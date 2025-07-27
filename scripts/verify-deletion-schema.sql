-- Verify database schema for recipe deletion functionality
-- This script checks all required tables, columns, and constraints

-- Check if all required tables exist
SELECT 
  'Table Check' as test_type,
  table_name,
  CASE 
    WHEN table_name IN ('users', 'recipes', 'sessions', 'ratings', 'comments') 
    THEN 'REQUIRED' 
    ELSE 'OPTIONAL' 
  END as importance
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY importance DESC, table_name;

-- Check users table structure
SELECT 
  'Users Table Structure' as test_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check recipes table structure
SELECT 
  'Recipes Table Structure' as test_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'recipes'
ORDER BY ordinal_position;

-- Check for admin users
SELECT 
  'Admin Users' as test_type,
  id,
  username,
  email,
  role,
  status,
  is_verified,
  created_at
FROM users
WHERE role IN ('admin', 'owner', 'moderator')
ORDER BY role, username;

-- Check foreign key constraints for cascade deletion
SELECT 
  'Foreign Key Constraints' as test_type,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, tc.constraint_name;

-- Check sample recipes for deletion testing
SELECT 
  'Sample Recipes' as test_type,
  id,
  title,
  author_username,
  moderation_status,
  is_published,
  created_at
FROM recipes
ORDER BY created_at DESC
LIMIT 10;

-- Create audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS recipe_deletion_audit (
  id SERIAL PRIMARY KEY,
  recipe_id VARCHAR(50) NOT NULL,
  recipe_title VARCHAR(255),
  deleted_by_user_id INTEGER,
  deleted_by_username VARCHAR(50),
  deletion_reason TEXT,
  deleted_at TIMESTAMP DEFAULT NOW(),
  recipe_data JSONB
);

-- Verify record counts
SELECT 
  'Record Counts' as test_type,
  'users' as table_name,
  COUNT(*) as record_count
FROM users
UNION ALL
SELECT 
  'Record Counts' as test_type,
  'recipes' as table_name,
  COUNT(*) as record_count
FROM recipes
UNION ALL
SELECT 
  'Record Counts' as test_type,
  'sessions' as table_name,
  COUNT(*) as record_count
FROM sessions;
