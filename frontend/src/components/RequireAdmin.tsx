import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

/**
 * Guard для админских страниц.
 *
 * Если пользователь не залогинен — редирект на /login.
 * Если залогинен, но не админ — редирект на /.
 * Если проверка токена ещё идёт — заглушка.
 *
 * Проверка ролей на фронте — только для UX (не показывать раздел).
 * Реальная защита — на backend через @PreAuthorize.
 */
export function RequireAdmin({ children }: Props) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="text-slate-500">Загрузка...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAdmin = user.roles?.includes('ADMIN') ?? false;
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}