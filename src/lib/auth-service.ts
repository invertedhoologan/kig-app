import jwt from 'jsonwebtoken';
import { User, UserRole } from '@/types';
import { azureConfig } from './azure-config';
import { dataAccess } from './azure-data-access';

export interface AuthToken {
  userId: string;
  email: string;
  role: UserRole;
  exp: number;
}

class AuthService {
  private jwtSecret: string;

  constructor() {
    this.jwtSecret = azureConfig.jwt.secret;
  }

  // Generate JWT token
  generateToken(user: User): string {
    const payload: Omit<AuthToken, 'exp'> = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: '7d' });
  }

  // Verify JWT token
  verifyToken(token: string): AuthToken | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as AuthToken;
      return decoded;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }
  // Login with email and password
  async login(email: string, password: string): Promise<{ user: User; token: string } | null> {
    try {
      console.log('Login attempt:', { email });
      
      // In a real implementation, you would hash and compare passwords
      // For demo purposes, we'll use simple credential matching
      const users = await dataAccess.getUsers();
      console.log('Available users:', users.map(u => ({ id: u.id, email: u.email, role: u.role })));
      
      const user = users.find(u => u.email === email);
      console.log('Found user:', user ? { id: user.id, email: user.email, role: user.role } : null);

      if (!user) {
        console.log('User not found');
        return null;
      }

      // For demo: admin@kig.com / admin123, leader@kig.com / leader123
      const validPasswords: Record<string, string> = {
        'admin@kig.com': 'admin123',
        'leader@kig.com': 'leader123',
      };

      console.log('Password check:', { email, providedPassword: password, expectedPassword: validPasswords[email] });

      if (validPasswords[email] !== password) {
        console.log('Password mismatch');
        return null;
      }

      const token = this.generateToken(user);
      console.log('Login successful, token generated');
      return { user, token };
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }

  // Register new user
  async register(userData: {
    email: string;
    name: string;
    password: string;
    role?: UserRole;
    phone?: string;
  }): Promise<{ user: User; token: string } | null> {
    try {
      // Check if user already exists
      const users = await dataAccess.getUsers();
      const existingUser = users.find(u => u.email === userData.email);

      if (existingUser) {
        throw new Error('User already exists');
      }

      // Create new user
      const newUser = await dataAccess.createUser({
        email: userData.email,
        name: userData.name,
        role: userData.role || 'resident',
        phone: userData.phone,
      });

      const token = this.generateToken(newUser);
      return { user: newUser, token };
    } catch (error) {
      console.error('Registration error:', error);
      return null;
    }
  }

  // Get user from token
  async getUserFromToken(token: string): Promise<User | null> {
    const decoded = this.verifyToken(token);
    if (!decoded) return null;

    return await dataAccess.getUserById(decoded.userId);
  }

  // Check if user has permission
  hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
    const roleHierarchy: Record<UserRole, number> = {
      guest: 0,
      resident: 1,
      workGroupLeader: 2,
      admin: 3,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  // Check if user can manage issue
  canManageIssue(user: User, issue: any): boolean {
    if (user.role === 'admin') return true;
    if (user.role === 'workGroupLeader' && issue.assignedTo === user.id) return true;
    if (issue.reportedBy === user.id) return true;
    return false;
  }
}

export const authService = new AuthService();
