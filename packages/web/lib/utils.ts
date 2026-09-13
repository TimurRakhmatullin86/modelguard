import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function severityColor(severity: string) {
  switch (severity) {
    case 'error': return 'text-red-600 bg-red-50 border-red-200';
    case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function statusColor(violations: number, warnings: number) {
  if (violations > 0) return 'text-red-600';
  if (warnings > 0) return 'text-yellow-600';
  return 'text-green-600';
}

export function statusBadge(violations: number, warnings: number) {
  if (violations > 0) return { label: 'Violations', class: 'bg-red-100 text-red-800' };
  if (warnings > 0) return { label: 'Warnings', class: 'bg-yellow-100 text-yellow-800' };
  return { label: 'Compliant', class: 'bg-green-100 text-green-800' };
}
