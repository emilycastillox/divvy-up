import {
  validateEmail,
  formatCurrency,
  formatDate,
  calculateSplit,
} from './index';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(123.45)).toBe('$123.45');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(1000)).toBe('$1,000.00');
    });
  });

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2023-12-25T12:00:00Z');
      expect(formatDate(date)).toBe('Dec 25, 2023');
    });
  });

  describe('calculateSplit', () => {
    it('should calculate equal splits correctly', () => {
      expect(calculateSplit(100, 4)).toBe(25);
      expect(calculateSplit(33.33, 3)).toBe(11.11);
      expect(calculateSplit(10, 3)).toBe(3.33);
    });
  });
});
