import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  /** narrow — для форм и текстовых статей (max-w-3xl) */
  size?: 'default' | 'narrow' | 'wide';
}

const sizes = {
  narrow: 'max-w-3xl',
  default: 'max-w-7xl',
  wide: 'max-w-[1400px]',
};

/**
 * Единый контейнер для всей вёрстки.
 * Все секции — через него, чтобы отступы совпадали.
 */
export function Container({ children, className = '', size = 'default' }: Props) {
  return (
    <div className={`mx-auto w-full px-6 lg:px-8 ${sizes[size]} ${className}`}>
      {children}
    </div>
  );
}