import api from './client';
import type { ApiResponse, Usuario } from '../types';

export interface MeRequest {
  nome: string;
  email: string;
  telefone?: string;
  fotoPerfil?: string | null;
}

export interface AlterarSenhaRequest {
  senhaAtual: string;
  novaSenha: string;
}

export async function buscarMeuPerfil(): Promise<Usuario> {
  const res = await api.get<ApiResponse<Usuario>>('/usuarios/me');
  return res.data.data;
}

export async function atualizarMeuPerfil(data: MeRequest): Promise<Usuario> {
  const res = await api.put<ApiResponse<Usuario>>('/usuarios/me', data);
  return res.data.data;
}

export async function alterarMinhaSenha(data: AlterarSenhaRequest): Promise<void> {
  await api.put('/usuarios/me/senha', data);
}
