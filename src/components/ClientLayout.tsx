'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <div className="min-h-screen bg-green-50">
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
} 