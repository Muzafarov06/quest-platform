import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container } from './Container';
import { Logo } from './Logo';
import { NavLink } from './NavLink';
import { UserMenu } from './UserMenu';
import { MobileMenu } from './MobileMenu';
import { useAuth } from '../../auth/useAuth';

export function Header() {
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={
          'fixed top-0 left-0 right-0 z-50 ' +
          'transition-colors duration-200 ' +
          (scrolled
            ? 'bg-ink-soft/95 border-b border-ink-line'
            : 'bg-transparent border-b border-transparent')
        }
      >
        {/* Верхний светящийся хайрлайн — оставляем, но это просто линия, не лагает */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blood/50 to-transparent opacity-70" />

        <Container>
          <div
            className={
              'relative flex items-center justify-between gap-4 ' +
              'transition-[height] duration-300 ' +
              (scrolled ? 'h-16' : 'h-20')
            }
          >
            <div className="flex items-center shrink-0">
              <Logo />
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8 flex-1 ml-6">
              <NavLink to="/" exact>
                Главная
              </NavLink>

              {isAuthenticated && (
                <>
                  <span className="w-px h-3.5 bg-bone/15" />
                  <NavLink to="/cases">Дела</NavLink>
                  <NavLink to="/my-sessions">Мои сессии</NavLink>
                </>
              )}
            </nav>

            {/* Right */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <div className="hidden md:block">
                    <UserMenu />
                  </div>
                  <BurgerButton
                    open={mobileOpen}
                    onClick={() => setMobileOpen((v) => !v)}
                  />
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hidden md:inline-flex items-center gap-2 px-4 h-9
                               border border-bone/15 hover:border-blood/60
                               font-mono text-[11px] uppercase tracking-[0.22em]
                               text-bone-muted hover:text-bone
                               transition-colors duration-200"
                  >
                    Войти
                  </Link>
                  <BurgerButton
                    open={mobileOpen}
                    onClick={() => setMobileOpen((v) => !v)}
                  />
                </>
              )}
            </div>
          </div>
        </Container>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}

/* ─── Бургер с анимацией в крестик ─── */
function BurgerButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="md:hidden relative flex flex-col justify-center items-center w-10 h-10
                 hover:bg-white/[0.05] transition-colors cursor-pointer"
      aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
      aria-expanded={open}
    >
      <span
        className="absolute block bg-bone transition-all duration-300 ease-out"
        style={{
          width: 18,
          height: 1,
          transform: open
            ? 'translateY(0) rotate(45deg)'
            : 'translateY(-5px) rotate(0deg)',
        }}
      />
      <span
        className="absolute block bg-bone transition-all duration-200"
        style={{
          width: 18,
          height: 1,
          opacity: open ? 0 : 1,
          transform: open ? 'scaleX(0.2)' : 'scaleX(1)',
        }}
      />
      <span
        className="absolute block bg-bone transition-all duration-300 ease-out"
        style={{
          width: 18,
          height: 1,
          transform: open
            ? 'translateY(0) rotate(-45deg)'
            : 'translateY(5px) rotate(0deg)',
        }}
      />
    </button>
  );
}