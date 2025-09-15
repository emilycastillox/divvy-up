import { db } from '../config/database';
import { 
  Group, 
  CreateGroupInput, 
  UpdateGroupInput, 
  GroupFilters, 
  GroupWithMembers,
  DatabaseResult,
  PaginatedResponse,
  PaginationOptions
} from '@divvy-up/shared';

export class GroupModel {
  private static readonly TABLE_NAME = 'groups';

  // Create a new group
  static async create(input: CreateGroupInput): Promise<DatabaseResult<Group>> {
    try {
      const query = `
        INSERT INTO ${this.TABLE_NAME} (
          name, description, currency, created_by, settings
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const values = [
        input.name,
        input.description || null,
        input.currency || 'USD',
        input.created_by,
        JSON.stringify(input.settings || {})
      ];

      const result = await db.query(query, values);
      
      return {
        success: true,
        data: result.rows[0],
        affectedRows: 1
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Find group by ID
  static async findById(id: string): Promise<DatabaseResult<Group>> {
    try {
      const query = `SELECT * FROM ${this.TABLE_NAME} WHERE id = $1 AND is_active = true`;
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Group not found'
        };
      }

      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Find groups with filters and pagination
  static async findMany(
    filters: GroupFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 10, offset: 0 }
  ): Promise<DatabaseResult<PaginatedResponse<Group>>> {
    try {
      const whereConditions: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      if (filters.created_by) {
        paramCount++;
        whereConditions.push(`created_by = $${paramCount}`);
        values.push(filters.created_by);
      }

      if (filters.is_active !== undefined) {
        paramCount++;
        whereConditions.push(`is_active = $${paramCount}`);
        values.push(filters.is_active);
      }

      if (filters.currency) {
        paramCount++;
        whereConditions.push(`currency = $${paramCount}`);
        values.push(filters.currency);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${this.TABLE_NAME} ${whereClause}`;
      const countResult = await db.query(countQuery, values);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated results
      paramCount++;
      const limitParam = `$${paramCount}`;
      paramCount++;
      const offsetParam = `$${paramCount}`;
      
      const query = `
        SELECT * FROM ${this.TABLE_NAME} 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT ${limitParam} OFFSET ${offsetParam}
      `;

      values.push(pagination.limit, pagination.offset);
      const result = await db.query(query, values);

      const totalPages = Math.ceil(total / pagination.limit);

      return {
        success: true,
        data: {
          data: result.rows,
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total,
            totalPages,
            hasNext: pagination.page < totalPages,
            hasPrev: pagination.page > 1
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Update group
  static async update(id: string, input: UpdateGroupInput): Promise<DatabaseResult<Group>> {
    try {
      const setClause: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      Object.entries(input).forEach(([key, value]) => {
        if (value !== undefined) {
          paramCount++;
          if (key === 'settings' && typeof value === 'object') {
            setClause.push(`${key} = $${paramCount}`);
            values.push(JSON.stringify(value));
          } else {
            setClause.push(`${key} = $${paramCount}`);
            values.push(value);
          }
        }
      });

      if (setClause.length === 0) {
        return {
          success: false,
          error: 'No fields to update'
        };
      }

      paramCount++;
      values.push(id);

      const query = `
        UPDATE ${this.TABLE_NAME} 
        SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount} AND is_active = true
        RETURNING *
      `;

      const result = await db.query(query, values);
      
      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Group not found'
        };
      }

      return {
        success: true,
        data: result.rows[0],
        affectedRows: result.rowCount || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Soft delete group
  static async delete(id: string): Promise<DatabaseResult<boolean>> {
    try {
      const query = `
        UPDATE ${this.TABLE_NAME} 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND is_active = true
        RETURNING id
      `;

      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Group not found'
        };
      }

      return {
        success: true,
        data: true,
        affectedRows: result.rowCount || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Add member to group
  static async addMember(groupId: string, userId: string, role: 'admin' | 'member' = 'member'): Promise<DatabaseResult<boolean>> {
    try {
      const query = `
        INSERT INTO group_members (group_id, user_id, role)
        VALUES ($1, $2, $3)
        ON CONFLICT (group_id, user_id) 
        DO UPDATE SET 
          role = EXCLUDED.role,
          is_active = true,
          joined_at = CURRENT_TIMESTAMP,
          left_at = NULL
        RETURNING id
      `;

      const result = await db.query(query, [groupId, userId, role]);
      
      return {
        success: true,
        data: true,
        affectedRows: result.rowCount || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Remove member from group
  static async removeMember(groupId: string, userId: string): Promise<DatabaseResult<boolean>> {
    try {
      const query = `
        UPDATE group_members 
        SET is_active = false, left_at = CURRENT_TIMESTAMP
        WHERE group_id = $1 AND user_id = $2 AND is_active = true
        RETURNING id
      `;

      const result = await db.query(query, [groupId, userId]);
      
      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Member not found in group'
        };
      }

      return {
        success: true,
        data: true,
        affectedRows: result.rowCount || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get group with members
  static async findByIdWithMembers(id: string): Promise<DatabaseResult<GroupWithMembers>> {
    try {
      const groupQuery = `SELECT * FROM ${this.TABLE_NAME} WHERE id = $1 AND is_active = true`;
      const groupResult = await db.query(groupQuery, [id]);
      
      if (groupResult.rows.length === 0) {
        return {
          success: false,
          error: 'Group not found'
        };
      }

      const group = groupResult.rows[0];

      const membersQuery = `
        SELECT 
          gm.*,
          u.id as user_id,
          u.email,
          u.username,
          u.first_name,
          u.last_name,
          u.avatar_url,
          u.phone,
          u.timezone,
          u.email_verified,
          u.last_login,
          u.is_active as user_active,
          u.created_at as user_created_at,
          u.updated_at as user_updated_at
        FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = $1 AND gm.is_active = true AND u.is_active = true
        ORDER BY gm.joined_at ASC
      `;

      const membersResult = await db.query(membersQuery, [id]);

      const members = membersResult.rows.map(row => ({
        id: row.id,
        group_id: row.group_id,
        user_id: row.user_id,
        role: row.role,
        joined_at: row.joined_at,
        left_at: row.left_at,
        is_active: row.is_active,
        user: {
          id: row.user_id,
          email: row.email,
          username: row.username,
          first_name: row.first_name,
          last_name: row.last_name,
          avatar_url: row.avatar_url,
          phone: row.phone,
          timezone: row.timezone,
          email_verified: row.email_verified,
          last_login: row.last_login,
          is_active: row.user_active,
          created_at: row.user_created_at,
          updated_at: row.user_updated_at,
          password_hash: '', // Don't expose password hash
          email_verification_token: undefined,
          password_reset_token: undefined,
          password_reset_expires: undefined
        }
      }));

      return {
        success: true,
        data: {
          ...group,
          members,
          expenses: [], // Will be populated separately if needed
          balances: []   // Will be populated separately if needed
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Check if user is member of group
  static async isMember(groupId: string, userId: string): Promise<boolean> {
    try {
      const query = `
        SELECT id FROM group_members 
        WHERE group_id = $1 AND user_id = $2 AND is_active = true
      `;
      const result = await db.query(query, [groupId, userId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Is member check error:', error);
      return false;
    }
  }

  // Check if user is admin of group
  static async isAdmin(groupId: string, userId: string): Promise<boolean> {
    try {
      const query = `
        SELECT role FROM group_members 
        WHERE group_id = $1 AND user_id = $2 AND is_active = true
      `;
      const result = await db.query(query, [groupId, userId]);
      return result.rows.length > 0 && result.rows[0].role === 'admin';
    } catch (error) {
      console.error('Is admin check error:', error);
      return false;
    }
  }

  // Get user's groups
  static async findByUserId(userId: string): Promise<DatabaseResult<Group[]>> {
    try {
      const query = `
        SELECT g.*
        FROM ${this.TABLE_NAME} g
        JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = $1 AND gm.is_active = true AND g.is_active = true
        ORDER BY g.created_at DESC
      `;

      const result = await db.query(query, [userId]);
      
      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
