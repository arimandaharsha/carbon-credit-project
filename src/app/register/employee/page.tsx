'use client';

import React, { useState } from 'react';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import Toast from '@/components/ui/Toast';
import Logo from '@/components/ui/Logo';

type ToastType = 'success' | 'error' | 'info';

interface OrganizationResult {
  exists: boolean;
  orgId?: string;
  name?: string;
  domain?: string;
  [key: string]: any;
}

// Color palette
const colors = {
  white: '#FFFFFF',
  black: '#000000',
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  }
};

// Shared styles
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem',
    backgroundColor: colors.green[50],
    fontFamily: 'sans-serif',
  },
  formContainer: {
    backgroundColor: colors.white,
    padding: '2rem',
    borderRadius: '0.75rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
    width: '100%',
    maxWidth: '28rem',
    border: `1px solid ${colors.gray[200]}`,
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    textAlign: 'center' as const,
    marginBottom: '1.5rem',
    color: colors.green[700],
  },
  formGroup: {
    marginBottom: '1.25rem',
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: colors.gray[700],
    marginBottom: '0.25rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colors.green[300],
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    backgroundColor: colors.white,
    color: colors.gray[900],
    outline: 'none',
    transition: 'all 0.2s',
  },
  inputFocus: {
    borderColor: colors.green[500],
    boxShadow: `0 0 0 3px ${colors.green[100]}`,
  },
  inputHint: {
    marginTop: '0.25rem',
    fontSize: '0.75rem',
    color: colors.gray[500],
  },
  button: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '0.375rem',
    fontWeight: 600,
    color: colors.white,
    backgroundColor: colors.green[700],
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: '1rem',
  },
  buttonHover: {
    backgroundColor: colors.green[800],
  },
  buttonLoading: {
    backgroundColor: colors.green[500],
    cursor: 'not-allowed',
  },
  loginPrompt: {
    marginTop: '1.5rem',
    textAlign: 'center' as const,
    fontSize: '0.875rem',
    color: colors.gray[600],
  },
  link: {
    color: colors.green[600],
    textDecoration: 'none',
    fontWeight: 500,
    transition: 'color 0.2s',
  },
  linkHover: {
    color: colors.green[800],
  },
  successContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green[50],
    fontFamily: 'sans-serif',
  },
  successCard: {
    backgroundColor: colors.white,
    padding: '2rem',
    borderRadius: '0.75rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
    width: '100%',
    maxWidth: '28rem',
    textAlign: 'center' as const,
    border: `1px solid ${colors.gray[200]}`,
  },
  successIconWrapper: {
    width: '4rem',
    height: '4rem',
    backgroundColor: colors.green[100],
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1rem',
  },
  successIcon: {
    height: '2rem',
    width: '2rem',
    color: colors.green[600],
  },
  successTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: colors.green[700],
    marginBottom: '1rem',
  },
  successMessage: {
    color: colors.gray[600],
    marginBottom: '1.5rem',
    lineHeight: 1.5,
  },
  homeButton: {
    display: 'inline-block',
    backgroundColor: colors.green[600],
    color: colors.white,
    fontWeight: 500,
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    textDecoration: 'none',
    transition: 'background-color 0.3s',
  },
  homeButtonHover: {
    backgroundColor: colors.green[700],
  },
};

