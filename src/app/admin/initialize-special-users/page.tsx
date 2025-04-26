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

  // For initial setup, we'll temporarily disable the role check
  // to allow the first creation of special users
  /*
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
  */

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-green-900">Initialize Special Users</h1>
          <p className="mt-2 text-sm text-gray-600">Set up admin and bank accounts for the Carbon Credit Project</p>
        </div>
        
        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-green-100">
          <div className="px-6 py-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-green-900 mb-2">Special Users</h2>
              <p className="text-sm text-gray-600 mb-4">
                This page will create the following special user accounts:
              </p>
              
              <ul className="space-y-3 mb-6">
                <li className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-green-800">Bank Admin</span>
                      <p className="text-xs text-gray-600">bank@carbonbank.com</p>
                    </div>
                  </div>
                </li>
                <li className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-green-800">System Admin</span>
                      <p className="text-xs text-gray-600">admin@carboncredit.com</p>
                    </div>
                  </div>
                </li>
              </ul>
              
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-amber-700">
                      This action will create real accounts in your Firebase project. Use with caution.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={initializeSpecialUsers}
              disabled={isProcessing}
              className={`w-full flex justify-center items-center py-3 px-4 rounded-lg text-white font-medium ${
                isProcessing ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'
              } transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : 'Initialize Special Users'}
            </button>
          </div>
        </div>
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