'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  deleteDoc, 
  setDoc 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import Toast from '@/components/ui/Toast';
import AdminNavbar from '@/components/admin/AdminNavbar';

type ToastType = 'success' | 'error' | 'info';

interface PendingEmployer {
  id: string;
  fullName: string;
  email: string;
  organizationName: string;
  organizationAddress: string;
  organizationDomain: string;
  role: string;
  approved: boolean;
  createdAt: string;
}

export default function BankApprovalsPage() {
  const [pendingEmployers, setPendingEmployers] = useState<PendingEmployer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: ToastType;
  }>({ visible: false, message: '', type: 'error' });
  const router = useRouter();

  const showToast = (message: string, type: ToastType) => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, visible: false });
  };

  // Check if user is admin
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }

      // TODO: Replace with actual admin check
      // For demo purposes, we'll assume the user is an admin
      // In a real application, you would check against a list of admin UIDs
      // or have a 'role' field in the user's document
      setIsAdmin(true);
      fetchPendingEmployers();
    });

    return () => unsubscribe();
  }, [router]);

  const fetchPendingEmployers = async () => {
    try {
      const q = query(
        collection(db, 'pending_employers'),
        where('approved', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      const employers: PendingEmployer[] = [];
      
      querySnapshot.forEach((doc) => {
        employers.push({
          id: doc.id,
          ...doc.data() as Omit<PendingEmployer, 'id'>
        });
      });
      
      setPendingEmployers(employers);
    } catch (error) {
      console.error('Error fetching pending employers:', error);
      showToast('Failed to load pending employers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (employer: PendingEmployer) => {
    try {
      // 1. Add to users collection with role = "employer"
      await setDoc(doc(db, 'users', employer.id), {
        fullName: employer.fullName,
        email: employer.email,
        role: 'employer',
        createdAt: employer.createdAt,
        updatedAt: new Date().toISOString()
      });
      
      // 2. Add to organizations collection with availableMoney field
      const orgId = `org_${Date.now()}`;
      await setDoc(doc(db, 'organizations', orgId), {
        name: employer.organizationName,
        domain: employer.organizationDomain,
        address: employer.organizationAddress,
        totalCredits: 0, 
        availableMoney: 1000, // Initialize with $1000 available money for buying credits
        createdAt: new Date().toISOString(),
        employerId: employer.id
      });
      
      // 3. Delete from pending_employers
      await deleteDoc(doc(db, 'pending_employers', employer.id));
      
      // 4. Update local state
      setPendingEmployers(pendingEmployers.filter(e => e.id !== employer.id));
      
      showToast(`${employer.organizationName} has been approved`, 'success');
    } catch (error) {
      console.error('Error approving employer:', error);
      showToast('Failed to approve employer', 'error');
    }
  };

  const handleReject = async (employer: PendingEmployer) => {
    try {
      // Delete from pending_employers
      await deleteDoc(doc(db, 'pending_employers', employer.id));
      
      // Update local state
      setPendingEmployers(pendingEmployers.filter(e => e.id !== employer.id));
      
      showToast(`${employer.organizationName} has been rejected`, 'info');
    } catch (error) {
      console.error('Error rejecting employer:', error);
      showToast('Failed to reject employer', 'error');
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
        <div className="max-w-5xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md">
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-green-700">Pending Employer Approvals</h1>
            <p className="text-gray-600 mt-1">
              Review and approve employer registration requests
            </p>
          </header>
          
          {pendingEmployers.length === 0 ? (
            <div className="bg-green-50 p-6 rounded-lg text-center">
              <p className="text-green-600 font-medium">No pending approvals at this time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingEmployers.map((employer) => (
                <div 
                  key={employer.id} 
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="sm:flex sm:justify-between sm:items-start">
                    <div className="mb-4 sm:mb-0">
                      <h2 className="text-xl font-bold text-gray-800">{employer.organizationName}</h2>
                      <div className="mt-2 space-y-1">
                        <p className="text-gray-600">
                          <span className="font-medium">Domain:</span> {employer.organizationDomain}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Contact:</span> {employer.fullName}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Email:</span> {employer.email}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Submitted:</span> {new Date(employer.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex sm:flex-col gap-4">
                      <button
                        onClick={() => handleApprove(employer)}
                        className="flex-1 sm:w-32 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(employer)}
                        className="flex-1 sm:w-32 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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