export default function EmployeeRegistrationPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);
  const [inputFocus, setInputFocus] = useState({
    fullName: false,
    email: false,
    password: false
  });
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: ToastType;
  }>({ visible: false, message: '', type: 'error' });
  const router = useRouter();
  const { signUp, signOut } = useAuth();

  const showToast = (message: string, type: ToastType) => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, visible: false });
  };

  const extractDomainFromEmail = (email: string): string => {
    return email.split('@')[1]?.toLowerCase() || '';
  };

  const validateForm = (): boolean => {
    if (!fullName || !email || !password) {
      showToast('All fields are required', 'error');
      return false;
    }
    
    if (password.length < 6) {
      showToast('Password should be at least 6 characters', 'error');
      return false;
    }

    // Check if the email has a valid format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('Please enter a valid email address', 'error');
      return false;
    }

    return true;
  };

  const checkOrganizationDomain = async (domain: string): Promise<OrganizationResult> => {
    try {
      // Check in approved organizations
      const orgsQuery = query(
        collection(db, 'organizations'),
        where('domain', '==', domain),
        where('approved', '==', true)
      );
      
      const querySnapshot = await getDocs(orgsQuery);
      
      if (querySnapshot.empty) {
        // Also check in pending_employers for organizations that might be pending approval
        const pendingOrgsQuery = query(
          collection(db, 'pending_employers'),
          where('organizationDomain', '==', domain)
        );
        
        const pendingSnapshot = await getDocs(pendingOrgsQuery);
        
        if (pendingSnapshot.empty) {
          return { exists: false };
        }
        
        // Organization exists but is pending
        return { 
          exists: false, 
          pending: true,
          message: 'Your organization has registered but is awaiting approval'
        };
      }
      
      // Return the first organization that matches the domain
      const orgDoc = querySnapshot.docs[0];
      return { 
        exists: true, 
        orgId: orgDoc.id,
        ...orgDoc.data()
      };
    } catch (error) {
      console.error('Error checking organization domain:', error);
      throw error;
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const domain = extractDomainFromEmail(email);
    
    try {
      setLoading(true);
      
      // Check if domain exists in organizations
      const orgResult = await checkOrganizationDomain(domain);
      
      if (!orgResult.exists) {
        if (orgResult.pending) {
          showToast(orgResult.message || 'Your organization is awaiting approval. Please try again after approval.', 'info');
        } else {
          showToast('Your organization is not registered in our system. Please ask your employer to register first.', 'error');
        }
        setLoading(false);
        return;
      }
      
      // Create user in Firebase Auth
      const userCredential = await signUp(email, password, fullName);
      
      // Create a record in Firestore for pending approval
      const userUid = userCredential.user.uid;
      await setDoc(doc(db, 'pending_employees', userUid), {
        fullName,
        email,
        domain,
        orgId: orgResult.orgId,
        organizationName: orgResult.name || '',
        role: 'employee',
        approved: false,
        createdAt: new Date().toISOString(),
      });
      
      // Show success message
      showToast('Registration submitted successfully!', 'success');
      setRegistrationSubmitted(true);
      
      // Sign out the user until approved
      await signOut();
      
    } catch (error: any) {
      let errorMessage = 'An error occurred during registration';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection';
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = (field: string) => {
    setInputFocus(prev => ({
      ...prev,
      [field]: true
    }));
  };

  const handleBlur = (field: string) => {
    setInputFocus(prev => ({
      ...prev,
      [field]: false
    }));
  };

  if (registrationSubmitted) {
    return (
      <div style={styles.successContainer}>
        <div style={styles.successCard}>
          <Logo width="10rem" height="5rem" style={{ margin: '0 auto 1rem' }} />
          <div style={styles.successIconWrapper}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              style={styles.successIcon}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
          <h1 style={styles.successTitle}>Registration Submitted</h1>
          <p style={styles.successMessage}>
            Thank you for registering. Your registration is now awaiting approval from your employer.
            You will be notified via email once your account is approved.
          </p>
          <Link 
            href="/"
            style={styles.homeButton}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.homeButtonHover.backgroundColor}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.homeButton.backgroundColor}
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.formContainer}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
          <Logo width="10rem" height="5rem" />
          <h1 style={styles.title}>Join Your Organization</h1>
        </div>
        
        <form onSubmit={handleRegistration}>
          <div style={styles.formGroup}>
            <label htmlFor="fullName" style={styles.label}>
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{
                ...styles.input,
                ...(inputFocus.fullName ? styles.inputFocus : {})
              }}
              placeholder="John Doe"
              onFocus={() => handleFocus('fullName')}
              onBlur={() => handleBlur('fullName')}
              required
            />
          </div>
          
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>
              Work Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                ...styles.input,
                ...(inputFocus.email ? styles.inputFocus : {})
              }}
              placeholder="you@company.com"
              onFocus={() => handleFocus('email')}
              onBlur={() => handleBlur('email')}
              required
            />
            <p style={styles.inputHint}>
              Must match your organization's registered domain
            </p>
          </div>
          
          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                ...styles.input,
                ...(inputFocus.password ? styles.inputFocus : {})
              }}
              placeholder="••••••••"
              onFocus={() => handleFocus('password')}
              onBlur={() => handleBlur('password')}
              required
            />
            <p style={styles.inputHint}>Password must be at least 6 characters</p>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            style={loading ? { ...styles.button, ...styles.buttonLoading } : styles.button}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor)}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = styles.button.backgroundColor)}
          >
            {loading ? 'Processing...' : 'Register as Employee'}
          </button>
        </form>
        
        <div style={styles.loginPrompt}>
          <p>
            Already have an account?{' '}
            <Link 
              href="/login" 
              style={styles.link}
              onMouseEnter={(e) => e.currentTarget.style.color = styles.linkHover.color}
              onMouseLeave={(e) => e.currentTarget.style.color = styles.link.color}
            >
              Login
            </Link>
          </p>
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