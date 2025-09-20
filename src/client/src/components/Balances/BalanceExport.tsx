import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  BarChart3, 
  Calendar, 
  Users, 
  DollarSign,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Button from '../UI/Button';
import { useApp } from '../../contexts/AppContext';
import { apiClient } from '../../services/api';

interface BalanceExportProps {
  groupId: string;
  groupName: string;
  onExport?: () => void;
}

interface ExportOptions {
  format: 'json' | 'csv' | 'pdf';
  includeHistory: boolean;
  includeSettlements: boolean;
  includeMembers: boolean;
  dateRange: 'week' | 'month' | 'quarter' | 'year' | 'all';
}

const BalanceExport: React.FC<BalanceExportProps> = ({ groupId, groupName, onExport }) => {
  const { addNotification } = useApp();
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeHistory: true,
    includeSettlements: true,
    includeMembers: true,
    dateRange: 'month'
  });

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // For now, we'll create a simple CSV export
      // In a real app, this would call the backend export API
      const exportData = await generateExportData();
      
      if (exportOptions.format === 'csv') {
        downloadCSV(exportData, groupName);
      } else if (exportOptions.format === 'json') {
        downloadJSON(exportData, groupName);
      } else {
        // PDF would require a backend service
        addNotification({ type: 'info', message: 'PDF export requires backend service' });
        return;
      }
      
      addNotification({ type: 'success', message: 'Balance data exported successfully!' });
      if (onExport) {
        onExport();
      }
    } catch (error: any) {
      addNotification({ type: 'error', message: error.message || 'Failed to export balance data' });
    } finally {
      setIsExporting(false);
    }
  };

  const generateExportData = async () => {
    // This would normally call the backend export API
    // For now, we'll return mock data
    return {
      groupName,
      exportDate: new Date().toISOString(),
      totalExpenses: 0,
      totalMembers: 0,
      balances: [],
      settlements: [],
      history: []
    };
  };

  const downloadCSV = (data: any, groupName: string) => {
    const csvContent = generateCSVContent(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${groupName}_balance_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJSON = (data: any, groupName: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${groupName}_balance_export_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateCSVContent = (data: any) => {
    let csv = `Group Balance Export\n`;
    csv += `Group: ${data.groupName}\n`;
    csv += `Export Date: ${new Date(data.exportDate).toLocaleDateString()}\n`;
    csv += `\n`;
    
    if (exportOptions.includeMembers) {
      csv += `Member Balances\n`;
      csv += `Name,Total Paid,Total Owed,Net Balance\n`;
      // Add member data here
    }
    
    if (exportOptions.includeSettlements) {
      csv += `\nSettlement Transactions\n`;
      csv += `From,To,Amount,Description\n`;
      // Add settlement data here
    }
    
    if (exportOptions.includeHistory) {
      csv += `\nBalance History\n`;
      csv += `Date,Total Expenses,Member Count,Net Balance\n`;
      // Add history data here
    }
    
    return csv;
  };

  const formatOptions = [
    { value: 'csv', label: 'CSV', description: 'Spreadsheet format', icon: '📊' },
    { value: 'json', label: 'JSON', description: 'Structured data', icon: '📄' },
    { value: 'pdf', label: 'PDF', description: 'Document format', icon: '📋' },
  ];

  const dateRangeOptions = [
    { value: 'week', label: 'Last Week' },
    { value: 'month', label: 'Last Month' },
    { value: 'quarter', label: 'Last Quarter' },
    { value: 'year', label: 'Last Year' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Download className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Export Balance Data</h2>
            <p className="text-sm text-gray-500">
              Download balance information and reports
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Export Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Export Format
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {formatOptions.map((format) => (
              <label
                key={format.value}
                className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  exportOptions.format === format.value
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value={format.value}
                  checked={exportOptions.format === format.value}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as any }))}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{format.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900">{format.label}</p>
                    <p className="text-sm text-gray-500">{format.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Date Range
          </label>
          <select
            value={exportOptions.dateRange}
            onChange={(e) => setExportOptions(prev => ({ ...prev, dateRange: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            {dateRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Include Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Include in Export
          </label>
          <div className="space-y-3">
            {[
              { key: 'includeMembers', label: 'Member Balances', description: 'Individual member balance information', icon: Users },
              { key: 'includeSettlements', label: 'Settlement Transactions', description: 'Optimal settlement payment plan', icon: BarChart3 },
              { key: 'includeHistory', label: 'Balance History', description: 'Historical balance trends and changes', icon: Calendar },
            ].map((option) => {
              const Icon = option.icon;
              return (
                <label
                  key={option.key}
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={exportOptions[option.key as keyof ExportOptions] as boolean}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, [option.key]: e.target.checked }))}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <Icon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{option.label}</p>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Export Preview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Export Preview</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Format: {formatOptions.find(f => f.value === exportOptions.format)?.label}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Date Range: {dateRangeOptions.find(d => d.value === exportOptions.dateRange)?.label}</span>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>Group: {groupName}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Includes: {[
                exportOptions.includeMembers && 'Member Balances',
                exportOptions.includeSettlements && 'Settlements',
                exportOptions.includeHistory && 'History'
              ].filter(Boolean).join(', ')}</span>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={handleExport}
            loading={isExporting}
            disabled={isExporting}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exporting...' : 'Export Balance Data'}</span>
          </Button>
        </div>

        {/* Export Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Export Information</h4>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• Exported data will include all selected information</li>
                <li>• CSV format is compatible with Excel and Google Sheets</li>
                <li>• JSON format preserves all data structure and types</li>
                <li>• PDF format provides a formatted report (requires backend service)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceExport;
