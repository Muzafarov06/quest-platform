export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'DELETED';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarKey: string;
  status: UserStatus;
  createdAt: string;
  roles: string[];   // ← новое: ["USER"], ["USER","ADMIN"]
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  displayName: string;
}