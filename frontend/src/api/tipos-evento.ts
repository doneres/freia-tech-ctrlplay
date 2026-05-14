import api from './client';
import type { ApiResponse, TipoEvento } from '../types';

export interface TipoEventoRequest {
  nome: string;
  descricao?: string;
  icone?: string;
  cor?: string;
  formSchema?: string | null;
  workflowConfig?: string | null;
  usaFormularioLegado?: boolean;
  ativo?: boolean;
}

export async function listarTiposEvento(): Promise<TipoEvento[]> {
  const res = await api.get<ApiResponse<TipoEvento[]>>('/tipos-evento');
  return res.data.data;
}

export async function listarTiposEventoAtivos(): Promise<TipoEvento[]> {
  const res = await api.get<ApiResponse<TipoEvento[]>>('/tipos-evento/ativos');
  return res.data.data;
}

export async function buscarTipoEvento(id: string): Promise<TipoEvento> {
  const res = await api.get<ApiResponse<TipoEvento>>(`/tipos-evento/${id}`);
  return res.data.data;
}

export async function criarTipoEvento(data: TipoEventoRequest): Promise<TipoEvento> {
  const res = await api.post<ApiResponse<TipoEvento>>('/tipos-evento', data);
  return res.data.data;
}

export async function atualizarTipoEvento(id: string, data: TipoEventoRequest): Promise<TipoEvento> {
  const res = await api.put<ApiResponse<TipoEvento>>(`/tipos-evento/${id}`, data);
  return res.data.data;
}

export async function deletarTipoEvento(id: string): Promise<void> {
  await api.delete(`/tipos-evento/${id}`);
}
