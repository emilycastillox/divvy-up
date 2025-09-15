-- Migration: Create groups table
-- Description: Creates the groups table for storing expense groups (trips, events, shared living, etc.)
-- Version: 002
-- Created: 2024-01-15

-- Create groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  currency VARCHAR(3) DEFAULT 'USD',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_groups_active ON groups(is_active);
CREATE INDEX idx_groups_currency ON groups(currency);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add constraints
ALTER TABLE groups ADD CONSTRAINT chk_groups_name_length 
  CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 255);

ALTER TABLE groups ADD CONSTRAINT chk_groups_currency_length 
  CHECK (LENGTH(currency) = 3);

-- Add comments for documentation
COMMENT ON TABLE groups IS 'Stores expense groups (trips, events, shared living, etc.)';
COMMENT ON COLUMN groups.id IS 'Unique identifier for the group';
COMMENT ON COLUMN groups.name IS 'Group name';
COMMENT ON COLUMN groups.description IS 'Optional group description';
COMMENT ON COLUMN groups.currency IS 'Default currency for the group (ISO 4217)';
COMMENT ON COLUMN groups.created_by IS 'User who created the group';
COMMENT ON COLUMN groups.is_active IS 'Whether the group is active';
COMMENT ON COLUMN groups.settings IS 'JSON object containing group-specific settings';
