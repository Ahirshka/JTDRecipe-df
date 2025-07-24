-- Create email_tokens table for verification and password reset tokens
CREATE TABLE IF NOT EXISTS email_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('email_verification', 'password_reset')),
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_tokens_token ON email_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_tokens_user_id ON email_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_tokens_type ON email_tokens(type);
CREATE INDEX IF NOT EXISTS idx_email_tokens_expires_at ON email_tokens(expires_at);
