'use client';

import React from 'react';
import AuthLayout from './AuthLayout';

const styles = {
  mainContent: {
    flex: 1,
    padding: '2rem',
    overflowY: 'auto',
    minHeight: '100vh',
    backgroundColor: '#f0fdf4' // green-50
  }
};

export default function ClientLayout({ children }) {
  // First wrap with AuthLayout which will only apply its styling to non-dashboard pages
  return (
    <AuthLayout>
      <main style={styles.mainContent}>
        {children}
      </main>
    </AuthLayout>
  );
} 