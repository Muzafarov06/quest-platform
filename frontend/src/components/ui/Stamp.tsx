import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  variant?: 'default' | 'classified';
  className?: string;
}

export function Stamp({ children, variant = 'default', className = '' }: Props) {
  const cls = variant === 'classified' ? 'stamp-classified' : 'stamp';
  return <span className={`${cls} ${className}`}>{children}</span>;
}