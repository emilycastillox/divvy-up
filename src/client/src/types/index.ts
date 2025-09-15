// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string;
  timestamp: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  phone?: string;
  timezone: string;
  email_verified: boolean;
  last_login?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  confirmPassword: string;
}

// Group Types
export interface Group {
  id: string;
  name: string;
  description?: string;
  currency: string;
  created_by: string;
  is_active: boolean;
  settings: {
    splitMethod: 'equal' | 'percentage' | 'exact';
    allowPartialPayments: boolean;
    requireApproval: boolean;
  };
  members: GroupMember[];
  recentExpenses?: Expense[];
  totalExpenses?: number;
  created_at: Date;
  updated_at: Date;
}

export interface GroupMember {
  id: string;
  user: User;
  role: 'admin' | 'member';
  joined_at: Date;
  balance?: number;
  is_active?: boolean;
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  currency?: string;
}

export interface UpdateGroupInput {
  name?: string;
  description?: string;
  currency?: string;
}

// Expense Types
export interface Expense {
  id: string;
  group_id: string;
  group?: {
    id: string;
    name: string;
  };
  description: string;
  amount: number;
  category?: string;
  expense_date: Date;
  receipt_url?: string;
  notes?: string;
  paid_by: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  created_by: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
  };
  splits: ExpenseSplit[];
  is_settled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ExpenseSplit {
  id: string;
  user: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  amount: number;
  percentage: number;
  is_paid: boolean;
  paid_at?: Date;
}

export interface CreateExpenseInput {
  group_id: string;
  amount: number;
  description: string;
  category?: string;
  expense_date: string;
  receipt_url?: string;
  notes?: string;
  splits: {
    user_id: string;
    amount?: number;
    percentage?: number;
  }[];
}

export interface UpdateExpenseInput {
  amount?: number;
  description?: string;
  category?: string;
  expense_date?: string;
  receipt_url?: string;
  notes?: string;
}

// Balance Types
export interface Balance {
  user: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  total_owed: number;
  total_owes: number;
  net_balance: number;
}

// Category Types
export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea';
  placeholder?: string;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  options?: { value: string; label: string }[];
}

// Navigation Types
export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  badge?: number;
  children?: NavItem[];
}

// Theme Types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
  };
  breakpoints: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}
