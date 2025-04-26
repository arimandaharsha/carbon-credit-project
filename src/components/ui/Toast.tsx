'use client';

import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  isVisible,
  onClose,
  duration = 5000, // Default duration
}) => {
  const [closeButtonHover, setCloseButtonHover] = useState(false);
  
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration]);

  if (!isVisible) return null;

  const getToastStyles = () => {
    const baseStyles = {
      container: {
        position: 'fixed' as const,
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        minWidth: '320px',
        maxWidth: '28rem',
        zIndex: 50,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        animation: 'slideUp 0.3s ease-out forwards',
        display: 'flex',
        padding: '1rem',
        alignItems: 'flex-start',
      },
      icon: {
        flexShrink: 0,
        marginRight: '0.75rem',
        width: '1.5rem',
        height: '1.5rem',
      },
      content: {
        flex: 1,
        fontSize: '0.875rem',
      },
      closeButton: {
        marginLeft: '0.75rem',
        flexShrink: 0,
        color: '#9CA3AF',
        cursor: 'pointer',
        background: 'transparent',
        border: 'none',
        padding: 0,
        transition: 'color 0.15s',
      },
      closeButtonHover: {
        color: '#6B7280',
      }
    };

    // Type-specific styles
    switch (type) {
      case 'success':
        return {
          ...baseStyles,
          container: {
            ...baseStyles.container,
            backgroundColor: '#F0FDF4', // green-50
            borderLeft: '4px solid #22C55E', // green-500
          },
          icon: {
            ...baseStyles.icon,
            color: '#22C55E', // green-500
          },
          content: {
            ...baseStyles.content,
            color: '#374151', // gray-700
          }
        };
      case 'error':
        return {
          ...baseStyles,
          container: {
            ...baseStyles.container,
            backgroundColor: '#FEF2F2', // red-50
            borderLeft: '4px solid #EF4444', // red-500
          },
          icon: {
            ...baseStyles.icon,
            color: '#EF4444', // red-500
          },
          content: {
            ...baseStyles.content,
            color: '#374151', // gray-700
          }
        };
      case 'info':
        return {
          ...baseStyles,
          container: {
            ...baseStyles.container,
            backgroundColor: '#EFF6FF', // blue-50
            borderLeft: '4px solid #3B82F6', // blue-500
          },
          icon: {
            ...baseStyles.icon,
            color: '#3B82F6', // blue-500
          },
          content: {
            ...baseStyles.content,
            color: '#374151', // gray-700
          }
        };
      default:
        return baseStyles;
    }
  };

  const styles = getToastStyles();

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" style={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" style={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'info':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" style={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      {getIcon()}
      <div style={styles.content}>{message}</div>
      <button
        onClick={onClose}
        style={closeButtonHover ? {...styles.closeButton, ...styles.closeButtonHover} : styles.closeButton}
        onMouseEnter={() => setCloseButtonHover(true)}
        onMouseLeave={() => setCloseButtonHover(false)}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default Toast; 