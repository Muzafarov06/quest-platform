import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Container } from './Container';

export function Footer() {
  return (
    <footer className="relative mt-auto border-t border-ink-line bg-ink-soft/85 overflow-hidden">
      {/* Фоновое свечение */}
      <div
        className="pointer-events-none absolute -bottom-32 left-1/2 -translate-x-1/2
                   w-[720px] h-[320px] rounded-full bg-blood/[0.06] blur-3xl"
      />

      <Container>
        <div className="relative py-12 flex flex-col gap-10">
          {/* Верхняя часть: бренд + колонки */}
          <div className="flex items-start justify-between flex-wrap gap-10">
            <div className="flex flex-col gap-3 max-w-sm">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blood/80 shadow-[0_0_12px_rgba(220,38,38,0.6)]" />
                <span className="font-mono text-[12px] uppercase tracking-[0.22em] text-bone">
                  Quest Platform
                </span>
              </div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-bone-dim leading-relaxed">
                Платформа интерактивных расследований.
                <br />
                Сделано для игроков.
              </p>
            </div>

            <nav className="flex items-start gap-12 flex-wrap">
              <FooterColumn title="Разделы">
                <FooterLink to="/">О проекте</FooterLink>
                <FooterLink to="/cases">Истории</FooterLink>
              </FooterColumn>

              <FooterColumn title="Аккаунт">
                <FooterLink to="/login">Войти</FooterLink>
                <FooterLink to="/my-sessions">Мои сессии</FooterLink>
              </FooterColumn>
            </nav>
          </div>

          {/* Разделитель */}
          <div className="h-px bg-gradient-to-r from-transparent via-ink-line to-transparent" />

          {/* Нижняя часть */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-bone-dim">
              © {new Date().getFullYear()} Quest Platform
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-bone-dim/60">
              All rights reserved
            </span>
          </div>
        </div>
      </Container>
    </footer>
  );
}

/* ─── Колонка со ссылками ─── */
function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-bone-dim/70">
        {title}
      </span>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

/* ─── Ссылка с анимированным подчёркиванием ─── */
function FooterLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="relative w-fit font-mono text-[12px] uppercase tracking-[0.22em]
                 text-bone-muted hover:text-bone transition-colors group"
    >
      {children}
      <span
        className="absolute left-0 right-0 -bottom-0.5 h-px bg-blood
                   scale-x-0 group-hover:scale-x-100 origin-left
                   transition-transform duration-300 ease-out"
      />
    </Link>
  );
}