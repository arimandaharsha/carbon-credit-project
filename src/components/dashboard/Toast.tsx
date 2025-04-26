'use client';

import React, { useEffect } from 'react';
import { colors } from './dashboardStyles';
import { Toast as ToastType } from './dashboardTypes';

interface ToastProps {
  toast: ToastType;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseTime?: number;
}

const Toast: React.FC<ToastProps> = ({ 
  toast, 
  onClose, 
  autoClose = true, 
  autoCloseTime = 5000 
}) => {
  useEffect(() => {
    if (autoClose && toast.visible) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseTime);
      
      return () => clearTimeout(timer);
    }
  }, [toast.visible, onClose, autoClose, autoCloseTime]);

  if (!toast.visible) return null;

  const getToastColors = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: colors.green[100],
          border: colors.green[300],
          text: colors.green[800],
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
            </svg>
          )
        };
      case 'error':
        return {
          bg: '#FEE2E2',
          border: '#FECACA',
          text: '#B91C1C',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
            </svg>
          )
        };
      case 'info':
      default:
        return {
          bg: '#E0F2FE',
          border: '#BAE6FD',
          text: '#0369A1',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
            </svg>
          )
        };
    }
  };

  const toastColors = getToastColors();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: '24rem',
        width: 'calc(100% - 2rem)',
        backgroundColor: toastColors.bg,
        borderRadius: '0.5rem',
        padding: '1rem 1.25rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: `1px solid ${toastColors.border}`,
        color: toastColors.text,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        animation: 'slideUpFade 0.3s ease-out',
      }}
    >
      <div>{toastColors.icon}</div>
      <p style={{ margin: 0, flex: 1 }}>{toast.message}</p>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: toastColors.text,
          opacity: 0.6,
          cursor: 'pointer',
          padding: '0.25rem',
          borderRadius: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
        </svg>
      </button>
    </div>
  );
};

export default Toast; 