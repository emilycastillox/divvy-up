import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Users, DollarSign, Calendar, FileText, Tag, Receipt } from 'lucide-react';
import Button from '../UI/Button';
import { useApp } from '../../contexts/AppContext';
import { apiClient } from '../../services/api';
import { CreateExpenseInput, GroupMember, ExpenseCategory } from '../../types';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  groupMembers: GroupMember[];
  onExpenseAdded: () => void;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'food', name: 'Food & Dining', icon: '🍽️' },
  { id: 'transport', name: 'Transportation', icon: '🚗' },
  { id: 'accommodation', name: 'Accommodation', icon: '🏨' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️' },
  { id: 'utilities', name: 'Utilities', icon: '⚡' },
  { id: 'healthcare', name: 'Healthcare', icon: '🏥' },
  { id: 'other', name: 'Other', icon: '📦' },
];

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  groupId,
  groupName,
  groupMembers,
  onExpenseAdded,
}) => {
  const { addNotification } = useApp();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    expense_date: new Date().toISOString().split('T')[0],
    notes: '',
    receipt_url: '',
  });
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [splitType, setSplitType] = useState<'equal' | 'percentage' | 'custom'>('equal');
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        description: '',
        amount: '',
        category: '',
        expense_date: new Date().toISOString().split('T')[0],
        notes: '',
        receipt_url: '',
      });
      setSelectedMembers([]);
      setCustomAmounts({});
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        const newSelected = prev.filter(id => id !== memberId);
        const newCustomAmounts = { ...customAmounts };
        delete newCustomAmounts[memberId];
        setCustomAmounts(newCustomAmounts);
        return newSelected;
      } else {
        return [...prev, memberId];
      }
    });
  };

  const handleCustomAmountChange = (memberId: string, amount: string) => {
    setCustomAmounts(prev => ({ ...prev, [memberId]: amount }));
  };

  const calculateEqualSplit = () => {
    const amount = parseFloat(formData.amount);
    if (amount && selectedMembers.length > 0) {
      return amount / selectedMembers.length;
    }
    return 0;
  };

  const calculateSplits = () => {
    const amount = parseFloat(formData.amount);
    if (!amount || selectedMembers.length === 0) return [];

    switch (splitType) {
      case 'equal':
        const equalAmount = amount / selectedMembers.length;
        return selectedMembers.map(memberId => ({
          user_id: memberId,
          amount: equalAmount,
        }));

      case 'percentage':
        return selectedMembers.map(memberId => {
          const percentage = parseFloat(customAmounts[memberId] || '0');
          return {
            user_id: memberId,
            amount: (amount * percentage) / 100,
            percentage,
          };
        });

      case 'custom':
        return selectedMembers.map(memberId => ({
          user_id: memberId,
          amount: parseFloat(customAmounts[memberId] || '0'),
        }));

      default:
        return [];
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (selectedMembers.length === 0) {
      newErrors.members = 'Select at least one participant';
    }

    if (splitType === 'percentage') {
      const totalPercentage = selectedMembers.reduce((sum, memberId) => {
        return sum + parseFloat(customAmounts[memberId] || '0');
      }, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        newErrors.percentage = 'Total percentage must equal 100%';
      }
    }

    if (splitType === 'custom') {
      const totalCustomAmount = selectedMembers.reduce((sum, memberId) => {
        return sum + parseFloat(customAmounts[memberId] || '0');
      }, 0);
      const expectedTotal = parseFloat(formData.amount);
      if (Math.abs(totalCustomAmount - expectedTotal) > 0.01) {
        newErrors.custom = 'Custom amounts must equal the total amount';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const expenseData: CreateExpenseInput = {
        group_id: groupId,
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        category: formData.category || undefined,
        expense_date: formData.expense_date,
        notes: formData.notes || undefined,
        receipt_url: formData.receipt_url || undefined,
        splits: calculateSplits(),
      };

      const response = await apiClient.createExpense(expenseData);
      
      if (response.success) {
        addNotification({ type: 'success', message: 'Expense added successfully!' });
        onExpenseAdded();
        onClose();
      } else {
        addNotification({ type: 'error', message: response.message || 'Failed to add expense' });
      }
    } catch (error: any) {
      addNotification({ type: 'error', message: error.message || 'Failed to add expense' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Add Expense</h2>
              <p className="text-sm text-gray-500">{groupName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="What was this expense for?"
                disabled={loading}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  disabled={loading}
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={loading}
              >
                <option value="">Select a category</option>
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => handleInputChange('expense_date', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Participants Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Participants *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {groupMembers.map((member) => (
                <label
                  key={member.id}
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedMembers.includes(member.id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(member.id)}
                    onChange={() => handleMemberToggle(member.id)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    disabled={loading}
                  />
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      {member.user.avatarUrl ? (
                        <img
                          src={member.user.avatarUrl}
                          alt={`${member.user.firstName} ${member.user.lastName}`}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 font-semibold text-sm">
                          {member.user.firstName.charAt(0)}{member.user.lastName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {member.user.firstName} {member.user.lastName}
                    </span>
                  </div>
                </label>
              ))}
            </div>
            {errors.members && (
              <p className="mt-2 text-sm text-red-600">{errors.members}</p>
            )}
          </div>

          {/* Split Type Selection */}
          {selectedMembers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How to split the expense?
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'equal', label: 'Equal Split', icon: '⚖️' },
                  { value: 'percentage', label: 'Percentage', icon: '📊' },
                  { value: 'custom', label: 'Custom Amounts', icon: '✏️' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      splitType === option.value
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="splitType"
                      value={option.value}
                      checked={splitType === option.value}
                      onChange={(e) => setSplitType(e.target.value as any)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                      disabled={loading}
                    />
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{option.icon}</span>
                      <span className="font-medium text-gray-900">{option.label}</span>
                    </div>
                  </label>
                ))}
              </div>

              {/* Split Details */}
              {splitType === 'equal' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Each participant will pay: <strong>${calculateEqualSplit().toFixed(2)}</strong>
                  </p>
                </div>
              )}

              {splitType === 'percentage' && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-medium text-gray-700">Enter percentages for each participant:</p>
                  {selectedMembers.map((memberId) => {
                    const member = groupMembers.find(m => m.id === memberId);
                    return (
                      <div key={memberId} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-semibold text-sm">
                            {member?.user.firstName.charAt(0)}{member?.user.lastName.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-32">
                          {member?.user.firstName} {member?.user.lastName}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={customAmounts[memberId] || ''}
                          onChange={(e) => handleCustomAmountChange(memberId, e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="0"
                          disabled={loading}
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    );
                  })}
                  {errors.percentage && (
                    <p className="text-sm text-red-600">{errors.percentage}</p>
                  )}
                </div>
              )}

              {splitType === 'custom' && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-medium text-gray-700">Enter custom amounts for each participant:</p>
                  {selectedMembers.map((memberId) => {
                    const member = groupMembers.find(m => m.id === memberId);
                    return (
                      <div key={memberId} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-semibold text-sm">
                            {member?.user.firstName.charAt(0)}{member?.user.lastName.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-32">
                          {member?.user.firstName} {member?.user.lastName}
                        </span>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={customAmounts[memberId] || ''}
                            onChange={(e) => handleCustomAmountChange(memberId, e.target.value)}
                            className="w-24 pl-8 pr-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="0.00"
                            disabled={loading}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {errors.custom && (
                    <p className="text-sm text-red-600">{errors.custom}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Add any additional notes..."
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipt URL
              </label>
              <input
                type="url"
                value={formData.receipt_url}
                onChange={(e) => handleInputChange('receipt_url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="https://example.com/receipt"
                disabled={loading}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading || selectedMembers.length === 0}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
