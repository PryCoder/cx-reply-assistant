import React from 'react';
import { classNames } from '../../lib/utils';

interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'gray' | 'purple';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<string, string> = {
  primary: 'bg-indigo-50 text-indigo-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  gray: 'bg-gray-100 text-gray-600',
  purple: 'bg-purple-50 text-purple-700',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-0.5 text-sm',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'gray',
  size = 'sm',
  children,
  className,
}) => {
  return (
    <span
      className={classNames(
        'inline-flex items-center font-semibold rounded-full tracking-wide',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
};