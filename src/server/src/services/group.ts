import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database';
import { GroupModel } from '../models/Group';
import { UserModel } from '../models/User';
import { CreateGroupInput, UpdateGroupInput, Group, GroupMember, User } from '@divvy-up/shared';
import { activityService } from './activity';

export interface CreateGroupData {
  name: string;
  description?: string;
  currency: string;
  createdBy: string;
  settings?: {
    splitMethod?: 'equal' | 'percentage' | 'custom';
    allowPartialPayments?: boolean;
    requireApproval?: boolean;
  };
}

export interface UpdateGroupData {
  name?: string;
  description?: string;
  currency?: string;
  settings?: {
    splitMethod?: 'equal' | 'percentage' | 'custom';
    allowPartialPayments?: boolean;
    requireApproval?: boolean;
  };
}

export interface AddMemberData {
  userId: string;
  role: 'admin' | 'member';
  invitedBy: string;
}

export class GroupService {
  private groupModel: GroupModel;
  private userModel: UserModel;

  constructor() {
    this.groupModel = new GroupModel();
    this.userModel = new UserModel();
  }

  /**
   * Create a new group
   */
  async createGroup(data: CreateGroupData): Promise<Group> {
    try {
      // Validate that the creator exists
      const creator = await this.userModel.findById(data.createdBy);
      if (!creator) {
        throw new Error('Creator user not found');
      }

      // Create the group
      const groupData = {
        id: uuidv4(),
        name: data.name,
        description: data.description || null,
        currency: data.currency,
        created_by: data.createdBy,
        is_active: true,
        settings: data.settings || {
          splitMethod: 'equal',
          allowPartialPayments: true,
          requireApproval: false,
        },
      };

      const group = await this.groupModel.create(groupData);

      // Add the creator as an admin member
      await this.addMember(group.id, {
        userId: data.createdBy,
        role: 'admin',
        invitedBy: data.createdBy,
      });

      // Log group creation activity
      await activityService.logGroupCreated(group.id, data.createdBy);

      return group;
    } catch (error) {
      console.error('Error creating group:', error);
      throw new Error('Failed to create group');
    }
  }

  /**
   * Get group by ID with members
   */
  async getGroupById(groupId: string): Promise<Group | null> {
    try {
      const group = await this.groupModel.findById(groupId);
      if (!group) {
        return null;
      }

      // Get group members
      const members = await this.getGroupMembers(groupId);
      return {
        ...group,
        members,
      };
    } catch (error) {
      console.error('Error getting group:', error);
      throw new Error('Failed to get group');
    }
  }

  /**
   * Get all groups for a user
   */
  async getUserGroups(userId: string, page: number = 1, limit: number = 10): Promise<{
    groups: Group[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const offset = (page - 1) * limit;
      
      // Get groups where user is a member
      const query = `
        SELECT g.*, 
               COUNT(gm.user_id) as member_count,
               COALESCE(SUM(e.amount), 0) as total_expenses
        FROM groups g
        LEFT JOIN group_members gm ON g.id = gm.group_id
        LEFT JOIN expenses e ON g.id = e.group_id
        WHERE g.id IN (
          SELECT group_id FROM group_members WHERE user_id = $1
        )
        AND g.is_active = true
        GROUP BY g.id
        ORDER BY g.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const countQuery = `
        SELECT COUNT(DISTINCT g.id) as total
        FROM groups g
        WHERE g.id IN (
          SELECT group_id FROM group_members WHERE user_id = $1
        )
        AND g.is_active = true
      `;

      const [groupsResult, countResult] = await Promise.all([
        db.query(query, [userId, limit, offset]),
        db.query(countQuery, [userId]),
      ]);

      const groups = groupsResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        currency: row.currency,
        created_by: row.created_by,
        is_active: row.is_active,
        settings: row.settings,
        created_at: row.created_at,
        updated_at: row.updated_at,
        memberCount: parseInt(row.member_count),
        totalExpenses: parseFloat(row.total_expenses),
      }));

      const total = parseInt(countResult.rows[0].total);

      return {
        groups,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Error getting user groups:', error);
      throw new Error('Failed to get user groups');
    }
  }

  /**
   * Update group
   */
  async updateGroup(groupId: string, data: UpdateGroupData, userId: string): Promise<Group> {
    try {
      // Check if user has permission to update group
      const isAdmin = await this.isGroupAdmin(groupId, userId);
      if (!isAdmin) {
        throw new Error('Insufficient permissions to update group');
      }

      const group = await this.groupModel.update(groupId, data);
      if (!group) {
        throw new Error('Group not found');
      }

      return group;
    } catch (error) {
      console.error('Error updating group:', error);
      throw new Error('Failed to update group');
    }
  }

  /**
   * Delete group (soft delete)
   */
  async deleteGroup(groupId: string, userId: string): Promise<void> {
    try {
      // Check if user is the creator
      const group = await this.groupModel.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      if (group.created_by !== userId) {
        throw new Error('Only the group creator can delete the group');
      }

      await this.groupModel.update(groupId, { is_active: false });
    } catch (error) {
      console.error('Error deleting group:', error);
      throw new Error('Failed to delete group');
    }
  }

  /**
   * Add member to group
   */
  async addMember(groupId: string, data: AddMemberData): Promise<GroupMember> {
    try {
      // Check if user exists
      const user = await this.userModel.findById(data.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if group exists
      const group = await this.groupModel.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      // Check if user is already a member
      const existingMember = await this.getGroupMember(groupId, data.userId);
      if (existingMember) {
        throw new Error('User is already a member of this group');
      }

      // Add member to group
      const memberData = {
        id: uuidv4(),
        group_id: groupId,
        user_id: data.userId,
        role: data.role,
        invited_by: data.invitedBy,
        joined_at: new Date(),
      };

      const query = `
        INSERT INTO group_members (id, group_id, user_id, role, invited_by, joined_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const result = await db.query(query, [
        memberData.id,
        memberData.group_id,
        memberData.user_id,
        memberData.role,
        memberData.invited_by,
        memberData.joined_at,
      ]);

      const member = result.rows[0];

      return {
        id: member.id,
        groupId: member.group_id,
        userId: member.user_id,
        role: member.role,
        invitedBy: member.invited_by,
        joinedAt: member.joined_at,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          avatarUrl: user.avatar_url,
        },
      };
    } catch (error) {
      console.error('Error adding member:', error);
      throw new Error('Failed to add member');
    }
  }

