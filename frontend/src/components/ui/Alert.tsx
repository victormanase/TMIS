import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

const config: Record<AlertVariant, { bg: string; text: string; Icon: typeof Info }> = {
  success: { bg: 'bg-green-50 border-green-200', text: 'text-green-800', Icon: CheckCircle },
  error: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', Icon: XCircle },
  warning: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', Icon: AlertCircle },
  info: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', Icon: Info },
};

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  message: string;
}

export function Alert({ className, variant = 'info', message, ...props }: AlertProps) {
  const { bg, text, Icon } = config[variant];
  return (
    <div className={cn('flex items-center gap-2 px-4 py-3 rounded-lg border text-sm', bg, text, className)} {...props}>
      <Icon size={16} className="shrink-0" />
      {message}
    </div>
  );
}
