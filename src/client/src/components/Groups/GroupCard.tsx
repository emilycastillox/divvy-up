import React from 'react';
import { Users, DollarSign, Calendar, MoreVertical, Settings, Trash2 } from 'react-feather';
import { format } from 'date-fns';
import Button from '../UI/Button';

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    description?: string;
    currency: string;
    memberCount?: number;
    totalExpenses?: number;
    yourBalance?: number;
    created_at: string;
    updated_at: string;
    members?: Array<{
      id: string;
      user: {
        id: string;
        username: string;
        firstName: string;
        lastName: string;
        avatarUrl?: string;
      };
      role: 'admin' | 'member';
    }>;
  };
  onViewGroup: (groupId: string) => void;
  onEditGroup?: (groupId: string) => void;
  onDeleteGroup?: (groupId: string) => void;
  isAdmin?: boolean;
}

const GroupCard: React.FC<GroupCardProps> = ({
  group,
  onViewGroup,
  onEditGroup,
  onDeleteGroup,
  isAdmin = false,
}) => {
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600';
    if (balance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getBalanceText = (balance: number) => {
    if (balance > 0) return 'You are owed';
    if (balance < 0) return 'You owe';
    return 'Settled up';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {group.name}
            </h3>
            {group.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {group.description}
              </p>
            )}
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                <span>{group.memberCount || group.members?.length || 0} members</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>Created {formatDate(group.created_at)}</span>
              </div>
            </div>
          </div>
          
          {/* Actions Menu */}
          {(isAdmin || onEditGroup || onDeleteGroup) && (
            <div className="relative">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <MoreVertical className="w-4 h-4" />
              </button>
              {/* TODO: Implement dropdown menu */}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900">
              {formatCurrency(group.totalExpenses || 0, group.currency)}
            </div>
            <div className="text-sm text-gray-500">Total Expenses</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-semibold ${getBalanceColor(group.yourBalance || 0)}`}>
              {formatCurrency(Math.abs(group.yourBalance || 0), group.currency)}
            </div>
            <div className="text-sm text-gray-500">
              {getBalanceText(group.yourBalance || 0)}
            </div>
          </div>
        </div>

        {/* Members Preview */}
        {group.members && group.members.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Members</div>
            <div className="flex -space-x-2">
              {group.members.slice(0, 4).map((member) => (
                <div
                  key={member.id}
                  className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600"
                  title={`${member.user.firstName} ${member.user.lastName}`}
                >
                  {member.user.avatarUrl ? (
                    <img
                      src={member.user.avatarUrl}
                      alt={`${member.user.firstName} ${member.user.lastName}`}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    `${member.user.firstName.charAt(0)}${member.user.lastName.charAt(0)}`
                  )}
                </div>
              ))}
              {group.members.length > 4 && (
                <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                  +{group.members.length - 4}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <Button
            variant="primary"
            onClick={() => onViewGroup(group.id)}
            className="flex-1"
          >
            View Group
          </Button>
          {isAdmin && onEditGroup && (
            <Button
              variant="secondary"
              onClick={() => onEditGroup(group.id)}
              className="px-3"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupCard;
