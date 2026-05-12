import api from './client';
import type { ApiResponse } from '../types';
import type { RegistroAcompanhamento, FaseDesignThinking } from '../types';

export interface AcompanhamentoRequest {
  fase: FaseDesignThinking;
  titulo: string;
  descricao: string;
  semana?: number;
}

export async function listarAcompanhamento(projetoId: string): Promise<RegistroAcompanhamento[]> {
  const res = await api.get<ApiResponse<RegistroAcompanhamento[]>>(`/projetos/${projetoId}/acompanhamento`);
  return res.data.data;
}

export async function criarRegistro(projetoId: string, data: AcompanhamentoRequest): Promise<RegistroAcompanhamento> {
  const res = await api.post<ApiResponse<RegistroAcompanhamento>>(`/projetos/${projetoId}/acompanhamento`, data);
  return res.data.data;
}

export async function deletarRegistro(projetoId: string, registroId: string): Promise<void> {
  await api.delete(`/projetos/${projetoId}/acompanhamento/${registroId}`);
}
