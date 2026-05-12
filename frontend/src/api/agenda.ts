import api from './client';
import type { ApiResponse, Projeto, ItemEstoque } from '../types';

export interface ItemSuperlotado {
  item: ItemEstoque;
  demandaTotal: number;
  disponivel: number;
}

export interface ProjetoAgendado {
  projeto: Projeto;
  materiaisConflitantes: string[];
}

export interface RecomendacaoAgenda {
  manha: ProjetoAgendado[];
  tarde: ProjetoAgendado[];
  naoAlocados: ProjetoAgendado[];
  itensSuperlotados: ItemSuperlotado[];
}

export async function buscarRecomendacao(): Promise<RecomendacaoAgenda> {
  const res = await api.get<ApiResponse<RecomendacaoAgenda>>('/agenda/recomendacao');
  return res.data.data;
}
