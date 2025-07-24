-- Create pending recipes table if it doesn't exist
-- This table will store all recipe submissions for admin review

-- First, ensure the recipes table has all necessary columns
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS moderation_notes TEXT,
ADD COLUMN IF NOT EXISTS moderated_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;

-- Create index for faster queries on moderation status
CREATE INDEX IF NOT EXISTS idx_recipes_moderation_status ON recipes(moderation_status);
CREATE INDEX IF NOT EXISTS idx_recipes_author_id ON recipes(author_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at);

-- Create a view for pending recipes with user information
CREATE OR REPLACE VIEW pending_recipes_view AS
SELECT 
  r.id,
  r.title,
  r.description,
  r.author_id,
  u.username as author_username,
  u.email as author_email,
  r.category,
  r.difficulty,
  r.prep_time_minutes,
  r.cook_time_minutes,
  r.servings,
  r.image_url,
  r.moderation_status,
  r.moderation_notes,
  r.created_at,
  r.updated_at,
  -- Get ingredients as JSON
  COALESCE(
    (SELECT json_agg(
      json_build_object(
        'ingredient', ri.ingredient,
        'amount', ri.amount,
        'unit', ri.unit
      )
    ) FROM recipe_ingredients ri WHERE ri.recipe_id = r.id),
    '[]'::json
  ) as ingredients,
  -- Get instructions as JSON
  COALESCE(
    (SELECT json_agg(
      json_build_object(
        'instruction', inst.instruction,
        'step_number', inst.step_number
      ) ORDER BY inst.step_number
    ) FROM recipe_instructions inst WHERE inst.recipe_id = r.id),
    '[]'::json
  ) as instructions,
  -- Get tags as array
  COALESCE(
    (SELECT array_agg(rt.tag) FROM recipe_tags rt WHERE rt.recipe_id = r.id),
    ARRAY[]::text[]
  ) as tags
FROM recipes r
JOIN users u ON r.author_id = u.id
WHERE r.moderation_status = 'pending'
ORDER BY r.created_at ASC;

-- Create a function to submit a recipe for moderation
CREATE OR REPLACE FUNCTION submit_recipe_for_moderation(
  p_title TEXT,
  p_description TEXT,
  p_author_id INTEGER,
  p_category TEXT,
  p_difficulty TEXT,
  p_prep_time_minutes INTEGER,
  p_cook_time_minutes INTEGER,
  p_servings INTEGER,
  p_image_url TEXT,
  p_ingredients JSONB,
  p_instructions JSONB,
  p_tags TEXT[]
) RETURNS TEXT AS $$
DECLARE
  recipe_id TEXT;
  ingredient JSONB;
  instruction JSONB;
  tag TEXT;
BEGIN
  -- Generate unique recipe ID
  recipe_id := 'recipe_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 8);
  
  -- Insert main recipe record
  INSERT INTO recipes (
    id, title, description, author_id, category, difficulty,
    prep_time_minutes, cook_time_minutes, servings, image_url,
    moderation_status, is_published, created_at, updated_at
  ) VALUES (
    recipe_id, p_title, p_description, p_author_id, p_category, p_difficulty,
    p_prep_time_minutes, p_cook_time_minutes, p_servings, p_image_url,
    'pending', FALSE, NOW(), NOW()
  );
  
  -- Insert ingredients
  FOR ingredient IN SELECT * FROM jsonb_array_elements(p_ingredients)
  LOOP
    INSERT INTO recipe_ingredients (recipe_id, ingredient, amount, unit)
    VALUES (
      recipe_id,
      ingredient->>'ingredient',
      ingredient->>'amount',
      ingredient->>'unit'
    );
  END LOOP;
  
  -- Insert instructions
  FOR instruction IN SELECT * FROM jsonb_array_elements(p_instructions)
  LOOP
    INSERT INTO recipe_instructions (recipe_id, instruction, step_number)
    VALUES (
      recipe_id,
      instruction->>'instruction',
      (instruction->>'step_number')::INTEGER
    );
  END LOOP;
  
  -- Insert tags
  FOREACH tag IN ARRAY p_tags
  LOOP
    INSERT INTO recipe_tags (recipe_id, tag)
    VALUES (recipe_id, tag);
  END LOOP;
  
  RETURN recipe_id;
END;
$$ LANGUAGE plpgsql;

-- Create notification function for new recipe submissions
CREATE OR REPLACE FUNCTION notify_new_recipe_submission() RETURNS TRIGGER AS $$
BEGIN
  -- This could be extended to send notifications to admins
  -- For now, we'll just log the event
  INSERT INTO admin_notifications (type, message, created_at)
  VALUES (
    'new_recipe',
    'New recipe "' || NEW.title || '" submitted by user ID ' || NEW.author_id,
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create admin notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_notifications (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create trigger for new recipe submissions
DROP TRIGGER IF EXISTS trigger_new_recipe_submission ON recipes;
CREATE TRIGGER trigger_new_recipe_submission
  AFTER INSERT ON recipes
  FOR EACH ROW
  WHEN (NEW.moderation_status = 'pending')
  EXECUTE FUNCTION notify_new_recipe_submission();
