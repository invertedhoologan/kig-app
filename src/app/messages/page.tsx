'use client';

import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  Users, 
  Bell, 
  Send,
  Plus,
  Search
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
  type: 'general' | 'group' | 'alert';
}

const mockMessages: Message[] = [
  {
    id: '1',
    content: 'Water supply has been restored to the Main Street area. Thank you for your patience.',
    sender: 'Water Works Team',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    type: 'alert',
  },
  {
    id: '2',
    content: 'Scheduled maintenance on street lighting in Zone A will begin tomorrow at 8 AM.',
    sender: 'Infrastructure Team',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    type: 'general',
  },
  {
    id: '3',
    content: 'Weekly community meeting this Saturday at 10 AM at the community center.',
    sender: 'Community Admin',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    type: 'general',
  },
];

const Messages = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'general' | 'group' | 'alert'>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
  }, [isAuthenticated, router]);

  const filteredMessages = messages.filter(message => 
    selectedType === 'all' || message.type === selectedType
  );

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: user?.name || 'You',
      timestamp: new Date(),
      type: 'general',
    };

    setMessages([message, ...messages]);
    setNewMessage('');
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <Bell className="w-4 h-4 text-danger-600" />;
      case 'group':
        return <Users className="w-4 h-4 text-primary-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'alert':
        return 'bg-danger-100 text-danger-800';
      case 'group':
        return 'bg-primary-100 text-primary-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Messages & Updates</h1>
          <p className="text-gray-600 mt-1">
            Stay informed about community infrastructure updates
          </p>
        </div>

        {/* Message Input */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Post Community Update
          </h2>
          <div className="flex space-x-4">
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Share an update with the community..."
                rows={3}
                className="form-textarea"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 mr-1" />
                Post
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 mr-2">Filter:</span>
            {[
              { key: 'all', label: 'All Messages' },
              { key: 'general', label: 'General' },
              { key: 'group', label: 'Work Groups' },
              { key: 'alert', label: 'Alerts' },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setSelectedType(filter.key as any)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedType === filter.key
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages List */}
        <div className="space-y-4">
          {filteredMessages.length > 0 ? (
            filteredMessages.map((message) => (
              <div key={message.id} className="card p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getMessageIcon(message.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900">
                          {message.sender}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(message.type)}`}>
                          {message.type}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-gray-700">{message.content}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="card p-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">No messages</h3>
              <p className="text-sm text-gray-600">
                No messages match your current filter
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="fixed bottom-20 right-4 md:bottom-8 md:right-8 space-y-2">
          <button className="bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-full shadow-lg">
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile bottom spacing */}
      <div className="h-20 md:h-0"></div>
    </div>
  );
};

export default Messages;
