import clsx from 'clsx';
import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-text-secondary">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">{icon}</div>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full bg-surface-input border rounded-xl px-4 py-2.5 text-sm text-text-primary',
            'placeholder:text-text-muted focus:outline-none transition-colors',
            icon && 'pl-9',
            error
              ? 'border-error/50 focus:border-error'
              : 'border-surface-border focus:border-brand-500',
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  ),
);
Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-text-secondary">{label}</label>}
      <textarea
        ref={ref}
        className={clsx(
          'w-full bg-surface-input border rounded-xl px-4 py-3 text-sm text-text-primary',
          'placeholder:text-text-muted focus:outline-none transition-colors resize-none',
          error ? 'border-error/50 focus:border-error' : 'border-surface-border focus:border-brand-500',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-error">{error}</p>}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  ),
);
Textarea.displayName = 'Textarea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-text-secondary">{label}</label>}
      <select
        ref={ref}
        className={clsx(
          'w-full bg-surface-input border rounded-xl px-4 py-2.5 text-sm text-text-primary',
          'focus:outline-none transition-colors appearance-none cursor-pointer',
          error ? 'border-error/50' : 'border-surface-border focus:border-brand-500',
          className,
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  ),
);
Select.displayName = 'Select';
