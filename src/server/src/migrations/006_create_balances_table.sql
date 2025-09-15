-- Migration: Create balances table
-- Description: Creates the balances table for storing calculated balances between users within groups
-- Version: 006
-- Created: 2024-01-15

-- Create balances table
CREATE TABLE balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  total_owed DECIMAL(10,2) DEFAULT 0,
  total_owes DECIMAL(10,2) DEFAULT 0,
  net_balance DECIMAL(10,2) DEFAULT 0,
  last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_balances_group_id ON balances(group_id);
CREATE INDEX idx_balances_user_id ON balances(user_id);
CREATE INDEX idx_balances_net ON balances(net_balance);
CREATE INDEX idx_balances_calculated ON balances(last_calculated);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_balances_updated_at
  BEFORE UPDATE ON balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add constraints
ALTER TABLE balances ADD CONSTRAINT chk_balances_total_owed_non_negative 
  CHECK (total_owed >= 0);

ALTER TABLE balances ADD CONSTRAINT chk_balances_total_owes_non_negative 
  CHECK (total_owes >= 0);

-- Add comments for documentation
COMMENT ON TABLE balances IS 'Stores calculated balances between users within groups';
COMMENT ON COLUMN balances.id IS 'Unique identifier for the balance record';
COMMENT ON COLUMN balances.group_id IS 'Reference to the group';
COMMENT ON COLUMN balances.user_id IS 'Reference to the user';
COMMENT ON COLUMN balances.total_owed IS 'Total amount this user is owed by others';
COMMENT ON COLUMN balances.total_owes IS 'Total amount this user owes to others';
COMMENT ON COLUMN balances.net_balance IS 'Net balance (total_owed - total_owes)';
COMMENT ON COLUMN balances.last_calculated IS 'When this balance was last calculated';
