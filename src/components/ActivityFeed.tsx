'use client';

import { useEffect, useState } from 'react';
import { ActivityLog, ActivityType } from '@/types';
import { dataAccess } from '@/lib/azure-data-access';
import { 
  Activity, 
  Plus, 
  Edit, 
  CheckCircle, 
  Users, 
  Heart, 
  MessageSquare, 
  Zap,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  limit?: number;
  className?: string;
}

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case 'issueCreated':
      return <Plus className="w-4 h-4 text-blue-600" />;
    case 'issueUpdated':
      return <Edit className="w-4 h-4 text-yellow-600" />;
    case 'issueResolved':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'userJoined':
      return <Users className="w-4 h-4 text-purple-600" />;
    case 'donationReceived':
      return <Heart className="w-4 h-4 text-red-600" />;
    case 'messagePosted':
      return <MessageSquare className="w-4 h-4 text-indigo-600" />;
    case 'groupCreated':
      return <Zap className="w-4 h-4 text-orange-600" />;
    default:
      return <Activity className="w-4 h-4 text-gray-600" />;
  }
};

const getActivityColor = (type: ActivityType) => {
  switch (type) {
    case 'issueCreated':
      return 'bg-blue-100 border-blue-200';
    case 'issueUpdated':
      return 'bg-yellow-100 border-yellow-200';
    case 'issueResolved':
      return 'bg-green-100 border-green-200';
    case 'userJoined':
      return 'bg-purple-100 border-purple-200';
    case 'donationReceived':
      return 'bg-red-100 border-red-200';
    case 'messagePosted':
      return 'bg-indigo-100 border-indigo-200';
    case 'groupCreated':
      return 'bg-orange-100 border-orange-200';
    default:
      return 'bg-gray-100 border-gray-200';
  }
};

export default function ActivityFeed({ limit = 10, className = '' }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const loadActivities = async () => {
      try {
        setLoading(true);
        setError(null);
        const logs = await dataAccess.getActivityLogs(limit);
        setActivities(logs);
      } catch (err) {
        console.error('Error loading activities:', err);
        setError('Failed to load activities');
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [limit]);

  const refreshActivities = async () => {
    try {
      setError(null);
      const logs = await dataAccess.getActivityLogs(limit);
      setActivities(logs);
    } catch (err) {
      console.error('Error loading activities:', err);
      setError('Failed to load activities');
    }
  };

  if (loading) {
    return (
      <div className={`card p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <Activity className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`card p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <Activity className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="text-center text-gray-500 py-8">
          <p>{error}</p>          <button
            onClick={refreshActivities}
            className="btn-secondary mt-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Activity className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>        <button
          onClick={refreshActivities}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          Refresh
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p>No recent activity</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className={`flex items-start space-x-3 p-3 rounded-lg border ${getActivityColor(activity.type)}`}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center border">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 font-medium">
                  {activity.description}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
                  </p>
                </div>
                {activity.beforeData && activity.afterData && (
                  <div className="mt-2 text-xs text-gray-600">
                    <span className="font-medium">Changed:</span>{' '}
                    <span className="text-red-600">{JSON.stringify(activity.beforeData)}</span>
                    {' → '}
                    <span className="text-green-600">{JSON.stringify(activity.afterData)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activities.length > 0 && activities.length >= limit && (
        <div className="mt-6 text-center">
          <button className="text-sm text-primary-600 hover:text-primary-700">
            View All Activity
          </button>
        </div>
      )}
    </div>
  );
}
