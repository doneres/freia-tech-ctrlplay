import api from './client';
import type { ApiResponse, EtapaAprovacao, StatusEtapaAprovacao } from '../types';

export interface RespostaEtapaRequest {
  status: StatusEtapaAprovacao;
  motivo?: string;
  dadosAnalise?: string;
}

export async function listarEtapasProjeto(projetoId: string): Promise<EtapaAprovacao[]> {
  const res = await api.get<ApiResponse<EtapaAprovacao[]>>(`/projetos/${projetoId}/etapas`);
  return res.data.data;
}

export async function responderEtapa(projetoId: string, data: RespostaEtapaRequest): Promise<void> {
  await api.patch(`/projetos/${projetoId}/etapas/responder`, data);
}
