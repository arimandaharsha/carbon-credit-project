'use client';

import React, { useState } from 'react';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/contexts/AuthContext';
import Toast from '@/components/ui/Toast';

type ToastType = 'success' | 'error' | 'info';

export default function InitializeSpecialUsers() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: ToastType;
  }>({ visible: false, message: '', type: 'error' });
  const { userData } = useAuth();

  const showToast = (message: string, type: ToastType) => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, visible: false });
  };

  const createSpecialUser = async (
    email: string, 
    password: string, 
    displayName: string, 
    role: UserRole
  ) => {
    try {
      // Check if user already exists
      const existingQuery = query(
        collection(db, 'special_users'),
        where('email', '==', email)
      );
      
      const existingDocs = await getDocs(existingQuery);
      if (!existingDocs.empty) {
        showToast(`User with email ${email} already exists as a special user`, 'info');
        return;
      }
      
      // Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Set the display name
      await updateProfile(userCredential.user, { displayName });
      
      // Create an entry in the special_users collection
      await setDoc(doc(db, 'special_users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email,
        name: displayName,
        role,
        createdAt: new Date().toISOString(),
      });
      
      // Also create an entry in the users collection
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: displayName,
        email,
        role,
        approved: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      });
      
      showToast(`Successfully created ${role} user: ${email}`, 'success');
    } catch (error: any) {
      console.error(`Error creating ${role} user:`, error);
      showToast(error.message || `Failed to create ${role} user`, 'error');
    }
  };

  const initializeSpecialUsers = async () => {
    setIsProcessing(true);
    
    try {
      // Create bank user
      await createSpecialUser(
        'bank@carbonbank.com',
        'BankPass123',
        'Carbon Bank Admin',
        'bank'
      );
      
      // Create system admin user
      await createSpecialUser(
        'admin@carboncredit.com',
        'AdminPass123',
        'System Administrator',
        'system_admin'
      );
      
      showToast('Initialization complete', 'success');
    } catch (error: any) {
      console.error('Error during initialization:', error);
      showToast(error.message || 'Failed to initialize special users', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Only system_admin can access this page
  if (userData && userData.role !== 'system_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-center text-red-600 mb-4">Access Denied</h1>
          <p className="text-center text-gray-700">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Initialize Special Users</h1>
        
        <div className="mb-8">
          <p className="text-gray-700 mb-4">
            This page will create the following special users:
          </p>
          
          <ul className="list-disc pl-5 space-y-2 mb-6">
            <li className="text-gray-700">
              <strong>Bank Admin:</strong> bank@carbonbank.com (role: bank)
            </li>
            <li className="text-gray-700">
              <strong>System Admin:</strong> admin@carboncredit.com (role: system_admin)
            </li>
          </ul>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  This action will create real accounts in your Firebase project. Use with caution.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <button
          onClick={initializeSpecialUsers}
          disabled={isProcessing}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            isProcessing ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          } transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {isProcessing ? 'Processing...' : 'Initialize Special Users'}
        </button>
      </div>
      
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={hideToast}
      />
    </div>
  );
} 