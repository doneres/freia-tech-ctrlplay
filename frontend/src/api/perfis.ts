import api from './client';
import type { ApiResponse, PerfilConfig } from '../types';

export interface PerfilRequest {
  nome: string;
  descricao?: string;
  cor?: string;
  permissoes?: string[];
}

export async function listarPerfis(): Promise<PerfilConfig[]> {
  const res = await api.get<ApiResponse<PerfilConfig[]>>('/perfis');
  return res.data.data;
}

export async function listarPerfisAtivos(): Promise<PerfilConfig[]> {
  const res = await api.get<ApiResponse<PerfilConfig[]>>('/perfis/ativos');
  return res.data.data;
}

export async function listarPermissoesDisponiveis(): Promise<string[]> {
  const res = await api.get<ApiResponse<string[]>>('/perfis/permissoes-disponiveis');
  return res.data.data;
}

export async function criarPerfil(data: PerfilRequest): Promise<PerfilConfig> {
  const res = await api.post<ApiResponse<PerfilConfig>>('/perfis', data);
  return res.data.data;
}

export async function atualizarPerfil(id: string, data: PerfilRequest): Promise<PerfilConfig> {
  const res = await api.put<ApiResponse<PerfilConfig>>(`/perfis/${id}`, data);
  return res.data.data;
}

export async function atualizarPermissoes(id: string, permissoes: string[]): Promise<void> {
  await api.put(`/perfis/${id}/permissoes`, { permissoes });
}

export async function deletarPerfil(id: string): Promise<void> {
  await api.delete(`/perfis/${id}`);
}
