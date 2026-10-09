import type { ReactNode } from 'react';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * Кастомный чекбокс в стиле сайта: бордовая заливка при выборе.
 */
export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
}: Props) {
  return (
    <label
      className={
        'inline-flex items-center gap-3 select-none ' +
        (disabled ? 'opacity-40 cursor-not-allowed ' : 'cursor-pointer ') +
        className
      }
    >
      <span
        className={
          'relative shrink-0 w-5 h-5 border-2 transition-all ' +
          (checked
            ? 'bg-blood border-blood'
            : 'bg-transparent border-bone/40 hover:border-brass')
        }
        style={{
          boxShadow: checked
            ? 'inset 0 0 0 1px rgba(0,0,0,0.35), 0 0 10px rgba(156,28,28,0.35)'
            : 'inset 0 0 0 1px rgba(0,0,0,0.25)',
        }}
      >
        {checked && (
          <svg
            viewBox="0 0 24 24"
            className="absolute inset-0 w-full h-full text-paper"
            style={{ padding: 1 }}
            aria-hidden="true"
          >
            <polyline
              points="20 6 9 17 4 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      {label && (
        <span className="type text-[11px] uppercase tracking-[0.2em] text-bone-muted">
          {label}
        </span>
      )}
    </label>
  );
}