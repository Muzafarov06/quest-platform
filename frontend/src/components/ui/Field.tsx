import type { ReactNode } from 'react';

interface Props {
  label: string;
  children: ReactNode;
  required?: boolean;
  error?: string | null;
  hint?: string;
  variant?: 'paper' | 'dark';
}

/**
 * Универсальное поле формы: label + children + error/hint.
 * - paper — на пергаменте (тёмный текст)
 * - dark — на тёмной карточке (светлый текст)
 */
export function Field({
  label,
  children,
  required,
  error,
  hint,
  variant = 'paper',
}: Props) {
  const labelClass =
    variant === 'paper'
      ? 'type text-[11px] uppercase tracking-[0.24em] text-ink-text-dim'
      : 'type text-[10px] uppercase tracking-[0.24em] text-bone-muted';

  const hintClass =
    variant === 'paper'
      ? 'type text-[11px] text-ink-text-dim'
      : 'type text-[10px] text-bone-dim';

  return (
    <label className="flex flex-col gap-2">
      <span className={labelClass}>
        {label}
        {required && <span className="text-blood ml-1">*</span>}
      </span>
      {children}
      {error && <span className="type text-[12px] text-blood">{error}</span>}
      {!error && hint && <span className={hintClass}>{hint}</span>}
    </label>
  );
}