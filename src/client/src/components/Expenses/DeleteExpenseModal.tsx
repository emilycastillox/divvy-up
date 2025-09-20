import React, { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import Button from '../UI/Button';
import { useApp } from '../../contexts/AppContext';
import { apiClient } from '../../services/api';
import { Expense } from '../../types';

interface DeleteExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  onExpenseDeleted: () => void;
}

const DeleteExpenseModal: React.FC<DeleteExpenseModalProps> = ({
  isOpen,
  onClose,
  expense,
  onExpenseDeleted,
}) => {
  const { addNotification } = useApp();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!expense) return;

    setLoading(true);
    try {
      const response = await apiClient.deleteExpense(expense.id);
      
      if (response.success) {
        addNotification({ type: 'success', message: 'Expense deleted successfully!' });
        onExpenseDeleted();
        onClose();
      } else {
        addNotification({ type: 'error', message: response.message || 'Failed to delete expense' });
      }
    } catch (error: any) {
      addNotification({ type: 'error', message: error.message || 'Failed to delete expense' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen || !expense) return null;

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
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Delete Expense</h2>
              <p className="text-sm text-gray-500">This action cannot be undone</p>
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
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete this expense? This action cannot be undone and will remove all associated data.
            </p>
            
            {/* Expense Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{expense.description}</h3>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(expense.amount)}
                </span>
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <p>Paid by: {expense.paid_by.first_name} {expense.paid_by.last_name}</p>
                <p>Date: {formatDate(expense.expense_date)}</p>
                <p>Participants: {expense.splits.length} member{expense.splits.length !== 1 ? 's' : ''}</p>
                {expense.category && (
                  <p>Category: {expense.category}</p>
                )}
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 mr-3" />
              <div className="text-sm text-red-700">
                <p className="font-medium">Warning:</p>
                <p>Deleting this expense will also remove all split information and may affect group balances.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              loading={loading}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Expense</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteExpenseModal;
