import api from './client';
import type { ApiResponse } from '../types';

export interface Evento {
  id: string;
  nome: string;
  dataEvento: string;
  dataInicioSubmissao: string | null;
  dataFimSubmissao: string | null;
  descricao: string | null;
  submissaoAberta: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventoRequest {
  nome: string;
  dataEvento: string;
  dataInicioSubmissao?: string | null;
  dataFimSubmissao?: string | null;
  descricao?: string;
}

export async function listarEventos(): Promise<Evento[]> {
  const res = await api.get<ApiResponse<Evento[]>>('/eventos');
  return res.data.data;
}

export async function buscarProximoEvento(): Promise<Evento | null> {
  const res = await api.get<ApiResponse<Evento | null>>('/eventos/proximo');
  return res.data.data;
}

export async function criarEvento(data: EventoRequest): Promise<Evento> {
  const res = await api.post<ApiResponse<Evento>>('/eventos', data);
  return res.data.data;
}

export async function atualizarEvento(id: string, data: EventoRequest): Promise<Evento> {
  const res = await api.put<ApiResponse<Evento>>(`/eventos/${id}`, data);
  return res.data.data;
}

export async function deletarEvento(id: string): Promise<void> {
  await api.delete(`/eventos/${id}`);
}

export async function listarEventosComSubmissaoAberta(): Promise<Evento[]> {
  const res = await api.get<ApiResponse<Evento[]>>('/eventos/com-submissao-aberta');
  return res.data.data;
}
