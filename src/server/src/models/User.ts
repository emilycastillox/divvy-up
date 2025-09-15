import { db } from '../config/database';
import { 
  User, 
  CreateUserInput, 
  UpdateUserInput, 
  UserFilters, 
  UserWithGroups,
  DatabaseResult,
  PaginatedResponse,
  PaginationOptions
} from '@divvy-up/shared';
import bcrypt from 'bcryptjs';
import { env } from '@divvy-up/shared';

export class UserModel {
  private static readonly TABLE_NAME = 'users';

  // Create a new user
  static async create(input: CreateUserInput): Promise<DatabaseResult<User>> {
    try {
      const hashedPassword = await bcrypt.hash(input.password, env.SECURITY.BCRYPT_ROUNDS);
      
      const query = `
        INSERT INTO ${this.TABLE_NAME} (
          email, username, first_name, last_name, password_hash,
          avatar_url, phone, timezone
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const values = [
        input.email,
        input.username,
        input.first_name,
        input.last_name,
        hashedPassword,
        input.avatar_url || null,
        input.phone || null,
        input.timezone || 'UTC'
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

  // Find user by ID
  static async findById(id: string): Promise<DatabaseResult<User>> {
    try {
      const query = `SELECT * FROM ${this.TABLE_NAME} WHERE id = $1 AND is_active = true`;
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'User not found'
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

  // Find user by email
  static async findByEmail(email: string): Promise<DatabaseResult<User>> {
    try {
      const query = `SELECT * FROM ${this.TABLE_NAME} WHERE email = $1 AND is_active = true`;
      const result = await db.query(query, [email]);
      
      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'User not found'
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

  // Find user by username
  static async findByUsername(username: string): Promise<DatabaseResult<User>> {
    try {
      const query = `SELECT * FROM ${this.TABLE_NAME} WHERE username = $1 AND is_active = true`;
      const result = await db.query(query, [username]);
      
      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'User not found'
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

  // Find users with filters and pagination
  static async findMany(
    filters: UserFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 10, offset: 0 }
  ): Promise<DatabaseResult<PaginatedResponse<User>>> {
    try {
      const whereConditions: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      if (filters.email) {
        paramCount++;
        whereConditions.push(`email ILIKE $${paramCount}`);
        values.push(`%${filters.email}%`);
      }

      if (filters.username) {
        paramCount++;
        whereConditions.push(`username ILIKE $${paramCount}`);
        values.push(`%${filters.username}%`);
      }

      if (filters.is_active !== undefined) {
        paramCount++;
        whereConditions.push(`is_active = $${paramCount}`);
        values.push(filters.is_active);
      }

      if (filters.email_verified !== undefined) {
        paramCount++;
        whereConditions.push(`email_verified = $${paramCount}`);
        values.push(filters.email_verified);
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

  // Update user
  static async update(id: string, input: UpdateUserInput): Promise<DatabaseResult<User>> {
    try {
      const setClause: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      Object.entries(input).forEach(([key, value]) => {
        if (value !== undefined) {
          paramCount++;
          setClause.push(`${key} = $${paramCount}`);
          values.push(value);
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
          error: 'User not found'
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

  // Soft delete user
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
          error: 'User not found'
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

  // Verify password
  static async verifyPassword(user: User, password: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, user.password_hash);
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  // Update password
  static async updatePassword(id: string, newPassword: string): Promise<DatabaseResult<boolean>> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, env.SECURITY.BCRYPT_ROUNDS);
      
      const query = `
        UPDATE ${this.TABLE_NAME} 
        SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND is_active = true
        RETURNING id
      `;

      const result = await db.query(query, [hashedPassword, id]);
      
      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'User not found'
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

  // Update last login
  static async updateLastLogin(id: string): Promise<DatabaseResult<boolean>> {
    try {
      const query = `
        UPDATE ${this.TABLE_NAME} 
        SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND is_active = true
        RETURNING id
      `;

      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'User not found'
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

  // Check if email exists
  static async emailExists(email: string): Promise<boolean> {
    try {
      const query = `SELECT id FROM ${this.TABLE_NAME} WHERE email = $1 AND is_active = true`;
      const result = await db.query(query, [email]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Email exists check error:', error);
      return false;
    }
  }

  // Check if username exists
  static async usernameExists(username: string): Promise<boolean> {
    try {
      const query = `SELECT id FROM ${this.TABLE_NAME} WHERE username = $1 AND is_active = true`;
      const result = await db.query(query, [username]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Username exists check error:', error);
      return false;
    }
  }

  // Get user with groups
  static async findByIdWithGroups(id: string): Promise<DatabaseResult<UserWithGroups>> {
    try {
      const query = `
        SELECT 
          u.*,
          gm.id as membership_id,
          gm.role,
          gm.joined_at,
          gm.left_at,
          gm.is_active as membership_active,
          g.id as group_id,
          g.name as group_name,
          g.description as group_description,
          g.currency as group_currency,
          g.created_by as group_created_by,
          g.is_active as group_active,
          g.settings as group_settings,
          g.created_at as group_created_at,
          g.updated_at as group_updated_at
        FROM ${this.TABLE_NAME} u
        LEFT JOIN group_members gm ON u.id = gm.user_id AND gm.is_active = true
        LEFT JOIN groups g ON gm.group_id = g.id AND g.is_active = true
        WHERE u.id = $1 AND u.is_active = true
      `;

      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const user = result.rows[0];
      const groups = result.rows
        .filter(row => row.group_id)
        .map(row => ({
          id: row.membership_id,
          group_id: row.group_id,
          user_id: row.id,
          role: row.role,
          joined_at: row.joined_at,
          left_at: row.left_at,
          is_active: row.membership_active,
          group: {
            id: row.group_id,
            name: row.group_name,
            description: row.group_description,
            currency: row.group_currency,
            created_by: row.group_created_by,
            is_active: row.group_active,
            settings: row.group_settings,
            created_at: row.group_created_at,
            updated_at: row.group_updated_at
          }
        }));

      return {
        success: true,
        data: {
          ...user,
          groups
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
