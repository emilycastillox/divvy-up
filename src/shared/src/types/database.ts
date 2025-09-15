// Database entity types for DivvyUp application

export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  avatar_url?: string;
  phone?: string;
  timezone: string;
  email_verified: boolean;
  email_verification_token?: string;
  password_reset_token?: string;
  password_reset_expires?: Date;
  last_login?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  // Also support camelCase for compatibility
  firstName?: string;
  lastName?: string;
  passwordHash?: string;
  avatarUrl?: string;
  emailVerified?: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLogin?: Date;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  currency: string;
  created_by: string;
  is_active: boolean;
  settings: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: Date;
  left_at?: Date;
  is_active: boolean;
}

export interface Expense {
  id: string;
  group_id: string;
  created_by: string;
  paid_by: string;
  amount: number;
  description: string;
  category?: string;
  expense_date: Date;
  receipt_url?: string;
  notes?: string;
  is_settled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ExpenseItem {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  percentage?: number;
  is_paid: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Balance {
  id: string;
  group_id: string;
  user_id: string;
  total_owed: number;
  total_owes: number;
  net_balance: number;
  last_calculated: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Transaction {
  id: string;
  group_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  description?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  payment_method?: string;
  payment_reference?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Payment {
  id: string;
  transaction_id?: string;
  group_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  currency: string;
  payment_provider: 'venmo' | 'paypal' | 'stripe' | 'manual';
  provider_transaction_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  provider_fee: number;
  net_amount?: number;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  processed_at?: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  group_id?: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  is_read: boolean;
  read_at?: Date;
  created_at: Date;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  group_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

// Input types for creating new records
export interface CreateUserInput {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  avatar_url?: string;
  phone?: string;
  timezone?: string;
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  currency?: string;
  created_by: string;
  settings?: Record<string, any>;
}

export interface CreateExpenseInput {
  group_id: string;
  created_by: string;
  paid_by: string;
  amount: number;
  description: string;
  category?: string;
  expense_date: Date;
  receipt_url?: string;
  notes?: string;
  splits: Array<{
    user_id: string;
    amount?: number;
    percentage?: number;
  }>;
}

export interface CreateTransactionInput {
  group_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  description?: string;
  payment_method?: string;
}

export interface CreatePaymentInput {
  transaction_id?: string;
  group_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  currency?: string;
  payment_provider: 'venmo' | 'paypal' | 'stripe' | 'manual';
  provider_transaction_id?: string;
  metadata?: Record<string, any>;
}

// Update types for modifying existing records
export interface UpdateUserInput {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone?: string;
  timezone?: string;
  email_verified?: boolean;
  is_active?: boolean;
}

export interface UpdateGroupInput {
  name?: string;
  description?: string;
  currency?: string;
  is_active?: boolean;
  settings?: Record<string, any>;
}

export interface UpdateExpenseInput {
  description?: string;
  category?: string;
  expense_date?: Date;
  receipt_url?: string;
  notes?: string;
  is_settled?: boolean;
}

// Query filter types
export interface UserFilters {
  email?: string;
  username?: string;
  is_active?: boolean;
  email_verified?: boolean;
}

export interface GroupFilters {
  created_by?: string;
  is_active?: boolean;
  currency?: string;
}

export interface ExpenseFilters {
  group_id?: string;
  created_by?: string;
  paid_by?: string;
  category?: string;
  is_settled?: boolean;
  date_from?: Date;
  date_to?: Date;
  min_amount?: number;
  max_amount?: number;
}

export interface TransactionFilters {
  group_id?: string;
  from_user_id?: string;
  to_user_id?: string;
  status?: string;
}

// Response types with populated relationships
export interface UserWithGroups extends User {
  groups: Array<GroupMember & { group: Group }>;
}

export interface GroupWithMembers extends Group {
  members: Array<GroupMember & { user: User }>;
  expenses: Expense[];
  balances: Balance[];
}

export interface ExpenseWithDetails extends Expense {
  group: Group;
  created_by_user: User;
  paid_by_user: User;
  items: Array<ExpenseItem & { user: User }>;
}

export interface BalanceWithUser extends Balance {
  user: User;
  group: Group;
}

export interface TransactionWithUsers extends Transaction {
  from_user: User;
  to_user: User;
  group: Group;
  payments: Payment[];
}

// Pagination types
export interface PaginationOptions {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Database operation result types
export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  affectedRows?: number;
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  errors: Array<{
    index: number;
    error: string;
  }>;
}

// Utility types
export type EntityId = string;
export type Timestamp = Date;
export type Currency = string;
export type UserRole = 'admin' | 'member';
export type TransactionStatus = 'pending' | 'completed' | 'cancelled' | 'failed';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
// PaymentProvider is defined in config/env.ts