  /**
   * Remove member from group
   */
  async removeMember(groupId: string, userId: string, removedBy: string): Promise<void> {
    try {
      // Check if user has permission to remove members
      const isAdmin = await this.isGroupAdmin(groupId, removedBy);
      if (!isAdmin) {
        throw new Error('Insufficient permissions to remove members');
      }

      // Check if trying to remove the creator
      const group = await this.groupModel.findById(groupId);
      if (group?.created_by === userId) {
        throw new Error('Cannot remove the group creator');
      }

      // Remove member
      const query = 'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2';
      const result = await db.query(query, [groupId, userId]);

      if (result.rowCount === 0) {
        throw new Error('Member not found');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      throw new Error('Failed to remove member');
    }
  }

  /**
   * Get group members
   */
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
      const query = `
        SELECT gm.*, u.email, u.username, u.first_name, u.last_name, u.avatar_url
        FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = $1
        ORDER BY gm.joined_at ASC
      `;

      const result = await db.query(query, [groupId]);
      
      return result.rows.map(row => ({
        id: row.id,
        groupId: row.group_id,
        userId: row.user_id,
        role: row.role,
        invitedBy: row.invited_by,
        joinedAt: row.joined_at,
        user: {
          id: row.user_id,
          email: row.email,
          username: row.username,
          firstName: row.first_name,
          lastName: row.last_name,
          avatarUrl: row.avatar_url,
        },
      }));
    } catch (error) {
      console.error('Error getting group members:', error);
      throw new Error('Failed to get group members');
    }
  }

  /**
   * Get specific group member
   */
  async getGroupMember(groupId: string, userId: string): Promise<GroupMember | null> {
    try {
      const query = `
        SELECT gm.*, u.email, u.username, u.first_name, u.last_name, u.avatar_url
        FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = $1 AND gm.user_id = $2
      `;

      const result = await db.query(query, [groupId, userId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        groupId: row.group_id,
        userId: row.user_id,
        role: row.role,
        invitedBy: row.invited_by,
        joinedAt: row.joined_at,
        user: {
          id: row.user_id,
          email: row.email,
          username: row.username,
          firstName: row.first_name,
          lastName: row.last_name,
          avatarUrl: row.avatar_url,
        },
      };
    } catch (error) {
      console.error('Error getting group member:', error);
      throw new Error('Failed to get group member');
    }
  }

  /**
   * Check if user is group admin
   */
  async isGroupAdmin(groupId: string, userId: string): Promise<boolean> {
    try {
      const member = await this.getGroupMember(groupId, userId);
      return member?.role === 'admin' || false;
    } catch (error) {
      console.error('Error checking group admin:', error);
      return false;
    }
  }

  /**
   * Check if user is group member
   */
  async isGroupMember(groupId: string, userId: string): Promise<boolean> {
    try {
      const member = await this.getGroupMember(groupId, userId);
      return !!member;
    } catch (error) {
      console.error('Error checking group member:', error);
      return false;
    }
  }

  /**
   * Update member role
   */
  async updateMemberRole(groupId: string, userId: string, role: 'admin' | 'member', updatedBy: string): Promise<GroupMember> {
    try {
      // Check if user has permission to update roles
      const isAdmin = await this.isGroupAdmin(groupId, updatedBy);
      if (!isAdmin) {
        throw new Error('Insufficient permissions to update member roles');
      }

      // Check if trying to update the creator
      const group = await this.groupModel.findById(groupId);
      if (group?.created_by === userId) {
        throw new Error('Cannot change the group creator role');
      }

      // Get current role for activity logging
      const currentMember = await this.getGroupMember(groupId, userId);
      if (!currentMember) {
        throw new Error('Member not found');
      }

      // Update member role
      const query = 'UPDATE group_members SET role = $1 WHERE group_id = $2 AND user_id = $3';
      const result = await db.query(query, [role, groupId, userId]);

      if (result.rowCount === 0) {
        throw new Error('Member not found');
      }

      // Log role change activity
      await activityService.logMemberRoleChanged(
        groupId,
        updatedBy,
        userId,
        currentMember.role,
        role
      );

      // Return updated member
      return await this.getGroupMember(groupId, userId);
    } catch (error) {
      console.error('Error updating member role:', error);
      throw new Error('Failed to update member role');
    }
  }
}

export const groupService = new GroupService();
