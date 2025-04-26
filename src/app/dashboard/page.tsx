'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  styles, 
  EmployeeDashboard, 
  EmployerDashboard, 
  BankDashboard, 
  AdminDashboard, 
  Toast 
} from '@/components/dashboard';

export default function DashboardPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as 'success' | 'error' | 'info' });
  
  const router = useRouter();
  const { user, userData, loading: authLoading, checkApprovalStatus } = useAuth();

  useEffect(() => {
    // Check if user is authenticated and approved
    const checkUserApproval = async () => {
      try {
        setLoading(true);
        if (authLoading) return;
        
        if (!user) {
          router.push('/login');
          return;
        }
        
        const approvalStatus = await checkApprovalStatus(user.uid);
        
        if (!approvalStatus.approved) {
          router.push('/pending-approval');
          return;
        }
      } catch (error) {
        console.error("Error checking user approval:", error);
        showToast("Failed to verify account status. Please try again.", "error");
      } finally {
        setLoading(false);
      }
    };
    
    checkUserApproval();
  }, [user, authLoading, router, checkApprovalStatus]);

  // Set up a timeout to recover from potential stalled loading states
  useEffect(() => {
    if (loading) {
      console.log("Dashboard - Setting loading recovery timeout");
      // If still loading after 10 seconds, reset loading state
      const timeout = setTimeout(() => {
        console.log("Dashboard - Loading timeout reached, forcing loading to false");
        setLoading(false);
        showToast("Loading took longer than expected. Please refresh if you encounter issues.", "info");
      }, 10000);
      
      setLoadingTimeout(timeout);
      
      return () => {
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
        }
      };
    }
  }, [loading]);

  // Toast notification handlers
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, visible: false });
  };

  // Role-specific dashboard content
  const renderDashboardContent = () => {
    if (!userData) return null;
    
    switch (userData.role) {
      case 'bank':
        return <BankDashboard />;
        
      case 'employer':
        return <EmployerDashboard />;
        
      case 'employee':
        return <EmployeeDashboard />;
        
      case 'system_admin':
        return <AdminDashboard />;
        
      default:
        return (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Welcome to Carbon Credits</h2>
            </div>
            <div style={styles.cardBody}>
              <p>Please contact your administrator for access to the dashboard features.</p>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.contentArea}>
          <div style={styles.maxWidthWrapper}>
            <div style={styles.loader}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-spin">
                <circle cx="12" cy="12" r="10" stroke="#E2E8F0" strokeWidth="4" />
                <path d="M12 2C6.47715 2 2 6.47715 2 12" stroke="#22C55E" strokeWidth="4" />
              </svg>
              <p style={styles.loaderText}>Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {renderDashboardContent()}
      <Toast toast={toast} onClose={hideToast} />
    </div>
  );
} 