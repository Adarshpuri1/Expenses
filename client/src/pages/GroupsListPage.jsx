import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Users, Receipt, Calendar, MoreVertical, Trash2 } from 'lucide-react';
import { useGroupStore, useAuthStore } from '../store';
import { LoadingSpinner } from '../components';
import { formatDate, classNames } from '../utils';
import toast from 'react-hot-toast';

const GroupsListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { groups, fetchGroups, deleteGroup, isLoading } = useGroupStore();

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleDeleteGroup = async (groupId, groupName) => {
    if (!confirm(`Are you sure you want to delete "${groupName}"? This cannot be undone.`)) {
      return;
    }
    const result = await deleteGroup(groupId);
    if (result.success) {
      toast.success('Group deleted');
    } else {
      toast.error(result.error || 'Failed to delete group');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Groups</h1>
          <p className="text-gray-600 mt-1">
            Manage your expense sharing groups
          </p>
        </div>
        <Link to="/groups/new" className="btn-primary">
          <Plus className="w-5 h-5 mr-2" />
          New Group
        </Link>
      </div>

      {/* Groups List */}
      {groups.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-accent-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No groups yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create your first group to start tracking shared expenses with your flatmates.
          </p>
          <Link to="/groups/new" className="btn-primary">
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Group
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group, index) => {
            const memberCount = group.memberships?.length || 0;
            const isCreator = group.created_by === user?.id;

            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card-hover overflow-visible"
              >
                <Link to={`/groups/${group.id}`} className="block p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {group.name}
                  </h3>

                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Created {formatDate(group.created_at)}</span>
                    </div>
                  </div>
                </Link>

                {isCreator && (
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteGroup(group.id, group.name);
                      }}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GroupsListPage;
