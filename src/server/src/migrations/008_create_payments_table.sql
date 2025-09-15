-- Migration: Create payments table
-- Description: Creates the payments table for storing payment processing information and status
-- Version: 008
-- Created: 2024-01-15

-- Create payments table
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
  processed_at TIMESTAMP,
  CHECK (from_user_id != to_user_id)
);

-- Create indexes for performance
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_group_id ON payments(group_id);
CREATE INDEX idx_payments_from_user ON payments(from_user_id);
CREATE INDEX idx_payments_to_user ON payments(to_user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_provider ON payments(payment_provider);
CREATE INDEX idx_payments_created ON payments(created_at);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add constraints
ALTER TABLE payments ADD CONSTRAINT chk_payments_amount_positive 
  CHECK (amount > 0);

ALTER TABLE payments ADD CONSTRAINT chk_payments_currency_length 
  CHECK (LENGTH(currency) = 3);

ALTER TABLE payments ADD CONSTRAINT chk_payments_provider_valid 
  CHECK (payment_provider IN ('venmo', 'paypal', 'stripe', 'manual'));

ALTER TABLE payments ADD CONSTRAINT chk_payments_status_valid 
  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'));

ALTER TABLE payments ADD CONSTRAINT chk_payments_no_self_reference 
  CHECK (from_user_id != to_user_id);

ALTER TABLE payments ADD CONSTRAINT chk_payments_fee_non_negative 
  CHECK (provider_fee >= 0);

-- Add comments for documentation
COMMENT ON TABLE payments IS 'Stores payment processing information and status';
COMMENT ON COLUMN payments.id IS 'Unique identifier for the payment';
COMMENT ON COLUMN payments.transaction_id IS 'Reference to the associated transaction';
COMMENT ON COLUMN payments.group_id IS 'Reference to the group';
COMMENT ON COLUMN payments.from_user_id IS 'User making the payment';
COMMENT ON COLUMN payments.to_user_id IS 'User receiving the payment';
COMMENT ON COLUMN payments.amount IS 'Amount being paid';
COMMENT ON COLUMN payments.currency IS 'Currency code (ISO 4217)';
COMMENT ON COLUMN payments.payment_provider IS 'Payment service provider used';
COMMENT ON COLUMN payments.provider_transaction_id IS 'External provider transaction ID';
COMMENT ON COLUMN payments.status IS 'Current status of the payment';
COMMENT ON COLUMN payments.provider_fee IS 'Fee charged by the payment provider';
COMMENT ON COLUMN payments.net_amount IS 'Amount after fees';
COMMENT ON COLUMN payments.metadata IS 'Additional provider-specific data';
COMMENT ON COLUMN payments.processed_at IS 'When the payment was processed';
