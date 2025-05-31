'use client';

import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Issue, MapPin as MapPinType } from '@/types';
import { dataAccess } from '@/lib/azure-data-access';
import { 
  Filter, 
  List, 
  MapPin, 
  AlertTriangle,
  Clock,
  CheckCircle,
  X
} from 'lucide-react';
import MapboxComponent from '@/components/MapboxComponent';

const IssueMap = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showList, setShowList] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    priority: 'all',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    loadIssues();
  }, [isAuthenticated, router]);

  const loadIssues = async () => {
    try {
      const issuesData = await dataAccess.getIssues();
      setIssues(issuesData);
    } catch (error) {
      console.error('Error loading issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredIssues = issues.filter(issue => {
    if (filters.status !== 'all' && issue.status !== filters.status) return false;
    if (filters.category !== 'all' && issue.category !== filters.category) return false;
    if (filters.priority !== 'all' && issue.priority !== filters.priority) return false;
    return true;
  });

  const mapPins: MapPinType[] = filteredIssues.map(issue => ({
    id: issue.id,
    latitude: issue.location.latitude,
    longitude: issue.location.longitude,
    status: issue.status,
    category: issue.category,
    title: issue.title,
    priority: issue.priority,
  }));

  const handlePinClick = (pin: MapPinType) => {
    const issue = issues.find(i => i.id === pin.id);
    setSelectedIssue(issue || null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertTriangle className="w-4 h-4 text-danger-600" />;
      case 'inProgress':
        return <Clock className="w-4 h-4 text-warning-600" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-secondary-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'open':
        return `${baseClasses} bg-danger-100 text-danger-800`;
      case 'inProgress':
        return `${baseClasses} bg-warning-100 text-warning-800`;
      case 'resolved':
        return `${baseClasses} bg-secondary-100 text-secondary-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

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
      
      <div className="relative h-screen">
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="flex items-center justify-between bg-white rounded-lg shadow-md p-4">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Issue Map</h1>
              <p className="text-sm text-gray-600">
                {filteredIssues.length} of {issues.length} issues
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowList(!showList)}
                className={`p-2 rounded-lg transition-colors ${
                  showList ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-2 bg-white rounded-lg shadow-md p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="form-select text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="inProgress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="form-select text-sm"
                  >
                    <option value="all">All Categories</option>
                    <option value="power">Power</option>
                    <option value="water">Water</option>
                    <option value="sewer">Sewer</option>
                    <option value="roads">Roads</option>
                    <option value="lights">Lighting</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    className="form-select text-sm"
                  >
                    <option value="all">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>        {/* Map */}
        <div className="absolute inset-0 pt-20">
          <MapboxComponent
            pins={mapPins}
            onPinClick={handlePinClick}
            selectedPin={selectedIssue ? mapPins.find(p => p.id === selectedIssue.id) || null : null}
          />
        </div>

        {/* Issue List Sidebar */}
        {showList && (
          <div className="absolute top-20 right-4 bottom-4 w-80 bg-white rounded-lg shadow-md overflow-hidden z-20">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Issues List</h2>
                <button
                  onClick={() => setShowList(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredIssues.map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => setSelectedIssue(issue)}
                  className={`w-full p-4 text-left border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                    selectedIssue?.id === issue.id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(issue.status)}
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {issue.title}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {issue.category} • {issue.location.address}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={getStatusBadge(issue.status)}>
                          {issue.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Issue Details Modal */}
        {selectedIssue && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:w-96 bg-white rounded-lg shadow-lg z-30">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(selectedIssue.status)}
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedIssue.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 max-h-64 overflow-y-auto">
              <div className="space-y-3">
                <div>
                  <span className={getStatusBadge(selectedIssue.status)}>
                    {selectedIssue.status}
                  </span>
                  <span className="ml-2 text-sm text-gray-600 capitalize">
                    {selectedIssue.priority} priority
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{selectedIssue.description}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    <MapPin className="inline w-4 h-4 mr-1" />
                    {selectedIssue.location.address}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    Category: <span className="capitalize">{selectedIssue.category}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    Reported: {new Date(selectedIssue.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile bottom spacing */}
      <div className="h-16 md:h-0"></div>
    </div>
  );
};

export default IssueMap;
