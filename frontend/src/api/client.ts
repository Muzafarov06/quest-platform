import axios from 'axios';

/**
 * Единый axios-инстанс для всего приложения.
 *
 * baseURL берётся из переменной окружения VITE_API_URL,
 * а если её нет — падает на localhost для локальной разработки.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

const TOKEN_KEY = 'quest.auth.token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

/**
 * Interceptor запроса: добавляет Authorization: Bearer <token>,
 * если токен есть в localStorage.
 */
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Interceptor ответа: ловит 401 и автоматически чистит токен,
 * чтобы фронт не застрял в «залогинен, но токен истёк».
 *
 * Здесь НЕ редиректим — редирект делает компонент, который
 * знает про текущий URL и роутер.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setStoredToken(null);
    }
    return Promise.reject(error);
  }
);