import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './AuthContext';

/**
 * Хук для доступа к AuthContext.
 *
 * Бросает ошибку, если использован вне AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth должен использоваться внутри <AuthProvider>');
  }
  return context;
}