import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Shield,
  DollarSign,
  Users,
  Calculator
} from 'lucide-react';
import Button from '../UI/Button';
import { useApp } from '../../contexts/AppContext';
import { apiClient } from '../../services/api';

interface BalanceValidationProps {
  groupId: string;
  onRefresh?: () => void;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  totalMembers: number;
  totalNetBalance: number;
}

const BalanceValidation: React.FC<BalanceValidationProps> = ({ groupId, onRefresh }) => {
  const { addNotification } = useApp();
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastValidated, setLastValidated] = useState<Date | null>(null);

  const validateBalances = async () => {
    try {
      setLoading(true);
      const response = await apiClient.validateBalances(groupId);
      
      if (response.success && response.data) {
        setValidationResult(response.data);
        setLastValidated(new Date());
        
        if (response.data.isValid) {
          addNotification({ type: 'success', message: 'Balances are valid and correctly calculated!' });
        } else {
          addNotification({ type: 'warning', message: response.data.error || 'Balance validation failed' });
        }
      } else {
        addNotification({ type: 'error', message: response.message || 'Failed to validate balances' });
      }
    } catch (error: any) {
      addNotification({ type: 'error', message: error.message || 'Failed to validate balances' });
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

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getValidationStatus = () => {
    if (!validationResult) return { status: 'unknown', color: 'text-gray-600', bgColor: 'bg-gray-50' };
    
    if (validationResult.isValid) {
      return { status: 'valid', color: 'text-green-600', bgColor: 'bg-green-50' };
    } else {
      return { status: 'invalid', color: 'text-red-600', bgColor: 'bg-red-50' };
    }
  };

  const getValidationIcon = () => {
    if (!validationResult) return <Shield className="w-6 h-6 text-gray-500" />;
    
    if (validationResult.isValid) {
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    } else {
      return <XCircle className="w-6 h-6 text-red-500" />;
    }
  };

  const getValidationMessage = () => {
    if (!validationResult) return 'Click "Validate Balances" to check the integrity of group balances.';
    
    if (validationResult.isValid) {
      return 'All balances are correctly calculated and sum to zero. No issues found.';
    } else {
      return validationResult.error || 'Balance validation failed. Please check for calculation errors.';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Balance Validation</h2>
            <p className="text-sm text-gray-500">
              Verify the integrity of group balances
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={validateBalances}
          loading={loading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Validate Balances</span>
        </Button>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Validation Status */}
        <div className={`p-4 rounded-lg border ${getValidationStatus().bgColor} mb-6`}>
          <div className="flex items-center space-x-3">
            {getValidationIcon()}
            <div>
              <h3 className={`font-medium ${getValidationStatus().color}`}>
                {validationResult ? 
                  (validationResult.isValid ? 'Balances Valid' : 'Balances Invalid') : 
                  'Not Validated'
                }
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {getValidationMessage()}
              </p>
            </div>
          </div>
        </div>

        {/* Validation Details */}
        {validationResult && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {validationResult.totalMembers}
              </div>
              <p className="text-sm text-gray-500">Total Members</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatCurrency(validationResult.totalNetBalance)}
              </div>
              <p className="text-sm text-gray-500">Net Balance</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calculator className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {Math.abs(validationResult.totalNetBalance) < 0.01 ? '0.00' : 'Error'}
              </div>
              <p className="text-sm text-gray-500">Expected Net</p>
            </div>
          </div>
        )}

        {/* Validation Rules */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Validation Rules</h4>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>All member balances must sum to zero (no money created or lost)</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Total paid amounts must equal total owed amounts</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>All expense splits must be properly calculated</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>No negative amounts in expense calculations</span>
            </li>
          </ul>
        </div>

        {/* Error Details */}
        {validationResult && !validationResult.isValid && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Validation Error</h4>
                <p className="text-sm text-red-700 mt-1">
                  {validationResult.error}
                </p>
                <div className="mt-3 text-sm text-red-700">
                  <p><strong>Total Net Balance:</strong> {formatCurrency(validationResult.totalNetBalance)}</p>
                  <p><strong>Expected:</strong> $0.00</p>
                  <p><strong>Difference:</strong> {formatCurrency(validationResult.totalNetBalance)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Details */}
        {validationResult && validationResult.isValid && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-green-800">Validation Successful</h4>
                <p className="text-sm text-green-700 mt-1">
                  All balances are correctly calculated and mathematically sound.
                </p>
                <div className="mt-3 text-sm text-green-700">
                  <p><strong>Total Net Balance:</strong> {formatCurrency(validationResult.totalNetBalance)}</p>
                  <p><strong>Status:</strong> All balances sum to zero ✓</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Last Validated */}
        {lastValidated && (
          <div className="text-center text-sm text-gray-500">
            Last validated: {formatDateTime(lastValidated)}
          </div>
        )}

        {/* Auto-refresh suggestion */}
        {!validationResult && (
          <div className="text-center text-sm text-gray-500">
            Run validation after adding or modifying expenses to ensure data integrity.
          </div>
        )}
      </div>
    </div>
  );
};

export default BalanceValidation;
