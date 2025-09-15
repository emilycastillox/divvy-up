# Database Schema Design

This document outlines the complete database schema for the DivvyUp expense splitting application.

## Overview

The database is designed to support:
- User management and authentication
- Group creation and management
- Expense tracking and splitting
- Balance calculations and settlements
- Payment processing and transactions
- Audit trails and history

## Entity Relationship Diagram

```
Users (1) ──── (M) GroupMembers (M) ──── (1) Groups
  │                                        │
  │                                        │
  └─── (1) Expenses (M) ───────────────────┘
  │        │
  │        └─── (M) ExpenseItems (M) ──── (1) Users
  │
  └─── (M) Balances (M) ──── (1) Groups
  │
  └─── (M) Transactions (M) ──── (1) Groups
  │
  └─── (M) Payments (M) ──── (1) Groups
```

## Tables

### 1. Users

Stores user account information and authentication data.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  phone VARCHAR(20),
  timezone VARCHAR(50) DEFAULT 'UTC',
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Groups

Stores expense groups (trips, events, shared living, etc.).

```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  currency VARCHAR(3) DEFAULT 'USD',
  created_by UUID NOT NULL REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. GroupMembers

Junction table for group membership with roles and permissions.

```sql
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(group_id, user_id)
);
```

### 4. Expenses

Stores individual expenses within groups.

```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  paid_by UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  category VARCHAR(50),
  expense_date DATE NOT NULL,
  receipt_url VARCHAR(500),
  notes TEXT,
  is_settled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. ExpenseItems

Stores how an expense is split among group members.

```sql
CREATE TABLE expense_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  percentage DECIMAL(5,2) CHECK (percentage >= 0 AND percentage <= 100),
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(expense_id, user_id)
);
```

### 6. Balances

Stores calculated balances between users within groups.

```sql
CREATE TABLE balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  total_owed DECIMAL(10,2) DEFAULT 0,
  total_owes DECIMAL(10,2) DEFAULT 0,
  net_balance DECIMAL(10,2) DEFAULT 0,
  last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, user_id)
);
```

### 7. Transactions

Stores settlement transactions between users.

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id),
  to_user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (from_user_id != to_user_id)
);
```

### 8. Payments

Stores payment processing information and status.

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id),
  to_user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'USD',
  payment_provider VARCHAR(50) NOT NULL CHECK (payment_provider IN ('venmo', 'paypal', 'stripe', 'manual')),
  provider_transaction_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
  provider_fee DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);
```

### 9. Notifications

Stores user notifications and alerts.

```sql
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
```

### 10. AuditLogs

Stores audit trail for important actions.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  group_id UUID REFERENCES groups(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Indexes

### Performance Indexes

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_active ON users(is_active);

-- Groups
CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_groups_active ON groups(is_active);

-- Group Members
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_active ON group_members(is_active);

-- Expenses
CREATE INDEX idx_expenses_group_id ON expenses(group_id);
CREATE INDEX idx_expenses_created_by ON expenses(created_by);
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_settled ON expenses(is_settled);

-- Expense Items
CREATE INDEX idx_expense_items_expense_id ON expense_items(expense_id);
CREATE INDEX idx_expense_items_user_id ON expense_items(user_id);

-- Balances
CREATE INDEX idx_balances_group_id ON balances(group_id);
CREATE INDEX idx_balances_user_id ON balances(user_id);
CREATE INDEX idx_balances_net ON balances(net_balance);

-- Transactions
CREATE INDEX idx_transactions_group_id ON transactions(group_id);
CREATE INDEX idx_transactions_from_user ON transactions(from_user_id);
CREATE INDEX idx_transactions_to_user ON transactions(to_user_id);
CREATE INDEX idx_transactions_status ON transactions(status);

-- Payments
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_group_id ON payments(group_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_provider ON payments(payment_provider);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_group_id ON notifications(group_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- Audit Logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_group_id ON audit_logs(group_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

## Constraints and Validation

### Check Constraints

```sql
-- Amount validations
ALTER TABLE expenses ADD CONSTRAINT chk_expense_amount_positive CHECK (amount > 0);
ALTER TABLE expense_items ADD CONSTRAINT chk_expense_item_amount_non_negative CHECK (amount >= 0);
ALTER TABLE transactions ADD CONSTRAINT chk_transaction_amount_positive CHECK (amount > 0);
ALTER TABLE payments ADD CONSTRAINT chk_payment_amount_positive CHECK (amount > 0);

-- Percentage validations
ALTER TABLE expense_items ADD CONSTRAINT chk_expense_item_percentage_valid CHECK (percentage >= 0 AND percentage <= 100);

-- Status validations
ALTER TABLE transactions ADD CONSTRAINT chk_transaction_status_valid CHECK (status IN ('pending', 'completed', 'cancelled', 'failed'));
ALTER TABLE payments ADD CONSTRAINT chk_payment_status_valid CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'));
ALTER TABLE payments ADD CONSTRAINT chk_payment_provider_valid CHECK (payment_provider IN ('venmo', 'paypal', 'stripe', 'manual'));

-- Role validations
ALTER TABLE group_members ADD CONSTRAINT chk_group_member_role_valid CHECK (role IN ('admin', 'member'));

-- Self-reference prevention
ALTER TABLE transactions ADD CONSTRAINT chk_transaction_no_self_reference CHECK (from_user_id != to_user_id);
ALTER TABLE payments ADD CONSTRAINT chk_payment_no_self_reference CHECK (from_user_id != to_user_id);
```

### Foreign Key Constraints

All foreign key relationships are properly defined with appropriate cascade behaviors:
- Groups are deleted when the creator is deleted
- Group members are deleted when the group is deleted
- Expenses and related items are deleted when the group is deleted
- Notifications are deleted when the user is deleted

## Data Types and Precision

- **UUIDs**: Used for all primary keys for better distribution and security
- **DECIMAL(10,2)**: Used for monetary amounts to ensure precision
- **TIMESTAMP**: Used for all date/time fields with timezone support
- **JSONB**: Used for flexible data storage (settings, metadata)
- **TEXT**: Used for longer text fields without length restrictions
- **VARCHAR**: Used for shorter text fields with appropriate length limits

## Security Considerations

- All monetary amounts use DECIMAL to prevent floating-point precision issues
- UUIDs prevent enumeration attacks
- Soft deletes for important entities (users, groups)
- Audit logging for all critical operations
- Proper foreign key constraints to maintain referential integrity

## Scalability Considerations

- Indexes on frequently queried columns
- Partitioning strategy for audit logs (by date)
- JSONB for flexible schema evolution
- Proper normalization to reduce data redundancy
- Efficient query patterns for common operations

This schema provides a solid foundation for the DivvyUp expense splitting application with room for future enhancements and optimizations.
