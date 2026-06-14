import React from 'react';
import { motion } from 'framer-motion';
import { formatDate, classNames } from '../utils';
import { UserCheck, UserMinus, Calendar } from 'lucide-react';

const MemberTimeline = ({ memberships, asOfDate }) => {
  const filteredMemberships = memberships?.filter((m) => {
    if (!asOfDate) return true;
    const date = new Date(asOfDate);
    const joined = new Date(m.joined_at);
    if (joined > date) return false;
    if (!m.left_at) return true;
    return new Date(m.left_at) > date;
  }) || [];

  const totalMembers = memberships?.length || 0;
  const activeMembers = filteredMemberships.filter((m) => !m.left_at).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Member Timeline</h3>
        {asOfDate && (
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            as of {formatDate(asOfDate)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-xs text-green-600 uppercase">Active Members</p>
          <p className="text-2xl font-bold text-green-700">{activeMembers}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 uppercase">Total Members</p>
          <p className="text-2xl font-bold text-gray-700">{totalMembers}</p>
        </div>
      </div>

      <div className="space-y-4">
        {filteredMemberships.map((membership, index) => {
          const user = membership.user;
          const isActive = !membership.left_at;
          const duration = getMembershipDuration(
            membership.joined_at,
            membership.left_at
          );

          return (
            <motion.div
              key={membership.id || index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={classNames(
                'p-3 rounded-lg border',
                isActive
                  ? 'bg-white border-gray-200'
                  : 'bg-gray-50 border-gray-200'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={classNames(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                      isActive
                        ? 'bg-accent-100 text-accent-700'
                        : 'bg-gray-200 text-gray-500'
                    )}
                  >
                    {user?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p
                      className={classNames(
                        'font-medium',
                        isActive ? 'text-gray-900' : 'text-gray-500'
                      )}
                    >
                      {user?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">{duration}</p>
                  </div>
                </div>
                <span
                  className={classNames(
                    'badge',
                    isActive ? 'badge-success' : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {isActive ? (
                    <>
                      <UserCheck className="w-3 h-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <UserMinus className="w-3 h-3 mr-1" />
                      Left
                    </>
                  )}
                </span>
              </div>

              <div className="mt-2 ml-11">
                <div className="text-xs text-gray-500">
                  Joined: {formatDate(membership.joined_at)}
                  {membership.left_at && (
                    <span className="ml-3">
                      Left: {formatDate(membership.left_at)}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

function getMembershipDuration(joinedAt, leftAt) {
  const joined = new Date(joinedAt);
  const left = leftAt ? new Date(leftAt) : new Date();
  const diffMs = left - joined;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return 'Less than a day';
  if (diffDays < 30) return `${diffDays} days`;
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  }
  const years = Math.floor(diffDays / 365);
  const remainingMonths = Math.floor((diffDays % 365) / 30);
  if (remainingMonths > 0) {
    return `${years}y ${remainingMonths}m`;
  }
  return `${years} year${years > 1 ? 's' : ''}`;
}

export default MemberTimeline;
