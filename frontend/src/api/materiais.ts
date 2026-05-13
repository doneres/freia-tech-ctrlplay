import api from './client';
import type { ApiResponse, Material, MaterialPendente, StatusCompra } from '../types';

export interface MaterialRequest {
  item: string;
  quantidade: number;
  unidade?: string;
  custoUnitario?: number;
  imagemUrl?: string;
  links?: { nomeSite: string; url: string; valorEncontrado?: number }[];
}

export async function listarMateriais(projetoId: string): Promise<Material[]> {
  const res = await api.get<ApiResponse<Material[]>>(`/materiais/projeto/${projetoId}`);
  return res.data.data;
}

export async function criarMaterial(projetoId: string, data: MaterialRequest): Promise<Material> {
  const res = await api.post<ApiResponse<Material>>(`/materiais/projeto/${projetoId}`, data);
  return res.data.data;
}

export async function criarDoEstoque(
  projetoId: string,
  itemEstoqueId: string,
  quantidade: number
): Promise<Material> {
  const res = await api.post<ApiResponse<Material>>(
    `/materiais/projeto/${projetoId}/do-estoque/${itemEstoqueId}`,
    { quantidade }
  );
  return res.data.data;
}

export async function atualizarMaterial(id: string, data: MaterialRequest): Promise<Material> {
  const res = await api.put<ApiResponse<Material>>(`/materiais/${id}`, data);
  return res.data.data;
}

export async function deletarMaterial(id: string): Promise<void> {
  await api.delete(`/materiais/${id}`);
}

export async function atualizarStatusCompra(
  id: string,
  statusCompra: StatusCompra,
  justificativa?: string
): Promise<Material> {
  const res = await api.patch<ApiResponse<Material>>(`/materiais/${id}/status-compra`, {
    status: statusCompra,
    justificativa,
  });
  return res.data.data;
}

export async function listarSolicitacoesPendentes(): Promise<MaterialPendente[]> {
  const res = await api.get<ApiResponse<MaterialPendente[]>>('/materiais/aguardando-aprovacao');
  return res.data.data;
}
