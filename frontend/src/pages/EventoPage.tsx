import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash2, Loader2, Calendar, X,
  MapPin, Monitor, Smartphone, Projector, LayoutGrid, Table2, Users,
} from 'lucide-react';
import {
  listarEventos, criarEvento, atualizarEvento, deletarEvento,
  type Evento, type EventoRequest,
} from '../api/eventos';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

function toDatetimeLocal(iso: string) {
  return new Date(iso).toISOString().slice(0, 16);
}

function toISOFromLocal(local: string) {
  return new Date(local).toISOString();
}

const emptyForm: EventoRequest = {
  nome: '',
  dataEvento: '',
  dataInicioSubmissao: '',
  dataFimSubmissao: '',
  descricao: '',
  localEvento: '',
  qtdMesas: null,
  qtdComputadores: null,
  qtdCelularesTablets: null,
  qtdSalas: null,
  qtdProjetores: null,
  capacidadePorTurno: null,
};

function CapBadge({ icon: Icon, value, label, color }: {
  icon: React.ElementType; value: number | null; label: string; color: string;
}) {
  if (!value) return null;
  return (
    <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${color}`}>
      <Icon size={11} />
      <span>{value} {label}</span>
    </div>
  );
}

export default function EventoPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Evento | null>(null);
  const [form, setForm] = useState<EventoRequest>(emptyForm);
  const [activeSection, setActiveSection] = useState<'basico' | 'submissao' | 'infraestrutura'>('basico');

  if (user?.perfil !== 'ADMINISTRADOR' && user?.perfil !== 'COORDENACAO') return <Navigate to="/" replace />;

  const { data: eventos = [], isLoading } = useQuery({ queryKey: ['eventos'], queryFn: listarEventos });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['eventos'] });
    qc.invalidateQueries({ queryKey: ['evento-proximo'] });
    qc.invalidateQueries({ queryKey: ['eventos-submissao-aberta'] });
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
    setForm(emptyForm);
    setActiveSection('basico');
    setShowModal(true);
  }

  function openEdit(e: Evento) {
    setEditing(e);
    setForm({
      nome: e.nome,
      dataEvento: toDatetimeLocal(e.dataEvento),
      dataInicioSubmissao: e.dataInicioSubmissao ? toDatetimeLocal(e.dataInicioSubmissao) : '',
      dataFimSubmissao: e.dataFimSubmissao ? toDatetimeLocal(e.dataFimSubmissao) : '',
      descricao: e.descricao ?? '',
      localEvento: e.localEvento ?? '',
      qtdMesas: e.qtdMesas,
      qtdComputadores: e.qtdComputadores,
      qtdCelularesTablets: e.qtdCelularesTablets,
      qtdSalas: e.qtdSalas,
      qtdProjetores: e.qtdProjetores,
      capacidadePorTurno: e.capacidadePorTurno,
    });
    setActiveSection('basico');
    setShowModal(true);
  }

  function save() {
    const payload: EventoRequest = {
      ...form,
      dataEvento: toISOFromLocal(form.dataEvento),
      dataInicioSubmissao: form.dataInicioSubmissao ? toISOFromLocal(form.dataInicioSubmissao) : null,
      dataFimSubmissao: form.dataFimSubmissao ? toISOFromLocal(form.dataFimSubmissao) : null,
    };
    if (editing) {
      mutAtualizar.mutate({ id: editing.id, data: payload });
    } else {
      mutCriar.mutate(payload);
    }
  }

  const isPending = mutCriar.isPending || mutAtualizar.isPending;
  const canSave = form.nome.trim() && form.dataEvento;

  function numField(key: keyof EventoRequest) {
    return {
      type: 'number' as const,
      min: 0,
      value: (form[key] as number | null) ?? '',
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(f => ({ ...f, [key]: e.target.value === '' ? null : Number(e.target.value) })),
      className: 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500',
    };
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Eventos</h1>
          <p className="text-gray-500 text-sm mt-1">Cadastre a data, local e capacidade da feira</p>
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
            <div key={e.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{e.nome}</p>
                    {e.submissaoAberta ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Submissão aberta</span>
                    ) : e.dataInicioSubmissao ? (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Submissão fechada</span>
                    ) : null}
                    {new Date(e.dataEvento) > new Date() && (
                      <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">Próximo</span>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(e.dataEvento).toLocaleString('pt-BR', {
                      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>

                  {e.localEvento && (
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <MapPin size={11} /> {e.localEvento}
                    </p>
                  )}

                  {e.dataInicioSubmissao && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Submissão: {new Date(e.dataInicioSubmissao).toLocaleDateString('pt-BR')}
                      {e.dataFimSubmissao && ` → ${new Date(e.dataFimSubmissao).toLocaleDateString('pt-BR')}`}
                    </p>
                  )}

                  {e.descricao && <p className="text-xs text-gray-400 mt-1">{e.descricao}</p>}

                  {/* Capacity badges */}
                  {(e.qtdMesas || e.qtdComputadores || e.qtdCelularesTablets || e.qtdSalas || e.qtdProjetores || e.capacidadePorTurno) && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <CapBadge icon={Table2} value={e.qtdMesas} label="mesas" color="bg-blue-50 text-blue-700" />
                      <CapBadge icon={Monitor} value={e.qtdComputadores} label="computadores" color="bg-purple-50 text-purple-700" />
                      <CapBadge icon={Smartphone} value={e.qtdCelularesTablets} label="celulares/tablets" color="bg-cyan-50 text-cyan-700" />
                      <CapBadge icon={LayoutGrid} value={e.qtdSalas} label="salas" color="bg-amber-50 text-amber-700" />
                      <CapBadge icon={Projector} value={e.qtdProjetores} label="projetores" color="bg-pink-50 text-pink-700" />
                      <CapBadge icon={Users} value={e.capacidadePorTurno} label="proj/turno" color="bg-green-50 text-green-700" />
                    </div>
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
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <h3 className="text-base font-semibold text-gray-900">
                {editing ? 'Editar evento' : 'Novo evento'}
              </h3>
              <button onClick={() => setShowModal(false)}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
            </div>

            {/* Section tabs */}
            <div className="flex border-b border-gray-100 shrink-0">
              {(['basico', 'submissao', 'infraestrutura'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setActiveSection(s)}
                  className={`flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
                    activeSection === s ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {s === 'basico' ? 'Básico' : s === 'submissao' ? 'Submissão' : 'Infraestrutura'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">

              {activeSection === 'basico' && (
                <>
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
                    <label className="block text-xs font-medium text-gray-700 mb-1">Local / Endereço</label>
                    <input
                      type="text"
                      value={form.localEvento ?? ''}
                      onChange={e => setForm(f => ({ ...f, localEvento: e.target.value }))}
                      placeholder="Ex: Auditório principal, Rua X, 123"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
                    <textarea
                      rows={3}
                      value={form.descricao ?? ''}
                      onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                      placeholder="Informações adicionais..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                    />
                  </div>
                </>
              )}

              {activeSection === 'submissao' && (
                <>
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                    Define o período em que instrutores podem vincular projetos a este evento.
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Início das submissões</label>
                    <input
                      type="datetime-local"
                      value={form.dataInicioSubmissao ?? ''}
                      onChange={e => setForm(f => ({ ...f, dataInicioSubmissao: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Fim das submissões</label>
                    <input
                      type="datetime-local"
                      value={form.dataFimSubmissao ?? ''}
                      onChange={e => setForm(f => ({ ...f, dataFimSubmissao: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </>
              )}

              {activeSection === 'infraestrutura' && (
                <>
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                    Informe a capacidade do espaço. Esses dados ajudam a organizar os turnos da agenda automaticamente.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1"><Table2 size={11} /> Mesas</label>
                      <input {...numField('qtdMesas')} placeholder="Ex: 20" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1"><Users size={11} /> Proj. por turno</label>
                      <input {...numField('capacidadePorTurno')} placeholder="Ex: 15" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1"><Monitor size={11} /> Computadores</label>
                      <input {...numField('qtdComputadores')} placeholder="Ex: 30" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1"><Smartphone size={11} /> Celulares/Tablets</label>
                      <input {...numField('qtdCelularesTablets')} placeholder="Ex: 10" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1"><LayoutGrid size={11} /> Salas/Espaços</label>
                      <input {...numField('qtdSalas')} placeholder="Ex: 3" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1"><Projector size={11} /> Projetores</label>
                      <input {...numField('qtdProjetores')} placeholder="Ex: 2" />
                    </div>
                  </div>
                  {form.qtdMesas && form.capacidadePorTurno && (
                    <div className="bg-brand-50 border border-brand-100 rounded-lg px-3 py-2.5 text-xs text-brand-700">
                      Com {form.capacidadePorTurno} projetos por turno, cabem até{' '}
                      <strong>{form.capacidadePorTurno * 3} projetos</strong> em 3 turnos (manhã, tarde, noite).
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-3 px-6 pb-6 shrink-0 border-t border-gray-100 pt-4">
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
