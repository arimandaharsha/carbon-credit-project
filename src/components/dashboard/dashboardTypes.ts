import { Timestamp, FieldValue } from 'firebase/firestore';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  visible: boolean;
  message: string;
  type: ToastType;
}

export interface PendingEmployer {
  id: string;
  fullName: string;
  email: string;
  organizationName: string;
  organizationDomain: string;
  createdAt: string;
}

export interface PendingEmployee {
  id: string;
  fullName: string;
  email: string;
  domain: string;
  createdAt: string;
}

export interface TripData {
  id: string;
  userId: string;
  startLocation: {
    latitude: number;
    longitude: number;
  };
  endLocation: {
    latitude: number;
    longitude: number;
  };
  startAddress?: string;
  endAddress?: string;
  startTime: Date;
  endTime: Date;
  tripDate: Date;
  distanceKm: number;
  avgSpeedKmh: number;
  transportMode: 'walking' | 'cycling' | 'publicTransport' | 'rideShare' | 'ownVehicle' | 'unknown';
  carbonCredits: number;
  isWorkFromHome: boolean;
  rejected?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  domain: string;
  address?: string;
  totalCredits: number;
  carbonCredits: number;
  availableMoney: number;
  createdAt: string;
  approved?: boolean;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  domain: string;
  carbonCredits: number;
  calculatedCredits?: number;
  role?: UserRole;
  approved?: boolean;
  status?: 'active' | 'inactive';
  active?: boolean;
}

export interface CreditTransaction {
  id: string;
  sellerOrgId: string;
  sellerOrgName: string;
  buyerOrgId: string;
  buyerOrgName: string;
  creditAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'pending_purchase';
  price: number;
  createdAt: Date | string | FieldValue;
  updatedAt?: Date | string | FieldValue;
  completedAt?: Date | null;
}

export type UserRole = 'employee' | 'employer' | 'bank' | 'admin' | 'user' | 'system_admin';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  approved?: boolean;
  domain?: string;
}

export interface UserData {
  uid: string;
  name: string; 
  email: string;
  role: UserRole;
  domain?: string;
  organizationId?: string;
  approved: boolean;
  createdAt: string;
  lastLogin: string;
  carbonCredits?: number;
} 