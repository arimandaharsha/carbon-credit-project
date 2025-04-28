'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center' as const,
    position: 'relative' as const,
    overflow: 'hidden'
  },
  background: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, #1a2e35 0%, #234c5c 50%, #0c5b54 100%)',
    zIndex: -1
  },
  content: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem',
    zIndex: 1,
    color: 'white'
  },
  logoContainer: {
    marginBottom: '2rem'
  },
  logoCircle: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
  },
  logoIcon: {
    width: '60px',
    height: '60px',
    color: '#4ade80'
  },
  title: {
    fontSize: '3rem',
    fontWeight: 800,
    marginBottom: '1.5rem',
    letterSpacing: '-0.025em',
    lineHeight: 1.2,
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
  },
  tagline: {
    fontSize: '1.25rem',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '2.5rem',
    maxWidth: '600px',
    marginLeft: 'auto',
    marginRight: 'auto',
    lineHeight: 1.6
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    width: '100%',
    maxWidth: '400px',
    margin: '0 auto'
  },
  buttonContainerDesktop: {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'center',
    gap: '1rem',
    width: '100%',
    maxWidth: '400px',
    margin: '0 auto'
  },
  button: {
    display: 'block',
    padding: '1rem 2rem',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '1.125rem',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
  },
  loginButton: {
    background: 'linear-gradient(to right, #38bdf8, #0ea5e9, #0284c7)',
    color: 'white'
  },
  loginButtonHover: {
    boxShadow: '0 6px 16px rgba(56, 189, 248, 0.4)',
    transform: 'translateY(-2px)'
  },
  registerButton: {
    background: 'linear-gradient(to right, #4ade80, #22c55e, #16a34a)',
    color: 'white'
  },
  registerButtonHover: {
    boxShadow: '0 6px 16px rgba(74, 222, 128, 0.4)',
    transform: 'translateY(-2px)'
  }
};

export default function Home() {
  const [isMediumScreen, setIsMediumScreen] = useState(false);
  const [loginHovered, setLoginHovered] = useState(false);
  const [registerHovered, setRegisterHovered] = useState(false);
  
  useEffect(() => {
    // Handle responsive design
    const checkScreenSize = () => {
      setIsMediumScreen(window.innerWidth >= 640);
    };
    
    // Initial check
    checkScreenSize();
    
    // Add event listener
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  return (
    <div style={styles.container}>
      <div style={styles.background}></div>
      
      <div style={styles.content}>
        {/* Logo Icon */}
        <div style={styles.logoContainer}>
          <div style={styles.logoCircle}>
            <img
              src="/Logo.png"
              alt="Carbon Credits Logo"
              style={{
                width: '170px',
                height: '170px',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>

        {/* Title */}
        <h1 style={styles.title}>
          Travel Green - Carbon Credits
        </h1>

        {/* Tagline */}
        <p style={styles.tagline}>
          Track. Trade. Transform. Empower your organization with transparent and sustainable carbon credit management.
        </p>

        {/* CTA Buttons */}
        <div style={isMediumScreen ? styles.buttonContainerDesktop : styles.buttonContainer}>
          <Link
            href="/login"
            style={{
              ...styles.button,
              ...styles.loginButton,
              ...(loginHovered ? styles.loginButtonHover : {})
            }}
            onMouseEnter={() => setLoginHovered(true)}
            onMouseLeave={() => setLoginHovered(false)}
          >
            Log In
          </Link>
          <Link
            href="/signup"
            style={{
              ...styles.button,
              ...styles.registerButton,
              ...(registerHovered ? styles.registerButtonHover : {})
            }}
            onMouseEnter={() => setRegisterHovered(true)}
            onMouseLeave={() => setRegisterHovered(false)}
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
