-- Update all multi-tenant users to use bcrypt hash for password 'password'
UPDATE mt_users
SET password_hash = '$2a$10$2vOLua7SGknUSUWtgno7U.tSXy3ogPyv4L.drCOyos5kFZD2YWfDi';
