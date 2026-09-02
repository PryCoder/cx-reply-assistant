import React from 'react';
import { classNames } from '../../lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'white' | 'indigo' | 'gray';
  className?: string;
}

const sizeStyles: Record<string, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
};

const colorStyles: Record<string, string> = {
  white: 'border-white/30 border-t-white',
  indigo: 'border-indigo-200 border-t-indigo-600',
  gray: 'border-gray-200 border-t-gray-600',
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'indigo',
  className,
}) => {
  return (
    <div
      className={classNames(
        'inline-block rounded-full animate-spin',
        sizeStyles[size],
        colorStyles[color],
        className
      )}
    />
  );
};