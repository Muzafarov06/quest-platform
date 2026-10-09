import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

/**
 * Обёртка для приватных страниц.
 *
 * Если пользователь не залогинен — редиректит на /login,
 * запоминая исходный URL, чтобы вернуться после логина.
 *
 * Если проверка токена ещё идёт (isLoading) — показывает заглушку,
 * чтобы не было мигания «не залогинен → залогинен».
 */
export function RequireAuth({ children }: Props) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}