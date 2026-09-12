-- Make expires_at nullable to support "never expires" orders
ALTER TABLE orders ALTER COLUMN expires_at DROP NOT NULL;