import React, { useState, useEffect } from 'react';
import { Users, Settings, UserPlus, MoreVertical, Crown, Shield, Trash2, Edit3, Activity, Download, DollarSign, TrendingUp } from 'lucide-react';
import Button from '../UI/Button';
import InviteMemberModal from './InviteMemberModal';
import GroupSettingsModal from './GroupSettingsModal';
import GroupActivityFeed from './GroupActivityFeed';
import DeleteGroupModal from './DeleteGroupModal';
import GroupExportModal from './GroupExportModal';
import AddExpenseModal from '../Expenses/AddExpenseModal';
import ExpensesList from '../Expenses/ExpensesList';
import BalanceSummary from '../Balances/BalanceSummary';
import SettlementView from '../Balances/SettlementView';
import BalanceHistory from '../Balances/BalanceHistory';
import BalanceValidation from '../Balances/BalanceValidation';
import BalanceExport from '../Balances/BalanceExport';
import { useApp } from '../../contexts/AppContext';
import { apiClient } from '../../services/api';

interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: 'admin' | 'member';
  invitedBy: string;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

interface Group {
  id: string;
  name: string;
  description?: string;
  currency: string;
  createdBy: string;
  isActive: boolean;
  settings: {
    splitMethod: 'equal' | 'percentage' | 'custom';
    allowPartialPayments: boolean;
    requireApproval: boolean;
  };
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
}

interface GroupDetailProps {
  groupId: string;
  onBack: () => void;
}

