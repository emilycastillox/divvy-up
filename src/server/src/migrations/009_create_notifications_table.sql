-- Migration: Create notifications table
-- Description: Creates the notifications table for storing user notifications and alerts
-- Version: 009
-- Created: 2024-01-15

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_group_id ON notifications(group_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- Add constraints
ALTER TABLE notifications ADD CONSTRAINT chk_notifications_title_length 
  CHECK (LENGTH(title) >= 1 AND LENGTH(title) <= 255);

ALTER TABLE notifications ADD CONSTRAINT chk_notifications_message_length 
  CHECK (LENGTH(message) >= 1);

ALTER TABLE notifications ADD CONSTRAINT chk_notifications_read_at_after_created 
  CHECK (read_at IS NULL OR read_at >= created_at);

-- Add comments for documentation
COMMENT ON TABLE notifications IS 'Stores user notifications and alerts';
COMMENT ON COLUMN notifications.id IS 'Unique identifier for the notification';
COMMENT ON COLUMN notifications.user_id IS 'User who receives this notification';
COMMENT ON COLUMN notifications.group_id IS 'Optional group this notification relates to';
COMMENT ON COLUMN notifications.type IS 'Type of notification (expense_added, payment_received, etc.)';
COMMENT ON COLUMN notifications.title IS 'Notification title';
COMMENT ON COLUMN notifications.message IS 'Notification message content';
COMMENT ON COLUMN notifications.data IS 'Additional data for the notification';
COMMENT ON COLUMN notifications.is_read IS 'Whether the user has read this notification';
COMMENT ON COLUMN notifications.read_at IS 'When the notification was read';
