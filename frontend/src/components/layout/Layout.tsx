import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

/**
 * Страницы, для которых хедер и футер не рендерятся — они занимают
 * весь экран (лобби и игровая сессия).
 */
const FULLSCREEN_PREFIXES = ['/rooms/', '/sessions/'];

export function Layout() {
  const location = useLocation();
  const isFullscreen = FULLSCREEN_PREFIXES.some((p) =>
    location.pathname.startsWith(p)
  );

  if (isFullscreen) {
    return (
      <div className="min-h-screen bg-ink text-bone">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col text-bone bg-board">
      <Header />
      <main className="flex-1 w-full pt-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}