import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Loader2, ShieldCheck, Pencil, Trash2, Lock } from 'lucide-react';
import {
  listarPerfis, listarPermissoesDisponiveis, criarPerfil, atualizarPerfil, deletarPerfil,
  type PerfilRequest,
} from '../api/perfis';
import type { PerfilConfig } from '../types';

const PERMISSAO_LABELS: Record<string, string> = {
  VER_PROJETOS: 'Ver projetos',
  CRIAR_PROJETO: 'Criar projeto',
  EDITAR_PROJETO: 'Editar projeto',
  EXCLUIR_PROJETO: 'Excluir projeto',
  SUBMETER_PROJETO: 'Submeter projeto',
  APROVAR_PROJETO: 'Aprovar projeto',
  REPROVAR_PROJETO: 'Reprovar projeto',
  INICIAR_ANDAMENTO_PROJETO: 'Iniciar andamento',
  CONCLUIR_PROJETO: 'Concluir projeto',
  RESPONDER_ETAPA_APROVACAO: 'Responder etapa de aprovação',
  VER_USUARIOS: 'Ver usuários',
  CRIAR_USUARIO: 'Criar usuário',
  EDITAR_USUARIO: 'Editar usuário',
  DESATIVAR_USUARIO: 'Desativar usuário',
  VER_ESTOQUE: 'Ver estoque',
  CRIAR_ESTOQUE: 'Criar item de estoque',
  EDITAR_ESTOQUE: 'Editar estoque',
  EXCLUIR_ESTOQUE: 'Excluir estoque',
  VER_SOLICITACOES: 'Ver solicitações de compra',
  APROVAR_MATERIAL: 'Aprovar material',
  VER_FERRAMENTAS: 'Ver ferramentas de software',
  GERENCIAR_FERRAMENTAS: 'Gerenciar ferramentas',
  VER_EVENTOS: 'Ver eventos',
  GERENCIAR_EVENTOS: 'Gerenciar eventos',
  VER_TIPOS_EVENTO: 'Ver tipos de evento',
  GERENCIAR_TIPOS_EVENTO: 'Gerenciar tipos de evento',
  VER_RELATORIOS_ESTOQUE: 'Ver relatórios de estoque',
  VER_RELATORIOS_PROJETOS: 'Ver relatórios de projetos',
  VER_RELATORIOS_PROPRIOS: 'Ver meus relatórios',
  VER_FORUM: 'Ver fórum',
  CRIAR_POST_FORUM: 'Criar post no fórum',
  FIXAR_POST_FORUM: 'Fixar post no fórum',
  VER_AGENDA: 'Ver agenda',
  GERENCIAR_PERFIS: 'Gerenciar perfis',
};

const PERMISSAO_GRUPOS: { label: string; permissoes: string[] }[] = [
  { label: 'Projetos', permissoes: ['VER_PROJETOS', 'CRIAR_PROJETO', 'EDITAR_PROJETO', 'EXCLUIR_PROJETO', 'SUBMETER_PROJETO', 'APROVAR_PROJETO', 'REPROVAR_PROJETO', 'INICIAR_ANDAMENTO_PROJETO', 'CONCLUIR_PROJETO', 'RESPONDER_ETAPA_APROVACAO'] },
  { label: 'Usuários', permissoes: ['VER_USUARIOS', 'CRIAR_USUARIO', 'EDITAR_USUARIO', 'DESATIVAR_USUARIO'] },
  { label: 'Estoque', permissoes: ['VER_ESTOQUE', 'CRIAR_ESTOQUE', 'EDITAR_ESTOQUE', 'EXCLUIR_ESTOQUE', 'VER_SOLICITACOES', 'APROVAR_MATERIAL'] },
  { label: 'Ferramentas', permissoes: ['VER_FERRAMENTAS', 'GERENCIAR_FERRAMENTAS'] },
  { label: 'Eventos', permissoes: ['VER_EVENTOS', 'GERENCIAR_EVENTOS', 'VER_TIPOS_EVENTO', 'GERENCIAR_TIPOS_EVENTO'] },
  { label: 'Relatórios', permissoes: ['VER_RELATORIOS_ESTOQUE', 'VER_RELATORIOS_PROJETOS', 'VER_RELATORIOS_PROPRIOS'] },
  { label: 'Fórum', permissoes: ['VER_FORUM', 'CRIAR_POST_FORUM', 'FIXAR_POST_FORUM'] },
  { label: 'Sistema', permissoes: ['VER_AGENDA', 'GERENCIAR_PERFIS'] },
];

const emptyForm: PerfilRequest = { nome: '', descricao: '', cor: '#6b7280', permissoes: [] };