const GroupDetail: React.FC<GroupDetailProps> = ({ groupId, onBack }) => {
  const { addNotification } = useApp();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showMemberMenu, setShowMemberMenu] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'expenses' | 'balances' | 'activity'>('members');

  useEffect(() => {
    loadGroupDetails();
  }, [groupId]);

  const loadGroupDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getGroup(groupId);
      
      if (response.success && response.data?.group) {
        const groupData = response.data.group;
        setGroup(groupData);
        
        // Check if current user is admin or creator
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const isUserAdmin = groupData.members?.some(
          member => member.userId === currentUser.id && member.role === 'admin'
        );
        const isUserCreator = groupData.createdBy === currentUser.id;
        setIsAdmin(isUserAdmin);
        setIsCreator(isUserCreator);
      } else {
        addNotification({ type: 'error', message: response.message || 'Failed to load group' });
      }
    } catch (error: any) {
      addNotification({ type: 'error', message: error.message || 'Failed to load group' });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = () => {
    setShowInviteModal(true);
  };

  const handleMemberInvited = () => {
    loadGroupDetails();
    setShowInviteModal(false);
  };

  const handleSettingsUpdated = (newSettings: any) => {
    if (group) {
      setGroup({
        ...group,
        settings: newSettings,
      });
    }
    setShowSettingsModal(false);
  };

  const handleDeleteGroup = () => {
    setShowDeleteModal(true);
  };

  const handleGroupDeleted = () => {
    onBack(); // Navigate back to groups list
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this group?`)) {
      return;
    }

    try {
      const response = await apiClient.removeGroupMember(groupId, memberId);
      if (response.success) {
        addNotification({ type: 'success', message: 'Member removed successfully' });
        loadGroupDetails();
      } else {
        addNotification({ type: 'error', message: response.message || 'Failed to remove member' });
      }
    } catch (error: any) {
      addNotification({ type: 'error', message: error.message || 'Failed to remove member' });
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: 'admin' | 'member') => {
    try {
      const response = await apiClient.updateMemberRole(groupId, memberId, newRole);
      if (response.success) {
        addNotification({ type: 'success', message: 'Member role updated successfully' });
        loadGroupDetails();
      } else {
        addNotification({ type: 'error', message: response.message || 'Failed to update member role' });
      }
    } catch (error: any) {
      addNotification({ type: 'error', message: error.message || 'Failed to update member role' });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading group details...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Group not found</h3>
        <p className="text-gray-500 mb-4">The group you're looking for doesn't exist or you don't have access to it.</p>
        <Button variant="primary" onClick={onBack}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            {group.description && (
              <p className="text-gray-600">{group.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {isAdmin && (
            <>
              <Button
                variant="secondary"
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Button>
              <Button
                variant="primary"
                onClick={handleInviteMember}
                className="flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite Member</span>
              </Button>
            </>
          )}
          <Button
            variant="primary"
            onClick={() => setShowAddExpenseModal(true)}
            className="flex items-center space-x-2"
          >
            <DollarSign className="w-4 h-4" />
            <span>Add Expense</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowExportModal(true)}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
          {isCreator && (
            <Button
              variant="danger"
              onClick={handleDeleteGroup}
              className="flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Group</span>
            </Button>
          )}
        </div>
      </div>

      {/* Group Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Group Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Currency</label>
            <p className="text-gray-900">{group.currency}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Split Method</label>
            <p className="text-gray-900 capitalize">{group.settings.splitMethod}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Created</label>
            <p className="text-gray-900">{formatDate(group.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('members')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'members'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Members ({group.members?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'expenses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DollarSign className="w-4 h-4 inline mr-2" />
              Expenses
            </button>
            <button
              onClick={() => setActiveTab('balances')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'balances'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Balances
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'activity'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Activity className="w-4 h-4 inline mr-2" />
              Activity
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'members' && (
          <div className="divide-y divide-gray-200">
            {group.members?.map((member) => (
            <div key={member.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {member.user.avatarUrl ? (
                      <img
                        src={member.user.avatarUrl}
                        alt={`${member.user.firstName} ${member.user.lastName}`}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 font-semibold text-sm">
                        {member.user.firstName.charAt(0)}{member.user.lastName.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">
                        {member.user.firstName} {member.user.lastName}
                      </p>
                      {member.role === 'admin' && (
                        <Crown className="w-4 h-4 text-yellow-500" title="Admin" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{member.user.email}</p>
                    <p className="text-xs text-gray-400">
                      Joined {formatDate(member.joinedAt)}
                    </p>
                  </div>
                </div>
                
                {isAdmin && (
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <button
                        onClick={() => setShowMemberMenu(showMemberMenu === member.id ? null : member.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {showMemberMenu === member.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                          <div className="py-1">
                            {member.role === 'member' && (
                              <button
                                onClick={() => {
                                  handleUpdateMemberRole(member.id, 'admin');
                                  setShowMemberMenu(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                Make Admin
                              </button>
                            )}
                            {member.role === 'admin' && member.userId !== group.createdBy && (
                              <button
                                onClick={() => {
                                  handleUpdateMemberRole(member.id, 'member');
                                  setShowMemberMenu(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Users className="w-4 h-4 mr-2" />
                                Remove Admin
                              </button>
                            )}
                            {member.userId !== group.createdBy && (
                              <button
                                onClick={() => {
                                  handleRemoveMember(member.id, `${member.user.firstName} ${member.user.lastName}`);
                                  setShowMemberMenu(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove Member
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          </div>
        )}
        
        {activeTab === 'expenses' && (
          <div className="p-6">
            <ExpensesList
              groupId={groupId}
              onExpenseUpdated={() => {
                // Refresh group details when expenses are updated
                loadGroupDetails();
              }}
            />
          </div>
        )}
        
        {activeTab === 'balances' && (
          <div className="p-6 space-y-6">
            <BalanceSummary
              groupId={groupId}
              onRefresh={() => {
                loadGroupDetails();
              }}
            />
            <SettlementView
              groupId={groupId}
              onRefresh={() => {
                loadGroupDetails();
              }}
            />
            <BalanceHistory
              groupId={groupId}
              onRefresh={() => {
                loadGroupDetails();
              }}
            />
            <BalanceValidation
              groupId={groupId}
              onRefresh={() => {
                loadGroupDetails();
              }}
            />
            <BalanceExport
              groupId={groupId}
              groupName={group.name}
              onExport={() => {
                loadGroupDetails();
              }}
            />
          </div>
        )}
        
        {activeTab === 'activity' && (
          <div className="p-6">
            <GroupActivityFeed groupId={groupId} />
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        groupId={groupId}
        groupName={group.name}
        onMemberInvited={handleMemberInvited}
      />

      {/* Group Settings Modal */}
      <GroupSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        groupId={groupId}
        groupName={group.name}
        currentSettings={group.settings}
        onSettingsUpdated={handleSettingsUpdated}
      />

      {/* Delete Group Modal */}
      <DeleteGroupModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        groupId={groupId}
        groupName={group.name}
        onGroupDeleted={handleGroupDeleted}
      />

      {/* Export Group Modal */}
      <GroupExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        groupId={groupId}
        groupName={group.name}
      />

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        groupId={groupId}
        groupName={group.name}
        groupMembers={group.members || []}
        onExpenseAdded={() => {
          loadGroupDetails();
          setShowAddExpenseModal(false);
        }}
      />
    </div>
  );
};

export default GroupDetail;
