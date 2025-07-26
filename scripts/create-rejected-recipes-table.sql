-- Create rejected_recipes table to store rejected recipe submissions
CREATE TABLE IF NOT EXISTS rejected_recipes (
    id SERIAL PRIMARY KEY,
    original_recipe_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    author_id INTEGER NOT NULL,
    author_username VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    prep_time_minutes INTEGER DEFAULT 0,
    cook_time_minutes INTEGER DEFAULT 0,
    servings INTEGER DEFAULT 1,
    image_url TEXT,
    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
    instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    rejection_reason TEXT,
    rejected_by INTEGER NOT NULL,
    rejected_at TIMESTAMP DEFAULT NOW(),
    original_created_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rejected_recipes_original_id ON rejected_recipes(original_recipe_id);
CREATE INDEX IF NOT EXISTS idx_rejected_recipes_author ON rejected_recipes(author_id);
CREATE INDEX IF NOT EXISTS idx_rejected_recipes_rejected_by ON rejected_recipes(rejected_by);
CREATE INDEX IF NOT EXISTS idx_rejected_recipes_rejected_at ON rejected_recipes(rejected_at);

-- Add comments for documentation
COMMENT ON TABLE rejected_recipes IS 'Stores recipes that have been rejected during moderation';
COMMENT ON COLUMN rejected_recipes.original_recipe_id IS 'The ID of the original recipe before rejection';
COMMENT ON COLUMN rejected_recipes.rejection_reason IS 'Admin notes explaining why the recipe was rejected';
COMMENT ON COLUMN rejected_recipes.rejected_by IS 'ID of the admin/moderator who rejected the recipe';
COMMENT ON COLUMN rejected_recipes.rejected_at IS 'Timestamp when the recipe was rejected';
COMMENT ON COLUMN rejected_recipes.original_created_at IS 'Original creation timestamp from the recipes table';

-- Add foreign key constraints if users table exists
-- ALTER TABLE rejected_recipes ADD CONSTRAINT fk_rejected_recipes_author 
--     FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE rejected_recipes ADD CONSTRAINT fk_rejected_recipes_rejected_by 
--     FOREIGN KEY (rejected_by) REFERENCES users(id) ON DELETE CASCADE;
