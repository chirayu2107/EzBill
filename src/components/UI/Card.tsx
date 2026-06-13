import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', padding = 'md', hoverable = false }) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  };
  
  return (
    <div className={`ez-card ${hoverable ? 'ez-card-hover cursor-pointer' : ''} ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};

export default Card;