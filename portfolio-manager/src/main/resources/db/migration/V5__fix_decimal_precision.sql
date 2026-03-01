-- Alter columns to increase decimal precision for crypto support (8 decimal places)

-- Positions table
ALTER TABLE positions ALTER COLUMN quantity TYPE DECIMAL(20, 8);
ALTER TABLE positions ALTER COLUMN average_purchase_price TYPE DECIMAL(20, 8);
ALTER TABLE positions ALTER COLUMN current_price TYPE DECIMAL(20, 8);

-- Transactions table
ALTER TABLE transactions ALTER COLUMN quantity TYPE DECIMAL(20, 8);
ALTER TABLE transactions ALTER COLUMN price TYPE DECIMAL(20, 8);
ALTER TABLE transactions ALTER COLUMN balance_transaction TYPE DECIMAL(20, 8);

-- Users table
ALTER TABLE users ALTER COLUMN cash_balance TYPE DECIMAL(20, 8);
ALTER TABLE users ALTER COLUMN locked_balance TYPE DECIMAL(20, 8);
