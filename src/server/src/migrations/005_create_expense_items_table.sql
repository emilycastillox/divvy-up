-- Migration: Create expense_items table
-- Description: Creates the expense_items table for storing how an expense is split among group members
-- Version: 005
-- Created: 2024-01-15

-- Create expense_items table
CREATE TABLE expense_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  percentage DECIMAL(5,2) CHECK (percentage >= 0 AND percentage <= 100),
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(expense_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_expense_items_expense_id ON expense_items(expense_id);
CREATE INDEX idx_expense_items_user_id ON expense_items(user_id);
CREATE INDEX idx_expense_items_paid ON expense_items(is_paid);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_expense_items_updated_at
  BEFORE UPDATE ON expense_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add constraints
ALTER TABLE expense_items ADD CONSTRAINT chk_expense_items_amount_non_negative 
  CHECK (amount >= 0);

ALTER TABLE expense_items ADD CONSTRAINT chk_expense_items_percentage_valid 
  CHECK (percentage IS NULL OR (percentage >= 0 AND percentage <= 100));

-- Add comments for documentation
COMMENT ON TABLE expense_items IS 'Stores how an expense is split among group members';
COMMENT ON COLUMN expense_items.id IS 'Unique identifier for the expense item';
COMMENT ON COLUMN expense_items.expense_id IS 'Reference to the parent expense';
COMMENT ON COLUMN expense_items.user_id IS 'User this split belongs to';
COMMENT ON COLUMN expense_items.amount IS 'Amount this user owes (non-negative)';
COMMENT ON COLUMN expense_items.percentage IS 'Percentage of total expense this user owes';
COMMENT ON COLUMN expense_items.is_paid IS 'Whether this user has paid their share';
