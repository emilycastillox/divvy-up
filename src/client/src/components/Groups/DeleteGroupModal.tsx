import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import Button from '../UI/Button';
import { useApp } from '../../contexts/AppContext';
import { apiClient } from '../../services/api';

interface DeleteGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  onGroupDeleted: () => void;
}

const DeleteGroupModal: React.FC<DeleteGroupModalProps> = ({
  isOpen,
  onClose,
  groupId,
  groupName,
  onGroupDeleted,
}) => {
  const { addNotification } = useApp();
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (confirmText !== groupName) {
      addNotification({ type: 'error', message: 'Group name does not match' });
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.deleteGroup(groupId);
      if (response.success) {
        addNotification({ type: 'success', message: 'Group deleted successfully' });
        onGroupDeleted();
        onClose();
        setConfirmText('');
      } else {
        addNotification({ type: 'error', message: response.message || 'Failed to delete group' });
      }
    } catch (error: any) {
      addNotification({ type: 'error', message: error.message || 'Failed to delete group' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setConfirmText('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Delete Group</h2>
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
            <div className="flex items-start space-x-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Are you sure you want to delete this group?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  This will permanently delete the group <strong>"{groupName}"</strong> and all associated data including:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• All expenses and payment records</li>
                  <li>• Member relationships and roles</li>
                  <li>• Group settings and configuration</li>
                  <li>• Activity history and notifications</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To confirm deletion, type the group name:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={groupName}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              disabled={loading}
            />
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
              disabled={loading || confirmText !== groupName}
              className="flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Group</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteGroupModal;
