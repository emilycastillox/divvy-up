import { db } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

export interface ActivityItem {
  id: string;
  type: 'member_added' | 'member_removed' | 'member_role_changed' | 'expense_added' | 'expense_updated' | 'expense_deleted' | 'settings_changed' | 'group_created' | 'invitation_sent' | 'invitation_accepted';
  groupId: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
  targetUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  metadata: Record<string, any>;
  createdAt: string;
}

class ActivityService {
  async createActivity(
    groupId: string,
    userId: string,
    type: ActivityItem['type'],
    metadata: Record<string, any> = {},
    targetUserId?: string
  ): Promise<ActivityItem> {
    const activityId = uuidv4();
    const client = await db.getClient();

    try {
      // Get user information
      const userResult = await client.query(
        'SELECT id, first_name, last_name, email, avatar_url FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      const user = userResult.rows[0];

      // Get target user information if provided
      let targetUser = null;
      if (targetUserId) {
        const targetUserResult = await client.query(
          'SELECT id, first_name, last_name, email FROM users WHERE id = $1',
          [targetUserId]
        );
        if (targetUserResult.rows.length > 0) {
          targetUser = targetUserResult.rows[0];
        }
      }

      // Insert activity
      const activityResult = await client.query<ActivityItem>(
        `INSERT INTO group_activities (id, group_id, user_id, type, metadata, target_user_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
        [activityId, groupId, userId, type, JSON.stringify(metadata), targetUserId]
      );

      const activity = activityResult.rows[0];

      return {
        ...activity,
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          avatarUrl: user.avatar_url,
        },
        targetUser: targetUser ? {
          id: targetUser.id,
          firstName: targetUser.first_name,
          lastName: targetUser.last_name,
          email: targetUser.email,
        } : undefined,
        metadata: JSON.parse(activity.metadata || '{}'),
      };
    } finally {
      client.release();
    }
  }

  async getGroupActivities(
    groupId: string,
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ActivityItem[]> {
    const client = await db.getClient();
    const offset = (page - 1) * limit;

    try {
      // Check if user is a member of the group
      const membershipResult = await client.query(
        'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );

      if (membershipResult.rows.length === 0) {
        throw new AppError('User not a member of this group', 403);
      }

      // Get activities with user information
      const activitiesResult = await client.query(
        `SELECT 
           ga.id,
           ga.type,
           ga.group_id,
           ga.user_id,
           ga.metadata,
           ga.target_user_id,
           ga.created_at,
           u.first_name,
           u.last_name,
           u.email,
           u.avatar_url,
           tu.first_name as target_first_name,
           tu.last_name as target_last_name,
           tu.email as target_email
         FROM group_activities ga
         JOIN users u ON ga.user_id = u.id
         LEFT JOIN users tu ON ga.target_user_id = tu.id
         WHERE ga.group_id = $1
         ORDER BY ga.created_at DESC
         LIMIT $2 OFFSET $3`,
        [groupId, limit, offset]
      );

      return activitiesResult.rows.map(row => ({
        id: row.id,
        type: row.type,
        groupId: row.group_id,
        userId: row.user_id,
        user: {
          id: row.user_id,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          avatarUrl: row.avatar_url,
        },
        targetUser: row.target_user_id ? {
          id: row.target_user_id,
          firstName: row.target_first_name,
          lastName: row.target_last_name,
          email: row.target_email,
        } : undefined,
        metadata: JSON.parse(row.metadata || '{}'),
        createdAt: row.created_at,
      }));
    } finally {
      client.release();
    }
  }

  async logMemberAdded(groupId: string, addedByUserId: string, addedUserId: string): Promise<void> {
    await this.createActivity(
      groupId,
      addedByUserId,
      'member_added',
      {},
      addedUserId
    );
  }

  async logMemberRemoved(groupId: string, removedByUserId: string, removedUserId: string): Promise<void> {
    await this.createActivity(
      groupId,
      removedByUserId,
      'member_removed',
      {},
      removedUserId
    );
  }

  async logMemberRoleChanged(
    groupId: string,
    changedByUserId: string,
    targetUserId: string,
    oldRole: string,
    newRole: string
  ): Promise<void> {
    await this.createActivity(
      groupId,
      changedByUserId,
      'member_role_changed',
      { oldRole, newRole },
      targetUserId
    );
  }

  async logExpenseAdded(
    groupId: string,
    addedByUserId: string,
    expenseTitle: string,
    expenseAmount: number,
    currency: string
  ): Promise<void> {
    await this.createActivity(
      groupId,
      addedByUserId,
      'expense_added',
      { expenseTitle, expenseAmount, currency }
    );
  }

  async logExpenseUpdated(
    groupId: string,
    updatedByUserId: string,
    expenseTitle: string
  ): Promise<void> {
    await this.createActivity(
      groupId,
      updatedByUserId,
      'expense_updated',
      { expenseTitle }
    );
  }

  async logExpenseDeleted(
    groupId: string,
    deletedByUserId: string,
    expenseTitle: string
  ): Promise<void> {
    await this.createActivity(
      groupId,
      deletedByUserId,
      'expense_deleted',
      { expenseTitle }
    );
  }

  async logSettingsChanged(
    groupId: string,
    changedByUserId: string,
    settingName: string,
    settingValue: any
  ): Promise<void> {
    await this.createActivity(
      groupId,
      changedByUserId,
      'settings_changed',
      { settingName, settingValue }
    );
  }

  async logGroupCreated(groupId: string, createdByUserId: string): Promise<void> {
    await this.createActivity(
      groupId,
      createdByUserId,
      'group_created',
      {}
    );
  }

  async logInvitationSent(
    groupId: string,
    sentByUserId: string,
    invitationEmail: string
  ): Promise<void> {
    await this.createActivity(
      groupId,
      sentByUserId,
      'invitation_sent',
      { invitationEmail }
    );
  }

  async logInvitationAccepted(
    groupId: string,
    acceptedByUserId: string
  ): Promise<void> {
    await this.createActivity(
      groupId,
      acceptedByUserId,
      'invitation_accepted',
      {}
    );
  }
}

export const activityService = new ActivityService();
