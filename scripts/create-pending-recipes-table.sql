-- Create pending recipes system if it doesn't exist
-- This script ensures all necessary tables and columns exist for recipe moderation

-- First, ensure the recipes table has the necessary columns for moderation
DO $$ 
BEGIN
    -- Add moderation_status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'recipes' AND column_name = 'moderation_status') THEN
        ALTER TABLE recipes ADD COLUMN moderation_status VARCHAR(20) DEFAULT 'pending';
    END IF;
    
    -- Add is_published column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'recipes' AND column_name = 'is_published') THEN
        ALTER TABLE recipes ADD COLUMN is_published BOOLEAN DEFAULT false;
    END IF;
    
    -- Add moderated_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'recipes' AND column_name = 'moderated_by') THEN
        ALTER TABLE recipes ADD COLUMN moderated_by INTEGER REFERENCES users(id);
    END IF;
    
    -- Add moderated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'recipes' AND column_name = 'moderated_at') THEN
        ALTER TABLE recipes ADD COLUMN moderated_at TIMESTAMP;
    END IF;
    
    -- Add moderation_notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'recipes' AND column_name = 'moderation_notes') THEN
        ALTER TABLE recipes ADD COLUMN moderation_notes TEXT;
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
    step_number INTEGER NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_recipes_is_published ON recipes(is_published);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_instructions_recipe_id ON recipe_instructions(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_recipe_id ON recipe_tags(recipe_id);

-- Update existing recipes to have pending status if they don't have one
UPDATE recipes SET moderation_status = 'pending' WHERE moderation_status IS NULL;

-- Create a view for pending recipes for admin use
CREATE OR REPLACE VIEW pending_recipes_view AS
SELECT 
    r.*,
    u.username as author_username,
    u.email as author_email,
    COALESCE(
        json_agg(
            DISTINCT jsonb_build_object(
                'ingredient', ri.ingredient,
                'amount', ri.amount,
                'unit', ri.unit
            )
        ) FILTER (WHERE ri.ingredient IS NOT NULL), 
        '[]'::json
    ) as ingredients,
    COALESCE(
        json_agg(
            DISTINCT jsonb_build_object(
                'instruction', inst.instruction,
                'step_number', inst.step_number
            )
            ORDER BY inst.step_number
        ) FILTER (WHERE inst.instruction IS NOT NULL), 
        '[]'::json
    ) as instructions,
    COALESCE(
        array_agg(DISTINCT rt.tag) FILTER (WHERE rt.tag IS NOT NULL), 
        ARRAY[]::text[]
    ) as tags
FROM recipes r
JOIN users u ON r.author_id = u.id
LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
LEFT JOIN recipe_instructions inst ON r.id = inst.recipe_id
LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
WHERE r.moderation_status = 'pending'
GROUP BY r.id, u.username, u.email
ORDER BY r.created_at DESC;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON recipes TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON recipe_ingredients TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON recipe_instructions TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON recipe_tags TO PUBLIC;
GRANT SELECT ON pending_recipes_view TO PUBLIC;
