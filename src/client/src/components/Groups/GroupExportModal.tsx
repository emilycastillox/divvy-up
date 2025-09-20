import React, { useState } from 'react';
import { Download, FileText, Calendar, Users, DollarSign, X, CheckCircle } from 'lucide-react';
import Button from '../UI/Button';
import { useApp } from '../../contexts/AppContext';
import { apiClient } from '../../services/api';

interface GroupExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
}

const GroupExportModal: React.FC<GroupExportModalProps> = ({
  isOpen,
  onClose,
  groupId,
  groupName,
}) => {
  const { addNotification } = useApp();
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');
  const [includeExpenses, setIncludeExpenses] = useState(true);
  const [includeMembers, setIncludeMembers] = useState(true);
  const [includeActivities, setIncludeActivities] = useState(false);
  const [dateRange, setDateRange] = useState<'all' | 'last30' | 'last90' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = {
        format: exportFormat,
        includeExpenses,
        includeMembers,
        includeActivities,
        dateRange,
        ...(dateRange === 'custom' && {
          startDate: customStartDate,
          endDate: customEndDate,
        }),
      };

      const response = await apiClient.exportGroupData(groupId, params);
      
      if (response.success && response.data?.downloadUrl) {
        // Create a temporary link to download the file
        const link = document.createElement('a');
        link.href = response.data.downloadUrl;
        link.download = `${groupName}_export_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        addNotification({ type: 'success', message: 'Group data exported successfully!' });
        onClose();
      } else {
        addNotification({ type: 'error', message: response.message || 'Failed to export group data' });
      }
    } catch (error: any) {
      addNotification({ type: 'error', message: error.message || 'Failed to export group data' });
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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Download className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Export Group Data</h2>
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
        <div className="p-6 space-y-6">
          {/* Export Format */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Export Format</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: 'json', label: 'JSON', description: 'Machine-readable format', icon: FileText },
                { value: 'csv', label: 'CSV', description: 'Spreadsheet compatible', icon: FileText },
                { value: 'pdf', label: 'PDF', description: 'Human-readable report', icon: FileText },
              ].map((format) => (
                <label
                  key={format.value}
                  className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    exportFormat === format.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={format.value}
                    checked={exportFormat === format.value}
                    onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv' | 'pdf')}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <format.icon className="w-4 h-4" />
                      <span className="font-medium text-gray-900">{format.label}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{format.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Data to Include */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Data to Include</h3>
            <div className="space-y-4">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={includeExpenses}
                  onChange={(e) => setIncludeExpenses(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-gray-900">Expenses</span>
                  </div>
                  <p className="text-sm text-gray-600">All expense records, payments, and splits</p>
                </div>
              </label>

              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={includeMembers}
                  onChange={(e) => setIncludeMembers(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-gray-900">Members</span>
                  </div>
                  <p className="text-sm text-gray-600">Member information, roles, and join dates</p>
                </div>
              </label>

              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={includeActivities}
                  onChange={(e) => setIncludeActivities(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-gray-900">Activity Log</span>
                  </div>
                  <p className="text-sm text-gray-600">Group activity history and changes</p>
                </div>
              </label>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Date Range</h3>
            <div className="space-y-3">
              {[
                { value: 'all', label: 'All Time' },
                { value: 'last30', label: 'Last 30 Days' },
                { value: 'last90', label: 'Last 90 Days' },
                { value: 'custom', label: 'Custom Range' },
              ].map((range) => (
                <label
                  key={range.value}
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    dateRange === range.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="dateRange"
                    value={range.value}
                    checked={dateRange === range.value}
                    onChange={(e) => setDateRange(e.target.value as any)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="font-medium text-gray-900">{range.label}</span>
                </label>
              ))}
            </div>

            {dateRange === 'custom' && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
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
              type="button"
              variant="primary"
              onClick={handleExport}
              loading={loading}
              disabled={loading || (dateRange === 'custom' && (!customStartDate || !customEndDate))}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupExportModal;
