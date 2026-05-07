import api from './client';
import type { PapelariaItem, StatusCompra, ApiResponse } from '../types';

export interface PapelariaRequest {
  nome: string;
  imagemUrl?: string;
  quantidade: number;
}

export const criarPapelariaItem = async (projetoId: string, data: PapelariaRequest): Promise<PapelariaItem> => {
  const res = await api.post<ApiResponse<PapelariaItem>>(`/papelaria/projeto/${projetoId}`, data);
  return res.data.data;
};

export const atualizarStatusPapelaria = async (
  id: string,
  status: StatusCompra,
  justificativa?: string,
): Promise<PapelariaItem> => {
  const res = await api.patch<ApiResponse<PapelariaItem>>(`/papelaria/${id}/status`, { status, justificativa });
  return res.data.data;
};

export const criarPapelariaDoEstoque = async (
  projetoId: string,
  itemEstoqueId: string,
  quantidade: number,
): Promise<PapelariaItem> => {
  const res = await api.post<ApiResponse<PapelariaItem>>(
    `/papelaria/projeto/${projetoId}/do-estoque/${itemEstoqueId}`,
    null,
    { params: { quantidade } },
  );
  return res.data.data;
};

export const deletarPapelariaItem = async (id: string): Promise<void> => {
  await api.delete(`/papelaria/${id}`);
};
