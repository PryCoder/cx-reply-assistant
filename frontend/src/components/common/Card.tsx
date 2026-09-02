import React from 'react';
import { classNames } from '../../lib/utils';

interface CardProps {
  variant?: 'default' | 'premium' | 'hover';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const variantStyles: Record<string, string> = {
  default: 'bg-white rounded-2xl shadow-sm border border-gray-200/50',
  premium: 'bg-white rounded-2xl shadow-lg border border-gray-100/80',
  hover: 'bg-white rounded-2xl shadow-sm border border-gray-200/50 hover:shadow-xl hover:border-indigo-200 hover:scale-[1.01] transition-all duration-300 cursor-pointer',
};

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  children,
  className,
  onClick,
}) => {
  return (
    <div
      className={classNames(variantStyles[variant], className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
};