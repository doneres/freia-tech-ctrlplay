import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronUp, X, GripVertical,
  ToggleLeft, ToggleRight, Settings, Workflow,
} from 'lucide-react';
import {
  listarTiposEvento, criarTipoEvento, atualizarTipoEvento, deletarTipoEvento,
  type TipoEventoRequest,
} from '../api/tipos-evento';
import type { TipoEvento, FormField, WorkflowStep, PerfilUsuario } from '../types';

const FIELD_TYPES = ['text', 'textarea', 'number', 'select', 'checkbox', 'date'] as const;
const PERFIS: PerfilUsuario[] = ['ADMINISTRADOR', 'COORDENACAO', 'COMERCIAL', 'MONITOR', 'INSTRUTOR'];

function parseJsonSafe<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

// ── Form Builder ────────────────────────────────────────────────────────────

interface FormBuilderProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

function FormBuilder({ fields, onChange }: FormBuilderProps) {
  function addField() {
    onChange([...fields, { id: `field_${Date.now()}`, type: 'text', label: 'Novo campo' }]);
  }

  function removeField(idx: number) {
    onChange(fields.filter((_, i) => i !== idx));
  }

  function updateField(idx: number, patch: Partial<FormField>) {
    onChange(fields.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  }

  return (
    <div className="space-y-3">
      {fields.map((field, idx) => (
        <div key={field.id} className="border border-gray-200 rounded-lg p-3 bg-white">
          <div className="flex items-center gap-2 mb-2">
            <GripVertical size={14} className="text-gray-300 shrink-0" />
            <input
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 font-medium"
              value={field.label}
              onChange={e => updateField(idx, { label: e.target.value })}
              placeholder="Rótulo do campo"
            />
            <button onClick={() => removeField(idx)} className="text-red-400 hover:text-red-600">
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-gray-500 mb-0.5">Tipo</label>
              <select
                className="w-full border border-gray-300 rounded px-2 py-1"
                value={field.type}
                onChange={e => updateField(idx, { type: e.target.value as FormField['type'] })}
              >
                {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-500 mb-0.5">ID (único)</label>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1 font-mono"
                value={field.id}
                onChange={e => updateField(idx, { id: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-500 mb-0.5">Seção</label>
              <input
                className="w-full border border-gray-300 rounded px-2 py-1"
                value={field.section ?? ''}
                onChange={e => updateField(idx, { section: e.target.value || undefined })}
                placeholder="Nome da seção"
              />
            </div>
            <div>
              <label className="block text-gray-500 mb-0.5">Tamanho máx.</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded px-2 py-1"
                value={field.maxLength ?? ''}
                onChange={e => updateField(idx, { maxLength: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="sem limite"
              />
            </div>
            {field.type === 'select' && (
              <div className="col-span-2">
                <label className="block text-gray-500 mb-0.5">Opções (uma por linha)</label>
                <textarea
                  className="w-full border border-gray-300 rounded px-2 py-1 h-16 resize-none"
                  value={(field.options ?? []).join('\n')}
                  onChange={e => updateField(idx, { options: e.target.value.split('\n').filter(Boolean) })}
                />
              </div>
            )}
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id={`req-${idx}`}
                checked={field.required ?? false}
                onChange={e => updateField(idx, { required: e.target.checked })}
              />
              <label htmlFor={`req-${idx}`} className="text-gray-600">Obrigatório</label>
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={addField}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-500 hover:border-brand-400 hover:text-brand-600 transition-colors"
      >
        + Adicionar campo
      </button>
    </div>
  );
}

// ── Workflow Builder ─────────────────────────────────────────────────────────

interface WorkflowBuilderProps {
  steps: WorkflowStep[];
  onChange: (steps: WorkflowStep[]) => void;
}

function WorkflowBuilder({ steps, onChange }: WorkflowBuilderProps) {
  function addStep() {
    const nextOrdem = steps.length > 0 ? Math.max(...steps.map(s => s.ordem)) + 1 : 1;
    onChange([...steps, {
      ordem: nextOrdem,
      nomeEtapa: `Etapa ${nextOrdem}`,
      tipo: 'sequential',
      perfilResponsavel: 'COORDENACAO',
      notificarEmail: true,
      camposAnalise: [],
    }]);
  }

  function removeStep(idx: number) {
    const updated = steps.filter((_, i) => i !== idx);
    onChange(updated.map((s, i) => ({ ...s, ordem: i + 1 })));
  }

  function updateStep(idx: number, patch: Partial<WorkflowStep>) {
    onChange(steps.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function addCampoAnalise(stepIdx: number) {
    const step = steps[stepIdx];
    const campos = [...(step.camposAnalise ?? [])];
    campos.push({ id: `campo_${Date.now()}`, type: 'textarea', label: 'Novo campo' });
    updateStep(stepIdx, { camposAnalise: campos });
  }

  function updateCampoAnalise(stepIdx: number, campoIdx: number, patch: Partial<FormField>) {
    const step = steps[stepIdx];
    const campos = (step.camposAnalise ?? []).map((c, i) => (i === campoIdx ? { ...c, ...patch } : c));
    updateStep(stepIdx, { camposAnalise: campos });
  }

  function removeCampoAnalise(stepIdx: number, campoIdx: number) {
    const step = steps[stepIdx];
    const campos = (step.camposAnalise ?? []).filter((_, i) => i !== campoIdx);
    updateStep(stepIdx, { camposAnalise: campos });
  }

  return (
    <div className="space-y-3">
      {steps.map((step, idx) => (
        <div key={step.ordem} className="border border-gray-200 rounded-lg p-3 bg-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center shrink-0">
              {step.ordem}
            </span>
            <input
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 font-medium"
              value={step.nomeEtapa}
              onChange={e => updateStep(idx, { nomeEtapa: e.target.value })}
            />
            <button onClick={() => removeStep(idx)} className="text-red-400 hover:text-red-600">
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
            <div>
              <label className="block text-gray-500 mb-0.5">Perfil responsável</label>
              <select
                className="w-full border border-gray-300 rounded px-2 py-1"
                value={step.perfilResponsavel}
                onChange={e => updateStep(idx, { perfilResponsavel: e.target.value as PerfilUsuario })}
              >
                {PERFIS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-500 mb-0.5">Tipo</label>
              <select
                className="w-full border border-gray-300 rounded px-2 py-1"
                value={step.tipo}
                onChange={e => updateStep(idx, { tipo: e.target.value as WorkflowStep['tipo'] })}
              >
                <option value="sequential">Sequencial</option>
                <option value="parallel">Paralelo (futuro)</option>
              </select>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id={`notify-${idx}`}
                checked={step.notificarEmail ?? true}
                onChange={e => updateStep(idx, { notificarEmail: e.target.checked })}
              />
              <label htmlFor={`notify-${idx}`} className="text-gray-600">Notificar por email</label>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-2">
            <p className="text-xs text-gray-500 mb-1 font-medium">Campos do analisador</p>
            <div className="space-y-1.5">
              {(step.camposAnalise ?? []).map((campo, ci) => (
                <div key={campo.id} className="flex items-center gap-1.5 text-xs">
                  <input
                    className="flex-1 border border-gray-200 rounded px-2 py-0.5"
                    value={campo.label}
                    onChange={e => updateCampoAnalise(idx, ci, { label: e.target.value })}
                    placeholder="Rótulo"
                  />
                  <select
                    className="border border-gray-200 rounded px-1.5 py-0.5"
                    value={campo.type}
                    onChange={e => updateCampoAnalise(idx, ci, { type: e.target.value as FormField['type'] })}
                  >
                    {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input
                    type="checkbox"
                    title="Obrigatório"
                    checked={campo.required ?? false}
                    onChange={e => updateCampoAnalise(idx, ci, { required: e.target.checked })}
                  />
                  <button onClick={() => removeCampoAnalise(idx, ci)} className="text-red-400">
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addCampoAnalise(idx)}
                className="text-xs text-brand-600 hover:text-brand-800"
              >
                + Campo de análise
              </button>
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={addStep}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-500 hover:border-brand-400 hover:text-brand-600 transition-colors"
      >
        + Adicionar etapa de aprovação
      </button>
    </div>
  );
}

// ── Modal de criação/edição ──────────────────────────────────────────────────

interface ModalProps {
  tipo?: TipoEvento;
  onClose: () => void;
  onSave: (data: TipoEventoRequest) => void;
  saving: boolean;
}

function TipoEventoModal({ tipo, onClose, onSave, saving }: ModalProps) {
  const [nome, setNome] = useState(tipo?.nome ?? '');
  const [descricao, setDescricao] = useState(tipo?.descricao ?? '');
  const [icone, setIcone] = useState(tipo?.icone ?? '');
  const [cor, setCor] = useState(tipo?.cor ?? '#7c3aed');
  const [usaLegado, setUsaLegado] = useState(tipo?.usaFormularioLegado ?? false);
  const [ativo, setAtivo] = useState(tipo?.ativo ?? true);
  const [formFields, setFormFields] = useState<FormField[]>(
    parseJsonSafe<FormField[]>(tipo?.formSchema, [])
  );
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>(
    parseJsonSafe<WorkflowStep[]>(tipo?.workflowConfig, [])
  );
  const [tab, setTab] = useState<'info' | 'form' | 'workflow'>('info');

  function handleSave() {
    onSave({
      nome,
      descricao: descricao || undefined,
      icone: icone || undefined,
      cor: cor || undefined,
      usaFormularioLegado: usaLegado,
      ativo,
      formSchema: usaLegado ? null : (formFields.length > 0 ? JSON.stringify(formFields) : null),
      workflowConfig: workflowSteps.length > 0 ? JSON.stringify(workflowSteps) : null,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {tipo ? 'Editar' : 'Novo'} Tipo de Evento
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6">
          {(['info', 'form', 'workflow'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              disabled={t !== 'info' && usaLegado}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors disabled:opacity-40 ${
                tab === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'info' ? 'Informações' : t === 'form' ? 'Formulário' : 'Workflow'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'info' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-20 resize-none"
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ícone (nome Lucide)</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={icone}
                    onChange={e => setIcone(e.target.value)}
                    placeholder="ex: Trophy, Laptop, GraduationCap"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      className="h-9 w-12 border border-gray-300 rounded-lg cursor-pointer"
                      value={cor}
                      onChange={e => setCor(e.target.value)}
                    />
                    <input
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                      value={cor}
                      onChange={e => setCor(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <button
                  onClick={() => setUsaLegado(v => !v)}
                  className={`shrink-0 ${usaLegado ? 'text-brand-600' : 'text-gray-400'}`}
                >
                  {usaLegado ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
                <div>
                  <p className="text-sm font-medium text-gray-700">Formulário legado</p>
                  <p className="text-xs text-gray-500">
                    Usa o formulário fixo da Feira Tecnológica em vez do construtor dinâmico
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <button
                  onClick={() => setAtivo(v => !v)}
                  className={`shrink-0 ${ativo ? 'text-green-600' : 'text-gray-400'}`}
                >
                  {ativo ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
                <div>
                  <p className="text-sm font-medium text-gray-700">Ativo</p>
                  <p className="text-xs text-gray-500">Disponível para uso em novos eventos</p>
                </div>
              </div>
            </div>
          )}

          {tab === 'form' && (
            <div>
              <p className="text-sm text-gray-500 mb-3">
                Defina os campos que o instrutor preencherá ao submeter um projeto deste tipo de evento.
              </p>
              <FormBuilder fields={formFields} onChange={setFormFields} />
            </div>
          )}

          {tab === 'workflow' && (
            <div>
              <p className="text-sm text-gray-500 mb-3">
                Configure as etapas de aprovação. Cada etapa é respondida pelo perfil designado antes de avançar.
              </p>
              <WorkflowBuilder steps={workflowSteps} onChange={setWorkflowSteps} />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !nome.trim()}
            className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TiposEventoPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoEvento | undefined>();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: tipos = [], isLoading } = useQuery({
    queryKey: ['tipos-evento'],
    queryFn: listarTiposEvento,
  });

  const createMutation = useMutation({
    mutationFn: criarTipoEvento,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tipos-evento'] }); setModalOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TipoEventoRequest }) => atualizarTipoEvento(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tipos-evento'] }); setModalOpen(false); setEditingTipo(undefined); },
  });

  const deleteMutation = useMutation({
    mutationFn: deletarTipoEvento,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tipos-evento'] }),
  });

  function handleSave(data: TipoEventoRequest) {
    if (editingTipo) {
      updateMutation.mutate({ id: editingTipo.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tipos de Evento</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure formulários e workflows de aprovação por tipo de evento</p>
        </div>
        <button
          onClick={() => { setEditingTipo(undefined); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700"
        >
          <Plus size={16} />
          Novo Tipo
        </button>
      </div>

      {isLoading && (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      )}

      <div className="space-y-2">
        {tipos.map(tipo => {
          const formFields = parseJsonSafe<FormField[]>(tipo.formSchema, []);
          const workflowSteps = parseJsonSafe<WorkflowStep[]>(tipo.workflowConfig, []);
          const expanded = expandedId === tipo.id;

          return (
            <div key={tipo.id} className="border border-gray-200 rounded-xl bg-white overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                {tipo.cor && (
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: tipo.cor }} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">{tipo.nome}</span>
                    {tipo.usaFormularioLegado && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">legado</span>
                    )}
                    {!tipo.ativo && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">inativo</span>
                    )}
                  </div>
                  {tipo.descricao && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">{tipo.descricao}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                  {!tipo.usaFormularioLegado && (
                    <>
                      <Settings size={12} />
                      <span>{formFields.length} campos</span>
                      <span className="mx-1">·</span>
                    </>
                  )}
                  <Workflow size={12} />
                  <span>{workflowSteps.length} etapas</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditingTipo(tipo); setModalOpen(true); }}
                    className="p-1.5 text-gray-400 hover:text-brand-600 rounded"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Excluir "${tipo.nome}"?`)) deleteMutation.mutate(tipo.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => setExpandedId(expanded ? null : tipo.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 rounded"
                  >
                    {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {expanded && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 text-xs text-gray-600 grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Formulário ({formFields.length} campos)</p>
                    {tipo.usaFormularioLegado ? (
                      <p className="italic text-gray-400">Usa formulário fixo da Feira Tech</p>
                    ) : formFields.length === 0 ? (
                      <p className="italic text-gray-400">Nenhum campo configurado</p>
                    ) : (
                      <ul className="space-y-0.5">
                        {formFields.map(f => (
                          <li key={f.id}>{f.label} <span className="text-gray-400">({f.type}{f.required ? ', obrig.' : ''})</span></li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Workflow ({workflowSteps.length} etapas)</p>
                    {workflowSteps.length === 0 ? (
                      <p className="italic text-gray-400">Sem workflow (aprovação manual)</p>
                    ) : (
                      <ol className="space-y-0.5 list-decimal list-inside">
                        {workflowSteps.map(s => (
                          <li key={s.ordem}>{s.nomeEtapa} <span className="text-gray-400">({s.perfilResponsavel})</span></li>
                        ))}
                      </ol>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <TipoEventoModal
          tipo={editingTipo}
          onClose={() => { setModalOpen(false); setEditingTipo(undefined); }}
          onSave={handleSave}
          saving={isSaving}
        />
      )}
    </div>
  );
}
