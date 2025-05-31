import { TableClient, TableEntity } from '@azure/data-tables';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { User, Issue, WorkGroup, Task, Message, Notification, Donation, ActivityLog, ActivityType } from '@/types';
import { azureConfig, validateAzureConfig } from './azure-config';

// Mock data for development when Azure is not configured
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@kig.com',
    name: 'Admin User',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    email: 'leader@kig.com',
    name: 'Work Group Leader',
    role: 'workGroupLeader',
    workGroup: 'maintenance',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockIssues: Issue[] = [
  {
    id: '1',
    title: 'Water pipe burst on Main Street',
    description: 'Large water pipe has burst causing flooding on Main Street near the shopping center.',
    category: 'water',
    status: 'open',
    priority: 'high',
    location: {
      latitude: -34.0373,
      longitude: 23.0474,
      address: 'Main Street, Knysna'
    },
    photos: [],
    reportedBy: '2',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: 'Street light not working',
    description: 'Street light at corner of Queen Street and Grey Street has been out for 3 days.',
    category: 'lights',
    status: 'inProgress',
    priority: 'medium',
    location: {
      latitude: -34.0383,
      longitude: 23.0484,
      address: 'Queen Street & Grey Street, Knysna'
    },
    photos: [],    reportedBy: '2',
    assignedTo: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockWorkGroups: WorkGroup[] = [
  {
    id: '1',
    name: 'Water & Sewerage Team',
    description: 'Handling all water and sewerage related issues in Knysna',
    leaderId: '2',
    members: ['1', '2'],
    area: 'Central Knysna',
    specialization: ['water', 'sewer'],
    category: 'water',
    isActive: true,
    contactInfo: {
      email: 'water@kig.com',
      phone: '+27 44 382 6000'
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Infrastructure Maintenance',
    description: 'General infrastructure maintenance and repairs',
    leaderId: '1',
    members: ['1', '2'],
    area: 'Greater Knysna',
    specialization: ['roads', 'lights', 'drainage'],
    category: 'general',
    isActive: true,
    contactInfo: {
      email: 'maintenance@kig.com'
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Repair Main Street water pipe',
    description: 'Emergency repair needed for burst water pipe on Main Street',
    workGroupId: '1',
    assignedTo: '2',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2025-06-05',
    issueId: '1',
    createdBy: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: 'Install replacement street light',
    description: 'Replace broken street light at Queen Street intersection',
    workGroupId: '2',
    assignedTo: '1',
    status: 'pending',
    priority: 'medium',
    dueDate: '2025-06-10',
    issueId: '2',
    createdBy: '2',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

class AzureDataAccess {
  private tableClient: TableClient | null = null;
  private blobServiceClient: BlobServiceClient | null = null;
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = validateAzureConfig();
    if (this.isConfigured) {
      this.initializeClients();
    }
  }
  private initializeClients() {
    try {
      // Validate configuration before attempting to initialize
      if (!validateAzureConfig()) {
        console.warn('Azure configuration validation failed. Using mock data.');
        this.isConfigured = false;
        return;
      }

      // Check if connection string is valid before creating clients
      if (!azureConfig.storage.connectionString || azureConfig.storage.connectionString.trim() === '') {
        console.warn('Azure connection string is empty. Using mock data.');
        this.isConfigured = false;
        return;
      }

      // Initialize Table Client
      this.tableClient = new TableClient(
        azureConfig.storage.connectionString,
        'KIGData'
      );

      // Initialize Blob Service Client
      this.blobServiceClient = BlobServiceClient.fromConnectionString(
        azureConfig.storage.connectionString
      );
      
      console.log('Azure clients initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Azure clients:', error);
      this.isConfigured = false;
    }
  }

  // User operations
  async getUsers(): Promise<User[]> {
    if (!this.isConfigured) {
      return mockUsers;
    }

    try {
      const entities = this.tableClient!.listEntities({
        queryOptions: { filter: "PartitionKey eq 'User'" }
      });
      
      const users: User[] = [];
      for await (const entity of entities) {
        users.push(this.entityToUser(entity));
      }
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      return mockUsers;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    if (!this.isConfigured) {
      return mockUsers.find(u => u.id === id) || null;
    }

    try {
      const entity = await this.tableClient!.getEntity('User', id);
      return this.entityToUser(entity);
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!this.isConfigured) {
      mockUsers.push(newUser);
      return newUser;
    }

    try {
      const entity = this.userToEntity(newUser);
      await this.tableClient!.createEntity(entity);
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Issue operations
  async getIssues(): Promise<Issue[]> {
    if (!this.isConfigured) {
      return mockIssues;
    }

    try {
      const entities = this.tableClient!.listEntities({
        queryOptions: { filter: "PartitionKey eq 'Issue'" }
      });
      
      const issues: Issue[] = [];
      for await (const entity of entities) {
        issues.push(this.entityToIssue(entity));
      }
      return issues;
    } catch (error) {
      console.error('Error fetching issues:', error);
      return mockIssues;
    }
  }

  async getIssueById(id: string): Promise<Issue | null> {
    if (!this.isConfigured) {
      return mockIssues.find(i => i.id === id) || null;
    }

    try {
      const entity = await this.tableClient!.getEntity('Issue', id);
      return this.entityToIssue(entity);
    } catch (error) {
      console.error('Error fetching issue:', error);
      return null;
    }
  }
  async createIssue(issue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>): Promise<Issue> {
    const newIssue: Issue = {
      ...issue,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!this.isConfigured) {
      mockIssues.push(newIssue);
      // Create activity log for mock data
      await this.createActivityLog({
        type: 'issueCreated',
        description: `New issue reported: ${newIssue.title}`,
        userId: newIssue.reportedBy,
        relatedId: newIssue.id,
      });
      return newIssue;
    }

    try {
      const entity = this.issueToEntity(newIssue);
      await this.tableClient!.createEntity(entity);
      
      // Create activity log
      await this.createActivityLog({
        type: 'issueCreated',
        description: `New issue reported: ${newIssue.title}`,
        userId: newIssue.reportedBy,
        relatedId: newIssue.id,
      });
      
      return newIssue;
    } catch (error) {
      console.error('Error creating issue:', error);
      throw error;
    }
  }
  async updateIssue(id: string, updates: Partial<Issue>): Promise<Issue | null> {
    if (!this.isConfigured) {
      const index = mockIssues.findIndex(i => i.id === id);
      if (index !== -1) {
        const beforeData = { ...mockIssues[index] };
        mockIssues[index] = { ...mockIssues[index], ...updates, updatedAt: new Date() };
        
        // Create activity log for significant changes
        if (updates.status && updates.status !== beforeData.status) {
          const activityType = updates.status === 'resolved' ? 'issueResolved' : 'issueUpdated';
          await this.createActivityLog({
            type: activityType,
            description: `Issue status changed from ${beforeData.status} to ${updates.status}`,
            userId: updates.assignedTo || beforeData.reportedBy,
            relatedId: id,
            beforeData: { status: beforeData.status },
            afterData: { status: updates.status },
          });
        }
        
        return mockIssues[index];
      }
      return null;
    }

    try {
      const existing = await this.getIssueById(id);
      if (!existing) return null;

      const updated = { ...existing, ...updates, updatedAt: new Date() };
      const entity = this.issueToEntity(updated);
      await this.tableClient!.updateEntity(entity, 'Replace');
      
      // Create activity log for significant changes
      if (updates.status && updates.status !== existing.status) {
        const activityType = updates.status === 'resolved' ? 'issueResolved' : 'issueUpdated';
        await this.createActivityLog({
          type: activityType,
          description: `Issue status changed from ${existing.status} to ${updates.status}`,
          userId: updates.assignedTo || existing.reportedBy,
          relatedId: id,
          beforeData: { status: existing.status },
          afterData: { status: updates.status },
        });
      }
      
      return updated;
    } catch (error) {
      console.error('Error updating issue:', error);
      return null;
    }
  }

  // Blob storage operations for photos
  async uploadPhoto(file: Buffer, fileName: string, issueId: string): Promise<string> {
    if (!this.isConfigured) {
      // Return mock URL for development
      return `https://mockblob.core.windows.net/issues/${issueId}/${fileName}`;
    }

    try {
      const containerClient = this.blobServiceClient!.getContainerClient('issues');
      await containerClient.createIfNotExists();
      
      const blobName = `${issueId}/${fileName}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
      await blockBlobClient.upload(file, file.length);
      return blockBlobClient.url;
    } catch (error) {
      console.error('Error uploading photo:', error);      throw error;
    }
  }

  // Work Group operations
  async getWorkGroups(): Promise<WorkGroup[]> {
    if (!this.isConfigured) {
      return mockWorkGroups;
    }

    try {
      const entities = this.tableClient!.listEntities({
        queryOptions: { filter: "PartitionKey eq 'WorkGroup'" }
      });
      
      const workGroups: WorkGroup[] = [];
      for await (const entity of entities) {
        workGroups.push(this.entityToWorkGroup(entity as any));
      }
      return workGroups;
    } catch (error) {
      console.error('Error fetching work groups:', error);
      return mockWorkGroups;
    }
  }

  async createWorkGroup(workGroup: Omit<WorkGroup, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkGroup> {
    const newWorkGroup: WorkGroup = {
      ...workGroup,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!this.isConfigured) {
      mockWorkGroups.push(newWorkGroup);
      return newWorkGroup;
    }

    try {
      const entity = this.workGroupToEntity(newWorkGroup);
      await this.tableClient!.createEntity(entity);
      return newWorkGroup;
    } catch (error) {
      console.error('Error creating work group:', error);
      throw error;
    }
  }

  // Task operations
  async getTasksByWorkGroup(workGroupId: string): Promise<Task[]> {
    if (!this.isConfigured) {
      return mockTasks.filter(t => t.workGroupId === workGroupId);
    }

    try {
      const entities = this.tableClient!.listEntities({
        queryOptions: { filter: `PartitionKey eq 'Task' and workGroupId eq '${workGroupId}'` }
      });
      
      const tasks: Task[] = [];
      for await (const entity of entities) {
        tasks.push(this.entityToTask(entity as any));
      }
      return tasks;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return mockTasks.filter(t => t.workGroupId === workGroupId);
    }
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdBy: task.createdBy || '1', // Default to admin if not provided
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!this.isConfigured) {
      mockTasks.push(newTask);
      return newTask;
    }

    try {
      const entity = this.taskToEntity(newTask);
      await this.tableClient!.createEntity(entity);
      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  // Entity conversion helpers
  private entityToUser(entity: TableEntity): User {
    return {
      id: entity.rowKey as string,
      email: entity.email as string,
      name: entity.name as string,
      role: entity.role as any,
      profilePicture: entity.profilePicture as string,
      phone: entity.phone as string,
      workGroup: entity.workGroup as string,
      createdAt: new Date(entity.createdAt as string),
      updatedAt: new Date(entity.updatedAt as string),
    };
  }

  private userToEntity(user: User): TableEntity {
    return {
      partitionKey: 'User',
      rowKey: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profilePicture: user.profilePicture || '',
      phone: user.phone || '',
      workGroup: user.workGroup || '',
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private entityToIssue(entity: TableEntity): Issue {
    return {
      id: entity.rowKey as string,
      title: entity.title as string,
      description: entity.description as string,
      category: entity.category as any,
      status: entity.status as any,
      priority: entity.priority as any,
      location: JSON.parse(entity.location as string),
      photos: JSON.parse(entity.photos as string || '[]'),
      reportedBy: entity.reportedBy as string,
      assignedTo: entity.assignedTo as string,
      workGroup: entity.workGroup as string,
      createdAt: new Date(entity.createdAt as string),
      updatedAt: new Date(entity.updatedAt as string),
      resolvedAt: entity.resolvedAt ? new Date(entity.resolvedAt as string) : undefined,
      estimatedCost: entity.estimatedCost as number,
      donationGoal: entity.donationGoal as number,
      donationsReceived: entity.donationsReceived as number,
    };
  }

  private issueToEntity(issue: Issue): TableEntity {
    return {
      partitionKey: 'Issue',
      rowKey: issue.id,
      title: issue.title,
      description: issue.description,
      category: issue.category,
      status: issue.status,
      priority: issue.priority,
      location: JSON.stringify(issue.location),
      photos: JSON.stringify(issue.photos),
      reportedBy: issue.reportedBy,
      assignedTo: issue.assignedTo || '',
      workGroup: issue.workGroup || '',
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt.toISOString(),
      resolvedAt: issue.resolvedAt?.toISOString() || '',
      estimatedCost: issue.estimatedCost || 0,
      donationGoal: issue.donationGoal || 0,      donationsReceived: issue.donationsReceived || 0,
    };
  }

  private entityToWorkGroup(entity: any): WorkGroup {
    return {
      id: entity.rowKey as string,
      name: entity.name as string,
      description: entity.description as string,
      leaderId: entity.leaderId as string,
      members: JSON.parse(entity.members as string || '[]'),
      area: entity.area as string,
      specialization: JSON.parse(entity.specialization as string || '[]'),
      category: entity.category as string,
      isActive: entity.isActive as boolean,
      contactInfo: JSON.parse(entity.contactInfo as string || '{}'),
      createdAt: new Date(entity.createdAt as string),
      updatedAt: new Date(entity.updatedAt as string),
    };
  }

  private workGroupToEntity(workGroup: WorkGroup): any {
    return {
      partitionKey: 'WorkGroup',
      rowKey: workGroup.id,
      name: workGroup.name,
      description: workGroup.description,
      leaderId: workGroup.leaderId,
      members: JSON.stringify(workGroup.members),
      area: workGroup.area,
      specialization: JSON.stringify(workGroup.specialization),
      category: workGroup.category || '',
      isActive: workGroup.isActive || true,
      contactInfo: JSON.stringify(workGroup.contactInfo),
      createdAt: workGroup.createdAt.toISOString(),
      updatedAt: workGroup.updatedAt.toISOString(),
    };
  }

  private entityToTask(entity: any): Task {
    return {
      id: entity.rowKey as string,
      title: entity.title as string,
      description: entity.description as string,
      workGroupId: entity.workGroupId as string,
      assignedTo: entity.assignedTo as string,
      status: entity.status as any,
      priority: entity.priority as any,
      dueDate: entity.dueDate as string,
      issueId: entity.issueId as string,
      createdBy: entity.createdBy as string,
      createdAt: new Date(entity.createdAt as string),
      updatedAt: new Date(entity.updatedAt as string),
      completedAt: entity.completedAt ? new Date(entity.completedAt as string) : undefined,
    };
  }

  private taskToEntity(task: Task): any {
    return {
      partitionKey: 'Task',
      rowKey: task.id,
      title: task.title,
      description: task.description,
      workGroupId: task.workGroupId,
      assignedTo: task.assignedTo || '',      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate || '',
      issueId: task.issueId || '',
      createdBy: task.createdBy,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      completedAt: task.completedAt?.toISOString() || '',
    };
  }
  // Activity Log Operations
  async getActivityLogs(limit?: number): Promise<ActivityLog[]> {
    if (!this.isConfigured) {
      // Return mock activity logs
      const mockLogs: ActivityLog[] = [
        {
          id: '1',
          type: 'issueCreated' as ActivityType,
          description: 'New issue reported: Broken street light on Main Street',
          userId: 'user1',
          relatedId: 'issue1',
          createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        },
        {
          id: '2',
          type: 'issueUpdated' as ActivityType,
          description: 'Issue status changed from Open to In Progress',
          userId: 'admin1',
          relatedId: 'issue2',
          beforeData: { status: 'open' },
          afterData: { status: 'inProgress' },
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        },
        {
          id: '3',
          type: 'userJoined' as ActivityType,
          description: 'New user joined the community',
          userId: 'user3',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        },
        {
          id: '4',
          type: 'issueResolved' as ActivityType,
          description: 'Water supply issue resolved in Brackenridge',
          userId: 'user2',
          relatedId: 'issue3',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
        },
      ];
      return limit ? mockLogs.slice(0, limit) : mockLogs;
    }    try {
      const entities = this.tableClient!.listEntities({
        queryOptions: { filter: "PartitionKey eq 'activity'" }
      });
        const logs: ActivityLog[] = [];
      for await (const entity of entities) {
        logs.push(this.entityToActivityLog(entity as TableEntity));
      }
      
      const sortedLogs = logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return limit ? sortedLogs.slice(0, limit) : sortedLogs;
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      throw error;
    }
  }

  async createActivityLog(log: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<ActivityLog> {
    const id = Date.now().toString();
    const activityLog: ActivityLog = {
      ...log,
      id,
      createdAt: new Date(),
    };

    if (!this.isConfigured) {
      console.log('Mock activity log created:', activityLog);
      return activityLog;
    }

    try {
      const entity = this.activityLogToEntity(activityLog);
      await this.tableClient!.createEntity(entity);
      return activityLog;
    } catch (error) {
      console.error('Error creating activity log:', error);
      throw error;
    }
  }

  private entityToActivityLog(entity: TableEntity): ActivityLog {
    return {
      id: entity.id as string,
      type: entity.type as any,
      description: entity.description as string,
      userId: entity.userId as string,
      relatedId: entity.relatedId as string,
      beforeData: entity.beforeData ? JSON.parse(entity.beforeData as string) : undefined,
      afterData: entity.afterData ? JSON.parse(entity.afterData as string) : undefined,
      createdAt: new Date(entity.createdAt as string),
    };
  }

  private activityLogToEntity(log: ActivityLog): TableEntity {
    return {
      partitionKey: 'activity',
      rowKey: log.id,
      id: log.id,
      type: log.type,
      description: log.description,
      userId: log.userId,
      relatedId: log.relatedId || '',
      beforeData: log.beforeData ? JSON.stringify(log.beforeData) : '',
      afterData: log.afterData ? JSON.stringify(log.afterData) : '',
      createdAt: log.createdAt.toISOString(),
    };
  }
}

export const dataAccess = new AzureDataAccess();

// Export convenience functions
export const getUsers = () => dataAccess.getUsers();
export const getUserById = (id: string) => dataAccess.getUserById(id);
export const createUser = (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => dataAccess.createUser(user);

export const getIssues = () => dataAccess.getIssues();
export const getIssueById = (id: string) => dataAccess.getIssueById(id);
export const createIssue = (issue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>) => dataAccess.createIssue(issue);
export const updateIssue = (id: string, updates: Partial<Issue>) => dataAccess.updateIssue(id, updates);

export const getWorkGroups = () => dataAccess.getWorkGroups();
export const createWorkGroup = (workGroup: Omit<WorkGroup, 'id' | 'createdAt' | 'updatedAt'>) => dataAccess.createWorkGroup(workGroup);

export const getTasksByWorkGroup = (workGroupId: string) => dataAccess.getTasksByWorkGroup(workGroupId);
export const createTask = (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => dataAccess.createTask(task);

export const getActivityLogs = (limit?: number) => dataAccess.getActivityLogs(limit);
export const createActivityLog = (log: Omit<ActivityLog, 'id' | 'createdAt'>) => dataAccess.createActivityLog(log);

export const uploadPhoto = (file: Buffer, fileName: string, issueId: string) => dataAccess.uploadPhoto(file, fileName, issueId);
