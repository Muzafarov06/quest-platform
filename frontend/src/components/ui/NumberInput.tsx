import { useRef } from 'react';

interface Props {
  value: number | '';
  onChange: (v: number | '') => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  className?: string;
  variant?: 'paper' | 'dark';
  allowEmpty?: boolean;
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder,
  className = '',
  variant = 'paper',
  allowEmpty = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const clamp = (n: number): number => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };

  const stepUp = () => {
    const current = value === '' ? (min ?? 0) : value;
    onChange(clamp(current + step));
  };

  const stepDown = () => {
    const current = value === '' ? (min ?? 0) : value;
    onChange(clamp(current - step));
  };

  const handleChange = (raw: string) => {
    if (raw === '') {
      onChange(allowEmpty ? '' : 0);
      return;
    }
    const n = Number(raw);
    if (!Number.isNaN(n)) onChange(n);
  };

  const v = VARIANTS[variant];

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="number"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        className={className + ' pr-8'}
      />

      <div
        className="absolute right-0 top-0 bottom-0 flex flex-col border-l w-6"
        style={{ borderColor: v.border }}
      >
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={stepUp}
          className="flex-1 flex items-center justify-center transition-colors cursor-pointer"
          style={{ color: v.arrow, borderBottom: `1px solid ${v.border}` }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = v.hoverBg;
            e.currentTarget.style.color = v.arrowHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = v.arrow;
          }}
          aria-label="Увеличить"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 2 L8 6 L2 6 Z" fill="currentColor" />
          </svg>
        </button>

        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={stepDown}
          className="flex-1 flex items-center justify-center transition-colors cursor-pointer"
          style={{ color: v.arrow }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = v.hoverBg;
            e.currentTarget.style.color = v.arrowHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = v.arrow;
          }}
          aria-label="Уменьшить"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 8 L8 4 L2 4 Z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  );
}

const VARIANTS = {
  paper: {
    border: 'rgba(42, 35, 24, 0.25)',
    arrow: 'rgba(42, 35, 24, 0.55)',
    arrowHover: '#9c1c1c',
    hoverBg: 'rgba(156, 28, 28, 0.08)',
  },
  dark: {
    border: 'rgba(236, 226, 201, 0.2)',
    arrow: 'rgba(236, 226, 201, 0.55)',
    arrowHover: '#9c1c1c',
    hoverBg: 'rgba(156, 28, 28, 0.15)',
  },
} as const;