export default function GerenciarPerfisPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PerfilConfig | null>(null);
  const [form, setForm] = useState<PerfilRequest>(emptyForm);
  const [error, setError] = useState('');

  const { data: perfis = [], isLoading } = useQuery<PerfilConfig[]>({
    queryKey: ['perfis'],
    queryFn: listarPerfis,
  });

  const { data: permissoesDisponiveis = [] } = useQuery<string[]>({
    queryKey: ['permissoes-disponiveis'],
    queryFn: listarPermissoesDisponiveis,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['perfis'] });

  const mutCriar = useMutation({
    mutationFn: criarPerfil,
    onSuccess: () => { invalidate(); closeModal(); },
    onError: handleError,
  });

  const mutAtualizar = useMutation({
    mutationFn: (data: PerfilRequest) => atualizarPerfil(editing!.id, data),
    onSuccess: () => { invalidate(); closeModal(); },
    onError: handleError,
  });

  const mutDeletar = useMutation({
    mutationFn: deletarPerfil,
    onSuccess: invalidate,
    onError: handleError,
  });

  function handleError(err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
    setError(msg ?? 'Erro ao salvar perfil.');
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  }

  function openEdit(p: PerfilConfig) {
    setEditing(p);
    setForm({ nome: p.nome, descricao: p.descricao ?? '', cor: p.cor ?? '#6b7280', permissoes: [...p.permissoes] });
    setError('');
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setError('');
  }

  function togglePermissao(p: string) {
    setForm(prev => ({
      ...prev,
      permissoes: prev.permissoes?.includes(p)
        ? prev.permissoes.filter(x => x !== p)
        : [...(prev.permissoes ?? []), p],
    }));
  }

  function toggleGrupo(permissoes: string[]) {
    const current = form.permissoes ?? [];
    const allSelected = permissoes.every(p => current.includes(p));
    if (allSelected) {
      setForm(prev => ({ ...prev, permissoes: current.filter(p => !permissoes.includes(p)) }));
    } else {
      const combined = Array.from(new Set([...current, ...permissoes]));
      setForm(prev => ({ ...prev, permissoes: combined }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (editing) {
      mutAtualizar.mutate(form);
    } else {
      mutCriar.mutate(form);
    }
  }

  const isPending = mutCriar.isPending || mutAtualizar.isPending;

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perfis de Acesso</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie perfis e suas permissões no sistema</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Novo perfil
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-brand-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {perfis.map(p => (
            <div key={p.id} className={`bg-white border rounded-xl p-4 ${!p.ativo ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: (p.cor ?? '#6b7280') + '20' }}
                  >
                    <ShieldCheck size={16} style={{ color: p.cor ?? '#6b7280' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p.nome}</p>
                    {p.builtin && (
                      <span className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Lock size={10} /> Padrão do sistema
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(p)}
                    className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  {!p.builtin && (
                    <button
                      onClick={() => { if (confirm(`Excluir perfil "${p.nome}"?`)) mutDeletar.mutate(p.id); }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {p.descricao && (
                <p className="text-xs text-gray-500 mb-3">{p.descricao}</p>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{p.permissoes.length} permissões</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {p.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              {p.permissoes.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {p.permissoes.slice(0, 5).map(perm => (
                    <span key={perm} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                      {PERMISSAO_LABELS[perm] ?? perm}
                    </span>
                  ))}
                  {p.permissoes.length > 5 && (
                    <span className="text-[10px] text-gray-400 px-1.5 py-0.5">
                      +{p.permissoes.length - 5} mais
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                {editing ? `Editar: ${editing.nome}` : 'Novo perfil'}
              </h3>
              <button onClick={closeModal}>
                <X size={18} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nome do perfil * <span className="text-gray-400 font-normal">(maiúsculo, sem espaços)</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={editing?.builtin}
                    value={form.nome}
                    onChange={e => setForm(p => ({ ...p, nome: e.target.value.toUpperCase().replace(/\s/g, '_') }))}
                    placeholder="EX: PARCEIRO_EXTERNO"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cor</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.cor ?? '#6b7280'}
                      onChange={e => setForm(p => ({ ...p, cor: e.target.value }))}
                      className="h-9 w-14 rounded border border-gray-300 cursor-pointer p-0.5"
                    />
                    <span className="text-sm text-gray-500">{form.cor}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
                <input
                  type="text"
                  value={form.descricao ?? ''}
                  onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
                  placeholder="Descreva o papel deste perfil..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-700">Permissões</label>
                  <span className="text-xs text-gray-400">{(form.permissoes ?? []).length} selecionadas</span>
                </div>

                <div className="space-y-4 max-h-72 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {PERMISSAO_GRUPOS.map(grupo => {
                    const grupoDisponiveis = grupo.permissoes.filter(p => permissoesDisponiveis.includes(p));
                    if (grupoDisponiveis.length === 0) return null;
                    const allSelected = grupoDisponiveis.every(p => form.permissoes?.includes(p));
                    const someSelected = grupoDisponiveis.some(p => form.permissoes?.includes(p));
                    return (
                      <div key={grupo.label}>
                        <button
                          type="button"
                          onClick={() => toggleGrupo(grupoDisponiveis)}
                          className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 hover:text-gray-900"
                        >
                          <span
                            className={`w-4 h-4 rounded border flex items-center justify-center text-white ${allSelected ? 'bg-brand-600 border-brand-600' : someSelected ? 'bg-brand-200 border-brand-300' : 'border-gray-300'}`}
                          >
                            {(allSelected || someSelected) && '✓'}
                          </span>
                          {grupo.label}
                        </button>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pl-6">
                          {grupoDisponiveis.map(perm => (
                            <label key={perm} className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 hover:text-gray-900 py-0.5">
                              <input
                                type="checkbox"
                                checked={form.permissoes?.includes(perm) ?? false}
                                onChange={() => togglePermissao(perm)}
                                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                              />
                              {PERMISSAO_LABELS[perm] ?? perm}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                  {editing ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
