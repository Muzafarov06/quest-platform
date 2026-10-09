import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';

export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isAdmin = user?.roles?.includes('ADMIN') ?? false;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  if (!user) return null;

  const initial = user.displayName.charAt(0).toUpperCase();

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={
          'flex items-center gap-2 pl-3 pr-2 py-1.5 border border-ink-line ' +
          'transition-colors cursor-pointer ' +
          (open ? 'border-blood bg-ink-hover' : 'hover:border-bone/30 hover:bg-ink-hover')
        }
      >
        <span className="w-6 h-6 flex items-center justify-center bg-blood text-bone font-display text-sm">
          {initial}
        </span>
        <span className="font-mono text-[12px] uppercase tracking-widest text-bone max-w-[120px] truncate">
          {user.displayName}
        </span>
        <span className={'text-bone-muted text-[10px] transition-transform ' + (open ? 'rotate-180' : '')}>
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] w-60 bg-ink-elevated border border-ink-line shadow-deep z-50 animate-rise-in">
          <div className="px-4 py-3 border-b border-ink-line">
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-bone-muted">
              Аккаунт
            </div>
            <div className="font-body text-sm text-bone truncate mt-1">{user.email}</div>
          </div>

          <div className="py-1">
            <MenuItem to="/profile" onClick={() => setOpen(false)}>Профиль</MenuItem>
            <MenuItem to="/my-sessions" onClick={() => setOpen(false)}>Мои сессии</MenuItem>
           {isAdmin && (
              <>
                <MenuItem to="/admin" onClick={() => setOpen(false)} accent>
                  ⚙ Админ-панель
                </MenuItem>
                <MenuItem to="/admin/figures" onClick={() => setOpen(false)} accent>
                  ♟ Фигурки
                </MenuItem>
              </>
            )}
          </div>
          

          <div className="border-t border-ink-line py-1">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 font-mono text-[12px] uppercase tracking-widest text-danger hover:bg-ink-hover transition-colors cursor-pointer"
            >
              Выйти
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  to, children, onClick, accent = false,
}: {
  to: string;
  children: React.ReactNode;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={
        'block px-4 py-2.5 font-mono text-[12px] uppercase tracking-widest transition-colors ' +
        (accent
          ? 'text-brass hover:bg-ink-hover hover:text-bone'
          : 'text-bone-muted hover:bg-ink-hover hover:text-bone')
      }
    >
      {children}
    </Link>
  );
}