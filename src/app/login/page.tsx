'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Toast from '@/components/ui/Toast';
import Logo from '@/components/ui/Logo';

type ToastType = 'success' | 'error' | 'info';

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

// React-based styles
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
  logoContainer: {
    width: '10rem',
    height: '5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem'
  },
  logo: {
    width: '100%',
    height: 'auto',
    objectFit: 'contain' as const
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: colors.green[700],
    marginBottom: '0.5rem'
  },
  subtitle: {
    color: colors.gray[600],
    fontSize: '0.875rem'
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
    paddingLeft: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none' as const
  },
  icon: {
    width: '1rem',
    height: '1rem',
    color: colors.gray[400]
  },
  input: {
    width: '100%',
    paddingLeft: '2.5rem',
    paddingRight: '0.75rem',
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colors.green[300],
    borderRadius: '0.375rem',
    outline: 'none',
    fontSize: '1rem'
  },
  button: {
    width: '100%',
    paddingTop: '0.75rem',
    paddingBottom: '0.75rem',
    paddingLeft: '1rem',
    paddingRight: '1rem',
    backgroundColor: colors.green[600],
    color: colors.white,
    fontWeight: '500',
    borderRadius: '0.375rem',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    transition: 'background-color 0.3s',
    border: 'none',
    cursor: 'pointer'
  },
  buttonHover: {
    backgroundColor: colors.green[700]
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  spinner: {
    animation: 'spin 1s linear infinite',
    marginRight: '0.5rem',
    marginLeft: '-0.25rem',
    height: '1rem',
    width: '1rem'
  },
  linkContainer: {
    marginTop: '1.5rem',
    textAlign: 'center' as const
  },
  linkText: {
    fontSize: '0.875rem',
    color: colors.gray[600]
  },
  link: {
    color: colors.green[600],
    fontWeight: '500',
    textDecoration: 'none'
  },
  linkHover: {
    color: colors.green[700],
    textDecoration: 'underline'
  },
  '@keyframes spin': {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' }
  }
};

// Add animation keyframes
const spinKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Injecting keyframes into the document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = spinKeyframes;
  document.head.appendChild(styleElement);
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: ToastType;
  }>({ visible: false, message: '', type: 'error' });
  const [buttonHover, setButtonHover] = useState(false);
  const [linkHover, setLinkHover] = useState(false);
  const [forgotPasswordLinkHover, setForgotPasswordLinkHover] = useState(false);
  const router = useRouter();
  const { signIn, checkApprovalStatus, signOut } = useAuth();

  const showToast = (message: string, type: ToastType) => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, visible: false });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      showToast('Email and password are required', 'error');
      return;
    }
    
    try {
      setLoading(true);
      console.log("Login - Attempting to sign in:", email);
      
      const result = await signIn(email, password);
      console.log("Login - Sign in successful, checking approval status");
      
      // Check if the user is approved
      const approvalStatus = await checkApprovalStatus(result.user.uid);
      console.log("Login - Approval status:", approvalStatus);
      
      if (!approvalStatus.approved) {
        showToast(approvalStatus.message, 'info');
        
        // Sign out after showing the message - they can't access the system yet
        setTimeout(async () => {
          await signOut();
          router.push('/');
        }, 3000);
        
        return;
      }
      
      showToast('Login successful!', 'success');
      console.log("Login - Redirecting to dashboard");
      
      // Redirect to dashboard after successful login
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (error: any) {
      console.error("Login - Error during login:", error);
      let errorMessage = 'An error occurred during login';
      
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'User not found';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many unsuccessful login attempts. Please try again later';
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
          <Logo width="12rem" height="6rem" />
          <h1 style={styles.title}>Sign In</h1>
          <p style={styles.subtitle}>Sign in to your account to continue</p>
        </div>
        
        <form onSubmit={handleLogin} style={styles.form}>
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
          
          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>
              Password
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                  />
                </svg>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                placeholder="••••••••"
                required
              />
            </div>
            <div style={{ 
              textAlign: 'right',
              marginTop: '0.5rem'
            }}>
              <Link 
                href="/forgot-password" 
                style={
                  forgotPasswordLinkHover 
                    ? {...styles.link, ...styles.linkHover, fontSize: '0.8rem'} 
                    : {...styles.link, fontSize: '0.8rem'}
                }
                onMouseEnter={() => setForgotPasswordLinkHover(true)}
                onMouseLeave={() => setForgotPasswordLinkHover(false)}
              >
                Forgot your password?
              </Link>
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
                Logging in...
              </div>
            ) : 'Log In'}
          </button>
        </form>
        
        <div style={styles.linkContainer}>
          <p style={styles.linkText}>
            Don't have an account?{' '}
            <Link 
              href="/signup" 
              style={linkHover ? {...styles.link, ...styles.linkHover} : styles.link}
              onMouseEnter={() => setLinkHover(true)}
              onMouseLeave={() => setLinkHover(false)}
            >
              Sign Up
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