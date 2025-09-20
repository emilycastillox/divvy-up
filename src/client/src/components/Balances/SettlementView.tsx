import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  DollarSign, 
  Users, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import Button from '../UI/Button';
import { useApp } from '../../contexts/AppContext';
import { apiClient } from '../../services/api';

interface SettlementViewProps {
  groupId: string;
  onRefresh?: () => void;
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
  description: string;
  fromUser?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  toUser?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

interface SettlementData {
  settlements: Settlement[];
  totalSettlements: number;
  totalAmount: number;
}

const SettlementView: React.FC<SettlementViewProps> = ({ groupId, onRefresh }) => {
  const { addNotification } = useApp();
  const [settlementData, setSettlementData] = useState<SettlementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSettlementData();
  }, [groupId]);

  const loadSettlementData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getGroupSettlements(groupId);
      
      if (response.success && response.data) {
        setSettlementData(response.data);
      } else {
        addNotification({ type: 'error', message: response.message || 'Failed to load settlement data' });
      }
    } catch (error: any) {
      addNotification({ type: 'error', message: error.message || 'Failed to load settlement data' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSettlementData();
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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!settlementData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load settlement data</h3>
        <p className="text-gray-500 mb-4">There was an error loading the settlement information.</p>
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
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Settlement Plan</h2>
            <p className="text-sm text-gray-500">
              {settlementData.totalSettlements} payment{settlementData.totalSettlements !== 1 ? 's' : ''} needed
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

      {/* Content */}
      <div className="p-6">
        {settlementData.settlements.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All Settled!</h3>
            <p className="text-gray-500">
              No settlement payments are needed. All balances are already settled.
            </p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Settlement Summary
                  </p>
                  <p className="text-sm text-blue-700">
                    {settlementData.totalSettlements} payment{settlementData.totalSettlements !== 1 ? 's' : ''} totaling {formatCurrency(settlementData.totalAmount)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-900">
                    {formatCurrency(settlementData.totalAmount)}
                  </div>
                  <p className="text-sm text-blue-700">Total to settle</p>
                </div>
              </div>
            </div>

            {/* Settlement Transactions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Settlement Transactions
              </h3>
              
              {settlementData.settlements.map((settlement, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between">
                    {/* From User */}
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        {settlement.fromUser?.avatar_url ? (
                          <img
                            src={settlement.fromUser.avatar_url}
                            alt={`${settlement.fromUser.first_name} ${settlement.fromUser.last_name}`}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-red-600 font-semibold text-sm">
                            {settlement.fromUser ? getInitials(settlement.fromUser.first_name, settlement.fromUser.last_name) : '?'}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {settlement.fromUser ? `${settlement.fromUser.first_name} ${settlement.fromUser.last_name}` : 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-500">Pays</p>
                      </div>
                    </div>

                    {/* Arrow and Amount */}
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(settlement.amount)}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* To User */}
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium text-gray-900 text-right">
                          {settlement.toUser ? `${settlement.toUser.first_name} ${settlement.toUser.last_name}` : 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-500 text-right">Receives</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        {settlement.toUser?.avatar_url ? (
                          <img
                            src={settlement.toUser.avatar_url}
                            alt={`${settlement.toUser.first_name} ${settlement.toUser.last_name}`}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-green-600 font-semibold text-sm">
                            {settlement.toUser ? getInitials(settlement.toUser.first_name, settlement.toUser.last_name) : '?'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Settlement Description */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      {settlement.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">How to settle:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Follow the settlement transactions above in order</li>
                <li>• Use your preferred payment method (Venmo, PayPal, etc.)</li>
                <li>• Mark payments as completed when done</li>
                <li>• All members will be notified when payments are received</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SettlementView;
