-- Verify database schema for recipe deletion functionality
-- This script checks all required tables and constraints

-- Check if all required tables exist
SELECT 
  'Table Check' as test_type,
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'recipes', 'ratings', 'comments', 'audit_log')
ORDER BY table_name;

-- Check users table structure
SELECT 
  'Users Table Structure' as test_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
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
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check for admin users
SELECT 
  'Admin Users Check' as test_type,
  id,
  username,
  email,
  role,
  status,
  is_verified,
  created_at
FROM users 
WHERE role IN ('admin', 'owner', 'moderator')
ORDER BY 
  CASE role 
    WHEN 'owner' THEN 1 
    WHEN 'admin' THEN 2 
    WHEN 'moderator' THEN 3 
    ELSE 4 
  END,
  created_at;

-- Check foreign key constraints for cascade deletion
SELECT 
  'Foreign Key Constraints' as test_type,
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name IN ('ratings', 'comments')
ORDER BY tc.table_name, kcu.column_name;

-- Count records in each table
SELECT 'Record Counts' as test_type, 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Record Counts' as test_type, 'recipes' as table_name, COUNT(*) as count FROM recipes
UNION ALL
SELECT 'Record Counts' as test_type, 'ratings' as table_name, COUNT(*) as count FROM ratings
UNION ALL
SELECT 'Record Counts' as test_type, 'comments' as table_name, COUNT(*) as count FROM comments;

-- Sample recipes for testing
SELECT 
  'Sample Recipes' as test_type,
  id,
  title,
  author_username,
  moderation_status,
  created_at
FROM recipes 
ORDER BY created_at DESC 
LIMIT 10;

-- Create audit_log table if it doesn't exist (for deletion tracking)
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Verify audit_log table structure
SELECT 
  'Audit Log Structure' as test_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'audit_log' 
AND table_schema = 'public'
ORDER BY ordinal_position;
