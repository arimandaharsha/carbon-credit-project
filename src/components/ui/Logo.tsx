'use client';

import React from 'react';

interface LogoProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

const Logo: React.FC<LogoProps> = ({ 
  width = '10rem', 
  height = '5rem', 
  className = '',
  style = {}
}) => {
  return (
    <div 
      style={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
      className={className}
    >
      <img 
        src="/LongLogo.png" 
        alt="Carbon Credits Logo" 
        style={{
          width: '100%',
          height: 'auto',
          objectFit: 'contain'
        }}
      />
    </div>
  );
};

export default Logo; 