import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'md' | 'lg';
}

const paddings = {
  none: '',
  md: 'p-5',
  lg: 'p-8',
};

export function Card({ children, className = '', hover = false, padding = 'md' }: Props) {
  return (
    <div
      className={
        'bg-ink-card border border-ink-line ' +
        paddings[padding] + ' ' +
        (hover ? 'transition-colors hover:border-bone/20 cursor-pointer ' : '') +
        className
      }
    >
      {children}
    </div>
  );
}