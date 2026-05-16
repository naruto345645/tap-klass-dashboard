import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/25',
      secondary: 'bg-white/5 hover:bg-white/10 text-zinc-100 border border-white/10',
      ghost: 'bg-transparent hover:bg-white/5 text-zinc-400 hover:text-zinc-100',
      danger: 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-lg shadow-rose-500/25',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-lg',
      md: 'px-4 py-2.5 text-sm rounded-xl',
      lg: 'px-6 py-3 text-base rounded-xl',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2 focus:ring-offset-zinc-900',
          'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);
Button.displayName = 'Button';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, ...props }, ref) => (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-zinc-400">{label}</label>}
      <div className="relative">
        {leftIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">{leftIcon}</div>}
        <input
          ref={ref}
          className={cn(
            'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-zinc-100',
            'placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500',
            'transition-all duration-200',
            leftIcon && 'pl-10',
            error && 'border-rose-500 focus:ring-rose-500/50',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export function Card({ children, className, hover = true, glow = false }: CardProps) {
  return (
    <div
      className={cn(
        'bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.06] rounded-2xl p-6 backdrop-blur-xl shadow-xl shadow-black/20',
        hover && 'transition-all duration-300 hover:border-white/[0.12] hover:shadow-2xl hover:-translate-y-0.5',
        glow && 'relative before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-violet-500/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity',
        className
      )}
    >
      {children}
    </div>
  );
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-7xl' };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={cn('relative w-full bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 rounded-2xl shadow-2xl animate-scale-in', sizes[size])}>
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-zinc-100 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  className?: string;
}

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  const variants = {
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
    info: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
    neutral: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  };

  return <span className={cn('inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border', variants[variant], className)}>{children}</span>;
}

interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function Progress({ value, max = 100, size = 'md', showValue = false, variant = 'default', className }: ProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const sizes = { sm: 'h-1', md: 'h-2', lg: 'h-3' };
  const variants = { default: 'bg-violet-500', success: 'bg-emerald-500', warning: 'bg-amber-500', danger: 'bg-rose-500' };

  return (
    <div className={cn('space-y-1', className)}>
      {showValue && <div className="flex justify-between text-sm text-zinc-400"><span>{value}</span><span>{max}</span></div>}
      <div className={cn('w-full bg-white/10 rounded-full overflow-hidden', sizes[size])}>
        <div className={cn('h-full rounded-full transition-all duration-500', variants[variant])} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-500 mb-4">{icon}</div>}
      <h3 className="text-lg font-medium text-zinc-100 mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-zinc-400">{label}</label>}
      <select
        ref={ref}
        className={cn(
          'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all duration-200 [&>option]:bg-zinc-900 [&>option]:text-zinc-100',
          error && 'border-rose-500 focus:ring-rose-500/50',
          className
        )}
        {...props}
      >
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  )
);
Select.displayName = 'Select';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-zinc-400">{label}</label>}
      <textarea
        ref={ref}
        className={cn('w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all duration-200 resize-none', error && 'border-rose-500 focus:ring-rose-500/50', className)}
        {...props}
      />
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  )
);
Textarea.displayName = 'Textarea';