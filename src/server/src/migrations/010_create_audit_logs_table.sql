-- Migration: Create audit_logs table
-- Description: Creates the audit_logs table for storing audit trail for important actions
-- Version: 010
-- Created: 2024-01-15

-- Create audit_logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  group_id UUID REFERENCES groups(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_group_id ON audit_logs(group_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Add constraints
ALTER TABLE audit_logs ADD CONSTRAINT chk_audit_logs_action_length 
  CHECK (LENGTH(action) >= 1 AND LENGTH(action) <= 100);

ALTER TABLE audit_logs ADD CONSTRAINT chk_audit_logs_entity_type_length 
  CHECK (LENGTH(entity_type) >= 1 AND LENGTH(entity_type) <= 50);

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Stores audit trail for important actions';
COMMENT ON COLUMN audit_logs.id IS 'Unique identifier for the audit log entry';
COMMENT ON COLUMN audit_logs.user_id IS 'User who performed the action (NULL for system actions)';
COMMENT ON COLUMN audit_logs.group_id IS 'Group this action relates to (if applicable)';
COMMENT ON COLUMN audit_logs.action IS 'Action performed (create, update, delete, etc.)';
COMMENT ON COLUMN audit_logs.entity_type IS 'Type of entity affected (user, group, expense, etc.)';
COMMENT ON COLUMN audit_logs.entity_id IS 'ID of the entity affected';
COMMENT ON COLUMN audit_logs.old_values IS 'Previous values (for updates)';
COMMENT ON COLUMN audit_logs.new_values IS 'New values (for creates/updates)';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the request';
COMMENT ON COLUMN audit_logs.user_agent IS 'User agent string from the request';
