'use client';

import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import ActivityFeed from '@/components/ActivityFeed';
import { useEffect, useState } from 'react';
import { Issue, User } from '@/types';
import { dataAccess } from '@/lib/azure-data-access';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Users, 
  TrendingUp,
  MapPin,
  Plus,
  Filter
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    loadDashboardData();
  }, [isAuthenticated, router]);

  const loadDashboardData = async () => {
    try {
      const issuesData = await dataAccess.getIssues();
      setIssues(issuesData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusCounts = () => {
    return {
      open: issues.filter(i => i.status === 'open').length,
      inProgress: issues.filter(i => i.status === 'inProgress').length,
      resolved: issues.filter(i => i.status === 'resolved').length,
      total: issues.length,
    };
  };

  const getRecentIssues = () => {
    return issues
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-danger-600" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-warning-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'open':
        return `${baseClasses} status-open`;
      case 'inProgress':
        return `${baseClasses} status-inProgress`;
      case 'resolved':
        return `${baseClasses} status-resolved`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const statusCounts = getStatusCounts();
  const recentIssues = getRecentIssues();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="spinner w-8 h-8"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}
          </h1>          <p className="text-gray-600 mt-1">
            Here&apos;s what&apos;s happening in your community today
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-danger-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-danger-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Open Issues</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.open}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-warning-100 rounded-lg">
                <Clock className="w-6 h-6 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.inProgress}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-secondary-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-secondary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.resolved}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Issues</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => router.push('/report')}
            className="card p-6 text-left hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg">
                <Plus className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Report Issue</h3>
                <p className="text-gray-600">Submit a new infrastructure issue</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/map')}
            className="card p-6 text-left hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-lg">
                <MapPin className="w-6 h-6 text-secondary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">View Map</h3>
                <p className="text-gray-600">See issues on the community map</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/messages')}
            className="card p-6 text-left hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="p-3 bg-warning-100 rounded-lg">
                <Users className="w-6 h-6 text-warning-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Messages</h3>
                <p className="text-gray-600">Check community updates</p>
              </div>
            </div>
          </button>
        </div>        {/* Recent Issues and Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Issues - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Recent Issues</h2>
                  <button className="btn-secondary text-sm">
                    <Filter className="w-4 h-4 mr-1" />
                    Filter
                  </button>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {recentIssues.length > 0 ? (
                  recentIssues.map((issue) => (
                    <div key={issue.id} className="p-6 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getPriorityIcon(issue.priority)}
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">
                              {issue.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {issue.category} • {issue.location.address}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={getStatusBadge(issue.status)}>
                            {issue.status}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(issue.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 mb-1">No issues yet</h3>
                    <p className="text-sm text-gray-600">
                      Start by reporting your first infrastructure issue
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Feed - Takes 1 column */}
          <div className="lg:col-span-1">
            <ActivityFeed limit={8} />
          </div>
        </div>
      </div>

      {/* Mobile bottom spacing */}
      <div className="h-20 md:h-0"></div>
    </div>
  );
};

export default Dashboard;
