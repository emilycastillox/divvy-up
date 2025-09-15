import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from 'dotenv';

// Load environment variables first
config();

import { UserModel } from '../models/User';
import { CreateUserInput, User } from '@divvy-up/shared';
import { env } from '@divvy-up/shared';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends CreateUserInput {
  confirmPassword: string;
}

export interface PasswordResetData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export class AuthService {
  // Generate JWT tokens
  static generateTokens(user: User): AuthTokens {
    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
    };

    const accessToken = jwt.sign(payload, env.JWT.SECRET, {
      expiresIn: env.JWT.EXPIRES_IN,
    });

    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      env.JWT.REFRESH_SECRET,
      { expiresIn: env.JWT.REFRESH_EXPIRES_IN }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getTokenExpiration(env.JWT.EXPIRES_IN),
    };
  }

  // Verify JWT token
  static verifyToken(token: string, isRefresh = false): any {
    try {
      const secret = isRefresh ? env.JWT.REFRESH_SECRET : env.JWT.SECRET;
      return jwt.verify(token, secret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Get token expiration time in seconds
  private static getTokenExpiration(expiresIn: string): number {
    const timeUnits: { [key: string]: number } = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // Default 1 hour

    const [, value, unit] = match;
    return parseInt(value) * timeUnits[unit];
  }

  // Register new user
  static async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    // Validate input
    this.validateRegistrationData(data);

    // Check if user already exists
    const existingUserByEmail = await UserModel.findByEmail(data.email);
    if (existingUserByEmail.success) {
      throw new Error('User with this email already exists');
    }

    const existingUserByUsername = await UserModel.findByUsername(data.username);
    if (existingUserByUsername.success) {
      throw new Error('Username already taken');
    }

    // Create user
    const userResult = await UserModel.create({
      email: data.email,
      username: data.username,
      first_name: data.first_name,
      last_name: data.last_name,
      password: data.password,
      avatar_url: data.avatar_url,
      phone: data.phone,
      timezone: data.timezone,
    });

    if (!userResult.success || !userResult.data) {
      throw new Error(userResult.error || 'Failed to create user');
    }

    // Generate tokens
    const tokens = this.generateTokens(userResult.data);

    return {
      user: userResult.data,
      tokens,
    };
  }

  // Login user
  static async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    // Find user by email
    const userResult = await UserModel.findByEmail(credentials.email);
    if (!userResult.success || !userResult.data) {
      throw new Error('Invalid email or password');
    }

    const user = userResult.data;

    // Verify password
    const isPasswordValid = await UserModel.verifyPassword(user, credentials.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Update last login
    await UserModel.updateLastLogin(user.id);

    // Generate tokens
    const tokens = this.generateTokens(user);

    return {
      user,
      tokens,
    };
  }

  // Refresh access token
  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = this.verifyToken(refreshToken, true);
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }

      // Get user
      const userResult = await UserModel.findById(decoded.id);
      if (!userResult.success || !userResult.data) {
        throw new Error('User not found');
      }

      const user = userResult.data;

      // Check if user is still active
      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }

      // Generate new tokens
      return this.generateTokens(user);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Generate password reset token
  static async generatePasswordResetToken(email: string): Promise<string> {
    const userResult = await UserModel.findByEmail(email);
    if (!userResult.success || !userResult.data) {
      // Don't reveal if email exists or not
      return 'reset-token-placeholder';
    }

    const user = userResult.data;
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Update user with reset token
    await UserModel.update(user.id, {
      password_reset_token: resetToken,
      password_reset_expires: expiresAt,
    });

    return resetToken;
  }

  // Reset password
  static async resetPassword(data: PasswordResetData): Promise<void> {
    // Validate input
    if (data.newPassword !== data.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    if (data.newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Find user by reset token
    const query = `
      SELECT * FROM users 
      WHERE password_reset_token = $1 
      AND password_reset_expires > NOW() 
      AND is_active = true
    `;

    // We'll need to use the database directly for this query
    const { db } = await import('../config/database');
    const result = await db.query(query, [data.token]);

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired reset token');
    }

    const user = result.rows[0];

    // Update password
    const updateResult = await UserModel.updatePassword(user.id, data.newPassword);
    if (!updateResult.success) {
      throw new Error('Failed to update password');
    }

    // Clear reset token
    await UserModel.update(user.id, {
      password_reset_token: undefined,
      password_reset_expires: undefined,
    });
  }

  // Generate email verification token
  static async generateEmailVerificationToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    
    await UserModel.update(userId, {
      email_verification_token: token,
    });

    return token;
  }

  // Verify email
  static async verifyEmail(token: string): Promise<void> {
    const query = `
      SELECT * FROM users 
      WHERE email_verification_token = $1 
      AND is_active = true
    `;

    const { db } = await import('../config/database');
    const result = await db.query(query, [token]);

    if (result.rows.length === 0) {
      throw new Error('Invalid verification token');
    }

    const user = result.rows[0];

    await UserModel.update(user.id, {
      email_verified: true,
      email_verification_token: undefined,
    });
  }

  // Validate registration data
  private static validateRegistrationData(data: RegisterData): void {
    if (!data.email || !data.email.includes('@')) {
      throw new Error('Valid email is required');
    }

    if (!data.username || data.username.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }

    if (!data.first_name || !data.last_name) {
      throw new Error('First name and last name are required');
    }

    if (!data.password || data.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (data.password !== data.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(data.password)) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }
  }

  // Logout (invalidate refresh token)
  static async logout(userId: string): Promise<void> {
    // In a real implementation, you would store refresh tokens in Redis
    // and invalidate them here. For now, we'll just log the logout.
    console.log(`User ${userId} logged out`);
  }

  // Get user from token
  static async getUserFromToken(token: string): Promise<User> {
    try {
      const decoded = this.verifyToken(token);
      const userResult = await UserModel.findById(decoded.id);
      
      if (!userResult.success || !userResult.data) {
        throw new Error('User not found');
      }

      return userResult.data;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}
