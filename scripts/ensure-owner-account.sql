-- Ensure owner account exists with correct credentials for Aaron Hirshka
INSERT INTO users (
  id,
  username, 
  email, 
  password_hash, 
  role, 
  is_verified, 
  created_at,
  status
) VALUES (
  'owner-account-001',
  'Aaron Hirshka',
  'aaronhirshka@gmail.com',
  '$2a$12$K1p/a0dclxKk/BHH1fOyOeIiHv6bJbGCp3Aa5wdxMpIGlVPL2/Pu', -- Morton2121
  'owner',
  true,
  NOW(),
  'active'
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  is_verified = EXCLUDED.is_verified,
  status = EXCLUDED.status,
  username = EXCLUDED.username;

-- Also update any existing owner account to the new email
UPDATE users 
SET email = 'aaronhirshka@gmail.com', 
    username = 'Aaron Hirshka',
    password_hash = '$2a$12$K1p/a0dclxKk/BHH1fOyOeIiHv6bJbGCp3Aa5wdxMpIGlVPL2/Pu'
WHERE role = 'owner' AND email != 'aaronhirshka@gmail.com';

-- Verify the owner account
SELECT id, username, email, role, is_verified, status 
FROM users 
WHERE email = 'aaronhirshka@gmail.com';
