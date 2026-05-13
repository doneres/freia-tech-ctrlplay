import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Loader2, CheckCircle, XCircle, Send, Trash2,
  ShoppingCart, X, Plus, Package, Cpu, Code2, Gamepad2, Paperclip,
  Search, ExternalLink, Pencil, FolderOpen, Globe, Video, Link as LinkIcon, Layers, PlayCircle, Flag,
} from 'lucide-react';
import {
  buscarProjeto, submeterProjeto, aprovarProjeto, reprovarProjeto,
  deletarProjeto, atualizarStatusSemana, iniciarAndamento, concluirProjeto,
} from '../api/projetos';
import {
  criarMaterial, criarDoEstoque, atualizarStatusCompra, deletarMaterial,
  type MaterialRequest,
} from '../api/materiais';
import {
  criarPapelariaItem, criarPapelariaDoEstoque, atualizarStatusPapelaria, deletarPapelariaItem,
  type PapelariaRequest,
} from '../api/papelaria';
import { listarEstoque } from '../api/estoque';
import { listarAcompanhamento, criarRegistro, deletarRegistro, type AcompanhamentoRequest } from '../api/acompanhamento';
import { listarArquivos, criarArquivo, deletarArquivo, type ArquivoRequest } from '../api/arquivos';
import type { Projeto, StatusSemana, StatusCompra, Material, ItemEstoque, TipoItemEstoque, PapelariaItem, RegistroAcompanhamento, ArquivoProjeto, FaseDesignThinking, TipoArquivo } from '../types';
import StatusBadge from '../components/ui/StatusBadge';
import { useAuth } from '../contexts/AuthContext';

type Tab = 'geral' | 'proposta' | 'materiais' | 'papelaria' | 'cronograma' | 'arquivos';
type MaterialMode = 'estoque' | 'compra';
type PapelariaMode = 'estoque' | 'compra';

const semanas: { key: string; label: string; field: keyof Projeto }[] = [
  { key: 'S1', label: 'Semana 1', field: 'statusS1' },
  { key: 'S2', label: 'Semana 2', field: 'statusS2' },
  { key: 'S3', label: 'Semana 3', field: 'statusS3' },
  { key: 'S4', label: 'Semana 4 (entrega)', field: 'statusS4' },
];

