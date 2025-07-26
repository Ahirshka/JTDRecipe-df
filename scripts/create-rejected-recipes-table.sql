-- Create rejected_recipes table to store rejected recipe submissions
CREATE TABLE IF NOT EXISTS rejected_recipes (
    id SERIAL PRIMARY KEY,
    original_recipe_id VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_username VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    prep_time_minutes INTEGER NOT NULL CHECK (prep_time_minutes >= 0),
    cook_time_minutes INTEGER NOT NULL CHECK (cook_time_minutes >= 0),
    servings INTEGER NOT NULL CHECK (servings > 0),
    image_url TEXT,
    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
    instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    rejection_reason TEXT NOT NULL,
    rejected_by INTEGER NOT NULL REFERENCES users(id),
    rejected_at TIMESTAMP NOT NULL DEFAULT NOW(),
    original_created_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rejected_recipes_author ON rejected_recipes(author_id);
CREATE INDEX IF NOT EXISTS idx_rejected_recipes_rejected_by ON rejected_recipes(rejected_by);
CREATE INDEX IF NOT EXISTS idx_rejected_recipes_rejected_at ON rejected_recipes(rejected_at);
CREATE INDEX IF NOT EXISTS idx_rejected_recipes_original_id ON rejected_recipes(original_recipe_id);

-- Add comment for documentation
COMMENT ON TABLE rejected_recipes IS 'Stores rejected recipe submissions for record keeping and potential appeals';
COMMENT ON COLUMN rejected_recipes.original_recipe_id IS 'The original ID from the recipes table before rejection';
COMMENT ON COLUMN rejected_recipes.rejection_reason IS 'Reason provided by moderator for rejection';
COMMENT ON COLUMN rejected_recipes.rejected_by IS 'ID of the moderator who rejected the recipe';
COMMENT ON COLUMN rejected_recipes.original_created_at IS 'When the recipe was originally submitted';
