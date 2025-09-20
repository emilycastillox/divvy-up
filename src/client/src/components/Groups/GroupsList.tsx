import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Grid, List } from 'react-feather';
import GroupCard from './GroupCard';
import CreateGroupModal from './CreateGroupModal';
import Button from '../UI/Button';
import { useApp } from '../../contexts/AppContext';
import { apiClient } from '../../services/api';

interface Group {
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
}

interface GroupsListProps {
  onViewGroup: (groupId: string) => void;
  onEditGroup?: (groupId: string) => void;
  onDeleteGroup?: (groupId: string) => void;
}

const GroupsList: React.FC<GroupsListProps> = ({
  onViewGroup,
  onEditGroup,
  onDeleteGroup,
}) => {
  const { addNotification } = useApp();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadGroups = async (pageNum: number = 1, search: string = '') => {
    try {
      setLoading(true);
      const response = await apiClient.getGroups({
        page: pageNum,
        limit: 12,
        search: search || undefined,
      });

      if (response.success && response.data?.groups) {
        if (pageNum === 1) {
          setGroups(response.data.groups);
        } else {
          setGroups(prev => [...prev, ...response.data.groups]);
        }
        setHasMore(response.pagination?.hasNext || false);
      } else {
        addNotification({ type: 'error', message: response.message || 'Failed to load groups' });
      }
    } catch (error: any) {
      addNotification({ type: 'error', message: error.message || 'Failed to load groups' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups(1, searchTerm);
  }, [searchTerm]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadGroups(nextPage, searchTerm);
  };

  const handleGroupCreated = (newGroup: Group) => {
    setGroups(prev => [newGroup, ...prev]);
    setShowCreateModal(false);
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await apiClient.deleteGroup(groupId);
      if (response.success) {
        setGroups(prev => prev.filter(group => group.id !== groupId));
        addNotification({ type: 'success', message: 'Group deleted successfully' });
      } else {
        addNotification({ type: 'error', message: response.message || 'Failed to delete group' });
      }
    } catch (error: any) {
      addNotification({ type: 'error', message: error.message || 'Failed to delete group' });
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading && groups.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Groups</h1>
          <p className="text-gray-600">Manage your expense splitting groups</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Group</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search groups..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${
              viewMode === 'grid'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${
              viewMode === 'list'
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Groups Grid/List */}
      {filteredGroups.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No groups found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'Try adjusting your search terms' : 'Create your first group to get started'}
          </p>
          {!searchTerm && (
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Group</span>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {filteredGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onViewGroup={onViewGroup}
                onEditGroup={onEditGroup}
                onDeleteGroup={handleDeleteGroup}
                isAdmin={group.members?.some(m => m.role === 'admin')}
              />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="text-center">
              <Button
                variant="secondary"
                onClick={handleLoadMore}
                loading={loading}
                disabled={loading}
              >
                Load More Groups
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onGroupCreated={handleGroupCreated}
      />
    </div>
  );
};

export default GroupsList;
