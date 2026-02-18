-- Add locked_quantity column to positions table for order locking functionality
ALTER TABLE positions ADD COLUMN IF NOT EXISTS locked_quantity DECIMAL(20, 8) DEFAULT 0.0;
