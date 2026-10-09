import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import type { User } from '../types/user';
import { getMe, login as loginApi } from '../api/auth';
import { getStoredToken, setStoredToken } from '../api/client';

/**
 * Что доступно из контекста всем компонентам.
 */
export interface AuthContextValue {
  /** Текущий пользователь, или null если не залогинен. */
  user: User | null;
  /** true — пока идёт проверка токена при старте приложения. */
  isLoading: boolean;
  /** true — пользователь залогинен. */
  isAuthenticated: boolean;
  /** Логин: принимает email и пароль, сохраняет токен, обновляет user. */
  login: (email: string, password: string) => Promise<void>;
  /** Логаут: чистит токен и user. */
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Провайдер AuthContext.
 *
 * При старте приложения:
 *   - если есть сохранённый токен, пробует получить текущего пользователя
 *     через GET /api/users/me;
 *   - если токен валиден — ставит user;
 *   - если нет — остаётся гостем.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    getMe()
      .then((me) => setUser(me))
      .catch(() => {
        setStoredToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginApi({ email, password });
    setStoredToken(response.accessToken);
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}