-- Migration: Create expenses table
-- Description: Creates the expenses table for storing individual expenses within groups
-- Version: 004
-- Created: 2024-01-15

-- Create expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  paid_by UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  category VARCHAR(50),
  expense_date DATE NOT NULL,
  receipt_url VARCHAR(500),
  notes TEXT,
  is_settled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_expenses_group_id ON expenses(group_id);
CREATE INDEX idx_expenses_created_by ON expenses(created_by);
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_settled ON expenses(is_settled);
CREATE INDEX idx_expenses_category ON expenses(category);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add constraints
ALTER TABLE expenses ADD CONSTRAINT chk_expenses_amount_positive 
  CHECK (amount > 0);

ALTER TABLE expenses ADD CONSTRAINT chk_expenses_description_length 
  CHECK (LENGTH(description) >= 1);

ALTER TABLE expenses ADD CONSTRAINT chk_expenses_date_not_future 
  CHECK (expense_date <= CURRENT_DATE);

-- Add comments for documentation
COMMENT ON TABLE expenses IS 'Stores individual expenses within groups';
COMMENT ON COLUMN expenses.id IS 'Unique identifier for the expense';
COMMENT ON COLUMN expenses.group_id IS 'Reference to the group this expense belongs to';
COMMENT ON COLUMN expenses.created_by IS 'User who created this expense';
COMMENT ON COLUMN expenses.paid_by IS 'User who actually paid for this expense';
COMMENT ON COLUMN expenses.amount IS 'Amount of the expense (positive decimal)';
COMMENT ON COLUMN expenses.description IS 'Description of what was purchased';
COMMENT ON COLUMN expenses.category IS 'Optional category for the expense';
COMMENT ON COLUMN expenses.expense_date IS 'Date when the expense occurred';
COMMENT ON COLUMN expenses.receipt_url IS 'URL to receipt image/document';
COMMENT ON COLUMN expenses.notes IS 'Additional notes about the expense';
COMMENT ON COLUMN expenses.is_settled IS 'Whether this expense has been settled';
