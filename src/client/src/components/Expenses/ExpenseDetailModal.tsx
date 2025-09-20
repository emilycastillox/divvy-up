import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, User, Users, FileText, Receipt, Edit3, Trash2, Share2 } from 'lucide-react';
import Button from '../UI/Button';
import { useApp } from '../../contexts/AppContext';
import { apiClient } from '../../services/api';
import { Expense } from '../../types';

interface ExpenseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseId: string | null;
  onEditExpense?: (expense: Expense) => void;
  onDeleteExpense?: (expense: Expense) => void;
}

const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  isOpen,
  onClose,
  expenseId,
  onEditExpense,
  onDeleteExpense,
}) => {
  const { addNotification } = useApp();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && expenseId) {
      loadExpenseDetails();
    }
  }, [isOpen, expenseId]);

  const loadExpenseDetails = async () => {
    if (!expenseId) return;

    try {
      setLoading(true);
      const response = await apiClient.getExpense(expenseId);
      
      if (response.success && response.data?.expense) {
        setExpense(response.data.expense);
      } else {
        addNotification({ type: 'error', message: response.message || 'Failed to load expense details' });
        onClose();
      }
    } catch (error: any) {
      addNotification({ type: 'error', message: error.message || 'Failed to load expense details' });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryIcon = (category?: string) => {
    const categories: Record<string, string> = {
      food: '🍽️',
      transport: '🚗',
      accommodation: '🏨',
      entertainment: '🎬',
      shopping: '🛍️',
      utilities: '⚡',
      healthcare: '🏥',
      other: '📦',
    };
    return categories[category || 'other'] || '📦';
  };

  const getCategoryName = (category?: string) => {
    const categories: Record<string, string> = {
      food: 'Food & Dining',
      transport: 'Transportation',
      accommodation: 'Accommodation',
      entertainment: 'Entertainment',
      shopping: 'Shopping',
      utilities: 'Utilities',
      healthcare: 'Healthcare',
      other: 'Other',
    };
    return categories[category || 'other'] || 'Other';
  };

  const handleClose = () => {
    if (!loading) {
      setExpense(null);
      onClose();
    }
  };

  const handleEdit = () => {
    if (expense && onEditExpense) {
      onEditExpense(expense);
      onClose();
    }
  };

  const handleDelete = () => {
    if (expense && onDeleteExpense) {
      onDeleteExpense(expense);
      onClose();
    }
  };

  const handleShare = async () => {
    if (!expense) return;

    try {
      const shareData = {
        title: `Expense: ${expense.description}`,
        text: `${expense.description} - ${formatCurrency(expense.amount)} paid by ${expense.paid_by.first_name} ${expense.paid_by.last_name}`,
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        addNotification({ type: 'success', message: 'Expense details copied to clipboard!' });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading expense details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Expense Not Found</h3>
            <p className="text-gray-500 mb-4">The requested expense could not be found.</p>
            <Button onClick={handleClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold text-xl">
                {getCategoryIcon(expense.category)}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{expense.description}</h2>
              <p className="text-sm text-gray-500">
                {getCategoryName(expense.category)} • {formatDate(expense.expense_date)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleShare}
              className="flex items-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </Button>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Expense Overview */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {formatCurrency(expense.amount)}
                </div>
                <p className="text-sm text-gray-500">Total Amount</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {expense.splits.length}
                </div>
                <p className="text-sm text-gray-500">Participants</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {formatCurrency(expense.amount / expense.splits.length)}
                </div>
                <p className="text-sm text-gray-500">Per Person</p>
              </div>
            </div>
          </div>

          {/* Split Breakdown */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Split Breakdown
            </h3>
            <div className="space-y-3">
              {expense.splits.map((split, index) => (
                <div key={split.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      {split.user.avatarUrl ? (
                        <img
                          src={split.user.avatarUrl}
                          alt={`${split.user.first_name} ${split.user.last_name}`}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 font-semibold">
                          {split.user.first_name.charAt(0)}{split.user.last_name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {split.user.first_name} {split.user.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {split.percentage ? `${split.percentage.toFixed(1)}%` : 'Equal split'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(split.amount)}
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${split.is_paid ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <p className="text-sm text-gray-500">
                        {split.is_paid ? 'Paid' : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expense Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Paid by:</span>
                  <span className="font-medium text-gray-900">
                    {expense.paid_by.first_name} {expense.paid_by.last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created by:</span>
                  <span className="font-medium text-gray-900">
                    {expense.created_by.first_name} {expense.created_by.last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(expense.expense_date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created:</span>
                  <span className="font-medium text-gray-900">
                    {formatDateTime(expense.created_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className={`font-medium ${expense.is_settled ? 'text-green-600' : 'text-yellow-600'}`}>
                    {expense.is_settled ? 'Settled' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Receipt className="w-5 h-5 mr-2" />
                Additional Info
              </h3>
              <div className="space-y-3">
                {expense.notes && (
                  <div>
                    <span className="text-gray-500 block mb-1">Notes:</span>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {expense.notes}
                    </p>
                  </div>
                )}
                {expense.receipt_url && (
                  <div>
                    <span className="text-gray-500 block mb-1">Receipt:</span>
                    <a
                      href={expense.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-500 font-medium"
                    >
                      View Receipt →
                    </a>
                  </div>
                )}
                {!expense.notes && !expense.receipt_url && (
                  <p className="text-gray-500 italic">No additional information</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <Button
            variant="secondary"
            onClick={handleClose}
          >
            Close
          </Button>
          {onEditExpense && (
            <Button
              variant="primary"
              onClick={handleEdit}
              className="flex items-center space-x-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit</span>
            </Button>
          )}
          {onDeleteExpense && (
            <Button
              variant="danger"
              onClick={handleDelete}
              className="flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseDetailModal;
