-- Add active flag to users (default true for existing users)
ALTER TABLE users ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE AFTER role;
