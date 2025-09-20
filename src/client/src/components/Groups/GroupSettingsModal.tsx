import React, { useState, useEffect } from 'react';
import { X, Settings, Save, AlertTriangle } from 'lucide-react';
import Button from '../UI/Button';
import { useApp } from '../../contexts/AppContext';
import { apiClient } from '../../services/api';

interface GroupSettings {
  splitMethod: 'equal' | 'percentage' | 'custom';
  allowPartialPayments: boolean;
  requireApproval: boolean;
}

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  currentSettings: GroupSettings;
  onSettingsUpdated: (settings: GroupSettings) => void;
}

const GroupSettingsModal: React.FC<GroupSettingsModalProps> = ({
  isOpen,
  onClose,
  groupId,
  groupName,
  currentSettings,
  onSettingsUpdated,
}) => {
  const { addNotification } = useApp();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<GroupSettings>(currentSettings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setSettings(currentSettings);
    setHasChanges(false);
  }, [currentSettings, isOpen]);

  const handleSettingChange = (key: keyof GroupSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const response = await apiClient.updateGroup(groupId, {
        settings,
      });

      if (response.success) {
        addNotification({ type: 'success', message: 'Group settings updated successfully!' });
        onSettingsUpdated(settings);
        onClose();
      } else {
        addNotification({ type: 'error', message: response.message || 'Failed to update group settings' });
      }
    } catch (error: any) {
      addNotification({ type: 'error', message: error.message || 'Failed to update group settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        setHasChanges(false);
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Group Settings</h2>
              <p className="text-sm text-gray-500">{groupName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Split Method */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Default Split Method</h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose how expenses are split by default when added to this group.
            </p>
            <div className="space-y-3">
              {[
                {
                  value: 'equal',
                  label: 'Equal Split',
                  description: 'Split expenses equally among all participants',
                  icon: '⚖️',
                },
                {
                  value: 'percentage',
                  label: 'Percentage Split',
                  description: 'Split expenses by percentage (e.g., 50%, 30%, 20%)',
                  icon: '📊',
                },
                {
                  value: 'custom',
                  label: 'Custom Amounts',
                  description: 'Set specific amounts for each participant',
                  icon: '✏️',
                },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    settings.splitMethod === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="splitMethod"
                    value={option.value}
                    checked={settings.splitMethod === option.value}
                    onChange={(e) => handleSettingChange('splitMethod', e.target.value)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{option.icon}</span>
                      <span className="font-medium text-gray-900">{option.label}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Payment Options */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Options</h3>
            <div className="space-y-4">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={settings.allowPartialPayments}
                  onChange={(e) => handleSettingChange('allowPartialPayments', e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <span className="font-medium text-gray-900">Allow Partial Payments</span>
                  <p className="text-sm text-gray-600">
                    Members can pay partial amounts instead of their full share
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={settings.requireApproval}
                  onChange={(e) => handleSettingChange('requireApproval', e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <span className="font-medium text-gray-900">Require Approval for Expenses</span>
                  <p className="text-sm text-gray-600">
                    New expenses must be approved by an admin before being added to the group
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Warning for Approval Setting */}
          {settings.requireApproval && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Approval Required
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    When enabled, all new expenses will need admin approval before being added to the group. 
                    This may slow down the expense tracking process.
                  </p>
                </div>
              </div>
            </div>
          )}

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
              disabled={loading || !hasChanges}
              className="flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupSettingsModal;
