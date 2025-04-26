'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function AdminNavbar() {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path;
  };
  
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  return (
    <nav className="bg-green-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold">Carbon Bank Admin</span>
            </div>
            <div className="ml-10 flex items-baseline space-x-4">
              <Link 
                href="/bank/dashboard" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/bank/dashboard') 
                    ? 'bg-green-900 text-white' 
                    : 'text-gray-200 hover:bg-green-700'
                }`}
              >
                Dashboard
              </Link>
              <Link 
                href="/bank/approvals" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/bank/approvals') 
                    ? 'bg-green-900 text-white' 
                    : 'text-gray-200 hover:bg-green-700'
                }`}
              >
                Approvals
              </Link>
              <Link 
                href="/bank/organizations" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/bank/organizations') 
                    ? 'bg-green-900 text-white' 
                    : 'text-gray-200 hover:bg-green-700'
                }`}
              >
                Organizations
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleSignOut}
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-200 hover:bg-green-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 