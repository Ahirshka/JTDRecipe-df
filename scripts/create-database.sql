-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT,
    avatar TEXT,
    provider TEXT DEFAULT 'email',
    social_id TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin', 'owner')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned', 'pending')),
    is_verified BOOLEAN DEFAULT FALSE,
    is_suspended BOOLEAN DEFAULT FALSE,
    suspension_reason TEXT,
    suspension_expires_at TEXT,
    warning_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_login_at TEXT
);

-- Create Recipes table
CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    author_id TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT DEFAULT 'Easy' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    prep_time_minutes INTEGER DEFAULT 0,
    cook_time_minutes INTEGER DEFAULT 0,
    servings INTEGER DEFAULT 1,
    image_url TEXT,
    rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Recipe Ingredients table
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id TEXT PRIMARY KEY,
    recipe_id TEXT NOT NULL,
    ingredient TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Create Recipe Instructions table
CREATE TABLE IF NOT EXISTS recipe_instructions (
    id TEXT PRIMARY KEY,
    recipe_id TEXT NOT NULL,
    instruction TEXT NOT NULL,
    step_number INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Create Recipe Tags table
CREATE TABLE IF NOT EXISTS recipe_tags (
    id TEXT PRIMARY KEY,
    recipe_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Create User Favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    recipe_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(user_id, recipe_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Create User Ratings table
CREATE TABLE IF NOT EXISTS user_ratings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    recipe_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(user_id, recipe_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Create Moderation Notes table
CREATE TABLE IF NOT EXISTS moderation_notes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    moderator_name TEXT NOT NULL,
    note TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('warning', 'suspension', 'ban', 'note', 'verification', 'role_change')),
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipes_author_id ON recipes(author_id);
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at);
CREATE INDEX IF NOT EXISTS idx_recipes_rating ON recipes(rating);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_instructions_recipe_id ON recipe_instructions(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_recipe_id ON recipe_tags(recipe_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_user_id ON user_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_recipe_id ON user_ratings(recipe_id);
