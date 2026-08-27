import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import Spinner from './Spinner';

const variants = {
  primary: 'bg-gradient-to-r from-primary to-violet text-white hover:opacity-90',
  secondary: 'bg-surface text-white hover:bg-surface/80',
  gold: 'bg-gold text-background hover:brightness-110',
  danger: 'bg-red-500 text-white hover:bg-red-400',
  ghost: 'bg-white/5 text-white hover:bg-white/10'
};

const sizes = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base'
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
}

const Button = ({ children, variant = 'primary', size = 'md', loading = false, className = '', disabled, ...props }: PropsWithChildren<ButtonProps>) => (
  <button
    className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
    disabled={disabled || loading}
    {...props}
  >
    {loading && <Spinner className="h-4 w-4 border-2" />}
    {children}
  </button>
);

export default Button;
