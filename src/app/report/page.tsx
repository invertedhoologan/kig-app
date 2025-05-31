'use client';

import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { dataAccess } from '@/lib/azure-data-access';
import { IssueCategory, IssuePriority } from '@/types';
import { 
  MapPin, 
  Camera, 
  Upload, 
  X,
  AlertTriangle,
  Clock,
  Zap
} from 'lucide-react';

interface ReportForm {
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  address: string;
}

const categories: { value: IssueCategory; label: string; icon: string }[] = [
  { value: 'power', label: 'Power/Electricity', icon: '⚡' },
  { value: 'water', label: 'Water Supply', icon: '💧' },
  { value: 'sewer', label: 'Sewer/Drainage', icon: '🚰' },
  { value: 'roads', label: 'Roads/Transport', icon: '🛣️' },
  { value: 'lights', label: 'Street Lighting', icon: '💡' },
  { value: 'drainage', label: 'Drainage', icon: '🌊' },
  { value: 'parks', label: 'Parks & Recreation', icon: '🌳' },
  { value: 'waterways', label: 'Waterways & Beaches', icon: '🏖️' },
  { value: 'wildlife', label: 'Wildlife', icon: '🦌' },
  { value: 'security', label: 'Security', icon: '🛡️' },
  { value: 'waste', label: 'Waste Management', icon: '🗑️' },
  { value: 'other', label: 'Other', icon: '📋' },
];

const priorities: { value: IssuePriority; label: string; color: string; icon: any }[] = [
  { value: 'low', label: 'Low Priority', color: 'text-gray-600', icon: Clock },
  { value: 'medium', label: 'Medium Priority', color: 'text-warning-600', icon: AlertTriangle },
  { value: 'high', label: 'High Priority', color: 'text-danger-600', icon: AlertTriangle },
  { value: 'critical', label: 'Critical/Emergency', color: 'text-danger-700', icon: Zap },
];

const ReportIssue = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [gettingLocation, setGettingLocation] = useState(false);

  const form = useForm<ReportForm>({
    defaultValues: {
      priority: 'medium',
      category: 'other',
    }
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    getCurrentLocation();
  }, [isAuthenticated, router]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setGettingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setGettingLocation(false);
          // Default to Knysna coordinates
          setLocation({
            lat: -34.0373,
            lng: 23.0474,
          });
        }
      );
    } else {
      // Default to Knysna coordinates
      setLocation({
        lat: -34.0373,
        lng: 23.0474,
      });
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (photos.length + files.length > 5) {
      toast.error('Maximum 5 photos allowed');
      return;
    }
    setPhotos([...photos, ...files]);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ReportForm) => {
    if (!location) {
      toast.error('Location is required');
      return;
    }

    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    setLoading(true);

    try {
      // Upload photos if any
      const photoUrls: string[] = [];
      for (const photo of photos) {
        try {
          const buffer = await photo.arrayBuffer();
          const url = await dataAccess.uploadPhoto(
            Buffer.from(buffer),
            `${Date.now()}_${photo.name}`,
            'temp'
          );
          photoUrls.push(url);
        } catch (error) {
          console.error('Error uploading photo:', error);
        }
      }

      // Create issue
      const issue = await dataAccess.createIssue({
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: 'open',
        location: {
          latitude: location.lat,
          longitude: location.lng,
          address: data.address,
        },
        photos: photoUrls,
        reportedBy: user.id,
      });

      toast.success('Issue reported successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error reporting issue:', error);
      toast.error('Failed to report issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Report an Issue</h1>
          <p className="text-gray-600 mt-1">
            Help improve our community by reporting infrastructure issues
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Issue Title */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Issue Details</h2>
            
            <div className="form-group">
              <label className="form-label">Issue Title</label>
              <input
                type="text"
                {...form.register('title', { required: 'Title is required' })}
                className="form-input"
                placeholder="Brief description of the issue"
              />
              {form.formState.errors.title && (
                <p className="form-error">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((category) => (
                  <label
                    key={category.value}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      form.watch('category') === category.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      {...form.register('category', { required: 'Category is required' })}
                      value={category.value}
                      className="sr-only"
                    />
                    <span className="text-lg mr-2">{category.icon}</span>
                    <span className="text-sm font-medium">{category.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Priority Level</label>
              <div className="space-y-2">
                {priorities.map((priority) => {
                  const Icon = priority.icon;
                  return (
                    <label
                      key={priority.value}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        form.watch('priority') === priority.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        {...form.register('priority', { required: 'Priority is required' })}
                        value={priority.value}
                        className="sr-only"
                      />
                      <Icon className={`w-4 h-4 mr-3 ${priority.color}`} />
                      <span className="text-sm font-medium">{priority.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                {...form.register('description', { required: 'Description is required' })}
                rows={4}
                className="form-textarea"
                placeholder="Provide detailed information about the issue..."
              />
              {form.formState.errors.description && (
                <p className="form-error">{form.formState.errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Location</h2>
            
            <div className="form-group">
              <label className="form-label">Address or Description</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  {...form.register('address', { required: 'Address is required' })}
                  className="form-input pl-10"
                  placeholder="Enter the location address or nearby landmark"
                />
              </div>
              {form.formState.errors.address && (
                <p className="form-error">{form.formState.errors.address.message}</p>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">GPS Location</p>
                  {location ? (
                    <p className="text-sm text-gray-600">
                      {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600">Getting location...</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="btn-secondary text-sm"
                >
                  {gettingLocation ? 'Getting...' : 'Update Location'}
                </button>
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Photos (Optional)</h2>
            
            <div className="form-group">
              <label className="form-label">Upload Photos</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Drag and drop photos here, or{' '}
                    <label className="text-primary-600 cursor-pointer">
                      browse
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="sr-only"
                      />
                    </label>
                  </p>
                  <p className="text-xs text-gray-500">
                    Maximum 5 photos, up to 10MB each
                  </p>
                </div>
              </div>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">                    <Image
                      src={URL.createObjectURL(photo)}
                      alt={`Upload ${index + 1}`}
                      width={100}
                      height={96}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 bg-danger-600 text-white rounded-full p-1 hover:bg-danger-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading || !location}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Report Issue'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Mobile bottom spacing */}
      <div className="h-20 md:h-0"></div>
    </div>
  );
};

export default ReportIssue;
