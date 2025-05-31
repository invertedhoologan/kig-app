'use client';

import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Settings,
  Camera,
  Save,
  LogOut,
  Edit
} from 'lucide-react';

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
  workGroup: string;
}

const Profile = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<ProfileForm>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      workGroup: user?.workGroup || '',
    }
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        workGroup: user.workGroup || '',
      });
    }
  }, [isAuthenticated, user, router, form]);

  const onSubmit = async (data: ProfileForm) => {
    setLoading(true);
    try {
      // In a real app, this would call an API to update the user profile
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: 'bg-purple-100 text-purple-800',
      workGroupLeader: 'bg-blue-100 text-blue-800',
      resident: 'bg-green-100 text-green-800',
      guest: 'bg-gray-100 text-gray-800',
    };
    return badges[role as keyof typeof badges] || badges.guest;
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Administrator',
      workGroupLeader: 'Work Group Leader',
      resident: 'Resident',
      guest: 'Guest',
    };
    return labels[role as keyof typeof labels] || 'Guest';
  };

  if (!user) {
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
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-white" />
              )}
            </div>
            <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md border border-gray-200 hover:bg-gray-50">
              <Camera className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleBadge(user.role)}`}>
            <Shield className="w-4 h-4 mr-1" />
            {getRoleLabel(user.role)}
          </span>
        </div>

        {/* Profile Information */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
            <button
              onClick={() => setEditing(!editing)}
              className="btn-secondary text-sm"
            >
              <Edit className="w-4 h-4 mr-1" />
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editing ? (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    {...form.register('name', { required: 'Name is required' })}
                    className="form-input pl-10"
                    placeholder="Enter your full name"
                  />
                </div>
                {form.formState.errors.name && (
                  <p className="form-error">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    {...form.register('email', { required: 'Email is required' })}
                    className="form-input pl-10"
                    placeholder="Enter your email"
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="form-error">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    {...form.register('phone')}
                    className="form-input pl-10"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Work Group</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    {...form.register('workGroup')}
                    className="form-input pl-10"
                    placeholder="Enter your work group"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Phone</p>
                  <p className="text-sm text-gray-600">{user.phone || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Work Group</p>
                  <p className="text-sm text-gray-600">{user.workGroup || 'None assigned'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Settings className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Member Since</p>
                  <p className="text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Account Actions */}
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Account Actions</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">Account Settings</span>
              </div>
            </button>

            <button className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">Privacy & Security</span>
              </div>
            </button>

            <button
              onClick={logout}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-danger-50 rounded-lg transition-colors text-danger-600"
            >
              <div className="flex items-center space-x-3">
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Sign Out</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile bottom spacing */}
      <div className="h-20 md:h-0"></div>
    </div>
  );
};

export default Profile;
