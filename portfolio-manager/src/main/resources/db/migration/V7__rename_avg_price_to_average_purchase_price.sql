-- Rename avg_price to average_purchase_price to match JPA entity
-- This fixes the null value constraint error when inserting positions

-- Add new column first
ALTER TABLE positions ADD COLUMN IF NOT EXISTS average_purchase_price DECIMAL(20, 8);

-- Copy data from avg_price to average_purchase_price
UPDATE positions SET average_purchase_price = avg_price WHERE avg_price IS NOT NULL;

-- Make average_purchase_price NOT NULL (with default for existing NULLs)
UPDATE positions SET average_purchase_price = 0 WHERE average_purchase_price IS NULL;
ALTER TABLE positions ALTER COLUMN average_purchase_price SET NOT NULL;
ALTER TABLE positions ALTER COLUMN average_purchase_price SET DEFAULT 0;

-- Drop old avg_price column
ALTER TABLE positions DROP COLUMN IF EXISTS avg_price;

-- Also update locked_quantity default if needed
ALTER TABLE positions ALTER COLUMN locked_quantity SET DEFAULT 0;