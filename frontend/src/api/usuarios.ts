import api from './client';
import type { ApiResponse, Usuario, PerfilUsuario } from '../types';

export interface UsuarioRequest {
  nome: string;
  email: string;
  senha: string;
  perfil: PerfilUsuario;
}

export async function listarUsuarios(): Promise<Usuario[]> {
  const res = await api.get<ApiResponse<Usuario[]>>('/usuarios');
  return res.data.data;
}

export async function listarInstrutores(): Promise<Usuario[]> {
  const res = await api.get<ApiResponse<Usuario[]>>('/usuarios/perfil/INSTRUTOR');
  return res.data.data;
}

export async function criarUsuario(data: UsuarioRequest): Promise<Usuario> {
  const res = await api.post<ApiResponse<Usuario>>('/usuarios', data);
  return res.data.data;
}

export async function atualizarUsuario(id: string, data: UsuarioRequest): Promise<Usuario> {
  const res = await api.put<ApiResponse<Usuario>>(`/usuarios/${id}`, data);
  return res.data.data;
}

export async function desativarUsuario(id: string): Promise<void> {
  await api.delete(`/usuarios/${id}`);
}

export async function reativarUsuario(id: string): Promise<void> {
  await api.patch(`/usuarios/${id}/reativar`);
}
