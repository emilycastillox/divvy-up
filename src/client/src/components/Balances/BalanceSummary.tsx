import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import Button from '../UI/Button';
import { useApp } from '../../contexts/AppContext';
import { apiClient } from '../../services/api';
import { Balance } from '../../types';

interface BalanceSummaryProps {
  groupId: string;
  onRefresh?: () => void;
}

interface BalanceData {
  totalExpenses: number;
  totalSettled: number;
  totalOutstanding: number;
  memberCount: number;
  balances: Balance[];
}

const BalanceSummary: React.FC<BalanceSummaryProps> = ({ groupId, onRefresh }) => {
  const { addNotification } = useApp();
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBalanceData();
  }, [groupId]);

  const loadBalanceData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getGroupBalances(groupId);
      
      if (response.success && response.data) {
        setBalanceData(response.data);
      } else {
        addNotification({ type: 'error', message: response.message || 'Failed to load balance data' });
      }
    } catch (error: any) {
      addNotification({ type: 'error', message: error.message || 'Failed to load balance data' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBalanceData();
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

  const getBalanceStatus = (balance: Balance) => {
    if (Math.abs(balance.net_balance) < 0.01) {
      return { status: 'settled', color: 'text-green-600', bgColor: 'bg-green-50' };
    } else if (balance.net_balance > 0) {
      return { status: 'owed', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    } else {
      return { status: 'owes', color: 'text-red-600', bgColor: 'bg-red-50' };
    }
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
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!balanceData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load balance data</h3>
        <p className="text-gray-500 mb-4">There was an error loading the balance information.</p>
        <Button onClick={handleRefresh} loading={refreshing}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Balance Summary</h2>
            <p className="text-sm text-gray-500">
              {balanceData.memberCount} member{balanceData.memberCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
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

      {/* Summary Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(balanceData.totalExpenses)}
            </div>
            <p className="text-sm text-gray-500">Total Expenses</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(balanceData.totalSettled)}
            </div>
            <p className="text-sm text-gray-500">Settled</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(balanceData.totalOutstanding)}
            </div>
            <p className="text-sm text-gray-500">Outstanding</p>
          </div>
        </div>

        {/* Member Balances */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Member Balances
          </h3>
          <div className="space-y-3">
            {balanceData.balances.map((balance) => {
              const status = getBalanceStatus(balance);
              return (
                <div key={balance.user.id} className={`p-4 rounded-lg border ${status.bgColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {balance.user.avatarUrl ? (
                          <img
                            src={balance.user.avatarUrl}
                            alt={`${balance.user.first_name} ${balance.user.last_name}`}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 font-semibold">
                            {balance.user.first_name.charAt(0)}{balance.user.last_name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {balance.user.first_name} {balance.user.last_name}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Paid: {formatCurrency(balance.total_owed)}</span>
                          <span>Owed: {formatCurrency(balance.total_owes)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-lg font-bold ${status.color} flex items-center space-x-2`}>
                        {status.status === 'owed' && <ArrowUpRight className="w-4 h-4" />}
                        {status.status === 'owes' && <ArrowDownLeft className="w-4 h-4" />}
                        {status.status === 'settled' && <CheckCircle className="w-4 h-4" />}
                        <span>{formatCurrency(balance.net_balance)}</span>
                      </div>
                      <p className="text-sm text-gray-500 capitalize">
                        {status.status === 'settled' ? 'All settled' : 
                         status.status === 'owed' ? 'Owed money' : 'Owes money'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Settlement Status */}
        {balanceData.totalOutstanding > 0 && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Outstanding Balance
                </p>
                <p className="text-sm text-yellow-700">
                  There are {formatCurrency(balanceData.totalOutstanding)} in outstanding balances that need to be settled.
                </p>
              </div>
            </div>
          </div>
        )}

        {balanceData.totalOutstanding === 0 && balanceData.totalExpenses > 0 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  All Settled
                </p>
                <p className="text-sm text-green-700">
                  All balances have been settled. No outstanding amounts remain.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BalanceSummary;
