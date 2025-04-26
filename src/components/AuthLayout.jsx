'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

const styles = {
  authLayout: {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(135deg, #1a2e35 0%, #234c5c 50%, #0c5b54 100%)'
  },
  authContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem'
  }
};

export default function AuthLayout({ children }) {
  const pathname = usePathname();
  
  // Only apply the auth layout to pages that are not in the dashboard or require authentication
  const isAuthPage = !pathname?.startsWith('/dashboard');
  
  if (!isAuthPage) {
    return children;
  }
  
  return (
    <div style={styles.authLayout}>
      <div style={styles.authContainer}>
        {children}
      </div>
    </div>
  );
} 