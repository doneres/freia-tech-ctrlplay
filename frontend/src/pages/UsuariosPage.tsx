import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Loader2, UserX, Pencil } from 'lucide-react';
import { listarUsuarios, criarUsuario, atualizarUsuario, desativarUsuario, type UsuarioRequest } from '../api/usuarios';
import type { Usuario, PerfilUsuario } from '../types';

const perfilLabels: Record<PerfilUsuario, string> = {
  ADMINISTRADOR: 'Administrador',
  INSTRUTOR: 'Instrutor',
  COORDENACAO: 'Coordenação',
  MONITOR: 'Monitor',
};

const perfilColors: Record<PerfilUsuario, string> = {
  ADMINISTRADOR: 'bg-brand-100 text-brand-700',
  INSTRUTOR: 'bg-blue-100 text-blue-700',
  COORDENACAO: 'bg-green-100 text-green-700',
  MONITOR: 'bg-amber-100 text-amber-700',
};

const emptyForm: UsuarioRequest = { nome: '', email: '', senha: '', perfil: 'INSTRUTOR' };

export default function UsuariosPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [form, setForm] = useState<UsuarioRequest>(emptyForm);
  const [senhaConfirmacao, setSenhaConfirmacao] = useState('');
  const [error, setError] = useState('');

  const { data: usuarios = [], isLoading } = useQuery<Usuario[]>({
    queryKey: ['usuarios'],
    queryFn: listarUsuarios,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['usuarios'] });

  const mutCriar = useMutation({
    mutationFn: (data: UsuarioRequest) => criarUsuario(data),
    onSuccess: () => { invalidate(); closeModal(); },
    onError: handleError,
  });

  const mutAtualizar = useMutation({
    mutationFn: (data: UsuarioRequest) => atualizarUsuario(editing!.id, data),
    onSuccess: () => { invalidate(); closeModal(); },
    onError: handleError,
  });

  const mutDesativar = useMutation({
    mutationFn: (id: string) => desativarUsuario(id),
    onSuccess: invalidate,
  });

  function handleError(err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
    setError(msg ?? 'Erro ao salvar usuário.');
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setSenhaConfirmacao('');
    setError('');
    setShowModal(true);
  }

  function openEdit(u: Usuario) {
    setEditing(u);
    setForm({ nome: u.nome, email: u.email, senha: '', perfil: u.perfil });
    setSenhaConfirmacao('');
    setError('');
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setSenhaConfirmacao('');
    setError('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const senhaPreenchida = !!form.senha;
    if (!editing && !senhaPreenchida) {
      return setError('Senha é obrigatória.');
    }
    if (senhaPreenchida && form.senha !== senhaConfirmacao) {
      return setError('As senhas não coincidem.');
    }
    if (senhaPreenchida && form.senha!.length < 6) {
      return setError('Senha deve ter no mínimo 6 caracteres.');
    }
    if (editing) {
      mutAtualizar.mutate(form);
    } else {
      mutCriar.mutate(form);
    }
  }

  const isPending = mutCriar.isPending || mutAtualizar.isPending;

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-500 text-sm mt-1">{usuarios.length} usuário{usuarios.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Novo usuário
        </button>
      </div>

      {/* Table / Cards */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-brand-600" />
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {usuarios.map((u) => (
              <div key={u.id} className={`bg-white rounded-xl border border-gray-200 p-4 ${!u.ativo ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{u.nome}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{u.email}</p>
                    <div className="flex items-center flex-wrap gap-2 mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${perfilColors[u.perfil]}`}>
                        {perfilLabels[u.perfil]}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEdit(u)}
                      className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil size={15} />
                    </button>
                    {u.ativo && (
                      <button
                        onClick={() => { if (confirm(`Desativar ${u.nome}?`)) mutDesativar.mutate(u.id); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Desativar"
                      >
                        <UserX size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Nome
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Email
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Perfil
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usuarios.map((u) => (
                  <tr key={u.id} className={!u.ativo ? 'opacity-50' : ''}>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{u.nome}</td>
                    <td className="px-5 py-3.5 text-gray-600">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${perfilColors[u.perfil]}`}>
                        {perfilLabels[u.perfil]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(u)}
                          className="text-gray-400 hover:text-brand-600 transition-colors"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        {u.ativo && (
                          <button
                            onClick={() => { if (confirm(`Desativar ${u.nome}?`)) mutDesativar.mutate(u.id); }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Desativar"
                          >
                            <UserX size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-900">
                {editing ? 'Editar usuário' : 'Novo usuário'}
              </h3>
              <button onClick={closeModal}>
                <X size={18} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  required
                  value={form.nome}
                  onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Senha {editing ? <span className="font-normal text-gray-400">(deixe em branco para manter)</span> : <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  value={form.senha}
                  onChange={(e) => setForm((p) => ({ ...p, senha: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder={editing ? '••••••••' : 'Mínimo 6 caracteres'}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Confirmar senha {editing ? <span className="font-normal text-gray-400">(se alterar a senha)</span> : <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  value={senhaConfirmacao}
                  onChange={(e) => setSenhaConfirmacao(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Perfil *</label>
                <select
                  value={form.perfil}
                  onChange={(e) => setForm((p) => ({ ...p, perfil: e.target.value as PerfilUsuario }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="INSTRUTOR">Instrutor</option>
                  <option value="COORDENACAO">Coordenação</option>
                  <option value="MONITOR">Monitor</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                </select>
              </div>

              <div className="flex gap-3 mt-5">
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
