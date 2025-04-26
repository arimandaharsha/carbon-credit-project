'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { styles, colors } from './dashboardStyles';
import { UserData } from './dashboardTypes';
import { useAuth } from '@/contexts/AuthContext';
import { getAvatarInitials } from './dashboardUtils';

interface HeaderProps {
  userData: UserData | null;
  isSearchFocused?: boolean;
  setIsSearchFocused?: React.Dispatch<React.SetStateAction<boolean>>;
  searchQuery?: string;
  setSearchQuery?: React.Dispatch<React.SetStateAction<string>>;
  showSearch?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  userData, 
  isSearchFocused = false, 
  setIsSearchFocused,
  searchQuery = '',
  setSearchQuery,
  showSearch = false
}) => {
  const { signOut } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      // Redirect to home page after successful sign out
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      setIsSigningOut(false);
    }
  };

  return (
    <header style={styles.header}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h1 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 600, 
          color: colors.green[800],
          margin: 0
        }}>
          Carbon Credits
        </h1>
      </div>

      {showSearch && setIsSearchFocused && setSearchQuery && (
        <div style={{ 
          ...styles.search, 
          ...(isSearchFocused ? styles.searchFocused : {})
        }}>
          <div style={styles.searchIcon}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              fill="currentColor" 
              viewBox="0 0 16 16"
            >
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search..."
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
        </div>
      )}

      <div style={styles.userProfile}>
        <div 
          style={styles.avatar}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          {getAvatarInitials(userData?.name || '')}
        </div>
        
        <div style={{ position: 'relative' as const }}>
          <div 
            style={styles.userInfo}
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <span style={styles.userName}>{userData?.name || 'User'}</span>
            <span style={styles.userRole}>{userData?.role || 'User'}</span>
          </div>
          
          {showDropdown && (
            <div style={{
              position: 'absolute' as const,
              top: '100%',
              right: 0,
              marginTop: '0.5rem',
              backgroundColor: colors.white,
              border: `1px solid ${colors.gray[200]}`,
              borderRadius: '0.375rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              width: '10rem',
              zIndex: 20,
            }}>
              <div style={{
                padding: '0.5rem',
                borderBottom: `1px solid ${colors.gray[200]}`,
              }}>
                <p style={{ margin: '0', fontWeight: 600, fontSize: '0.875rem' }}>{userData?.name}</p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: colors.gray[500] }}>{userData?.email}</p>
              </div>
              <div style={{ padding: '0.5rem' }}>
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left' as const,
                    padding: '0.5rem',
                    fontSize: '0.875rem',
                    color: colors.gray[700],
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: isSigningOut ? 'default' : 'pointer',
                    opacity: isSigningOut ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => !isSigningOut && (e.currentTarget.style.backgroundColor = colors.gray[100])}
                  onMouseLeave={(e) => !isSigningOut && (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {isSigningOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 