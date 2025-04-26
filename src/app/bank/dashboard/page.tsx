'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import AdminNavbar from '@/components/admin/AdminNavbar';

export default function BankDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }

      // TODO: Replace with actual admin check
      // For demo purposes, we'll assume the user is an admin
      setIsAdmin(true);
      fetchPendingCount();
    });

    return () => unsubscribe();
  }, [router]);

  const fetchPendingCount = async () => {
    try {
      const q = query(
        collection(db, 'pending_employers'),
        where('approved', '==', false)
      );
      
      const snapshot = await getCountFromServer(q);
      setPendingCount(snapshot.data().count);
    } catch (error) {
      console.error('Error fetching pending count:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar />
        <div className="p-8">
          <div className="max-w-5xl mx-auto bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-green-700 mb-6">Loading...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-8">
          <div className="max-w-5xl mx-auto bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-red-700 mb-6">Access Denied</h1>
            <p className="text-gray-700">
              You do not have permission to access this page. This area is restricted to Carbon Bank administrators.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <div className="p-4 sm:p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-medium text-gray-700 mb-2">Pending Approvals</h2>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-green-600">{pendingCount}</p>
                <Link 
                  href="/bank/approvals"
                  className="text-green-600 hover:text-green-800 font-medium"
                >
                  View All →
                </Link>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-medium text-gray-700 mb-2">Organizations</h2>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-blue-600">--</p>
                <Link 
                  href="/bank/organizations"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  View All →
                </Link>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-medium text-gray-700 mb-2">Carbon Credits</h2>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-purple-600">--</p>
                <Link 
                  href="/bank/credits"
                  className="text-purple-600 hover:text-purple-800 font-medium"
                >
                  View All →
                </Link>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link 
                href="/bank/approvals"
                className="block p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-200 transition-colors duration-200"
              >
                <h3 className="text-lg font-medium text-green-700">Review Employer Approvals</h3>
                <p className="text-gray-600 mt-1">
                  {pendingCount === 0 
                    ? 'No pending approvals at this time' 
                    : `Review ${pendingCount} pending employer registration${pendingCount !== 1 ? 's' : ''}`}
                </p>
              </Link>
              
              <Link 
                href="/bank/organizations"
                className="block p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors duration-200"
              >
                <h3 className="text-lg font-medium text-blue-700">Manage Organizations</h3>
                <p className="text-gray-600 mt-1">
                  View and manage registered organizations
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 