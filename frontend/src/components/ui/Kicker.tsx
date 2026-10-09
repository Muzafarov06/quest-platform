import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

/**
 * Надзаголовок с чертой слева: «— ДОСТУПНЫЕ ДЕЛА».
 */
export function Kicker({ children, className = '' }: Props) {
  return <div className={`kicker ${className}`}>{children}</div>;
}