import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database';
import { UserModel } from '../models/User';
import { groupService } from './group';
import { User } from '@divvy-up/shared';

export interface CreateInvitationData {
  groupId: string;
  email: string;
  role: 'admin' | 'member';
  invitedBy: string;
  expiresAt?: Date;
}

export interface Invitation {
  id: string;
  groupId: string;
  email: string;
  role: 'admin' | 'member';
  invitedBy: string;
  token: string;
  expiresAt: Date;
  isUsed: boolean;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  inviter?: User;
  group?: {
    id: string;
    name: string;
    description?: string;
  };
}

export class InvitationService {
  private userModel: UserModel;

  constructor() {
    this.userModel = new UserModel();
  }

  /**
   * Create a group invitation
   */
  async createInvitation(data: CreateInvitationData): Promise<Invitation> {
    try {
      // Check if group exists and user has permission
      const isAdmin = await groupService.isGroupAdmin(data.groupId, data.invitedBy);
      if (!isAdmin) {
        throw new Error('Insufficient permissions to invite members');
      }

      // Check if user with email already exists
      const existingUser = await this.userModel.findByEmail(data.email);
      if (existingUser) {
        // Check if user is already a member
        const isMember = await groupService.isGroupMember(data.groupId, existingUser.id);
        if (isMember) {
          throw new Error('User is already a member of this group');
        }
      }

      // Check for existing pending invitation
      const existingInvitation = await this.getInvitationByEmail(data.groupId, data.email);
      if (existingInvitation && !existingInvitation.isUsed) {
        throw new Error('Invitation already exists for this email');
      }

      // Create invitation
      const invitationId = uuidv4();
      const token = uuidv4();
      const expiresAt = data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const invitationData = {
        id: invitationId,
        group_id: data.groupId,
        email: data.email,
        role: data.role,
        invited_by: data.invitedBy,
        token,
        expires_at: expiresAt,
        is_used: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const query = `
        INSERT INTO group_invitations (
          id, group_id, email, role, invited_by, token, expires_at, is_used, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const result = await db.query(query, [
        invitationData.id,
        invitationData.group_id,
        invitationData.email,
        invitationData.role,
        invitationData.invited_by,
        invitationData.token,
        invitationData.expires_at,
        invitationData.is_used,
        invitationData.created_at,
        invitationData.updated_at,
      ]);

      const invitation = result.rows[0];

      // Get inviter and group details
      const [inviter, group] = await Promise.all([
        this.userModel.findById(data.invitedBy),
        groupService.getGroupById(data.groupId),
      ]);

      return {
        id: invitation.id,
        groupId: invitation.group_id,
        email: invitation.email,
        role: invitation.role,
        invitedBy: invitation.invited_by,
        token: invitation.token,
        expiresAt: invitation.expires_at,
        isUsed: invitation.is_used,
        usedAt: invitation.used_at,
        createdAt: invitation.created_at,
        updatedAt: invitation.updated_at,
        inviter: inviter ? {
          id: inviter.id,
          email: inviter.email,
          username: inviter.username,
          firstName: inviter.first_name,
          lastName: inviter.last_name,
          avatarUrl: inviter.avatar_url,
        } : undefined,
        group: group ? {
          id: group.id,
          name: group.name,
          description: group.description,
        } : undefined,
      };
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw new Error('Failed to create invitation');
    }
  }

  /**
   * Get invitation by token
   */
  async getInvitationByToken(token: string): Promise<Invitation | null> {
    try {
      const query = `
        SELECT gi.*, u.email as inviter_email, u.username as inviter_username, 
               u.first_name as inviter_first_name, u.last_name as inviter_last_name,
               u.avatar_url as inviter_avatar_url, g.name as group_name, g.description as group_description
        FROM group_invitations gi
        LEFT JOIN users u ON gi.invited_by = u.id
        LEFT JOIN groups g ON gi.group_id = g.id
        WHERE gi.token = $1
      `;

      const result = await db.query(query, [token]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        groupId: row.group_id,
        email: row.email,
        role: row.role,
        invitedBy: row.invited_by,
        token: row.token,
        expiresAt: row.expires_at,
        isUsed: row.is_used,
        usedAt: row.used_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        inviter: {
          id: row.invited_by,
          email: row.inviter_email,
          username: row.inviter_username,
          firstName: row.inviter_first_name,
          lastName: row.inviter_last_name,
          avatarUrl: row.inviter_avatar_url,
        },
        group: {
          id: row.group_id,
          name: row.group_name,
          description: row.group_description,
        },
      };
    } catch (error) {
      console.error('Error getting invitation by token:', error);
      throw new Error('Failed to get invitation');
    }
  }

  /**
   * Get invitation by email and group
   */
  async getInvitationByEmail(groupId: string, email: string): Promise<Invitation | null> {
    try {
      const query = `
        SELECT gi.*, u.email as inviter_email, u.username as inviter_username, 
               u.first_name as inviter_first_name, u.last_name as inviter_last_name,
               u.avatar_url as inviter_avatar_url, g.name as group_name, g.description as group_description
        FROM group_invitations gi
        LEFT JOIN users u ON gi.invited_by = u.id
        LEFT JOIN groups g ON gi.group_id = g.id
        WHERE gi.group_id = $1 AND gi.email = $2
        ORDER BY gi.created_at DESC
        LIMIT 1
      `;

      const result = await db.query(query, [groupId, email]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        groupId: row.group_id,
        email: row.email,
        role: row.role,
        invitedBy: row.invited_by,
        token: row.token,
        expiresAt: row.expires_at,
        isUsed: row.is_used,
        usedAt: row.used_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        inviter: {
          id: row.invited_by,
          email: row.inviter_email,
          username: row.inviter_username,
          firstName: row.inviter_first_name,
          lastName: row.inviter_last_name,
          avatarUrl: row.inviter_avatar_url,
        },
        group: {
          id: row.group_id,
          name: row.group_name,
          description: row.group_description,
        },
      };
    } catch (error) {
      console.error('Error getting invitation by email:', error);
      throw new Error('Failed to get invitation');
    }
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(token: string, userId: string): Promise<{ group: any; member: any }> {
    try {
      const invitation = await this.getInvitationByToken(token);
      if (!invitation) {
        throw new Error('Invitation not found');
      }

      if (invitation.isUsed) {
        throw new Error('Invitation has already been used');
      }

      if (invitation.expiresAt < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Check if user is already a member
      const isMember = await groupService.isGroupMember(invitation.groupId, userId);
      if (isMember) {
        throw new Error('User is already a member of this group');
      }

      // Add user to group
      const member = await groupService.addMember(invitation.groupId, {
        userId,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
      });

      // Mark invitation as used
      await this.markInvitationAsUsed(invitation.id);

      // Get group details
      const group = await groupService.getGroupById(invitation.groupId);

      return { group, member };
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw new Error('Failed to accept invitation');
    }
  }

  /**
   * Mark invitation as used
   */
  async markInvitationAsUsed(invitationId: string): Promise<void> {
    try {
      const query = `
        UPDATE group_invitations 
        SET is_used = true, used_at = $1, updated_at = $2
        WHERE id = $3
      `;

      await db.query(query, [new Date(), new Date(), invitationId]);
    } catch (error) {
      console.error('Error marking invitation as used:', error);
      throw new Error('Failed to mark invitation as used');
    }
  }

  /**
   * Get group invitations
   */
  async getGroupInvitations(groupId: string, userId: string): Promise<Invitation[]> {
    try {
      // Check if user has permission
      const isAdmin = await groupService.isGroupAdmin(groupId, userId);
      if (!isAdmin) {
        throw new Error('Insufficient permissions to view invitations');
      }

      const query = `
        SELECT gi.*, u.email as inviter_email, u.username as inviter_username, 
               u.first_name as inviter_first_name, u.last_name as inviter_last_name,
               u.avatar_url as inviter_avatar_url
        FROM group_invitations gi
        LEFT JOIN users u ON gi.invited_by = u.id
        WHERE gi.group_id = $1
        ORDER BY gi.created_at DESC
      `;

      const result = await db.query(query, [groupId]);
      
      return result.rows.map(row => ({
        id: row.id,
        groupId: row.group_id,
        email: row.email,
        role: row.role,
        invitedBy: row.invited_by,
        token: row.token,
        expiresAt: row.expires_at,
        isUsed: row.is_used,
        usedAt: row.used_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        inviter: {
          id: row.invited_by,
          email: row.inviter_email,
          username: row.inviter_username,
          firstName: row.inviter_first_name,
          lastName: row.inviter_last_name,
          avatarUrl: row.inviter_avatar_url,
        },
      }));
    } catch (error) {
      console.error('Error getting group invitations:', error);
      throw new Error('Failed to get group invitations');
    }
  }

  /**
   * Cancel invitation
   */
  async cancelInvitation(invitationId: string, userId: string): Promise<void> {
    try {
      const query = `
        SELECT gi.*, g.created_by
        FROM group_invitations gi
        JOIN groups g ON gi.group_id = g.id
        WHERE gi.id = $1
      `;

      const result = await db.query(query, [invitationId]);
      
      if (result.rows.length === 0) {
        throw new Error('Invitation not found');
      }

      const invitation = result.rows[0];

      // Check if user has permission (group admin or invitation creator)
      const isAdmin = await groupService.isGroupAdmin(invitation.group_id, userId);
      const isCreator = invitation.invited_by === userId;
      
      if (!isAdmin && !isCreator) {
        throw new Error('Insufficient permissions to cancel invitation');
      }

      // Delete invitation
      await db.query('DELETE FROM group_invitations WHERE id = $1', [invitationId]);
    } catch (error) {
      console.error('Error canceling invitation:', error);
      throw new Error('Failed to cancel invitation');
    }
  }
}

export const invitationService = new InvitationService();
