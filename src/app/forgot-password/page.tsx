'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Toast from '@/components/ui/Toast';

type ToastType = 'success' | 'error' | 'info';

// Color palette - reusing the same colors from login page for consistency
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

// React-based styles - similar to login page
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem',
    backgroundColor: colors.green[50],
  },
  card: {
    backgroundColor: colors.white,
    padding: '2rem',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '28rem',
    border: `1px solid ${colors.gray[200]}`,
  },
  headerContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const,
    marginBottom: '1.5rem'
  },
  logoCircle: {
    width: '4rem',
    height: '4rem',
    backgroundColor: colors.green[100],
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem'
  },
  logoIcon: {
    width: '2rem',
    height: '2rem',
    color: colors.green[600]
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: colors.green[700],
    marginBottom: '0.5rem'
  },
  subtitle: {
    color: colors.gray[600],
    fontSize: '0.875rem',
    marginBottom: '1rem'
  },
  description: {
    color: colors.gray[600],
    fontSize: '0.875rem',
    lineHeight: '1.4',
    marginBottom: '1.5rem'
  },
  form: {
    marginBottom: '1.25rem'
  },
  formGroup: {
    marginBottom: '1.25rem'
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: colors.gray[700],
    marginBottom: '0.25rem'
  },
  inputContainer: {
    position: 'relative' as const
  },
  iconContainer: {
    position: 'absolute' as const,
    top: '0',
    bottom: '0',
    left: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.5rem'
  },
  icon: {
    width: '1.25rem',
    height: '1.25rem',
    color: colors.gray[500]
  },
  input: {
    width: '100%',
    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
    borderRadius: '0.375rem',
    border: `1px solid ${colors.gray[300]}`,
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    ':focus': {
      borderColor: colors.green[400],
      boxShadow: `0 0 0 3px ${colors.green[100]}`
    }
  },
  button: {
    width: '100%',
    padding: '0.75rem 1rem',
    backgroundColor: colors.green[600],
    color: colors.white,
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonHover: {
    backgroundColor: colors.green[700]
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  },
  spinner: {
    animation: 'spin 1s linear infinite',
    width: '1.25rem',
    height: '1.25rem'
  },
  linkContainer: {
    textAlign: 'center' as const
  },
  linkText: {
    fontSize: '0.875rem',
    color: colors.gray[600]
  },
  link: {
    color: colors.green[600],
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'color 0.15s'
  },
  linkHover: {
    color: colors.green[700],
    textDecoration: 'underline'
  }
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [buttonHover, setButtonHover] = useState(false);
  const [linkHover, setLinkHover] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false,
    message: '',
    type: 'info'
  });

  const router = useRouter();
  const { sendPasswordResetEmail } = useAuth();

  const showToast = (message: string, type: ToastType) => {
    setToast({
      visible: true,
      message,
      type
    });
  };

  const hideToast = () => {
    setToast({
      ...toast,
      visible: false
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      showToast('Email is required', 'error');
      return;
    }
    
    try {
      setLoading(true);
      await sendPasswordResetEmail(email);
      showToast('Password reset email sent! Please check your inbox.', 'success');
      
      // Clear form after success
      setEmail('');
      
      // Redirect to login after a delay
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      console.error("Error during password reset:", error);
      let errorMessage = 'An error occurred while sending the password reset email';
      
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address';
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.headerContainer}>
          <div style={styles.logoCircle}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              style={styles.logoIcon} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" 
              />
            </svg>
          </div>
          <h1 style={styles.title}>Reset Password</h1>
          <p style={styles.subtitle}>Forgot your password?</p>
          <p style={styles.description}>
            Enter your email address below and we will send you instructions to reset your password.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>
              Email Address
            </label>
            <div style={styles.inputContainer}>
              <div style={styles.iconContainer}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  style={styles.icon} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                  />
                </svg>
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            style={buttonHover ? {...styles.button, ...styles.buttonHover} : styles.button}
            onMouseEnter={() => setButtonHover(true)}
            onMouseLeave={() => setButtonHover(false)}
          >
            {loading ? (
              <div style={styles.loadingContainer}>
                <svg 
                  style={styles.spinner} 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    style={{opacity: 0.25}} 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    style={{opacity: 0.75}} 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Sending...
              </div>
            ) : 'Send Reset Instructions'}
          </button>
        </form>
        
        <div style={styles.linkContainer}>
          <p style={styles.linkText}>
            Remember your password?{' '}
            <Link 
              href="/login" 
              style={linkHover ? {...styles.link, ...styles.linkHover} : styles.link}
              onMouseEnter={() => setLinkHover(true)}
              onMouseLeave={() => setLinkHover(false)}
            >
              Back to Login
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