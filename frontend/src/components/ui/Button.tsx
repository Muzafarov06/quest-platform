import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'ghost' | 'danger' | 'link';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  loading?: boolean;
  withArrow?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-3 font-mono uppercase ' +
  'tracking-[0.2em] transition-colors duration-150 select-none cursor-pointer ' +
  'disabled:opacity-40 disabled:cursor-not-allowed';

const variants: Record<Variant, string> = {
  primary:
    'bg-blood text-bone hover:bg-blood-hover',
  ghost:
    'bg-transparent text-bone border border-bone/35 hover:border-bone/70',
  danger:
    'bg-transparent text-danger border border-danger hover:bg-danger/10',
  link:
    'bg-transparent text-blood hover:text-blood-hover underline underline-offset-4 border-0 p-0',
};

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-[10px]',
  md: 'px-6 py-3 text-[11px]',
  lg: 'px-8 py-4 text-[12px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  withArrow,
  children,
  className = '',
  ...rest
}: Props) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      <span>{loading ? '⋯' : children}</span>
      {withArrow && !loading && <span>→</span>}
    </button>
  );
}