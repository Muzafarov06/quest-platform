import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

interface Props {
  to: string;
  children: ReactNode;
  exact?: boolean;
  accent?: boolean;
}

export function NavLink({ to, children, exact = false, accent = false }: Props) {
  const { pathname } = useLocation();

  const isActive = exact
    ? pathname === to
    : pathname === to || pathname.startsWith(to + '/');

  const underlineColor = accent ? 'after:bg-brass' : 'after:bg-blood';

  return (
    <Link
      to={to}
      className={
        'relative font-mono text-[12px] uppercase tracking-[0.18em] py-1 transition-colors ' +
        'after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-px ' +
        'after:transition-transform after:origin-left ' +
        underlineColor + ' ' +
        (isActive
          ? 'after:scale-x-100 ' + (accent ? 'text-brass' : 'text-bone')
          : 'after:scale-x-0 hover:after:scale-x-100 ' +
            (accent
              ? 'text-brass/80 hover:text-brass'
              : 'text-bone-muted hover:text-bone'))
      }
    >
      {children}
    </Link>
  );
}