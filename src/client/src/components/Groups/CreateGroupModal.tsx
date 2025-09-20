import React, { useState } from 'react';
import { X, Users, DollarSign, Settings } from 'lucide-react';
import Button from '../UI/Button';
import { useApp } from '../../contexts/AppContext';
import { apiClient } from '../../services/api';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (group: any) => void;
}

interface GroupFormData {
  name: string;
  description: string;
  currency: string;
  settings: {
    splitMethod: 'equal' | 'percentage' | 'custom';
    allowPartialPayments: boolean;
    requireApproval: boolean;
  };
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onGroupCreated,
}) => {
  const { addNotification } = useApp();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<GroupFormData>({
    name: '',
    description: '',
    currency: 'USD',
    settings: {
      splitMethod: 'equal',
      allowPartialPayments: true,
      requireApproval: false,
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('settings.')) {
      const settingKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingKey]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      addNotification({ type: 'error', message: 'Group name is required' });
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.createGroup({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        currency: formData.currency,
        settings: formData.settings,
      });

      if (response.success) {
        addNotification({ type: 'success', message: 'Group created successfully!' });
        onGroupCreated(response.data?.group);
        onClose();
        setFormData({
          name: '',
          description: '',
          currency: 'USD',
          settings: {
            splitMethod: 'equal',
            allowPartialPayments: true,
            requireApproval: false,
          },
        });
      } else {
        addNotification({ type: 'error', message: response.message || 'Failed to create group' });
      }
    } catch (error: any) {
      addNotification({ type: 'error', message: error.message || 'Failed to create group' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Create New Group</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Group Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Weekend Trip to NYC"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Optional description for your group"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Currency */}
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              id="currency"
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
            </select>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Group Settings
            </h3>

            {/* Split Method */}
            <div>
              <label htmlFor="settings.splitMethod" className="block text-sm font-medium text-gray-700 mb-2">
                Default Split Method
              </label>
              <select
                id="settings.splitMethod"
                name="settings.splitMethod"
                value={formData.settings.splitMethod}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="equal">Equal Split</option>
                <option value="percentage">Percentage Split</option>
                <option value="custom">Custom Amounts</option>
              </select>
            </div>

            {/* Allow Partial Payments */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="settings.allowPartialPayments"
                name="settings.allowPartialPayments"
                checked={formData.settings.allowPartialPayments}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="settings.allowPartialPayments" className="ml-2 block text-sm text-gray-700">
                Allow partial payments
              </label>
            </div>

            {/* Require Approval */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="settings.requireApproval"
                name="settings.requireApproval"
                checked={formData.settings.requireApproval}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="settings.requireApproval" className="ml-2 block text-sm text-gray-700">
                Require approval for expenses
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading}
            >
              Create Group
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
