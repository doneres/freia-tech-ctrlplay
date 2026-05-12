import api from './client';
import type { ApiResponse } from '../types';
import type { PostForum, CategoriaForum } from '../types';

export interface PostRequest {
  titulo: string;
  conteudo: string;
  categoria: CategoriaForum;
}

export interface RespostaRequest {
  conteudo: string;
}

export async function listarPosts(): Promise<PostForum[]> {
  const res = await api.get<ApiResponse<PostForum[]>>('/forum');
  return res.data.data;
}

export async function buscarPost(id: string): Promise<PostForum> {
  const res = await api.get<ApiResponse<PostForum>>(`/forum/${id}`);
  return res.data.data;
}

export async function criarPost(data: PostRequest): Promise<PostForum> {
  const res = await api.post<ApiResponse<PostForum>>('/forum', data);
  return res.data.data;
}

export async function responderPost(postId: string, data: RespostaRequest): Promise<void> {
  await api.post(`/forum/${postId}/respostas`, data);
}

export async function deletarPost(id: string): Promise<void> {
  await api.delete(`/forum/${id}`);
}

export async function fixarPost(id: string): Promise<PostForum> {
  const res = await api.patch<ApiResponse<PostForum>>(`/forum/${id}/fixar`);
  return res.data.data;
}
