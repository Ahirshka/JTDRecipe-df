-- Users table with comprehensive user management
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    avatar TEXT,
    provider TEXT NOT NULL DEFAULT 'email',
    social_id TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin', 'owner')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned', 'pending')),
    is_verified BOOLEAN DEFAULT FALSE,
    is_suspended BOOLEAN DEFAULT FALSE,
    suspension_reason TEXT,
    suspension_expires_at DATETIME,
    warning_count INTEGER DEFAULT 0,
    login_attempts INTEGER DEFAULT 0,
    locked_until DATETIME,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    reset_token TEXT,
    reset_token_expires DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME
);

-- User profiles for additional information
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY,
    bio TEXT,
    location TEXT,
    website TEXT,
    cooking_experience TEXT CHECK (cooking_experience IN ('beginner', 'intermediate', 'advanced', 'professional')),
    favorite_cuisines TEXT, -- JSON array
    dietary_restrictions TEXT, -- JSON array
    social_links TEXT, -- JSON object
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Recipes table
CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    author_id TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    prep_time_minutes INTEGER DEFAULT 0,
    cook_time_minutes INTEGER DEFAULT 0,
    servings INTEGER DEFAULT 1,
    image_url TEXT,
    rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
    moderation_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Recipe ingredients
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id TEXT PRIMARY KEY,
    recipe_id TEXT NOT NULL,
    ingredient TEXT NOT NULL,
    amount TEXT,
    unit TEXT,
    order_index INTEGER DEFAULT 0,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Recipe instructions
CREATE TABLE IF NOT EXISTS recipe_instructions (
    id TEXT PRIMARY KEY,
    recipe_id TEXT NOT NULL,
    instruction TEXT NOT NULL,
    step_number INTEGER NOT NULL,
    image_url TEXT,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Recipe tags
CREATE TABLE IF NOT EXISTS recipe_tags (
    id TEXT PRIMARY KEY,
    recipe_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- User sessions for authentication
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User favorites
CREATE TABLE IF NOT EXISTS user_favorites (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    recipe_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    UNIQUE(user_id, recipe_id)
);

-- Recipe ratings
CREATE TABLE IF NOT EXISTS recipe_ratings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    recipe_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    UNIQUE(user_id, recipe_id)
);

-- Recipe comments
CREATE TABLE IF NOT EXISTS recipe_comments (
    id TEXT PRIMARY KEY,
    recipe_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Moderation logs
CREATE TABLE IF NOT EXISTS moderation_logs (
    id TEXT PRIMARY KEY,
    moderator_id TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('user', 'recipe')),
    target_id TEXT NOT NULL,
    action TEXT NOT NULL,
    reason TEXT,
    details TEXT, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (moderator_id) REFERENCES users(id)
);

-- Recipe analytics
CREATE TABLE IF NOT EXISTS recipe_analytics (
    id TEXT PRIMARY KEY,
    recipe_id TEXT NOT NULL,
    user_id TEXT,
    action TEXT NOT NULL CHECK (action IN ('view', 'favorite', 'rate', 'comment')),
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE INDEX IF NOT EXISTS idx_recipes_author ON recipes(author_id);
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_status ON recipes(moderation_status);
CREATE INDEX IF NOT EXISTS idx_recipes_published ON recipes(is_published);
CREATE INDEX IF NOT EXISTS idx_recipes_created ON recipes(created_at);
CREATE INDEX IF NOT EXISTS idx_recipes_rating ON recipes(rating);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_instructions_recipe ON recipe_instructions(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_recipe ON recipe_tags(recipe_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_recipe ON user_favorites(recipe_id);

CREATE INDEX IF NOT EXISTS idx_recipe_ratings_user ON recipe_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe ON recipe_ratings(recipe_id);

CREATE INDEX IF NOT EXISTS idx_recipe_comments_recipe ON recipe_comments(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_comments_user ON recipe_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_moderator ON moderation_logs(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_target ON moderation_logs(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_recipe_analytics_recipe ON recipe_analytics(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_analytics_user ON recipe_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_analytics_action ON recipe_analytics(action);
