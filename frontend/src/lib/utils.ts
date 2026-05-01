import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number | string, currency = 'TSh'): string {
  return `${currency} ${Number(amount).toLocaleString('en-TZ', { minimumFractionDigits: 2 })}`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const UNIT_TYPES = ['APARTMENT', 'STUDIO', 'AIRBNB', 'OTHER'] as const;
export const PAYMENT_TYPES = ['RENT', 'SERVICE_CHARGE', 'AIRBNB'] as const;
export const ROLES = ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'VIEWER'] as const;
