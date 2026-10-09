import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  /** paper — под пергамент, dark — под тёмные панели. */
  variant?: 'paper' | 'dark';
  disabled?: boolean;
  className?: string;
}

interface PanelPos {
  /** Координаты панели относительно viewport (position: fixed). */
  left: number;
  /** Верхняя грань — при открытии вниз. */
  top: number | null;
  /** Нижняя грань — при открытии вверх. */
  bottom: number | null;
  width: number;
  maxHeight: number;
}

const PANEL_MARGIN = 4;
const PANEL_PREFERRED_HEIGHT = 288;

/**
 * Кастомный select. Заменяет нативный `<select>` там, где важна
 * стилистика «детективной доски».
 *
 * Панель рендерится через React Portal в document.body с
 * position: fixed — благодаря этому не режутся
 * `overflow: hidden`, `backdrop-filter`, `transform` и любые
 * другие stacking contexts у родительских элементов.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder = '— выберите —',
  variant = 'paper',
  disabled = false,
  className = '',
}: Props) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [pos, setPos] = useState<PanelPos | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);

  const current = options.find((o) => o.value === value) ?? null;
  const isPaper = variant === 'paper';

  /* ─── Позиция панели ─── */

  const computePos = useCallback((): PanelPos | null => {
    const el = triggerRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom - PANEL_MARGIN;
    const spaceAbove = r.top - PANEL_MARGIN;

    // Открываем вверх только если снизу совсем мало места.
    const openUp =
      spaceBelow < 180 && spaceAbove > spaceBelow;

    if (openUp) {
      return {
        left: r.left,
        top: null,
        bottom: window.innerHeight - r.top + PANEL_MARGIN,
        width: r.width,
        maxHeight: Math.max(120, Math.min(PANEL_PREFERRED_HEIGHT, spaceAbove)),
      };
    }

    return {
      left: r.left,
      top: r.bottom + PANEL_MARGIN,
      bottom: null,
      width: r.width,
      maxHeight: Math.max(120, Math.min(PANEL_PREFERRED_HEIGHT, spaceBelow)),
    };
  }, []);

  const toggle = () => {
    if (disabled) return;
    setOpen((v) => {
      const next = !v;
      if (next) {
        const idx = options.findIndex((o) => o.value === value);
        setHighlight(idx >= 0 ? idx : 0);
        setPos(computePos());
      }
      return next;
    });
  };

  /* Пересчёт позиции при монтировании панели и при скролле/ресайзе. */
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => setPos(computePos());
    update();
    // capture: true — ловим скролл любого родителя, не только window.
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, computePos]);

  /* Клик мимо — учитываем и триггер, и панель (она в портале). */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  /* Скролл панели к подсвеченному пункту. */
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const el = panelRef.current.children[highlight] as HTMLElement | undefined;
    if (el) {
      const parent = panelRef.current;
      const top = el.offsetTop;
      const bottom = top + el.offsetHeight;
      if (top < parent.scrollTop) {
        parent.scrollTop = top;
      } else if (bottom > parent.scrollTop + parent.clientHeight) {
        parent.scrollTop = bottom - parent.clientHeight;
      }
    }
  }, [highlight, open]);

  /* Клавиатура. */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }

    if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault();
      setOpen(true);
      const idx = options.findIndex((o) => o.value === value);
      setHighlight(idx >= 0 ? idx : 0);
      setPos(computePos());
      return;
    }

    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => {
        let next = h;
        for (let i = h + 1; i < options.length; i++) {
          if (!options[i].disabled) { next = i; break; }
        }
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => {
        let next = h;
        for (let i = h - 1; i >= 0; i--) {
          if (!options[i].disabled) { next = i; break; }
        }
        return next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = options[highlight];
      if (opt && !opt.disabled) {
        onChange(opt.value);
        setOpen(false);
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      setHighlight(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setHighlight(options.length - 1);
    }
  };

  /* ─── Стили ─── */

  const triggerCls = isPaper
    ? 'w-full bg-transparent border-b-2 px-0 py-2 text-left ' +
      'font-type text-base transition-colors focus:outline-none ' +
      (open
        ? 'border-blood text-ink-text '
        : 'border-ink-text/40 text-ink-text hover:border-ink-text/60 ')
    : 'w-full bg-ink-soft border px-3 py-2 text-left ' +
      'font-type text-[14px] transition-colors focus:outline-none ' +
      (open
        ? 'border-blood text-bone '
        : 'border-ink-line text-bone hover:border-brass ');

  const panelCls = isPaper
    ? 'bg-[#d3c19a] border border-ink-text/30 ' +
      'shadow-[0_18px_40px_rgba(0,0,0,0.45)] ' +
      'overflow-y-auto scroll-paper'
    : 'bg-ink-card border border-brass/40 ' +
      'shadow-[0_18px_40px_rgba(0,0,0,0.75)] ' +
      'overflow-y-auto scroll-map';

  return (
    <>
      <div className={'relative ' + className} onKeyDown={onKeyDown}>
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={toggle}
          className={
            triggerCls +
            (disabled ? ' opacity-50 cursor-not-allowed' : ' cursor-pointer')
          }
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="flex items-center justify-between gap-3">
            <span
              className={
                'truncate ' +
                (current
                  ? ''
                  : isPaper
                  ? 'text-ink-text-dim/70 italic'
                  : 'text-bone-dim/70 italic')
              }
            >
              {current ? current.label : placeholder}
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              className={
                'shrink-0 transition-transform duration-150 ' +
                (open ? 'rotate-180 ' : '') +
                (isPaper ? 'text-ink-text-dim' : 'text-brass')
              }
              aria-hidden="true"
            >
              <path
                d="M2 4 L6 8 L10 4"
                stroke="currentColor"
                strokeWidth="1.7"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      </div>

      {open && pos &&
        createPortal(
          <ul
            ref={panelRef}
            role="listbox"
            className={panelCls}
            style={{
              position: 'fixed',
              left: pos.left,
              top: pos.top ?? 'auto',
              bottom: pos.bottom ?? 'auto',
              width: pos.width,
              maxHeight: pos.maxHeight,
              zIndex: 9999,
            }}
          >
            {options.map((o, i) => {
              const isSelected = o.value === value;
              const isHighlighted = i === highlight;

              const itemBase =
                'relative px-3.5 py-2.5 cursor-pointer transition-colors ' +
                'font-type text-[15px] flex items-center gap-2 ';

              const itemCls = isPaper
                ? itemBase +
                  (o.disabled
                    ? 'opacity-40 cursor-not-allowed text-ink-text-dim '
                    : isSelected
                    ? 'bg-blood/15 text-ink-text '
                    : isHighlighted
                    ? 'bg-ink-text/10 text-ink-text '
                    : 'text-ink-text-soft hover:bg-ink-text/10 hover:text-ink-text ')
                : itemBase +
                  (o.disabled
                    ? 'opacity-40 cursor-not-allowed text-bone-dim '
                    : isSelected
                    ? 'bg-blood/20 text-bone '
                    : isHighlighted
                    ? 'bg-brass/15 text-bone '
                    : 'text-bone-muted hover:bg-brass/10 hover:text-bone ');

              return (
                <li
                  key={o.value}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => !o.disabled && setHighlight(i)}
                  onClick={() => {
                    if (o.disabled) return;
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={itemCls}
                >
                  {isSelected && (
                    <span
                      className={
                        'absolute left-0 top-0 bottom-0 w-[3px] ' +
                        (isPaper ? 'bg-blood' : 'bg-brass')
                      }
                    />
                  )}
                  <span className="truncate">{o.label}</span>
                </li>
              );
            })}
          </ul>,
          document.body
        )}
    </>
  );
}