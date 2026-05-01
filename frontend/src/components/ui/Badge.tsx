import { Badge as BsBadge } from 'react-bootstrap';
import type { HTMLAttributes } from 'react';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'default';

const bgMap: Record<BadgeVariant, string> = {
  success: 'success',
  danger:  'danger',
  warning: 'warning',
  info:    'info',
  default: 'secondary',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <BsBadge bg={bgMap[variant]} className={`rounded-pill ${className ?? ''}`} {...props} />
  );
}
