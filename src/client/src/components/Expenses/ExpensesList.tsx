import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Calendar, 
  User, 
  Filter, 
  Search, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Button from '../UI/Button';
import EditExpenseModal from './EditExpenseModal';
import DeleteExpenseModal from './DeleteExpenseModal';
import ExpenseDetailModal from './ExpenseDetailModal';
import { useApp } from '../../contexts/AppContext';
import { apiClient } from '../../services/api';
import { Expense } from '../../types';

interface ExpensesListProps {
  groupId: string;
  onViewExpense?: (expenseId: string) => void;
  onExpenseUpdated?: () => void;
}

const ExpensesList: React.FC<ExpensesListProps> = ({
  groupId,
  onViewExpense,
  onExpenseUpdated,
}) => {
  const { addNotification } = useApp();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'description'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedExpense, setExpandedExpense] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);

  const categories = [
    { id: '', name: 'All Categories' },
    { id: 'food', name: '🍽️ Food & Dining' },
    { id: 'transport', name: '🚗 Transportation' },
    { id: 'accommodation', name: '🏨 Accommodation' },
    { id: 'entertainment', name: '🎬 Entertainment' },
    { id: 'shopping', name: '🛍️ Shopping' },
    { id: 'utilities', name: '⚡ Utilities' },
    { id: 'healthcare', name: '🏥 Healthcare' },
    { id: 'other', name: '📦 Other' },
  ];

  const dateFilters = [
    { id: '', name: 'All Time' },
    { id: 'today', name: 'Today' },
    { id: 'week', name: 'This Week' },
    { id: 'month', name: 'This Month' },
    { id: 'year', name: 'This Year' },
  ];

  useEffect(() => {
    loadExpenses();
  }, [groupId, searchTerm, categoryFilter, dateFilter, sortBy, sortOrder]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const params: any = {
        group_id: groupId,
        page: 1,
        limit: 50,
      };

      if (searchTerm) params.search = searchTerm;
      if (categoryFilter) params.category = categoryFilter;
      if (dateFilter) {
        const now = new Date();
        switch (dateFilter) {
          case 'today':
            params.date_from = now.toISOString().split('T')[0];
            params.date_to = now.toISOString().split('T')[0];
            break;
          case 'week':
            const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
            params.date_from = weekStart.toISOString().split('T')[0];
            break;
          case 'month':
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            params.date_from = monthStart.toISOString().split('T')[0];
            break;
          case 'year':
            const yearStart = new Date(now.getFullYear(), 0, 1);
            params.date_from = yearStart.toISOString().split('T')[0];
            break;
        }
      }

      const response = await apiClient.getExpenses(params);
      
      if (response.success && Array.isArray(response.data)) {
        let sortedExpenses = [...response.data];
        
        // Sort expenses
        sortedExpenses.sort((a, b) => {
          let comparison = 0;
          switch (sortBy) {
            case 'date':
              comparison = new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime();
              break;
            case 'amount':
              comparison = a.amount - b.amount;
              break;
            case 'description':
              comparison = a.description.localeCompare(b.description);
              break;
          }
          return sortOrder === 'asc' ? comparison : -comparison;
        });

        setExpenses(sortedExpenses);
      } else {
        addNotification({ type: 'error', message: response.message || 'Failed to load expenses' });
      }
    } catch (error: any) {
      addNotification({ type: 'error', message: error.message || 'Failed to load expenses' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getCategoryIcon = (category?: string) => {
    const categoryObj = categories.find(c => c.id === category);
    return categoryObj?.name.split(' ')[0] || '📦';
  };

  const handleSort = (field: 'date' | 'amount' | 'description') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const toggleExpenseExpansion = (expenseId: string) => {
    setExpandedExpense(expandedExpense === expenseId ? null : expenseId);
  };

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowEditModal(true);
  };

  const handleDeleteExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowDeleteModal(true);
  };

  const handleViewExpense = (expenseId: string) => {
    setSelectedExpenseId(expenseId);
    setShowDetailModal(true);
  };

  const handleExpenseUpdated = () => {
    loadExpenses();
    if (onExpenseUpdated) {
      onExpenseUpdated();
    }
  };

  const handleExpenseDeleted = () => {
    loadExpenses();
    if (onExpenseUpdated) {
      onExpenseUpdated();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-48"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses yet</h3>
        <p className="text-gray-500 mb-4">Start adding expenses to track group spending</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search expenses..."
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {dateFilters.map((filter) => (
                    <option key={filter.id} value={filter.id}>
                      {filter.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <div className="flex space-x-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="date">Date</option>
                    <option value="amount">Amount</option>
                    <option value="description">Description</option>
                  </select>
                  <Button
                    variant="secondary"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expenses List */}
      <div className="space-y-4">
        {expenses.map((expense) => (
          <div key={expense.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:border-gray-300 transition-colors">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-lg">
                      {getCategoryIcon(expense.category)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{expense.description}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(expense.expense_date)}
                      </span>
                      <span className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {expense.paid_by.first_name} {expense.paid_by.last_name}
                      </span>
                      {expense.category && (
                        <span className="flex items-center">
                          <span className="mr-1">{getCategoryIcon(expense.category)}</span>
                          {categories.find(c => c.id === expense.category)?.name.split(' ').slice(1).join(' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(expense.amount)}</p>
                    <p className="text-sm text-gray-500">
                      {expense.splits.length} participant{expense.splits.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleViewExpense(expense.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEditExpense(expense)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteExpense(expense)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedExpense === expense.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Split Details */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Split Details</h4>
                      <div className="space-y-2">
                        {expense.splits.map((split) => (
                          <div key={split.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                {split.user.avatarUrl ? (
                                  <img
                                    src={split.user.avatarUrl}
                                    alt={`${split.user.first_name} ${split.user.last_name}`}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-gray-600 font-semibold text-sm">
                                    {split.user.first_name.charAt(0)}{split.user.last_name.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {split.user.first_name} {split.user.last_name}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-medium text-gray-900">
                                {formatCurrency(split.amount)}
                              </span>
                              {split.percentage && (
                                <p className="text-xs text-gray-500">
                                  {split.percentage.toFixed(1)}%
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Additional Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Created by:</span>
                          <span className="text-gray-900">
                            {expense.created_by.first_name} {expense.created_by.last_name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Created:</span>
                          <span className="text-gray-900">
                            {formatDate(expense.created_at)}
                          </span>
                        </div>
                        {expense.notes && (
                          <div>
                            <span className="text-gray-500">Notes:</span>
                            <p className="text-gray-900 mt-1">{expense.notes}</p>
                          </div>
                        )}
                        {expense.receipt_url && (
                          <div>
                            <span className="text-gray-500">Receipt:</span>
                            <a
                              href={expense.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-500 ml-2"
                            >
                              View Receipt
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Expense Modal */}
      <EditExpenseModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedExpense(null);
        }}
        expense={selectedExpense}
        onExpenseUpdated={handleExpenseUpdated}
      />

      {/* Delete Expense Modal */}
      <DeleteExpenseModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedExpense(null);
        }}
        expense={selectedExpense}
        onExpenseDeleted={handleExpenseDeleted}
      />

      {/* Expense Detail Modal */}
      <ExpenseDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedExpenseId(null);
        }}
        expenseId={selectedExpenseId}
        onEditExpense={handleEditExpense}
        onDeleteExpense={handleDeleteExpense}
      />
    </div>
  );
};

export default ExpensesList;
