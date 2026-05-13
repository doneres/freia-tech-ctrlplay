import api from './client';
import type { ApiResponse, Projeto, ProjetoRequest, StatusSemana, NivelTurma, Turno, StatusProjeto } from '../types';

export interface ProjetoFilters {
  instrutorId?: string;
  turno?: Turno;
  nivelTurma?: NivelTurma;
  statusS4?: StatusSemana;
  statusProjeto?: StatusProjeto;
  eventoId?: string;
  search?: string;
  itemEstoqueId?: string;
}

export async function listarProjetos(filters: ProjetoFilters = {}): Promise<Projeto[]> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
  );
  const res = await api.get<ApiResponse<Projeto[]>>('/projetos', { params });
  return res.data.data;
}

export async function buscarProjeto(id: string): Promise<Projeto> {
  const res = await api.get<ApiResponse<Projeto>>(`/projetos/${id}`);
  return res.data.data;
}

export async function criarProjeto(data: ProjetoRequest): Promise<Projeto> {
  const res = await api.post<ApiResponse<Projeto>>('/projetos', data);
  return res.data.data;
}

export async function atualizarProjeto(id: string, data: ProjetoRequest): Promise<Projeto> {
  const res = await api.put<ApiResponse<Projeto>>(`/projetos/${id}`, data);
  return res.data.data;
}

export async function deletarProjeto(id: string): Promise<void> {
  await api.delete(`/projetos/${id}`);
}

export async function submeterProjeto(id: string): Promise<Projeto> {
  const res = await api.patch<ApiResponse<Projeto>>(`/projetos/${id}/submeter`);
  return res.data.data;
}

export async function aprovarProjeto(id: string): Promise<Projeto> {
  const res = await api.patch<ApiResponse<Projeto>>(`/projetos/${id}/aprovar`);
  return res.data.data;
}

export async function reprovarProjeto(id: string, justificativa: string): Promise<Projeto> {
  const res = await api.patch<ApiResponse<Projeto>>(`/projetos/${id}/reprovar`, { justificativa });
  return res.data.data;
}

export async function atualizarStatusSemana(
  id: string,
  semana: string,
  status: StatusSemana
): Promise<Projeto> {
  const res = await api.patch<ApiResponse<Projeto>>(`/projetos/${id}/status-semana`, { semana, status });
  return res.data.data;
}

export async function iniciarAndamento(id: string): Promise<Projeto> {
  const res = await api.patch<ApiResponse<Projeto>>(`/projetos/${id}/iniciar-andamento`);
  return res.data.data;
}

export async function concluirProjeto(id: string): Promise<Projeto> {
  const res = await api.patch<ApiResponse<Projeto>>(`/projetos/${id}/concluir`);
  return res.data.data;
}

export async function vincularEvento(projetoId: string, eventoId: string): Promise<Projeto> {
  const res = await api.patch<ApiResponse<Projeto>>(`/projetos/${projetoId}/vincular-evento`, { eventoId });
  return res.data.data;
}
