import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: Props) {
  const { isAuthenticated, user, logout } = useAuth();
  const isAdmin = user?.roles?.includes('ADMIN') ?? false;

  useEffect(() => {
    if (!open) return;

    // 1. Блокируем скролл страницы, запомнив старое значение
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // 2. Закрытие по Escape
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] md:hidden animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Главное меню"
    >
      {/* Затемнение. Обычный div, клик по нему закрывает. */}
      <button
        type="button"
        aria-label="Закрыть меню"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 cursor-default"
      />

      {/* Панель — выезжает справа сверху */}
      <div className="absolute right-0 top-0 w-[76%] max-w-[300px] max-h-[92vh]
                      animate-rise-in flex flex-col">
        <div className="paper paper-fresh w-full max-h-[92vh] overflow-y-auto
                        text-ink-text shadow-paper-lift flex flex-col">

          {/* ── Шапка дела ── */}
          <div className="relative px-5 pt-6 pb-5">
            <div className="type text-[10px] uppercase tracking-[0.32em] text-ink-text-dim mb-3">
              Досье · № 001
            </div>

            <div className="flex items-start justify-between gap-3">
              <span
                className="stamp-red text-[11px] tracking-[0.18em]"
                style={{ transform: 'rotate(3deg)' }}
              >
                Материалы дела
              </span>

              <button
                type="button"
                onClick={onClose}
                className="shrink-0 w-8 h-8 flex items-center justify-center
                           text-ink-text-dim hover:text-blood
                           transition-colors cursor-pointer text-lg leading-none -mt-1"
                aria-label="Закрыть меню"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Красная нить-разделитель */}
          <div className="relative h-px mx-5">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blood/60 to-transparent" />
          </div>

          {/* ── Оглавление ── */}
          <div className="px-5 pt-4 pb-2">
            <span className="type text-[10px] uppercase tracking-[0.32em] text-ink-text-dim">
              Оглавление
            </span>
          </div>

          {/* ── Ссылки ── */}
          <nav className="flex-1 pb-4">
            <MobileLink to="/" onClick={onClose} index="01" delay={0.04}>
              Главная
            </MobileLink>

            {isAuthenticated ? (
              <>
                <MobileLink to="/cases" onClick={onClose} index="02" delay={0.08}>
                  Дела
                </MobileLink>
                <MobileLink to="/my-sessions" onClick={onClose} index="03" delay={0.12}>
                  Мои сессии
                </MobileLink>
                <MobileLink to="/profile" onClick={onClose} index="04" delay={0.16}>
                  Профиль
                </MobileLink>
                {isAdmin && (
                  <MobileLink to="/admin" onClick={onClose} index="05" delay={0.20} accent>
                    Админ-панель
                  </MobileLink>
                )}
              </>
            ) : (
              <MobileLink to="/login" onClick={onClose} index="02" delay={0.08}>
                Войти
              </MobileLink>
            )}
          </nav>

          {/* ── Подвал досье ── */}
          <div className="relative px-5 pt-4 pb-6">
            <div className="absolute top-0 left-5 right-5 border-t border-dashed border-ink-text/25" />

            {isAuthenticated ? (
              <div className="flex items-end justify-between gap-3 pt-2">
                <div className="min-w-0">
                  <div className="type text-[10px] uppercase tracking-[0.28em] text-ink-text-dim mb-1">
                    Агент
                  </div>
                  <div className="font-mono text-[12px] text-ink-text truncate max-w-[140px]">
                    {user?.displayName}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    logout();
                  }}
                  className="hand text-2xl text-blood cursor-pointer
                             hover:opacity-75 transition-opacity rotate-[-2deg]
                             shrink-0"
                >
                  Выйти →
                </button>
              </div>
            ) : (
              <div className="pt-2">
                <div className="hand text-xl text-blood/90 rotate-[-2deg]">
                  Доступ по пропуску →
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileLink({
  to,
  children,
  onClick,
  index,
  accent = false,
  delay = 0,
}: {
  to: string;
  children: ReactNode;
  onClick: () => void;
  index: string;
  accent?: boolean;
  delay?: number;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{ animationDelay: `${delay + 0.05}s` }}
      className={
        'animate-rise-in group flex items-baseline gap-4 px-5 py-3.5 ' +
        'transition-colors ' +
        (accent
          ? 'text-blood hover:bg-black/[0.06]'
          : 'text-ink-text-soft hover:text-ink-text hover:bg-black/[0.06]')
      }
    >
      <span
        className={
          'type text-[10px] tracking-[0.2em] tabular-nums transition-colors ' +
          (accent
            ? 'text-blood/70 group-hover:text-blood'
            : 'text-ink-text-dim group-hover:text-blood')
        }
      >
        {index}
      </span>
      <span className="type text-[13px] uppercase tracking-[0.18em] flex-1">
        {children}
      </span>
      <span
        className={
          'text-[14px] opacity-0 group-hover:opacity-100 -translate-x-1 ' +
          'group-hover:translate-x-0 transition-all text-blood'
        }
      >
        →
      </span>
    </Link>
  );
}