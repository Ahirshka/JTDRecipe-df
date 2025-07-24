-- Create pending recipes system if it doesn't exist
-- This script ensures all necessary tables and columns exist for recipe moderation

-- First, ensure the recipes table has the necessary columns for moderation
DO $$ 
BEGIN
    -- Add moderation_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'moderation_status'
    ) THEN
        ALTER TABLE recipes ADD COLUMN moderation_status VARCHAR(20) DEFAULT 'pending';
    END IF;

    -- Add is_published column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'is_published'
    ) THEN
        ALTER TABLE recipes ADD COLUMN is_published BOOLEAN DEFAULT false;
    END IF;

    -- Add moderated_by column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'moderated_by'
    ) THEN
        ALTER TABLE recipes ADD COLUMN moderated_by INTEGER REFERENCES users(id);
    END IF;

    -- Add moderated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'moderated_at'
    ) THEN
        ALTER TABLE recipes ADD COLUMN moderated_at TIMESTAMP;
    END IF;

    -- Add moderation_notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'moderation_notes'
    ) THEN
        ALTER TABLE recipes ADD COLUMN moderation_notes TEXT;
    END IF;

    -- Add rejection_reason column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'rejection_reason'
    ) THEN
        ALTER TABLE recipes ADD COLUMN rejection_reason TEXT;
    END IF;
END $$;

-- Create recipe_ingredients table if it doesn't exist
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id SERIAL PRIMARY KEY,
    recipe_id VARCHAR(255) NOT NULL,
    ingredient TEXT NOT NULL,
    amount VARCHAR(100),
    unit VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Create recipe_instructions table if it doesn't exist
CREATE TABLE IF NOT EXISTS recipe_instructions (
    id SERIAL PRIMARY KEY,
    recipe_id VARCHAR(255) NOT NULL,
    instruction TEXT NOT NULL,
    step_number INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Create recipe_tags table if it doesn't exist
CREATE TABLE IF NOT EXISTS recipe_tags (
    id SERIAL PRIMARY KEY,
    recipe_id VARCHAR(255) NOT NULL,
    tag VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipes_moderation_status ON recipes(moderation_status);
CREATE INDEX IF NOT EXISTS idx_recipes_author_id ON recipes(author_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_instructions_recipe_id ON recipe_instructions(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_recipe_id ON recipe_tags(recipe_id);

-- Create a view for pending recipes with user information
CREATE OR REPLACE VIEW pending_recipes_view AS
SELECT 
    r.id,
    r.title,
    r.description,
    r.category,
    r.difficulty,
    r.prep_time_minutes,
    r.cook_time_minutes,
    r.servings,
    r.image_url,
    r.created_at,
    r.updated_at,
    r.moderation_status,
    r.moderation_notes,
    r.rejection_reason,
    u.id as author_id,
    u.username as author_username,
    u.email as author_email,
    u.role as author_role,
    COUNT(ri.id) as ingredient_count,
    COUNT(inst.id) as instruction_count
FROM recipes r
JOIN users u ON r.author_id = u.id
LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
LEFT JOIN recipe_instructions inst ON r.id = inst.recipe_id
WHERE r.moderation_status = 'pending'
GROUP BY r.id, u.id, u.username, u.email, u.role
ORDER BY r.created_at DESC;

-- Update any existing recipes without moderation status
UPDATE recipes 
SET moderation_status = 'pending', is_published = false 
WHERE moderation_status IS NULL;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON recipes TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON recipe_ingredients TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON recipe_instructions TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON recipe_tags TO PUBLIC;
GRANT SELECT ON pending_recipes_view TO PUBLIC;

-- Create notification function for new recipe submissions
CREATE OR REPLACE FUNCTION notify_new_recipe_submission()
RETURNS TRIGGER AS $$
BEGIN
    -- This could be extended to send actual notifications
    -- For now, it just logs the event
    RAISE NOTICE 'New recipe submitted: % by user %', NEW.title, NEW.author_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new recipe notifications
DROP TRIGGER IF EXISTS trigger_new_recipe_notification ON recipes;
CREATE TRIGGER trigger_new_recipe_notification
    AFTER INSERT ON recipes
    FOR EACH ROW
    WHEN (NEW.moderation_status = 'pending')
    EXECUTE FUNCTION notify_new_recipe_submission();

-- Insert some sample moderation statuses if needed
INSERT INTO recipes (id, title, description, author_id, category, difficulty, moderation_status, is_published, created_at, updated_at)
SELECT 
    'sample_pending_' || generate_random_uuid(),
    'Sample Pending Recipe',
    'This is a sample recipe pending moderation',
    1,
    'Dinner',
    'Easy',
    'pending',
    false,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE moderation_status = 'pending' LIMIT 1)
AND EXISTS (SELECT 1 FROM users WHERE id = 1);

COMMIT;
