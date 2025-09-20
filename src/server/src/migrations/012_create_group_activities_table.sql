-- Create group_activities table
CREATE TABLE group_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    metadata JSONB DEFAULT '{}',
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_group_activities_group_id ON group_activities(group_id);
CREATE INDEX idx_group_activities_user_id ON group_activities(user_id);
CREATE INDEX idx_group_activities_type ON group_activities(type);
CREATE INDEX idx_group_activities_created_at ON group_activities(created_at DESC);
CREATE INDEX idx_group_activities_group_created_at ON group_activities(group_id, created_at DESC);

-- Add comments
COMMENT ON TABLE group_activities IS 'Tracks all activities within a group for audit and feed purposes';
COMMENT ON COLUMN group_activities.type IS 'Type of activity: member_added, member_removed, member_role_changed, expense_added, expense_updated, expense_deleted, settings_changed, group_created, invitation_sent, invitation_accepted';
COMMENT ON COLUMN group_activities.metadata IS 'Additional data specific to the activity type';
COMMENT ON COLUMN group_activities.target_user_id IS 'User affected by the activity (e.g., user being added/removed)';
