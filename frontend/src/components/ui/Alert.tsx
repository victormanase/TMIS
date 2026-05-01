import { Alert as BsAlert } from 'react-bootstrap';
import type { HTMLAttributes } from 'react';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

const config: Record<AlertVariant, { bsVariant: string; icon: string }> = {
  success: { bsVariant: 'success', icon: 'fa-check-circle' },
  error:   { bsVariant: 'danger',  icon: 'fa-times-circle' },
  warning: { bsVariant: 'warning', icon: 'fa-exclamation-triangle' },
  info:    { bsVariant: 'info',    icon: 'fa-info-circle' },
};

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  message: string;
}

export function Alert({ variant = 'info', message, className, ...props }: AlertProps) {
  const { bsVariant, icon } = config[variant];
  return (
    <BsAlert
      variant={bsVariant}
      className={`d-flex align-items-center gap-2 py-2 ${className ?? ''}`}
      {...props}
    >
      <i className={`fas ${icon}`} />
      <span>{message}</span>
    </BsAlert>
  );
}
