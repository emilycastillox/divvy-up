import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  Users, 
  RefreshCw,
  BarChart3,
  Activity
} from 'lucide-react';
import Button from '../UI/Button';
import { useApp } from '../../contexts/AppContext';
import { apiClient } from '../../services/api';

interface BalanceHistoryProps {
  groupId: string;
  onRefresh?: () => void;
}

interface BalanceHistoryEntry {
  date: string;
  totalExpenses: number;
  memberCount: number;
  balances: Array<{
    userId: string;
    totalPaid: number;
    totalOwed: number;
    netBalance: number;
  }>;
}

interface BalanceHistoryData {
  history: BalanceHistoryEntry[];
  totalRecords: number;
}

const BalanceHistory: React.FC<BalanceHistoryProps> = ({ groupId, onRefresh }) => {
  const { addNotification } = useApp();
  const [historyData, setHistoryData] = useState<BalanceHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    loadHistoryData();
  }, [groupId, selectedPeriod]);

  const loadHistoryData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getBalanceHistory(groupId, 50);
      
      if (response.success && response.data) {
        setHistoryData(response.data);
      } else {
        addNotification({ type: 'error', message: response.message || 'Failed to load balance history' });
      }
    } catch (error: any) {
      addNotification({ type: 'error', message: error.message || 'Failed to load balance history' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistoryData();
    if (onRefresh) {
      onRefresh();
    }
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!historyData || historyData.history.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No History Available</h3>
        <p className="text-gray-500 mb-4">Balance history will appear here as expenses are added.</p>
        <Button onClick={handleRefresh} loading={refreshing}>
          Refresh
        </Button>
      </div>
    );
  }

  const latestEntry = historyData.history[0];
  const previousEntry = historyData.history[1];

  const totalExpensesTrend = previousEntry ? 
    calculateTrend(latestEntry.totalExpenses, previousEntry.totalExpenses) : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Balance History</h2>
            <p className="text-sm text-gray-500">
              {historyData.totalRecords} record{historyData.totalRecords !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            loading={refreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(latestEntry.totalExpenses)}
            </div>
            <p className="text-sm text-gray-500 mb-2">Total Expenses</p>
            {previousEntry && (
              <div className={`flex items-center justify-center space-x-1 text-sm ${getTrendColor(totalExpensesTrend)}`}>
                {getTrendIcon(totalExpensesTrend)}
                <span>{Math.abs(totalExpensesTrend).toFixed(1)}%</span>
              </div>
            )}
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {latestEntry.memberCount}
            </div>
            <p className="text-sm text-gray-500">Active Members</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {historyData.totalRecords}
            </div>
            <p className="text-sm text-gray-500">History Records</p>
          </div>
        </div>

        {/* History Timeline */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {historyData.history.map((entry, index) => {
              const isLatest = index === 0;
              const previousEntry = historyData.history[index + 1];
              const expensesTrend = previousEntry ? 
                calculateTrend(entry.totalExpenses, previousEntry.totalExpenses) : 0;

              return (
                <div key={index} className={`p-4 rounded-lg border ${
                  isLatest ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isLatest ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Calendar className={`w-5 h-5 ${
                          isLatest ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <p className={`font-medium ${
                          isLatest ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {formatDate(entry.date)}
                          {isLatest && <span className="ml-2 text-sm text-blue-600">(Latest)</span>}
                        </p>
                        <p className="text-sm text-gray-500">
                          {entry.memberCount} member{entry.memberCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        isLatest ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {formatCurrency(entry.totalExpenses)}
                      </div>
                      {previousEntry && (
                        <div className={`flex items-center justify-end space-x-1 text-sm ${getTrendColor(expensesTrend)}`}>
                          {getTrendIcon(expensesTrend)}
                          <span>{Math.abs(expensesTrend).toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Balance Summary for this entry */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Total Paid:</span>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(entry.balances.reduce((sum, b) => sum + b.totalPaid, 0))}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Owed:</span>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(entry.balances.reduce((sum, b) => sum + b.totalOwed, 0))}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Net Balance:</span>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(entry.balances.reduce((sum, b) => sum + b.netBalance, 0))}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Outstanding:</span>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(entry.balances.reduce((sum, b) => sum + Math.abs(b.netBalance), 0) / 2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trend Analysis */}
        {historyData.history.length > 1 && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Trend Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Expense Growth:</span>
                <div className={`flex items-center space-x-2 ${getTrendColor(totalExpensesTrend)}`}>
                  {getTrendIcon(totalExpensesTrend)}
                  <span className="font-medium">
                    {totalExpensesTrend > 0 ? '+' : ''}{totalExpensesTrend.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div>
                <span className="text-gray-500">Period:</span>
                <p className="font-medium text-gray-900 capitalize">{selectedPeriod}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BalanceHistory;
