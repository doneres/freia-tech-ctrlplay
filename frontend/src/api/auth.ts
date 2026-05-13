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
  telefone?: string;
  fotoPerfil?: string;
}

export async function login(data: LoginRequest): Promise<AuthUser> {
  const res = await api.post<ApiResponse<LoginResponse>>('/auth/login', data);
  const { token, id, nome, email, perfil, telefone, fotoPerfil } = res.data.data;
  return { token, id, nome, email, perfil, telefone, fotoPerfil };
}

export async function solicitarReset(email: string): Promise<void> {
  await api.post('/auth/solicitar-reset', { email });
}

export async function confirmarReset(email: string, codigo: string, novaSenha: string): Promise<void> {
  await api.post('/auth/confirmar-reset', { email, codigo, novaSenha });
}
