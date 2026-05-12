import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, Calendar, X } from 'lucide-react';
import { listarEventos, criarEvento, atualizarEvento, deletarEvento, type Evento, type EventoRequest } from '../api/eventos';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

function toDatetimeLocal(iso: string) {
  return new Date(iso).toISOString().slice(0, 16);
}

function toISOFromLocal(local: string) {
  return new Date(local).toISOString();
}

export default function EventoPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Evento | null>(null);
  const [form, setForm] = useState<EventoRequest>({ nome: '', dataEvento: '', descricao: '' });

  if (user?.perfil !== 'ADMINISTRADOR') return <Navigate to="/" replace />;

  const { data: eventos = [], isLoading } = useQuery({ queryKey: ['eventos'], queryFn: listarEventos });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['eventos'] });
    qc.invalidateQueries({ queryKey: ['evento-proximo'] });
  };

  const mutCriar = useMutation({
    mutationFn: criarEvento,
    onSuccess: () => { invalidate(); setShowModal(false); },
  });
  const mutAtualizar = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EventoRequest }) => atualizarEvento(id, data),
    onSuccess: () => { invalidate(); setShowModal(false); setEditing(null); },
  });
  const mutDeletar = useMutation({
    mutationFn: deletarEvento,
    onSuccess: invalidate,
  });

  function openCreate() {
    setEditing(null);
    setForm({ nome: '', dataEvento: '', descricao: '' });
    setShowModal(true);
  }

  function openEdit(e: Evento) {
    setEditing(e);
    setForm({ nome: e.nome, dataEvento: toDatetimeLocal(e.dataEvento), descricao: e.descricao ?? '' });
    setShowModal(true);
  }

  function save() {
    const payload = { ...form, dataEvento: toISOFromLocal(form.dataEvento) };
    if (editing) {
      mutAtualizar.mutate({ id: editing.id, data: payload });
    } else {
      mutCriar.mutate(payload);
    }
  }

  const isPending = mutCriar.isPending || mutAtualizar.isPending;
  const canSave = form.nome.trim() && form.dataEvento;

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Evento</h1>
          <p className="text-gray-500 text-sm mt-1">Cadastre a data e nome da feira tecnológica</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Novo evento
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-brand-600" /></div>
      ) : eventos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Calendar size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">Nenhum evento cadastrado.</p>
          <button onClick={openCreate} className="mt-3 text-brand-600 text-sm font-medium hover:underline">Cadastrar evento</button>
        </div>
      ) : (
        <div className="space-y-3">
          {eventos.map(e => (
            <div key={e.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900">{e.nome}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {new Date(e.dataEvento).toLocaleString('pt-BR', {
                    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
                {e.descricao && <p className="text-xs text-gray-400 mt-1">{e.descricao}</p>}
                {new Date(e.dataEvento) > new Date() && (
                  <span className="mt-2 inline-block text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">Próximo</span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => openEdit(e)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => { if (confirm('Excluir evento?')) mutDeletar.mutate(e.id); }}
                  disabled={mutDeletar.isPending}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-60"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                {editing ? 'Editar evento' : 'Novo evento'}
              </h3>
              <button onClick={() => setShowModal(false)}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nome do evento <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Feira Tecnológica 2025"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Data e hora <span className="text-red-500">*</span></label>
                <input
                  type="datetime-local"
                  value={form.dataEvento}
                  onChange={e => setForm(f => ({ ...f, dataEvento: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  rows={3}
                  value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  placeholder="Informações adicionais..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button
                onClick={save}
                disabled={!canSave || isPending}
                className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2"
              >
                {isPending && <Loader2 size={14} className="animate-spin" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
