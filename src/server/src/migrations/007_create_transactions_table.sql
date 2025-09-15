-- Migration: Create transactions table
-- Description: Creates the transactions table for storing settlement transactions between users
-- Version: 007
-- Created: 2024-01-15

-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id),
  to_user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (from_user_id != to_user_id)
);

-- Create indexes for performance
CREATE INDEX idx_transactions_group_id ON transactions(group_id);
CREATE INDEX idx_transactions_from_user ON transactions(from_user_id);
CREATE INDEX idx_transactions_to_user ON transactions(to_user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created ON transactions(created_at);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add constraints
ALTER TABLE transactions ADD CONSTRAINT chk_transactions_amount_positive 
  CHECK (amount > 0);

ALTER TABLE transactions ADD CONSTRAINT chk_transactions_status_valid 
  CHECK (status IN ('pending', 'completed', 'cancelled', 'failed'));

ALTER TABLE transactions ADD CONSTRAINT chk_transactions_no_self_reference 
  CHECK (from_user_id != to_user_id);

-- Add comments for documentation
COMMENT ON TABLE transactions IS 'Stores settlement transactions between users';
COMMENT ON COLUMN transactions.id IS 'Unique identifier for the transaction';
COMMENT ON COLUMN transactions.group_id IS 'Reference to the group';
COMMENT ON COLUMN transactions.from_user_id IS 'User who owes money';
COMMENT ON COLUMN transactions.to_user_id IS 'User who is owed money';
COMMENT ON COLUMN transactions.amount IS 'Amount being transferred';
COMMENT ON COLUMN transactions.description IS 'Optional description of the transaction';
COMMENT ON COLUMN transactions.status IS 'Current status of the transaction';
COMMENT ON COLUMN transactions.payment_method IS 'Method used for payment';
COMMENT ON COLUMN transactions.payment_reference IS 'External payment reference';
