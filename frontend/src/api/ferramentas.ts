import api from './client';
import type { ApiResponse, FerramentaSoftware } from '../types';

export interface FerramentaSoftwareRequest {
  nome: string;
  categoria?: string;
  descricao?: string;
  imagemUrl?: string;
}

export async function listarFerramentas(apenasAtivas = true): Promise<FerramentaSoftware[]> {
  const res = await api.get<ApiResponse<FerramentaSoftware[]>>('/ferramentas-software', {
    params: { apenasAtivas },
  });
  return res.data.data;
}

export async function criarFerramenta(data: FerramentaSoftwareRequest): Promise<FerramentaSoftware> {
  const res = await api.post<ApiResponse<FerramentaSoftware>>('/ferramentas-software', data);
  return res.data.data;
}

export async function atualizarFerramenta(id: string, data: FerramentaSoftwareRequest): Promise<FerramentaSoftware> {
  const res = await api.put<ApiResponse<FerramentaSoftware>>(`/ferramentas-software/${id}`, data);
  return res.data.data;
}

export async function desativarFerramenta(id: string): Promise<void> {
  await api.patch(`/ferramentas-software/${id}/desativar`);
}

export async function reativarFerramenta(id: string): Promise<FerramentaSoftware> {
  const res = await api.patch<ApiResponse<FerramentaSoftware>>(`/ferramentas-software/${id}/reativar`);
  return res.data.data;
}
