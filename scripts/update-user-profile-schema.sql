-- Add profile fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS website VARCHAR(500);

-- Create uploads directory structure
-- Note: This would be handled by the API route, but documenting the structure:
-- public/uploads/avatars/ - for user profile pictures

-- Update any existing users to have default values
UPDATE users 
SET bio = NULL, location = NULL, website = NULL 
WHERE bio IS NULL AND location IS NULL AND website IS NULL;
