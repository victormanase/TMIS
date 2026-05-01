import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { Button as BsButton, Spinner } from 'react-bootstrap';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantMap: Record<string, string> = {
  primary:   'primary',
  secondary: 'secondary',
  danger:    'danger',
  ghost:     'outline-secondary',
  outline:   'outline-secondary',
};

const sizeMap: Record<string, 'sm' | 'lg' | undefined> = {
  sm: 'sm',
  md: undefined,
  lg: 'lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, children, className, type = 'button', ...props }, ref) => (
    <BsButton
      ref={ref}
      variant={variantMap[variant]}
      size={sizeMap[size]}
      disabled={disabled || loading}
      className={className}
      type={type}
      {...(props as any)}
    >
      {loading && <Spinner animation="border" size="sm" className="me-2" />}
      {children}
    </BsButton>
  )
);
Button.displayName = 'Button';
