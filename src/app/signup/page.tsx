'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';

// React-based styles
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem'
  },
  wrapper: {
    maxWidth: '28rem',
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2rem'
  },
  header: {
    textAlign: 'center' as const
  },
  logoContainer: {
    width: '10rem',
    height: '5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto'
  },
  logo: {
    width: '100%',
    height: 'auto',
    objectFit: 'contain' as const
  },
  title: {
    marginTop: '1rem',
    fontSize: '1.875rem',
    fontWeight: 'bold',
    color: '#14532d' // green-900
  },
  subtitle: {
    marginTop: '0.5rem',
    fontSize: '0.875rem',
    color: '#4b5563' // gray-600
  },
  card: {
    backgroundColor: 'white',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    border: '1px solid #dcfce7' // green-100
  },
  cardContent: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem'
  },
  optionCard: {
    backgroundColor: '#f0fdf4', // green-50
    padding: '1.25rem',
    borderRadius: '0.75rem',
    border: '1px solid #dcfce7', // green-100
    transform: 'scale(1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer'
  },
  optionCardHover: {
    transform: 'scale(1.02)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  },
  optionContent: {
    display: 'flex',
    alignItems: 'flex-start'
  },
  iconContainer: {
    flexShrink: 0,
    marginRight: '1rem',
    width: '3rem',
    height: '3rem',
    borderRadius: '50%',
    backgroundColor: '#dcfce7', // green-100
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon: {
    width: '1.5rem',
    height: '1.5rem',
    color: '#16a34a' // green-600
  },
  optionTextContainer: {
    flex: 1
  },
  optionTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#14532d', // green-900
    marginBottom: '0.25rem'
  },
  optionDescription: {
    fontSize: '0.875rem',
    color: '#4b5563', // gray-600
    marginBottom: '1rem'
  },
  buttonGreen: {
    display: 'inline-flex',
    alignItems: 'center',
    paddingLeft: '1rem',
    paddingRight: '1rem',
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    border: 'none',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#16a34a', // green-600
    transition: 'background-color 0.2s',
    cursor: 'pointer',
    textDecoration: 'none'
  },
  buttonGreenHover: {
    backgroundColor: '#15803d' // green-700
  },
  buttonBlue: {
    display: 'inline-flex',
    alignItems: 'center',
    paddingLeft: '1rem',
    paddingRight: '1rem',
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    border: 'none',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#0284c7', // blue-600
    transition: 'background-color 0.2s',
    cursor: 'pointer',
    textDecoration: 'none'
  },
  buttonBlueHover: {
    backgroundColor: '#0369a1' // blue-700
  },
  buttonIcon: {
    width: '1rem',
    height: '1rem',
    marginRight: '0.5rem'
  },
  cardFooter: {
    padding: '1rem 1.5rem',
    backgroundColor: '#f9fafb', // gray-50
    borderTop: '1px solid #dcfce7', // green-100
    textAlign: 'center' as const
  },
  footerText: {
    fontSize: '0.875rem',
    color: '#4b5563', // gray-600
  },
  footerLink: {
    fontWeight: '500',
    color: '#16a34a', // green-600
    textDecoration: 'none'
  },
  footerLinkHover: {
    color: '#15803d', // green-700
    textDecoration: 'underline'
  },
  footer: {
    textAlign: 'center' as const
  },
  footerNote: {
    fontSize: '0.75rem',
    color: '#6b7280', // gray-500
    marginTop: '0.25rem'
  }
};

export default function SignupPage() {
  const [employerCardHover, setEmployerCardHover] = useState(false);
  const [employeeCardHover, setEmployeeCardHover] = useState(false);
  const [employerButtonHover, setEmployerButtonHover] = useState(false);
  const [employeeButtonHover, setEmployeeButtonHover] = useState(false);
  const [loginLinkHover, setLoginLinkHover] = useState(false);

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <div style={{display: 'flex', justifyContent: 'center', width: '100%'}}>
            <Logo width="12rem" height="6rem" />
          </div>
          <h1 style={styles.title}>Sign Up</h1>
          <p style={styles.subtitle}>Choose your account type to get started</p>
        </div>
        
        <div style={styles.card}>
          <div style={styles.cardContent}>
            <div 
              style={employerCardHover ? {...styles.optionCard, ...styles.optionCardHover} : styles.optionCard}
              onMouseEnter={() => setEmployerCardHover(true)}
              onMouseLeave={() => setEmployerCardHover(false)}
            >
              <div style={styles.optionContent}>
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
                      strokeWidth={2} 
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
                    />
                  </svg>
                </div>
                <div style={styles.optionTextContainer}>
                  <h3 style={styles.optionTitle}>
                    Register as an Employer
                  </h3>
                  <p style={styles.optionDescription}>
                    For organizations that want to manage their carbon credit portfolio. Your registration will need approval from the bank.
                  </p>
                  <Link 
                    href="/register/employer" 
                    style={employerButtonHover ? {...styles.buttonGreen, ...styles.buttonGreenHover} : styles.buttonGreen}
                    onMouseEnter={() => setEmployerButtonHover(true)}
                    onMouseLeave={() => setEmployerButtonHover(false)}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      style={styles.buttonIcon} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" 
                      />
                    </svg>
                    Register Organization
                  </Link>
                </div>
              </div>
            </div>
            
            <div 
              style={employeeCardHover ? {...styles.optionCard, ...styles.optionCardHover} : styles.optionCard}
              onMouseEnter={() => setEmployeeCardHover(true)}
              onMouseLeave={() => setEmployeeCardHover(false)}
            >
              <div style={styles.optionContent}>
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
                      strokeWidth={2} 
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                    />
                  </svg>
                </div>
                <div style={styles.optionTextContainer}>
                  <h3 style={styles.optionTitle}>
                    Register as an Employee
                  </h3>
                  <p style={styles.optionDescription}>
                    For individuals who are part of a registered organization. Your work email must match your organization's domain and your registration will need approval from your employer.
                  </p>
                  <Link 
                    href="/register/employee" 
                    style={employeeButtonHover ? {...styles.buttonBlue, ...styles.buttonBlueHover} : styles.buttonBlue}
                    onMouseEnter={() => setEmployeeButtonHover(true)}
                    onMouseLeave={() => setEmployeeButtonHover(false)}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      style={styles.buttonIcon} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" 
                      />
                    </svg>
                    Join Your Organization
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          <div style={styles.cardFooter}>
            <p style={styles.footerText}>
              Already have an account?{' '}
              <Link 
                href="/login" 
                style={loginLinkHover ? {...styles.footerLink, ...styles.footerLinkHover} : styles.footerLink}
                onMouseEnter={() => setLoginLinkHover(true)}
                onMouseLeave={() => setLoginLinkHover(false)}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
        
        <div style={styles.footer}>
          <p style={styles.footerNote}>
            For bank or admin accounts, please contact the system administrator.
          </p>
        </div>
      </div>
    </div>
  );
} 