const statusSemanaOptions: StatusSemana[] = ['NAO_INICIADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'ATRASADO'];
const statusSemanaLabels: Record<StatusSemana, string> = {
  NAO_INICIADO: 'Não iniciado', EM_ANDAMENTO: 'Em andamento', CONCLUIDO: 'Concluído', ATRASADO: 'Atrasado',
};

const TIPO_ICONS: Record<TipoItemEstoque, React.ElementType> = {
  HARDWARE: Cpu, SOFTWARE: Code2, PERIFERICO: Gamepad2, PAPELARIA: Paperclip,
};
const TIPO_COLORS: Record<TipoItemEstoque, string> = {
  HARDWARE: 'bg-blue-100 text-blue-700', SOFTWARE: 'bg-purple-100 text-purple-700',
  PERIFERICO: 'bg-amber-100 text-amber-700', PAPELARIA: 'bg-pink-100 text-pink-700',
};

export default function ProjetoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>('geral');
  const [showReprovacaoModal, setShowReprovacaoModal] = useState(false);
  const [justificativaReprovacao, setJustificativaReprovacao] = useState('');
  const [materialModalMode, setMaterialModalMode] = useState<MaterialMode | null>(null);
  const [papelariaModalMode, setPapelariaModalMode] = useState<PapelariaMode | null>(null);
  const [statusCompraError, setStatusCompraError] = useState<string | null>(null);
  const [failedMaterialId, setFailedMaterialId] = useState<string | null>(null);

  const { data: projeto, isLoading } = useQuery<Projeto>({
    queryKey: ['projeto', id],
    queryFn: () => buscarProjeto(id!),
    enabled: !!id,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['projeto', id] });
    queryClient.invalidateQueries({ queryKey: ['projetos'] });
  };

  const mutSubmeter = useMutation({ mutationFn: () => submeterProjeto(id!), onSuccess: invalidate });
  const mutAprovar = useMutation({ mutationFn: () => aprovarProjeto(id!), onSuccess: invalidate });
  const mutReprovar = useMutation({
    mutationFn: () => reprovarProjeto(id!, justificativaReprovacao),
    onSuccess: () => { invalidate(); setShowReprovacaoModal(false); },
  });
  const mutDeletar = useMutation({ mutationFn: () => deletarProjeto(id!), onSuccess: () => navigate('/projetos') });
  const mutIniciarAndamento = useMutation({ mutationFn: () => iniciarAndamento(id!), onSuccess: invalidate });
  const mutConcluir = useMutation({ mutationFn: () => concluirProjeto(id!), onSuccess: invalidate });
  const mutStatusSemana = useMutation({
    mutationFn: ({ semana, status }: { semana: string; status: StatusSemana }) => atualizarStatusSemana(id!, semana, status),
    onSuccess: invalidate,
  });
  const mutAddMaterialCompra = useMutation({
    mutationFn: (data: MaterialRequest) => criarMaterial(id!, data),
    onSuccess: () => { invalidate(); setMaterialModalMode(null); },
  });
  const mutAddDoEstoque = useMutation({
    mutationFn: ({ itemEstoqueId, quantidade }: { itemEstoqueId: string; quantidade: number }) =>
      criarDoEstoque(id!, itemEstoqueId, quantidade),
    onSuccess: () => { invalidate(); setMaterialModalMode(null); },
  });
  const mutStatusCompra = useMutation({
    mutationFn: ({ materialId, status, justificativa }: { materialId: string; status: StatusCompra; justificativa?: string }) =>
      atualizarStatusCompra(materialId, status, justificativa),
    onSuccess: () => { setStatusCompraError(null); setFailedMaterialId(null); invalidate(); },
    onError: (err: any, variables) => {
      setStatusCompraError(err?.response?.data?.message ?? 'Erro ao atualizar status da solicitação.');
      setFailedMaterialId(variables.materialId);
    },
  });
  const mutDeleteMaterial = useMutation({
    mutationFn: (materialId: string) => deletarMaterial(materialId),
    onSuccess: invalidate,
  });
  const mutAddPapelaria = useMutation({
    mutationFn: (data: PapelariaRequest) => criarPapelariaItem(id!, data),
    onSuccess: () => { invalidate(); setPapelariaModalMode(null); },
  });
  const mutAddPapelariaDoEstoque = useMutation({
    mutationFn: ({ itemEstoqueId, quantidade }: { itemEstoqueId: string; quantidade: number }) =>
      criarPapelariaDoEstoque(id!, itemEstoqueId, quantidade),
    onSuccess: () => { invalidate(); setPapelariaModalMode(null); },
  });
  const mutStatusPapelaria = useMutation({
    mutationFn: ({ itemId, status, justificativa }: { itemId: string; status: StatusCompra; justificativa?: string }) =>
      atualizarStatusPapelaria(itemId, status, justificativa),
    onSuccess: invalidate,
  });
  const mutDeletePapelaria = useMutation({
    mutationFn: (itemId: string) => deletarPapelariaItem(itemId),
    onSuccess: invalidate,
  });

  const canApprove = user?.perfil === 'COORDENACAO' || user?.perfil === 'ADMINISTRADOR';
  const canManage = user?.perfil === 'INSTRUTOR' || user?.perfil === 'ADMINISTRADOR';
  const canDelete =
    user?.perfil === 'ADMINISTRADOR' ||
    (user?.perfil === 'INSTRUTOR' &&
      projeto?.instrutor?.id === user?.id &&
      projeto?.statusProjeto === 'RASCUNHO');
  const canEdit =
    (user?.perfil === 'ADMINISTRADOR' ||
      (user?.perfil === 'INSTRUTOR' && projeto?.instrutor?.id === user?.id)) &&
    (projeto?.statusProjeto === 'RASCUNHO' || projeto?.statusProjeto === 'REPROVADO');

  if (isLoading || !projeto) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={32} className="animate-spin text-brand-600" />
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'geral', label: 'Geral' },
    { key: 'proposta', label: 'Proposta' },
    { key: 'materiais', label: `Materiais (${projeto.materiais?.length ?? 0})` },
    { key: 'papelaria', label: `Papelaria (${projeto.itensPapelaria?.length ?? 0})` },
    { key: 'cronograma', label: 'Cronograma' },
    { key: 'arquivos', label: 'Arquivos' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      {/* Back + Header */}
      <div className="mb-6">
        <Link to="/projetos" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={15} />
          Projetos
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{projeto.nomeProjeto ?? 'Projeto sem nome'}</h1>
              <StatusBadge type="projeto" value={projeto.statusProjeto} />
            </div>
            <p className="text-gray-500 text-sm mt-1">
              {projeto.instrutor?.nome}
              {projeto.codigoTurma ? ` • ${projeto.codigoTurma}` : ''}
              {projeto.turno ? ` • ${projeto.turno === 'MANHA' ? 'Manhã' : projeto.turno === 'TARDE' ? 'Tarde' : 'Noite'}` : ''}
              {projeto.nivelTurma ? ` • ${projeto.nivelTurma}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {canEdit && (
              <button onClick={() => navigate(`/projetos/${id}/editar`)}
                className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium px-3 py-2 rounded-lg">
                <Pencil size={14} /> Editar
              </button>
            )}
            {canManage && (projeto.statusProjeto === 'RASCUNHO' || projeto.statusProjeto === 'REPROVADO') && (
              <button onClick={() => mutSubmeter.mutate()} disabled={mutSubmeter.isPending}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-3 py-2 rounded-lg">
                <Send size={14} /> Submeter
              </button>
            )}
            {canApprove && projeto.statusProjeto === 'SUBMETIDO' && (
              <>
                <button onClick={() => mutAprovar.mutate()} disabled={mutAprovar.isPending}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium px-3 py-2 rounded-lg">
                  <CheckCircle size={14} /> Aprovar
                </button>
                <button onClick={() => setShowReprovacaoModal(true)}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-2 rounded-lg">
                  <XCircle size={14} /> Reprovar
                </button>
              </>
            )}
            {canApprove && projeto.statusProjeto === 'APROVADO' && (
              <button onClick={() => { if (confirm('Iniciar andamento do projeto?')) mutIniciarAndamento.mutate(); }}
                disabled={mutIniciarAndamento.isPending}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-3 py-2 rounded-lg">
                <PlayCircle size={14} /> Iniciar
              </button>
            )}
            {canApprove && projeto.statusProjeto === 'EM_ANDAMENTO' && (
              <button onClick={() => { if (confirm('Marcar projeto como concluído?')) mutConcluir.mutate(); }}
                disabled={mutConcluir.isPending}
                className="flex items-center gap-1.5 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white text-sm font-medium px-3 py-2 rounded-lg">
                <Flag size={14} /> Concluir
              </button>
            )}
            {canDelete && (
              <button onClick={() => { if (confirm('Excluir projeto?')) mutDeletar.mutate(); }} disabled={mutDeletar.isPending}
                className="flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 text-sm font-medium px-3 py-2 rounded-lg">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
        {projeto.statusProjeto === 'REPROVADO' && projeto.justificativaReprovacao && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-xs font-medium text-red-700 mb-0.5">Motivo da reprovação:</p>
            <p className="text-sm text-red-600">{projeto.justificativaReprovacao}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                activeTab === key ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'geral' && <TabGeral projeto={projeto} />}
      {activeTab === 'proposta' && <TabProposta projeto={projeto} />}
      {activeTab === 'materiais' && (
        <TabMateriais
          projeto={projeto}
          onStatusChange={(materialId, status, justificativa) => { setStatusCompraError(null); setFailedMaterialId(null); mutStatusCompra.mutate({ materialId, status, justificativa }); }}
          onDelete={(materialId) => mutDeleteMaterial.mutate(materialId)}
          onAddDoEstoque={() => setMaterialModalMode('estoque')}
          onAddSolicitacao={() => setMaterialModalMode('compra')}
          canManage={canManage}
          canApprove={canApprove}
          isAdmin={user?.perfil === 'ADMINISTRADOR'}
          isStatusChangePending={mutStatusCompra.isPending}
          statusChangeError={statusCompraError}
          statusChangeErrorMaterialId={failedMaterialId}
        />
      )}
      {activeTab === 'papelaria' && (
        <TabPapelaria
          projeto={projeto}
          onAddDoEstoque={() => setPapelariaModalMode('estoque')}
          onAddSolicitacao={() => setPapelariaModalMode('compra')}
          onStatusChange={(itemId, status, justificativa) => mutStatusPapelaria.mutate({ itemId, status, justificativa })}
          onDelete={(itemId) => mutDeletePapelaria.mutate(itemId)}
          canManage={canManage}
          canApprove={canApprove}
          isAdmin={user?.perfil === 'ADMINISTRADOR'}
        />
      )}
      {activeTab === 'cronograma' && (
        <TabCronograma
          projeto={projeto}
          onUpdateStatus={(semana, status) => mutStatusSemana.mutate({ semana, status })}
          canUpdate={canManage}
          projetoId={projeto.id}
          canAdd={canManage || user?.perfil === 'INSTRUTOR'}
          currentUserEmail={user?.email ?? ''}
          isAdmin={user?.perfil === 'ADMINISTRADOR'}
        />
      )}
      {activeTab === 'arquivos' && (
        <TabArquivos
          projetoId={projeto.id}
          canAdd={canManage || user?.perfil === 'INSTRUTOR'}
          currentUserEmail={user?.email ?? ''}
          isAdmin={user?.perfil === 'ADMINISTRADOR'}
        />
      )}

      {/* Reprovar projeto modal */}
      {showReprovacaoModal && (
        <Modal title="Reprovar projeto" onClose={() => setShowReprovacaoModal(false)}>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Motivo da reprovação <span className="text-red-500">*</span>
          </label>
          <textarea rows={4} placeholder="Descreva o motivo da reprovação..." value={justificativaReprovacao}
            onChange={(e) => setJustificativaReprovacao(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
          <p className="text-xs text-gray-400 mt-1">Obrigatório — o instrutor receberá este motivo por e-mail.</p>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowReprovacaoModal(false)}
              className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button onClick={() => mutReprovar.mutate()} disabled={!justificativaReprovacao.trim() || mutReprovar.isPending}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg">
              {mutReprovar.isPending ? 'Reprovando...' : 'Reprovar'}
            </button>
          </div>
        </Modal>
      )}

      {/* Papelaria: selecionar do estoque */}
      {papelariaModalMode === 'estoque' && (
        <EstoquePickerModal
          projetoId={id!}
          tipoFixo="PAPELARIA"
          onClose={() => setPapelariaModalMode(null)}
          onConfirm={(itemEstoqueId, quantidade) => mutAddPapelariaDoEstoque.mutate({ itemEstoqueId, quantidade })}
          isPending={mutAddPapelariaDoEstoque.isPending}
          error={mutAddPapelariaDoEstoque.error}
        />
      )}

      {/* Papelaria: solicitar compra */}
      {papelariaModalMode === 'compra' && (
        <PapelariaModal
          onClose={() => setPapelariaModalMode(null)}
          onConfirm={(data) => mutAddPapelaria.mutate(data)}
          isPending={mutAddPapelaria.isPending}
          error={mutAddPapelaria.error}
        />
      )}

      {/* Modal: selecionar do estoque */}
      {materialModalMode === 'estoque' && (
        <EstoquePickerModal
          projetoId={id!}
          onClose={() => setMaterialModalMode(null)}
          onConfirm={(itemEstoqueId, quantidade) => mutAddDoEstoque.mutate({ itemEstoqueId, quantidade })}
          isPending={mutAddDoEstoque.isPending}
          error={mutAddDoEstoque.error}
        />
      )}

      {/* Modal: solicitar compra */}
      {materialModalMode === 'compra' && (
        <SolicitacaoCompraModal
          onClose={() => setMaterialModalMode(null)}
          onConfirm={(data) => mutAddMaterialCompra.mutate(data)}
          isPending={mutAddMaterialCompra.isPending}
          error={mutAddMaterialCompra.error}
        />
      )}
    </div>
  );
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function EstoquePickerModal({
  tipoFixo, onClose, onConfirm, isPending, error,
}: {
  projetoId: string;
  tipoFixo?: TipoItemEstoque;
  onClose: () => void;
  onConfirm: (itemEstoqueId: string, quantidade: number) => void;
  isPending: boolean;
  error: Error | null;
}) {
  const [search, setSearch] = useState('');
  const [tipo, setTipo] = useState<TipoItemEstoque | ''>(tipoFixo ?? '');
  const [selected, setSelected] = useState<ItemEstoque | null>(null);
  const [quantidade, setQuantidade] = useState(1);

  const { data: itens = [], isLoading } = useQuery<ItemEstoque[]>({
    queryKey: ['estoque', { tipo: tipo || undefined, search: search || undefined, apenasAtivos: true }],
    queryFn: () => listarEstoque({ tipo: tipo || undefined, search: search || undefined, apenasAtivos: true }),
  });

  const TIPO_LABELS_PICKER: Record<TipoItemEstoque, string> = {
    HARDWARE: 'Hardware', SOFTWARE: 'Software', PERIFERICO: 'Periférico', PAPELARIA: 'Papelaria',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <h3 className="text-base font-semibold text-gray-900">
            {tipoFixo ? `Selecionar papelaria do estoque` : 'Selecionar do estoque'}
          </h3>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="p-4 border-b border-gray-100 space-y-2 shrink-0">
          <div className="flex gap-2">
            <div className="flex items-center gap-2 flex-1 border border-gray-300 rounded-lg px-3 py-2">
              <Search size={14} className="text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar item..." className="flex-1 text-sm outline-none" />
            </div>
            {!tipoFixo && (
              <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoItemEstoque | '')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none bg-white">
                <option value="">Todos</option>
                <option value="HARDWARE">Hardware</option>
                <option value="SOFTWARE">Software</option>
                <option value="PERIFERICO">Periférico</option>
                <option value="PAPELARIA">Papelaria</option>
              </select>
            )}
            {tipoFixo && (
              <span className="border border-pink-200 bg-pink-50 text-pink-700 text-xs font-medium px-3 py-2 rounded-lg">
                {TIPO_LABELS_PICKER[tipoFixo]}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin text-brand-600" /></div>
          ) : itens.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">Nenhum item disponível no estoque.</p>
          ) : (
            itens.map((item) => {
              const Icon = TIPO_ICONS[item.tipo];
              const isSelected = selected?.id === item.id;
              const semEstoque = item.quantidadeDisponivel === 0;
              return (
                <button key={item.id} onClick={() => !semEstoque && setSelected(item)} disabled={semEstoque}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl mb-1 text-left transition-all ${
                    isSelected ? 'bg-brand-50 border border-brand-300' :
                    semEstoque ? 'opacity-40 cursor-not-allowed' :
                    'hover:bg-gray-50 border border-transparent'
                  }`}>
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    {item.imagemUrl ? <img src={item.imagemUrl} alt={item.nome} className="w-full h-full object-cover rounded-lg" />
                      : <Icon size={16} className="text-gray-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.nome}</p>
                    <p className="text-xs text-gray-400">{[item.marca, item.modelo].filter(Boolean).join(' ')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs font-semibold ${item.quantidadeDisponivel === 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {item.quantidadeDisponivel} disp.
                    </span>
                    <p className="text-xs text-gray-400">/ {item.quantidadeTotal}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {selected && (
          <div className="p-4 border-t border-gray-100 shrink-0 bg-gray-50">
            <p className="text-xs text-gray-600 mb-2 font-medium">Selecionado: <span className="text-gray-900">{selected.nome}</span></p>
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-600">Quantidade:</label>
              <input type="number" min={1} max={selected.quantidadeDisponivel} value={quantidade}
                onChange={(e) => setQuantidade(Math.min(Number(e.target.value), selected.quantidadeDisponivel))}
                className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
              <span className="text-xs text-gray-400">máx {selected.quantidadeDisponivel}</span>
            </div>
          </div>
        )}

        {error && (
          <p className="mx-6 mb-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {(error as any)?.response?.data?.message ?? 'Erro ao adicionar item.'}
          </p>
        )}

        <div className="p-4 border-t border-gray-100 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={() => selected && onConfirm(selected.id, quantidade)}
            disabled={!selected || isPending}
            className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2">
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Adicionar ao projeto
          </button>
        </div>
      </div>
    </div>
  );
}

function SolicitacaoCompraModal({
  onClose, onConfirm, isPending, error,
}: {
  onClose: () => void;
  onConfirm: (data: MaterialRequest) => void;
  isPending: boolean;
  error: Error | null;
}) {
  const [form, setForm] = useState({
    item: '',
    quantidade: 1,
    imagemUrl: '',
    links: [
      { nomeSite: '', url: '', valorEncontrado: '' },
      { nomeSite: '', url: '', valorEncontrado: '' },
      { nomeSite: '', url: '', valorEncontrado: '' },
    ],
  });

  function salvar() {
    const linksValidos = form.links
      .filter(l => l.url.trim())
      .map(l => ({
        nomeSite: l.nomeSite,
        url: l.url,
        valorEncontrado: l.valorEncontrado ? Number(l.valorEncontrado) : undefined,
      }));

    onConfirm({
      item: form.item,
      quantidade: Number(form.quantidade),
      imagemUrl: form.imagemUrl || undefined,
      links: linksValidos,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <h3 className="text-base font-semibold text-gray-900">Solicitar compra</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Modelo / nome do equipamento *</label>
            <input value={form.item} onChange={(e) => setForm(f => ({ ...f, item: e.target.value }))}
              placeholder="Ex: Arduino Mega 2560"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Quantidade *</label>
            <input type="number" min={1} value={form.quantidade}
              onChange={(e) => setForm(f => ({ ...f, quantidade: Number(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">URL da foto do produto</label>
            <input value={form.imagemUrl} onChange={(e) => setForm(f => ({ ...f, imagemUrl: e.target.value }))}
              placeholder="https://..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Links de compra <span className="text-gray-400 font-normal">(até 3)</span>
            </label>
            <div className="space-y-3">
              {form.links.map((link, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50">
                  <p className="text-xs text-gray-500 font-medium">Link {i + 1}</p>
                  <input value={link.nomeSite}
                    onChange={(e) => setForm(f => ({ ...f, links: f.links.map((l, idx) => idx === i ? { ...l, nomeSite: e.target.value } : l) }))}
                    placeholder="Nome do site (ex: Amazon)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white" />
                  <input value={link.url}
                    onChange={(e) => setForm(f => ({ ...f, links: f.links.map((l, idx) => idx === i ? { ...l, url: e.target.value } : l) }))}
                    placeholder="https://..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white" />
                  <input value={link.valorEncontrado}
                    type="number" step="0.01" min="0"
                    onChange={(e) => setForm(f => ({ ...f, links: f.links.map((l, idx) => idx === i ? { ...l, valorEncontrado: e.target.value } : l) }))}
                    placeholder="Valor encontrado (R$)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white" />
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {(error as any)?.response?.data?.message ?? 'Erro ao criar solicitação.'}
            </p>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={salvar} disabled={!form.item.trim() || isPending}
            className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2">
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Criar solicitação
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function TabGeral({ projeto }: { projeto: Projeto }) {
  const turnoLabel: Record<string, string> = { MANHA: 'Manhã', TARDE: 'Tarde', NOITE: 'Noite' };
  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : null;
  return (
    <div>
      <Section title="Identificação">
        <Field label="Nome do projeto" value={projeto.nomeProjeto} />
        <Field label="Instrutor" value={projeto.instrutor?.nome} />
        <Field label="Código da turma" value={projeto.codigoTurma} />
        <Field label="Turno" value={projeto.turno ? turnoLabel[projeto.turno] : null} />
        <Field label="Nível da turma" value={projeto.nivelTurma} />
        <Field label="Qtd. alunos" value={projeto.qtdAlunos} />
        <Field label="Data de submissão" value={formatDate(projeto.dataSubmissao)} />
      </Section>
      {(projeto.integrantes?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Integrantes</h3>
          <ul className="space-y-1">
            {projeto.integrantes.map((nome, i) => (
              <li key={i} className="text-sm text-gray-900 flex items-center gap-2">
                <span className="w-5 h-5 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-medium shrink-0">
                  {i + 1}
                </span>
                {nome}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
          {`Ferramentas${projeto.tipoProjeto ? ` — ${projeto.tipoProjeto === 'HARDWARE' ? 'Hardware' : 'Software'}` : ''}`}
        </h3>
        {projeto.tipoProjeto === 'SOFTWARE' && (projeto.ferramentasSoftware?.length ?? 0) > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Ferramentas selecionadas</p>
            <div className="flex flex-wrap gap-2">
              {projeto.ferramentasSoftware.map(f => (
                <div key={f.id} className="flex items-center gap-1.5 bg-brand-50 border border-brand-100 rounded-lg px-2.5 py-1.5">
                  {f.imagemUrl && (
                    <img src={f.imagemUrl} alt={f.nome} className="w-5 h-5 object-contain rounded" />
                  )}
                  <span className="text-xs font-medium text-brand-800">{f.nome}</span>
                  {f.categoria && (
                    <span className="text-[10px] text-brand-500">{f.categoria}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {projeto.tipoProjeto === 'SOFTWARE' && (projeto.ferramentasSoftware?.length ?? 0) === 0 && (
          <p className="text-sm text-gray-400 italic">Nenhuma ferramenta selecionada.</p>
        )}
        {projeto.tipoProjeto === 'HARDWARE' && (
          <p className="text-sm text-gray-500">
            Consulte a aba <strong>Materiais</strong> para ver os equipamentos reservados do estoque.
          </p>
        )}
        {projeto.linkProjeto && (
          <div className="mt-3">
            <Field label="Link do projeto" value={projeto.linkProjeto} />
          </div>
        )}
      </div>
    </div>
  );
}

function TabProposta({ projeto }: { projeto: Projeto }) {
  const odsNumbers = projeto.ods ? projeto.ods.split(',').filter(Boolean).map(Number) : [];
  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Proposta</h3>
        {odsNumbers.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 mb-1.5">ODS</p>
            <div className="flex flex-wrap gap-1.5">
              {odsNumbers.map((n) => (
                <span key={n} className="text-xs bg-brand-100 text-brand-700 font-semibold px-2.5 py-1 rounded-full">ODS {n}</span>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 gap-4">
          <Field label="Problema identificado" value={projeto.problemaIdentificado} />
          <Field label="Solução proposta" value={projeto.solucaoProposta} />
          <Field label="Objetivo do projeto" value={projeto.objetivoProjeto} />
        </div>
      </div>
    </div>
  );
}

function TabCronograma({ projeto, onUpdateStatus, canUpdate, projetoId, canAdd, isAdmin }: {
  projeto: Projeto;
  onUpdateStatus: (semana: string, status: StatusSemana) => void;
  canUpdate: boolean;
  projetoId: string;
  canAdd: boolean;
  currentUserEmail: string;
  isAdmin: boolean;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AcompanhamentoRequest>({ fase: 'GERAL', titulo: '', descricao: '', semana: undefined });
  const [showForm, setShowForm] = useState(false);

  const { data: registros = [], isLoading } = useQuery<RegistroAcompanhamento[]>({
    queryKey: ['acompanhamento', projetoId],
    queryFn: () => listarAcompanhamento(projetoId),
  });

  const mutCriar = useMutation({
    mutationFn: (data: AcompanhamentoRequest) => criarRegistro(projetoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acompanhamento', projetoId] });
      setForm({ fase: 'GERAL', titulo: '', descricao: '', semana: undefined });
      setShowForm(false);
    },
  });

  const mutDeletar = useMutation({
    mutationFn: (registroId: string) => deletarRegistro(projetoId, registroId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['acompanhamento', projetoId] }),
  });

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }

  const byWeek = (n: number) => registros.filter(r => r.semana === n);
  const gerais = registros.filter(r => r.semana == null);

  function RecordRow({ r }: { r: RegistroAcompanhamento }) {
    return (
      <div className="px-5 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${FASE_COLOR[r.fase]}`}>{FASE_LABEL[r.fase]}</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">{r.titulo}</p>
            <p className="text-xs text-gray-400 mt-0.5">{r.autor.nome} · {formatDate(r.createdAt)}</p>
            <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{r.descricao}</p>
          </div>
          {(canAdd || isAdmin) && (
            <button
              onClick={() => { if (confirm('Excluir este registro?')) mutDeletar.mutate(r.id); }}
              className="text-gray-400 hover:text-red-500 transition-colors shrink-0 mt-0.5"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canAdd && (
        <div>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 border border-brand-300 text-brand-700 hover:bg-brand-50 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <Plus size={14} />
              Adicionar registro
            </button>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Novo registro de acompanhamento</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fase *</label>
                  <select value={form.fase} onChange={(e) => setForm(f => ({ ...f, fase: e.target.value as FaseDesignThinking }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                    {FASES.map(f => <option key={f} value={f}>{FASE_LABEL[f]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Semana</label>
                  <select value={form.semana ?? ''} onChange={(e) => setForm(f => ({ ...f, semana: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                    <option value="">Geral (sem semana)</option>
                    {[1, 2, 3, 4].map(s => <option key={s} value={s}>Semana {s}</option>)}
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">Título *</label>
                <input value={form.titulo} onChange={(e) => setForm(f => ({ ...f, titulo: e.target.value }))}
                  placeholder="Ex: Entrevista com alunos da turma"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">Descrição *</label>
                <textarea rows={3} value={form.descricao} onChange={(e) => setForm(f => ({ ...f, descricao: e.target.value }))}
                  placeholder="Descreva o que foi realizado..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)}
                  className="border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button onClick={() => mutCriar.mutate(form)}
                  disabled={!form.titulo.trim() || !form.descricao.trim() || mutCriar.isPending}
                  className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg">
                  {mutCriar.isPending && <Loader2 size={14} className="animate-spin" />}
                  Salvar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-brand-600" /></div>
      ) : (
        <>
          {semanas.map(({ key, label, field }, idx) => {
            const status = projeto[field] as StatusSemana;
            const weekRecords = byWeek(idx + 1);
            return (
              <div key={key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/70">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">{label}</span>
                    <StatusBadge type="semana" value={status} />
                  </div>
                  {canUpdate && (
                    <select value={status} onChange={(e) => onUpdateStatus(key, e.target.value as StatusSemana)}
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                      {statusSemanaOptions.map((s) => <option key={s} value={s}>{statusSemanaLabels[s]}</option>)}
                    </select>
                  )}
                </div>
                {weekRecords.length === 0 ? (
                  <p className="text-xs text-gray-400 px-5 py-3 italic">Nenhum registro para esta semana.</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {weekRecords.map(r => <RecordRow key={r.id} r={r} />)}
                  </div>
                )}
              </div>
            );
          })}

          {gerais.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/70">
                <span className="text-sm font-semibold text-gray-700">Registros gerais</span>
              </div>
              <div className="divide-y divide-gray-50">
                {gerais.map(r => <RecordRow key={r.id} r={r} />)}
              </div>
            </div>
          )}

          {!isLoading && registros.length === 0 && !canAdd && (
            <div className="bg-white rounded-xl border border-gray-200 py-10 text-center">
              <p className="text-sm text-gray-400">Nenhum registro de acompanhamento ainda.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const FASE_LABEL: Record<FaseDesignThinking, string> = {
  EMPATIA: 'Empatia',
  DEFINICAO: 'Definição',
  IDEACAO: 'Ideação',
  PROTOTIPACAO: 'Prototipação',
  TESTE: 'Teste',
  GERAL: 'Geral',
};

const FASE_COLOR: Record<FaseDesignThinking, string> = {
  EMPATIA: 'bg-pink-100 text-pink-700',
  DEFINICAO: 'bg-purple-100 text-purple-700',
  IDEACAO: 'bg-amber-100 text-amber-700',
  PROTOTIPACAO: 'bg-blue-100 text-blue-700',
  TESTE: 'bg-green-100 text-green-700',
  GERAL: 'bg-gray-100 text-gray-600',
};

const FASES: FaseDesignThinking[] = ['EMPATIA', 'DEFINICAO', 'IDEACAO', 'PROTOTIPACAO', 'TESTE', 'GERAL'];

// ── TabArquivos ──────────────────────────────────────────────────────────────

const TIPO_ARQUIVO_LABEL: Record<TipoArquivo, string> = {
  GITHUB: 'GitHub',
  GOOGLE_DRIVE: 'Google Drive',
  FIGMA: 'Figma',
  YOUTUBE: 'YouTube',
  SITE: 'Site',
  OUTRO: 'Outro',
};

const TIPO_ARQUIVO_COLOR: Record<TipoArquivo, string> = {
  GITHUB: 'bg-gray-900 text-white',
  GOOGLE_DRIVE: 'bg-blue-100 text-blue-700',
  FIGMA: 'bg-purple-100 text-purple-700',
  YOUTUBE: 'bg-red-100 text-red-700',
  SITE: 'bg-cyan-100 text-cyan-700',
  OUTRO: 'bg-gray-100 text-gray-600',
};

const TIPO_ARQUIVO_ICON: Record<TipoArquivo, React.ElementType> = {
  GITHUB: Code2,
  GOOGLE_DRIVE: FolderOpen,
  FIGMA: Layers,
  YOUTUBE: Video,
  SITE: Globe,
  OUTRO: LinkIcon,
};

const TIPOS_ARQUIVO: TipoArquivo[] = ['GITHUB', 'GOOGLE_DRIVE', 'FIGMA', 'YOUTUBE', 'SITE', 'OUTRO'];

function TabArquivos({ projetoId, canAdd, currentUserEmail, isAdmin }: {
  projetoId: string;
  canAdd: boolean;
  currentUserEmail: string;
  isAdmin: boolean;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ArquivoRequest>({
    titulo: '',
    url: '',
    tipo: 'GITHUB',
    descricao: '',
  });
  const [showForm, setShowForm] = useState(false);

  const { data: arquivos = [], isLoading } = useQuery<ArquivoProjeto[]>({
    queryKey: ['arquivos', projetoId],
    queryFn: () => listarArquivos(projetoId),
  });

  const mutCriar = useMutation({
    mutationFn: (data: ArquivoRequest) => criarArquivo(projetoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arquivos', projetoId] });
      setForm({ titulo: '', url: '', tipo: 'GITHUB', descricao: '' });
      setShowForm(false);
    },
  });

  const mutDeletar = useMutation({
    mutationFn: (arquivoId: string) => deletarArquivo(projetoId, arquivoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['arquivos', projetoId] }),
  });

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }

  return (
    <div>
      {canAdd && (
        <div className="mb-5">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 border border-brand-300 text-brand-700 hover:bg-brand-50 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <Plus size={14} />
              Adicionar arquivo/link
            </button>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Novo arquivo ou link</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo *</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm(f => ({ ...f, tipo: e.target.value as TipoArquivo }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    {TIPOS_ARQUIVO.map(t => <option key={t} value={t}>{TIPO_ARQUIVO_LABEL[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Título *</label>
                  <input
                    value={form.titulo}
                    onChange={(e) => setForm(f => ({ ...f, titulo: e.target.value }))}
                    placeholder="Ex: Repositório do projeto"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">URL *</label>
                <input
                  value={form.url}
                  onChange={(e) => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">Descrição (opcional)</label>
                <textarea
                  rows={2}
                  value={form.descricao}
                  onChange={(e) => setForm(f => ({ ...f, descricao: e.target.value }))}
                  placeholder="Breve descrição do conteúdo..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => mutCriar.mutate({ ...form, descricao: form.descricao || undefined })}
                  disabled={!form.titulo.trim() || !form.url.trim() || mutCriar.isPending}
                  className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg"
                >
                  {mutCriar.isPending && <Loader2 size={14} className="animate-spin" />}
                  Salvar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={24} className="animate-spin text-brand-600" />
        </div>
      ) : arquivos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-12 text-center">
          <LinkIcon size={36} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Nenhum arquivo ou link adicionado.</p>
          {canAdd && <p className="text-xs text-gray-400 mt-1">Adicione links para o GitHub, Google Drive, Figma e outros.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {arquivos.map((a) => {
            const Icon = TIPO_ARQUIVO_ICON[a.tipo];
            return (
              <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${TIPO_ARQUIVO_COLOR[a.tipo]}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${TIPO_ARQUIVO_COLOR[a.tipo]}`}>
                          {TIPO_ARQUIVO_LABEL[a.tipo]}
                        </span>
                        <p className="text-sm font-medium text-gray-900 mt-1 truncate">{a.titulo}</p>
                      </div>
                      {(canAdd || isAdmin) && (
                        <button
                          onClick={() => { if (confirm('Excluir este arquivo?')) mutDeletar.mutate(a.id); }}
                          className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-brand-600 hover:underline mt-1 truncate"
                    >
                      <ExternalLink size={11} />
                      {a.url}
                    </a>
                    {a.descricao && (
                      <p className="text-xs text-gray-500 mt-1">{a.descricao}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1.5">{a.autor.nome} · {formatDate(a.createdAt)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const STATUS_COMPRA_LABEL: Record<StatusCompra, string> = {
  A_COMPRAR: 'A comprar',
  AGUARDANDO_APROVACAO: 'Aguard. aprovação',
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
  EM_PROCESSO_DE_COMPRA: 'Em processo',
  COMPRADO_E_EM_ESTOQUE: 'Comprado ✓',
  DISPONIVEL_ESCOLA: 'Na escola',
  NAO_NECESSARIO: 'Não necessário',
};

const STATUS_COMPRA_COLOR: Record<StatusCompra, string> = {
  A_COMPRAR: 'bg-gray-100 text-gray-600',
  AGUARDANDO_APROVACAO: 'bg-amber-100 text-amber-700',
  APROVADO: 'bg-green-100 text-green-700',
  REPROVADO: 'bg-red-100 text-red-700',
  EM_PROCESSO_DE_COMPRA: 'bg-blue-100 text-blue-700',
  COMPRADO_E_EM_ESTOQUE: 'bg-emerald-100 text-emerald-700',
  DISPONIVEL_ESCOLA: 'bg-teal-100 text-teal-700',
  NAO_NECESSARIO: 'bg-gray-100 text-gray-400',
};

function MaterialStatusBadge({ status }: { status: StatusCompra }) {
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COMPRA_COLOR[status]}`}>
      {STATUS_COMPRA_LABEL[status]}
    </span>
  );
}

function TabPapelaria({ projeto, onAddDoEstoque, onAddSolicitacao, onStatusChange, onDelete, canManage, canApprove, isAdmin }: {
  projeto: Projeto;
  onAddDoEstoque: () => void;
  onAddSolicitacao: () => void;
  onStatusChange: (id: string, status: StatusCompra, justificativa?: string) => void;
  onDelete: (id: string) => void;
  canManage: boolean;
  canApprove: boolean;
  isAdmin: boolean;
}) {
  const [reprovando, setReprovando] = useState<string | null>(null);
  const [justificativa, setJustificativa] = useState('');
  const itens: PapelariaItem[] = projeto.itensPapelaria ?? [];

  const doEstoque = itens.filter(i => i.estoqueSubtraido);
  const solicitacoes = itens.filter(i => !i.estoqueSubtraido);

  const renderItem = (item: PapelariaItem) => (
    <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start gap-3">
        {item.imagemUrl ? (
          <img src={item.imagemUrl} alt={item.nome}
            className="w-14 h-14 object-cover rounded-lg shrink-0 border border-gray-200" />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-pink-50 flex items-center justify-center shrink-0">
            <Paperclip size={20} className="text-pink-300" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-gray-900">{item.nome}</p>
            <MaterialStatusBadge status={item.statusAquisicao} />
          </div>
          <p className="text-xs text-gray-500">Qtd: {item.quantidade}</p>
          {item.justificativaReprovacao && (
            <p className="mt-1.5 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
              Reprovado: {item.justificativaReprovacao}
            </p>
          )}
        </div>
        {canManage && (item.statusAquisicao === 'A_COMPRAR' || item.statusAquisicao === 'DISPONIVEL_ESCOLA') && (
          <button onClick={() => { if (confirm('Remover item?')) onDelete(item.id); }}
            className="text-gray-400 hover:text-red-500 transition-colors shrink-0">
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {!item.estoqueSubtraido && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-1.5">
          {canManage && (item.statusAquisicao === 'A_COMPRAR' || item.statusAquisicao === 'REPROVADO') && (
            <button onClick={() => onStatusChange(item.id, 'AGUARDANDO_APROVACAO')}
              className="text-xs font-medium px-2.5 py-1 rounded-md bg-amber-100 text-amber-700 hover:bg-amber-200">
              Solicitar aprovação
            </button>
          )}
          {canApprove && item.statusAquisicao === 'AGUARDANDO_APROVACAO' && (
            <>
              <button onClick={() => onStatusChange(item.id, 'APROVADO')}
                className="text-xs font-medium px-2.5 py-1 rounded-md bg-green-100 text-green-700 hover:bg-green-200">
                Aprovar
              </button>
              <button onClick={() => setReprovando(item.id)}
                className="text-xs font-medium px-2.5 py-1 rounded-md bg-red-100 text-red-700 hover:bg-red-200">
                Reprovar
              </button>
            </>
          )}
          {isAdmin && item.statusAquisicao === 'APROVADO' && (
            <button onClick={() => onStatusChange(item.id, 'EM_PROCESSO_DE_COMPRA')}
              className="text-xs font-medium px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200">
              Iniciar compra
            </button>
          )}
          {isAdmin && item.statusAquisicao === 'EM_PROCESSO_DE_COMPRA' && (
            <button onClick={() => onStatusChange(item.id, 'COMPRADO_E_EM_ESTOQUE')}
              className="text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
              Item chegou
            </button>
          )}
        </div>
      )}

      {reprovando === item.id && (
        <div className="mt-3 space-y-2">
          <textarea rows={2} placeholder="Justificativa..."
            value={justificativa} onChange={(e) => setJustificativa(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
          <div className="flex gap-2">
            <button onClick={() => { setReprovando(null); setJustificativa(''); }}
              className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button disabled={!justificativa.trim()}
              onClick={() => { onStatusChange(item.id, 'REPROVADO', justificativa); setReprovando(null); setJustificativa(''); }}
              className="text-xs px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg">
              Confirmar reprovação
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {canManage && (
        <div className="flex gap-2 mb-5">
          <button onClick={onAddDoEstoque}
            className="flex items-center gap-1.5 border border-pink-300 text-pink-700 hover:bg-pink-50 text-sm font-medium px-3 py-2 rounded-lg transition-colors">
            <Paperclip size={14} />
            Usar do estoque
          </button>
          <button onClick={onAddSolicitacao}
            className="flex items-center gap-1.5 border border-orange-300 text-orange-700 hover:bg-orange-50 text-sm font-medium px-3 py-2 rounded-lg transition-colors">
            <ShoppingCart size={14} />
            Solicitar compra
          </button>
        </div>
      )}

      {itens.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-12 text-center">
          <Paperclip size={36} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Nenhum item de papelaria adicionado.</p>
          {canManage && (
            <p className="text-xs text-gray-400 mt-1">Use os botões acima para adicionar itens do estoque ou solicitar compra.</p>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {doEstoque.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Do estoque ({doEstoque.length})
              </h4>
              <div className="space-y-3">{doEstoque.map(renderItem)}</div>
            </div>
          )}
          {solicitacoes.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Solicitações de compra ({solicitacoes.length})
              </h4>
              <div className="space-y-3">{solicitacoes.map(renderItem)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PapelariaModal({ onClose, onConfirm, isPending, error }: {
  onClose: () => void;
  onConfirm: (data: PapelariaRequest) => void;
  isPending: boolean;
  error: Error | null;
}) {
  const [form, setForm] = useState({ nome: '', imagemUrl: '', quantidade: 1 });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Adicionar item de papelaria</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nome do item *</label>
            <input value={form.nome} onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: Papel A4, Caneta, Tesoura..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Quantidade *</label>
            <input type="number" min={1} value={form.quantidade}
              onChange={(e) => setForm(f => ({ ...f, quantidade: Number(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">URL da imagem</label>
            <input value={form.imagemUrl} onChange={(e) => setForm(f => ({ ...f, imagemUrl: e.target.value }))}
              placeholder="https://..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {(error as any)?.response?.data?.message ?? 'Erro ao adicionar item.'}
            </p>
          )}
        </div>
        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">Cancelar</button>
          <button
            onClick={() => onConfirm({ nome: form.nome, quantidade: form.quantidade, imagemUrl: form.imagemUrl || undefined })}
            disabled={!form.nome.trim() || isPending}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2">
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}

function TabMateriais({ projeto, onStatusChange, onDelete, onAddDoEstoque, onAddSolicitacao, canManage, canApprove, isAdmin, isStatusChangePending, statusChangeError, statusChangeErrorMaterialId }: {
  projeto: Projeto;
  onStatusChange: (id: string, status: StatusCompra, justificativa?: string) => void;
  onDelete: (id: string) => void;
  onAddDoEstoque: () => void;
  onAddSolicitacao: () => void;
  canManage: boolean;
  canApprove: boolean;
  isAdmin: boolean;
  isStatusChangePending: boolean;
  statusChangeError: string | null;
  statusChangeErrorMaterialId: string | null;
}) {
  const [reprovando, setReprovando] = useState<string | null>(null);
  const [justificativa, setJustificativa] = useState('');
  const materiais = projeto.materiais ?? [];

  const doEstoque = materiais.filter(m => m.itemEstoque != null);
  const solicitacoes = materiais.filter(m => m.itemEstoque == null);

  return (
    <div>
      {/* Header com botões de ação */}
      {canManage && (
        <div className="flex gap-2 mb-5">
          <button onClick={onAddDoEstoque}
            className="flex items-center gap-1.5 border border-teal-300 text-teal-700 hover:bg-teal-50 text-sm font-medium px-3 py-2 rounded-lg transition-colors">
            <Package size={14} />
            Usar do estoque
          </button>
          <button onClick={onAddSolicitacao}
            className="flex items-center gap-1.5 border border-orange-300 text-orange-700 hover:bg-orange-50 text-sm font-medium px-3 py-2 rounded-lg transition-colors">
            <ShoppingCart size={14} />
            Solicitar compra
          </button>
        </div>
      )}

      {materiais.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-12 text-center">
          <ShoppingCart size={36} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Nenhum material adicionado ao projeto.</p>
          {canManage && (
            <p className="text-xs text-gray-400 mt-1">Use os botões acima para adicionar itens do estoque ou criar uma solicitação de compra.</p>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Itens do estoque */}
          {doEstoque.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Do estoque ({doEstoque.length})
              </h4>
              <div className="space-y-2">
                {doEstoque.map((m) => {
                  const item = m.itemEstoque!;
                  const Icon = TIPO_ICONS[item.tipo];
                  return (
                    <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        {item.imagemUrl
                          ? <img src={item.imagemUrl} alt={item.nome} className="w-full h-full object-cover rounded-lg" />
                          : <Icon size={16} className="text-gray-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{m.item}</p>
                        <p className="text-xs text-gray-400">{[item.marca, item.modelo].filter(Boolean).join(' ')} · {m.quantidade} un</p>
                        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${TIPO_COLORS[item.tipo]}`}>
                          {item.tipo === 'HARDWARE' ? 'Hardware' : item.tipo === 'SOFTWARE' ? 'Software' : 'Periférico'}
                        </span>
                      </div>
                      <MaterialStatusBadge status={m.statusCompra} />
                      {canManage && (
                        <button onClick={() => { if (confirm(`Devolver "${m.item}" ao estoque?`)) onDelete(m.id); }}
                          className="text-gray-400 hover:text-red-500 transition-colors ml-1" title="Devolver ao estoque">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Solicitações de compra */}
          {solicitacoes.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Solicitações de compra ({solicitacoes.length})
              </h4>
              <div className="space-y-3">
                {solicitacoes.map((m) => (
                  <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3">
                        {m.imagemUrl && (
                          <img src={m.imagemUrl} alt={m.item} className="w-14 h-14 object-cover rounded-lg shrink-0 border border-gray-200" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-gray-900">{m.item}</p>
                            <MaterialStatusBadge status={m.statusCompra} />
                          </div>
                          <p className="text-xs text-gray-500">Qtd: {m.quantidade}</p>

                          {m.justificativaReprovacao && (
                            <p className="mt-1.5 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                              Reprovado: {m.justificativaReprovacao}
                            </p>
                          )}

                          {m.links?.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {m.links.map((link) => (
                                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
                                  <ExternalLink size={11} />
                                  {link.nomeSite || link.url}
                                  {link.valorEncontrado ? ` — R$ ${Number(link.valorEncontrado).toFixed(2)}` : ''}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {canManage && m.statusCompra === 'A_COMPRAR' && (
                        <button onClick={() => { if (confirm('Remover solicitação?')) onDelete(m.id); }}
                          className="text-gray-400 hover:text-red-500 transition-colors shrink-0">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>

                    {/* Ações de status */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-1.5">
                      {/* Instrutor/admin: submeter para aprovação */}
                      {canManage && (m.statusCompra === 'A_COMPRAR' || m.statusCompra === 'REPROVADO') && (
                        <button onClick={() => onStatusChange(m.id, 'AGUARDANDO_APROVACAO')}
                          disabled={isStatusChangePending}
                          className="text-xs font-medium px-2.5 py-1 rounded-md bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed">
                          Solicitar aprovação
                        </button>
                      )}
                      {/* Coord/admin: aprovar ou reprovar */}
                      {canApprove && m.statusCompra === 'AGUARDANDO_APROVACAO' && (
                        <>
                          <button onClick={() => onStatusChange(m.id, 'APROVADO')}
                            disabled={isStatusChangePending}
                            className="text-xs font-medium px-2.5 py-1 rounded-md bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed">
                            Aprovar
                          </button>
                          <button onClick={() => setReprovando(m.id)}
                            disabled={isStatusChangePending}
                            className="text-xs font-medium px-2.5 py-1 rounded-md bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed">
                            Reprovar
                          </button>
                        </>
                      )}
                      {/* Admin: iniciar processo de compra */}
                      {isAdmin && m.statusCompra === 'APROVADO' && (
                        <button onClick={() => onStatusChange(m.id, 'EM_PROCESSO_DE_COMPRA')}
                          disabled={isStatusChangePending}
                          className="text-xs font-medium px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed">
                          Iniciar processo de compra
                        </button>
                      )}
                      {/* Admin: marcar como chegou */}
                      {isAdmin && m.statusCompra === 'EM_PROCESSO_DE_COMPRA' && (
                        <button onClick={() => onStatusChange(m.id, 'COMPRADO_E_EM_ESTOQUE')}
                          disabled={isStatusChangePending}
                          className="text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed">
                          Equipamento chegou
                        </button>
                      )}
                    </div>

                    {statusChangeError && statusChangeErrorMaterialId === m.id && (
                      <p className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">{statusChangeError}</p>
                    )}

                    {reprovando === m.id && (
                      <div className="mt-3 space-y-2">
                        <textarea rows={2} placeholder="Justificativa..."
                          value={justificativa} onChange={(e) => setJustificativa(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
                        <div className="flex gap-2">
                          <button onClick={() => { setReprovando(null); setJustificativa(''); }}
                            className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                          <button disabled={!justificativa.trim() || isStatusChangePending}
                            onClick={() => { onStatusChange(m.id, 'REPROVADO', justificativa); setReprovando(null); setJustificativa(''); }}
                            className="text-xs px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg">
                            Confirmar reprovação
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
