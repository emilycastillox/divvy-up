import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  UserPlus, 
  UserMinus, 
  Settings, 
  DollarSign, 
  MessageSquare, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { apiClient } from '../../services/api';

interface ActivityItem {
  id: string;
  type: 'member_added' | 'member_removed' | 'member_role_changed' | 'expense_added' | 'expense_updated' | 'expense_deleted' | 'settings_changed' | 'group_created' | 'invitation_sent' | 'invitation_accepted';
  groupId: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
  targetUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  metadata: {
    expenseTitle?: string;
    expenseAmount?: number;
    currency?: string;
    oldRole?: string;
    newRole?: string;
    settingName?: string;
    settingValue?: any;
    invitationEmail?: string;
  };
  createdAt: string;
}

interface GroupActivityFeedProps {
  groupId: string;
  limit?: number;
}

const GroupActivityFeed: React.FC<GroupActivityFeedProps> = ({ groupId, limit = 20 }) => {
  const { addNotification } = useApp();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadActivities();
  }, [groupId]);

  const loadActivities = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await apiClient.getGroupActivities(groupId, { page: pageNum, limit });
      
      if (response.success && response.data?.activities) {
        const newActivities = response.data.activities;
        if (pageNum === 1) {
          setActivities(newActivities);
        } else {
          setActivities(prev => [...prev, ...newActivities]);
        }
        setHasMore(newActivities.length === limit);
        setPage(pageNum);
      } else {
        addNotification({ type: 'error', message: response.message || 'Failed to load activities' });
      }
    } catch (error: any) {
      addNotification({ type: 'error', message: error.message || 'Failed to load activities' });
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadActivities(page + 1);
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    const iconClass = "w-5 h-5";
    
    switch (type) {
      case 'member_added':
      case 'invitation_accepted':
        return <UserPlus className={`${iconClass} text-green-600`} />;
      case 'member_removed':
        return <UserMinus className={`${iconClass} text-red-600`} />;
      case 'member_role_changed':
        return <Settings className={`${iconClass} text-blue-600`} />;
      case 'expense_added':
        return <DollarSign className={`${iconClass} text-green-600`} />;
      case 'expense_updated':
        return <DollarSign className={`${iconClass} text-yellow-600`} />;
      case 'expense_deleted':
        return <DollarSign className={`${iconClass} text-red-600`} />;
      case 'settings_changed':
        return <Settings className={`${iconClass} text-purple-600`} />;
      case 'group_created':
        return <CheckCircle className={`${iconClass} text-green-600`} />;
      case 'invitation_sent':
        return <MessageSquare className={`${iconClass} text-blue-600`} />;
      default:
        return <Activity className={`${iconClass} text-gray-600`} />;
    }
  };

  const getActivityMessage = (activity: ActivityItem) => {
    const { type, user, targetUser, metadata } = activity;
    const userName = `${user.firstName} ${user.lastName}`;
    const targetUserName = targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : '';

    switch (type) {
      case 'member_added':
        return `${userName} added ${targetUserName} to the group`;
      case 'member_removed':
        return `${userName} removed ${targetUserName} from the group`;
      case 'member_role_changed':
        return `${userName} changed ${targetUserName}'s role from ${metadata.oldRole} to ${metadata.newRole}`;
      case 'expense_added':
        return `${userName} added expense "${metadata.expenseTitle}" for ${metadata.currency} ${metadata.expenseAmount}`;
      case 'expense_updated':
        return `${userName} updated expense "${metadata.expenseTitle}"`;
      case 'expense_deleted':
        return `${userName} deleted expense "${metadata.expenseTitle}"`;
      case 'settings_changed':
        return `${userName} changed ${metadata.settingName} to ${metadata.settingValue}`;
      case 'group_created':
        return `${userName} created the group`;
      case 'invitation_sent':
        return `${userName} sent an invitation to ${metadata.invitationEmail}`;
      case 'invitation_accepted':
        return `${userName} joined the group`;
      default:
        return `${userName} performed an action`;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const activityDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return activityDate.toLocaleDateString();
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
        <p className="text-gray-500">Group activity will appear here as members interact with the group.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Recent Activity
        </h3>
        <button
          onClick={() => loadActivities(1)}
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
            <div className="flex-shrink-0">
              {activity.user.avatarUrl ? (
                <img
                  src={activity.user.avatarUrl}
                  alt={`${activity.user.firstName} ${activity.user.lastName}`}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-semibold text-sm">
                    {activity.user.firstName.charAt(0)}{activity.user.lastName.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                {getActivityIcon(activity.type)}
                <p className="text-sm text-gray-900">
                  {getActivityMessage(activity)}
                </p>
              </div>
              <div className="flex items-center space-x-1 mt-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {formatTimeAgo(activity.createdAt)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="text-center pt-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default GroupActivityFeed;
