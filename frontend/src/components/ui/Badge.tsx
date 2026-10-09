import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export function Badge({ children, className = '' }: Props) {
  return (
    <span
      className={
        'inline-flex items-center px-3 py-1.5 border border-ink-line ' +
        'font-mono text-[11px] uppercase tracking-widest text-bone-muted ' +
        className
      }
    >
      {children}
    </span>
  );
}