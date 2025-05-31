export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profilePicture?: string;
  phone?: string;
  workGroup?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'admin' | 'workGroupLeader' | 'resident' | 'guest';

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  priority: IssuePriority;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  photos: string[];
  reportedBy: string; // User ID
  assignedTo?: string; // User ID
  workGroup?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  estimatedCost?: number;
  donationGoal?: number;
  donationsReceived?: number;
}

export type IssueCategory = 
  | 'power'
  | 'sewer'
  | 'roads'
  | 'water'
  | 'lights'
  | 'drainage'
  | 'parks'
  | 'waterways'
  | 'wildlife'
  | 'security'
  | 'waste'
  | 'other';

export type IssueStatus = 'open' | 'inProgress' | 'resolved' | 'closed';

export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';

export interface WorkGroup {
  id: string;
  name: string;
  description: string;
  leaderId: string;
  members: string[]; // User IDs
  area: string;
  specialization: IssueCategory[];
  contactInfo: {
    email?: string;
    phone?: string;
    whatsapp?: string;
  };
  category?: string;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  workGroupId: string;
  assignedTo?: string; // User ID
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  issueId?: string; // Related issue
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  recipientType: 'group' | 'issue' | 'public';
  recipientId?: string; // Group ID or Issue ID
  attachments?: string[];
  createdAt: Date;
  readBy: string[]; // User IDs
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  userId: string;
  relatedId?: string; // Issue ID, Group ID, etc.
  read: boolean;
  createdAt: Date;
}

export type NotificationType = 
  | 'issueUpdate'
  | 'newAssignment'
  | 'groupMessage'
  | 'donation'
  | 'systemAlert';

export interface Donation {
  id: string;
  amount: number;
  currency: string;
  donorId?: string; // User ID (optional for anonymous)
  issueId: string;
  message?: string;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

export interface ActivityLog {
  id: string;
  type: ActivityType;
  description: string;
  userId: string;
  relatedId?: string; // Issue ID, Group ID, etc.
  beforeData?: any;
  afterData?: any;
  createdAt: Date;
}

export type ActivityType = 
  | 'issueCreated'
  | 'issueUpdated'
  | 'issueResolved'
  | 'userJoined'
  | 'donationReceived'
  | 'messagePosted'
  | 'groupCreated';

export interface MapPin {
  id: string;
  latitude: number;
  longitude: number;
  status: IssueStatus;
  category: IssueCategory;
  title: string;
  priority: IssuePriority;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
