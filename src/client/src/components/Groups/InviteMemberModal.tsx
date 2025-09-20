import React, { useState } from 'react';
import { X, Mail, UserPlus, Copy, Check } from 'lucide-react';
import Button from '../UI/Button';
import { useApp } from '../../contexts/AppContext';
import { apiClient } from '../../services/api';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  onMemberInvited: () => void;
}

interface InviteFormData {
  email: string;
  role: 'admin' | 'member';
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  groupId,
  groupName,
  onMemberInvited,
}) => {
  const { addNotification } = useApp();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [formData, setFormData] = useState<InviteFormData>({
    email: '',
    role: 'member',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      addNotification({ type: 'error', message: 'Email is required' });
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.inviteGroupMember(groupId, {
        email: formData.email.trim(),
        role: formData.role,
      });

      if (response.success && response.data?.invitation) {
        const invitation = response.data.invitation;
        const link = `${window.location.origin}/invite/${invitation.token}`;
        setInviteLink(link);
        addNotification({ type: 'success', message: 'Invitation sent successfully!' });
        onMemberInvited();
      } else {
        addNotification({ type: 'error', message: response.message || 'Failed to send invitation' });
      }
    } catch (error: any) {
      addNotification({ type: 'error', message: error.message || 'Failed to send invitation' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      addNotification({ type: 'success', message: 'Invitation link copied to clipboard!' });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      addNotification({ type: 'error', message: 'Failed to copy link' });
    }
  };

  const handleClose = () => {
    setFormData({ email: '', role: 'member' });
    setInviteLink('');
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Invite Member</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!inviteLink ? (
            // Invite Form
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Invite someone to join "{groupName}"
                </h3>
                <p className="text-sm text-gray-500">
                  They'll receive an email invitation to join your group
                </p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Admins can manage group settings and invite members
                </p>
              </div>

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
                  type="submit"
                  variant="primary"
                  loading={loading}
                  disabled={loading}
                >
                  Send Invitation
                </Button>
              </div>
            </form>
          ) : (
            // Success State
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Invitation Sent!
                </h3>
                <p className="text-sm text-gray-500">
                  We've sent an invitation to <strong>{formData.email}</strong>
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Or share this direct link:</p>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
                  />
                  <Button
                    variant="secondary"
                    onClick={handleCopyLink}
                    className="px-3 py-2"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={handleClose}
                >
                  Done
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setInviteLink('');
                    setFormData({ email: '', role: 'member' });
                  }}
                >
                  Invite Another
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteMemberModal;
