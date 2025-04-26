'use client';

import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import Toast from '@/components/ui/Toast';

type ToastType = 'success' | 'error' | 'info';

// Define color palette
const colors = {
  white: '#ffffff',
  black: '#000000',
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    300: '#86efac',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  red: {
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  }
};

// Define styles
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem',
  },
  card: {
    backgroundColor: colors.white,
    padding: '2rem',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '32rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    textAlign: 'center' as const,
    marginBottom: '1.5rem',
    color: colors.green[700],
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.25rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: colors.gray[700],
    marginBottom: '0.25rem',
  },
  input: {
    width: '100%',
    padding: '0.625rem 0.75rem',
    border: `1px solid ${colors.green[300]}`,
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    outline: 'none',
  },
  inputFocus: {
    boxShadow: `0 0 0 2px ${colors.green[500]}`,
    border: `1px solid ${colors.green[500]}`,
  },
  textarea: {
    width: '100%',
    padding: '0.625rem 0.75rem',
    border: `1px solid ${colors.green[300]}`,
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    outline: 'none',
    resize: 'vertical' as const,
    minHeight: '5rem',
  },
  helperText: {
    fontSize: '0.75rem',
    color: colors.gray[500],
    marginTop: '0.25rem',
  },
  button: {
    width: '100%',
    padding: '0.75rem 1rem',
    backgroundColor: colors.green[700],
    color: colors.white,
    fontWeight: 600,
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonHover: {
    backgroundColor: colors.green[800],
  },
  buttonDisabled: {
    backgroundColor: colors.green[500],
    cursor: 'not-allowed',
  },
  footer: {
    marginTop: '1.5rem',
    textAlign: 'center' as const,
  },
  footerText: {
    fontSize: '0.875rem',
    color: colors.gray[600],
  },
  link: {
    color: colors.green[600],
    textDecoration: 'none',
  },
  linkHover: {
    color: colors.green[800],
    textDecoration: 'underline',
  },
  successCard: {
    backgroundColor: colors.white,
    padding: '2rem',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '28rem',
    textAlign: 'center' as const,
  },
  iconContainer: {
    width: '4rem',
    height: '4rem',
    backgroundColor: colors.green[100],
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1rem',
  },
  successTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: colors.green[700],
    marginBottom: '1rem',
  },
  successText: {
    color: colors.gray[600],
    marginBottom: '1.5rem',
  },
  homeButton: {
    display: 'inline-block',
    padding: '0.625rem 1rem',
    backgroundColor: colors.green[600],
    color: colors.white,
    fontWeight: 500,
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'background-color 0.2s',
  },
  homeButtonHover: {
    backgroundColor: colors.green[700],
  },
};

export default function EmployerRegistrationPage() {
  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [organizationAddress, setOrganizationAddress] = useState('');
  const [organizationDomain, setOrganizationDomain] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);
  const [inputFocus, setInputFocus] = useState<{ [key: string]: boolean }>({});
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
    if (!fullName || !organizationName || !organizationAddress || !organizationDomain || !email || !password) {
      showToast('All fields are required', 'error');
      return false;
    }
    
    if (password.length < 6) {
      showToast('Password should be at least 6 characters', 'error');
      return false;
    }

    const emailDomain = extractDomainFromEmail(email);
    if (!emailDomain) {
      showToast('Invalid email format', 'error');
      return false;
    }

    const domainInput = organizationDomain.toLowerCase().trim();
    // Remove http:// or https:// and www. from domain input if present
    const cleanDomainInput = domainInput
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '');

    if (emailDomain !== cleanDomainInput) {
      showToast('Your work email domain must match your organization domain', 'error');
      return false;
    }

    return true;
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Create user in Firebase Auth
      const userCredential = await signUp(email, password, fullName);
      
      // Create a record in Firestore
      const userUid = userCredential.user.uid;
      await setDoc(doc(db, 'pending_employers', userUid), {
        fullName,
        email,
        organizationName,
        organizationAddress,
        organizationDomain: organizationDomain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/^www\./, ''),
        role: 'employer',
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
    setInputFocus(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: string) => {
    setInputFocus(prev => ({ ...prev, [field]: false }));
  };

  if (registrationSubmitted) {
    return (
      <div style={styles.container}>
        <div style={styles.successCard}>
          <div style={styles.iconContainer}>
            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '2rem', height: '2rem', color: colors.green[600] }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 style={styles.successTitle}>Registration Submitted</h1>
          <p style={styles.successText}>
            Thank you for registering your organization. Your registration is now awaiting approval from Carbon Bank.
            You will be notified via email once your account is approved.
          </p>
          <Link 
            href="/"
            style={styles.homeButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = styles.homeButtonHover.backgroundColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = styles.homeButton.backgroundColor;
            }}
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Register Your Organization</h1>
        
        <form onSubmit={handleRegistration} style={styles.form}>
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
              required
              onFocus={() => handleFocus('fullName')}
              onBlur={() => handleBlur('fullName')}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label htmlFor="organizationName" style={styles.label}>
              Organization Name
            </label>
            <input
              id="organizationName"
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              style={{
                ...styles.input,
                ...(inputFocus.organizationName ? styles.inputFocus : {})
              }}
              placeholder="Acme Corporation"
              required
              onFocus={() => handleFocus('organizationName')}
              onBlur={() => handleBlur('organizationName')}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label htmlFor="organizationAddress" style={styles.label}>
              Organization Address
            </label>
            <textarea
              id="organizationAddress"
              value={organizationAddress}
              onChange={(e) => setOrganizationAddress(e.target.value)}
              style={{
                ...styles.textarea,
                ...(inputFocus.organizationAddress ? styles.inputFocus : {})
              }}
              placeholder="123 Main St, City, State, Zip"
              required
              onFocus={() => handleFocus('organizationAddress')}
              onBlur={() => handleBlur('organizationAddress')}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label htmlFor="organizationDomain" style={styles.label}>
              Organization Domain
            </label>
            <input
              id="organizationDomain"
              type="text"
              value={organizationDomain}
              onChange={(e) => setOrganizationDomain(e.target.value)}
              style={{
                ...styles.input,
                ...(inputFocus.organizationDomain ? styles.inputFocus : {})
              }}
              placeholder="example.com"
              required
              onFocus={() => handleFocus('organizationDomain')}
              onBlur={() => handleBlur('organizationDomain')}
            />
            <p style={styles.helperText}>Do not include 'http://' or 'www.'</p>
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
              placeholder="you@example.com"
              required
              onFocus={() => handleFocus('email')}
              onBlur={() => handleBlur('email')}
            />
            <p style={styles.helperText}>Must match your organization domain</p>
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
              required
              onFocus={() => handleFocus('password')}
              onBlur={() => handleBlur('password')}
            />
            <p style={styles.helperText}>Password must be at least 6 characters</p>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor;
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = styles.button.backgroundColor;
            }}
          >
            {loading ? 'Processing...' : 'Register as Employer'}
          </button>
        </form>
        
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Already have an account?{' '}
            <Link 
              href="/login" 
              style={styles.link}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = styles.linkHover.color;
                e.currentTarget.style.textDecoration = styles.linkHover.textDecoration;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = styles.link.color;
                e.currentTarget.style.textDecoration = styles.link.textDecoration;
              }}
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