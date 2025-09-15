-- Migration: Create group_members table
-- Description: Creates the group_members junction table for group membership with roles and permissions
-- Version: 003
-- Created: 2024-01-15

-- Create group_members table
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(group_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_active ON group_members(is_active);
CREATE INDEX idx_group_members_role ON group_members(role);

-- Add constraints
ALTER TABLE group_members ADD CONSTRAINT chk_group_members_role_valid 
  CHECK (role IN ('admin', 'member'));

ALTER TABLE group_members ADD CONSTRAINT chk_group_members_left_after_joined 
  CHECK (left_at IS NULL OR left_at >= joined_at);

-- Add comments for documentation
COMMENT ON TABLE group_members IS 'Junction table for group membership with roles and permissions';
COMMENT ON COLUMN group_members.id IS 'Unique identifier for the membership record';
COMMENT ON COLUMN group_members.group_id IS 'Reference to the group';
COMMENT ON COLUMN group_members.user_id IS 'Reference to the user';
COMMENT ON COLUMN group_members.role IS 'User role in the group (admin or member)';
COMMENT ON COLUMN group_members.joined_at IS 'When the user joined the group';
COMMENT ON COLUMN group_members.left_at IS 'When the user left the group (NULL if still active)';
COMMENT ON COLUMN group_members.is_active IS 'Whether the membership is currently active';
