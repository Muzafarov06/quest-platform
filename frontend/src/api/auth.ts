import { apiClient } from './client';
import type {
  AuthResponse,
  CreateUserRequest,
  LoginRequest,
  User,
} from '../types/user';

/**
 * Регистрация. Возвращает данные созданного пользователя.
 * JWT здесь НЕ выдаётся — его надо получить через login.
 */
export async function register(data: CreateUserRequest): Promise<User> {
  const response = await apiClient.post<User>('/api/auth/register', data);
  return response.data;
}

/**
 * Логин. Возвращает access-токен и данные пользователя.
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/api/auth/login', data);
  return response.data;
}

/**
 * Текущий пользователь. Требует валидного JWT в localStorage.
 */
export async function getMe(): Promise<User> {
  const response = await apiClient.get<User>('/api/users/me');
  return response.data;
}