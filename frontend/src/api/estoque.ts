import api from './client';
import type { ApiResponse, ItemEstoque, TipoItemEstoque } from '../types';

export interface ItemEstoqueRequest {
  nome: string;
  descricao?: string;
  tipo: TipoItemEstoque;
  categoria?: string;
  marca?: string;
  modelo?: string;
  quantidadeTotal: number;
  imagemUrl?: string;
}

export interface EstoqueFilters {
  tipo?: TipoItemEstoque;
  search?: string;
  apenasAtivos?: boolean;
}

export async function listarEstoque(filters: EstoqueFilters = {}): Promise<ItemEstoque[]> {
  const params = Object.fromEntries(
    Object.entries({ ...filters, apenasAtivos: filters.apenasAtivos ?? true })
      .filter(([, v]) => v !== undefined && v !== '')
  );
  const res = await api.get<ApiResponse<ItemEstoque[]>>('/estoque', { params });
  return res.data.data;
}

export async function buscarItemEstoque(id: string): Promise<ItemEstoque> {
  const res = await api.get<ApiResponse<ItemEstoque>>(`/estoque/${id}`);
  return res.data.data;
}

export async function criarItemEstoque(data: ItemEstoqueRequest): Promise<ItemEstoque> {
  const res = await api.post<ApiResponse<ItemEstoque>>('/estoque', data);
  return res.data.data;
}

export async function atualizarItemEstoque(id: string, data: ItemEstoqueRequest): Promise<ItemEstoque> {
  const res = await api.put<ApiResponse<ItemEstoque>>(`/estoque/${id}`, data);
  return res.data.data;
}

export async function ajustarDisponivel(id: string, quantidade: number): Promise<ItemEstoque> {
  const res = await api.patch<ApiResponse<ItemEstoque>>(`/estoque/${id}/ajustar-disponivel`, { quantidade });
  return res.data.data;
}

export async function desativarItemEstoque(id: string): Promise<void> {
  await api.patch(`/estoque/${id}/desativar`);
}

export async function reativarItemEstoque(id: string): Promise<ItemEstoque> {
  const res = await api.patch<ApiResponse<ItemEstoque>>(`/estoque/${id}/reativar`);
  return res.data.data;
}

export async function deletarItemEstoque(id: string): Promise<void> {
  await api.delete(`/estoque/${id}`);
}
