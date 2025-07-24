-- Users table with comprehensive user management
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT,
    avatar TEXT,
    provider VARCHAR(50) NOT NULL DEFAULT 'email',
    social_id TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin', 'owner')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned', 'pending')),
    is_verified BOOLEAN DEFAULT FALSE,
    is_suspended BOOLEAN DEFAULT FALSE,
    suspension_reason TEXT,
    suspension_expires_at TIMESTAMP,
    warning_count INTEGER DEFAULT 0,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    reset_token TEXT,
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

-- User profiles for additional information
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    location TEXT,
    website TEXT,
    cooking_experience VARCHAR(20) CHECK (cooking_experience IN ('beginner', 'intermediate', 'advanced', 'professional')),
    favorite_cuisines JSONB DEFAULT '[]',
    dietary_restrictions JSONB DEFAULT '[]',
    social_links JSONB DEFAULT '{}'
);

-- Recipes table
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    prep_time_minutes INTEGER DEFAULT 0,
    cook_time_minutes INTEGER DEFAULT 0,
    servings INTEGER DEFAULT 1,
    image_url TEXT,
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    moderation_status VARCHAR(20) DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
    moderation_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recipe ingredients
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient VARCHAR(255) NOT NULL,
    amount VARCHAR(50),
    unit VARCHAR(50),
    order_index INTEGER DEFAULT 0
);

-- Recipe instructions
CREATE TABLE IF NOT EXISTS recipe_instructions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    instruction TEXT NOT NULL,
    step_number INTEGER NOT NULL,
    image_url TEXT
);

-- Recipe tags
CREATE TABLE IF NOT EXISTS recipe_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL
);

-- User sessions for authentication
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User favorites
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, recipe_id)
);

-- Recipe ratings
CREATE TABLE IF NOT EXISTS recipe_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, recipe_id)
);

-- Recipe comments
CREATE TABLE IF NOT EXISTS recipe_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Moderation logs
CREATE TABLE IF NOT EXISTS moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moderator_id UUID NOT NULL REFERENCES users(id),
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('user', 'recipe')),
    target_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    reason TEXT,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recipe analytics
CREATE TABLE IF NOT EXISTS recipe_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('view', 'favorite', 'rate', 'comment')),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
