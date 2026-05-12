import api from './client';
import type { ApiResponse } from '../types';
import type { ArquivoProjeto, TipoArquivo } from '../types';

export interface ArquivoRequest {
  titulo: string;
  url: string;
  tipo: TipoArquivo;
  descricao?: string;
}

export async function listarArquivos(projetoId: string): Promise<ArquivoProjeto[]> {
  const res = await api.get<ApiResponse<ArquivoProjeto[]>>(`/projetos/${projetoId}/arquivos`);
  return res.data.data;
}

export async function criarArquivo(projetoId: string, data: ArquivoRequest): Promise<ArquivoProjeto> {
  const res = await api.post<ApiResponse<ArquivoProjeto>>(`/projetos/${projetoId}/arquivos`, data);
  return res.data.data;
}

export async function deletarArquivo(projetoId: string, arquivoId: string): Promise<void> {
  await api.delete(`/projetos/${projetoId}/arquivos/${arquivoId}`);
}
