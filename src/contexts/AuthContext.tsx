'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  UserCredential, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp, 
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export type UserRole = 'employee' | 'employer' | 'bank' | 'system_admin' | 'user';

interface UserData {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  approved: boolean;
  orgId?: string;
  domain?: string;
  organizationName?: string;
  createdAt: any;
  lastLogin: any;
}

type AuthContextType = {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string, displayName: string) => Promise<UserCredential>;
  signOut: () => Promise<void>;
  syncUserData: (user: User) => Promise<UserData | null>;
  checkApprovalStatus: (userId: string) => Promise<{ approved: boolean, message: string }>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to check user approval status
  const checkApprovalStatus = async (userId: string) => {
    // Check in users collection
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data() as UserData;
      if (!userData.approved) {
        let message = 'Your account is awaiting approval.';
        if (userData.role === 'employer') {
          message = 'Your employer account is awaiting approval from the bank.';
        } else if (userData.role === 'employee') {
          message = 'Your employee account is awaiting approval from your employer.';
        }
        return { approved: false, message };
      }
      return { approved: true, message: 'Account is approved.' };
    }
    
    // Check in pending_employers
    const employerRef = doc(db, 'pending_employers', userId);
    const employerSnap = await getDoc(employerRef);
    
    if (employerSnap.exists()) {
      const empData = employerSnap.data();
      if (!empData.approved) {
        return { approved: false, message: 'Your employer account is awaiting approval from the bank.' };
      }
      return { approved: true, message: 'Account is approved.' };
    }
    
    // Check in pending_employees
    const employeeRef = doc(db, 'pending_employees', userId);
    const employeeSnap = await getDoc(employeeRef);
    
    if (employeeSnap.exists()) {
      const empData = employeeSnap.data();
      if (!empData.approved) {
        return { approved: false, message: 'Your employee account is awaiting approval from your employer.' };
      }
      return { approved: true, message: 'Account is approved.' };
    }
    
    return { approved: true, message: 'Account status unknown.' };
  };

  // Function to sync user data with Firestore
  const syncUserData = async (user: User): Promise<UserData | null> => {
    if (!user) return null;
    
    try {
      // Reference to the user document in Firestore
      const userRef = doc(db, 'users', user.uid);
      
      // Check if user document exists
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // User document doesn't exist, we need to create it
        // First, check if this user is in pending_employers or pending_employees to get role
        
        // Check pending employers
        const pendingEmployerRef = doc(db, 'pending_employers', user.uid);
        const pendingEmployerDoc = await getDoc(pendingEmployerRef);
        
        if (pendingEmployerDoc.exists()) {
          // This is an employer - use data from pending_employers
          const employerData = pendingEmployerDoc.data();
          const userData: UserData = {
            uid: user.uid,
            name: user.displayName || employerData.fullName || '',
            email: user.email || employerData.email || '',
            role: 'employer',
            approved: employerData.approved || false,
            organizationName: employerData.organizationName || '',
            domain: employerData.organizationDomain || '',
            createdAt: employerData.createdAt || serverTimestamp(),
            lastLogin: serverTimestamp(),
          };
          
          await setDoc(userRef, userData);
          setUserData(userData);
          return userData;
        }
        
        // Check pending employees
        const pendingEmployeeRef = doc(db, 'pending_employees', user.uid);
        const pendingEmployeeDoc = await getDoc(pendingEmployeeRef);
        
        if (pendingEmployeeDoc.exists()) {
          // This is an employee - use data from pending_employees
          const employeeData = pendingEmployeeDoc.data();
          const userData: UserData = {
            uid: user.uid,
            name: user.displayName || employeeData.fullName || '',
            email: user.email || employeeData.email || '',
            role: 'employee',
            approved: employeeData.approved || false,
            orgId: employeeData.orgId || null,
            domain: employeeData.domain || null,
            organizationName: employeeData.organizationName || '',
            createdAt: employeeData.createdAt || serverTimestamp(),
            lastLogin: serverTimestamp(),
          };
          
          await setDoc(userRef, userData);
          setUserData(userData);
          return userData;
        }
        
        // Check for special roles (bank and system_admin)
        // This would typically be pre-configured or set up by a system admin
        const specialRolesQuery = query(
          collection(db, 'special_users'),
          where('email', '==', user.email)
        );
        
        const specialRolesSnapshot = await getDocs(specialRolesQuery);
        
        if (!specialRolesSnapshot.empty) {
          const specialUserData = specialRolesSnapshot.docs[0].data();
          const userData: UserData = {
            uid: user.uid,
            name: user.displayName || specialUserData.name || '',
            email: user.email || '',
            role: specialUserData.role || 'user',
            approved: true, // Special users are auto-approved
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          };
          
          await setDoc(userRef, userData);
          setUserData(userData);
          return userData;
        }
        
        // If not found in any collections, create a basic user entry
        const userData: UserData = {
          uid: user.uid,
          name: user.displayName || '',
          email: user.email || '',
          role: 'user', // Default role
          approved: true, // Regular users are auto-approved
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        };
        
        await setDoc(userRef, userData);
        setUserData(userData);
        return userData;
      } else {
        // User document exists, just update the lastLogin timestamp
        const existingUserData = userDoc.data() as UserData;
        await updateDoc(userRef, {
          lastLogin: serverTimestamp(),
        });
        
        setUserData(existingUserData);
        return existingUserData;
      }
    } catch (error) {
      console.error('Error syncing user data:', error);
      return null;
    }
  };

  // Firebase Auth state change listener
  useEffect(() => {
    console.log("AuthContext - Setting up auth state listener");
    let isMounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("AuthContext - Auth state changed, user:", currentUser?.email);
      
      try {
        if (currentUser && isMounted) {
          setUser(currentUser);
          console.log("AuthContext - Syncing user data for:", currentUser.uid);
          const userData = await syncUserData(currentUser);
          console.log("AuthContext - User data synced:", userData?.role);
        } else if (isMounted) {
          console.log("AuthContext - No user or component unmounted");
          setUser(null);
          setUserData(null);
        }
      } catch (error) {
        console.error("AuthContext - Error in auth state change handler:", error);
      } finally {
        if (isMounted) {
          console.log("AuthContext - Setting loading to false");
          setLoading(false);
        }
      }
    }, (error) => {
      console.error("AuthContext - Auth state change error:", error);
      if (isMounted) {
        setLoading(false);
      }
    });
    
    return () => {
      console.log("AuthContext - Cleanup auth state listener");
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      
      // Explicitly sync user data immediately after login
      if (credential.user) {
        await syncUserData(credential.user);
      }
      
      return credential;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, displayName: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Set displayName
    if (credential.user) {
      await updateProfile(credential.user, { displayName });
      // The syncUserData will be triggered by onAuthStateChanged
    }
    
    return credential;
  };

  // Sign out function
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // Clear user state and data after sign out
      setUser(null);
      setUserData(null);
      // The auth state listener will also handle this, but we set it immediately
      // for better user experience
    } catch (error) {
      console.error('Error during sign out:', error);
      throw error; // Re-throw to allow handling in the UI
    }
  };

  // Password reset function
  const sendPasswordResetEmail = async (email: string) => {
    try {
      await firebaseSendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  };

  const value = {
    user,
    userData,
    loading,
    signIn,
    signUp,
    signOut,
    syncUserData,
    checkApprovalStatus,
    sendPasswordResetEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider; 