import api from './client';
import type { ApiResponse, AuthUser } from '../types';

interface LoginRequest {
  email: string;
  senha: string;
}

interface LoginResponse {
  token: string;
  tipo: string;
  id: string;
  nome: string;
  email: string;
  perfil: AuthUser['perfil'];
}

export async function login(data: LoginRequest): Promise<AuthUser> {
  const res = await api.post<ApiResponse<LoginResponse>>('/auth/login', data);
  const { token, id, nome, email, perfil } = res.data.data;
  return { token, id, nome, email, perfil };
}
