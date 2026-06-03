-- Add show_welcome column to users table for welcome dialog functionality
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_welcome BOOLEAN DEFAULT TRUE;