import React, { forwardRef } from 'react';
import { classNames } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={classNames(
              'w-full px-4 py-3 border-2 border-gray-200 rounded-xl',
              'text-gray-900 placeholder-gray-400 font-medium',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
              'hover:border-gray-300 transition-all duration-200',
              Boolean(icon) && 'pl-12',
              Boolean(error) && 'border-red-300 focus:ring-red-500',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm font-medium text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';