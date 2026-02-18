-- Add cash_balance column to users table for global cash balance functionality
ALTER TABLE users ADD COLUMN IF NOT EXISTS cash_balance DECIMAL(20, 8) DEFAULT 0.0;
