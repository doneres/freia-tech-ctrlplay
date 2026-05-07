import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Package, Cpu, Code2, Gamepad2, Paperclip,
  Pencil, PowerOff, RotateCcw, Loader2, Trash2, X, ArrowLeft,
} from 'lucide-react';
import {
  listarEstoque, desativarItemEstoque, reativarItemEstoque,
  criarItemEstoque, atualizarItemEstoque, deletarItemEstoque,
  type ItemEstoqueRequest,
} from '../api/estoque';
import type { ItemEstoque, TipoItemEstoque } from '../types';
import { useAuth } from '../contexts/AuthContext';

const TIPO_LABELS: Record<TipoItemEstoque, string> = {
  HARDWARE: 'Hardware',
  SOFTWARE: 'Software',
  PERIFERICO: 'Periférico',
  PAPELARIA: 'Papelaria',
};

const TIPO_ICONS: Record<TipoItemEstoque, React.ElementType> = {
  HARDWARE: Cpu,
  SOFTWARE: Code2,
  PERIFERICO: Gamepad2,
  PAPELARIA: Paperclip,
};

const TIPO_COLORS: Record<TipoItemEstoque, string> = {
  HARDWARE: 'bg-blue-100 text-blue-700',
  SOFTWARE: 'bg-purple-100 text-purple-700',
  PERIFERICO: 'bg-amber-100 text-amber-700',
  PAPELARIA: 'bg-pink-100 text-pink-700',
};

const TIPO_CONFIG: Record<TipoItemEstoque, {
  iconBg: string;
  iconColor: string;
  cardHover: string;
  descricao: string;
  placeholder: string;
  temMarcaModelo: boolean;
}> = {
  HARDWARE: {
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    cardHover: 'hover:border-blue-400 hover:bg-blue-50',
    descricao: 'Placas, sensores e componentes eletrônicos',
    placeholder: 'Ex: Arduino Uno R3, Sensor DHT11...',
    temMarcaModelo: true,
  },
  SOFTWARE: {
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    cardHover: 'hover:border-purple-400 hover:bg-purple-50',
    descricao: 'Licenças, IDEs e ferramentas de desenvolvimento',
    placeholder: 'Ex: Licença Adobe CC, VS Code...',
    temMarcaModelo: false,
  },
  PERIFERICO: {
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    cardHover: 'hover:border-amber-400 hover:bg-amber-50',
    descricao: 'Controles e dispositivos de entrada/saída',
    placeholder: 'Ex: Controle Xbox, Webcam Logitech...',
    temMarcaModelo: true,
  },
  PAPELARIA: {
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
    cardHover: 'hover:border-pink-400 hover:bg-pink-50',
    descricao: 'Papel, canetas e materiais de escritório',
    placeholder: 'Ex: Papel A4, Caneta azul, Tesoura...',
    temMarcaModelo: false,
  },
};

const CATEGORIAS_POR_TIPO: Record<TipoItemEstoque, string[]> = {
  HARDWARE: [
    'Placa de desenvolvimento',
    'Sensor',
    'Atuador',
    'Módulo de comunicação',
    'Fonte de alimentação',
    'Cabos e conectores',
    'Outros',
  ],
  PERIFERICO: [
    'Controlador de jogos',
    'Dispositivo de entrada',
    'Dispositivo de saída',
    'Outros',
  ],
  SOFTWARE: [
    'Licença',
    'IDE / Editor',
    'Outros',
  ],
  PAPELARIA: [
    'Papel',
    'Escrita',
    'Recorte e colagem',
    'Organização',
    'Impressão',
    'Outros',
  ],
};

const emptyForm: ItemEstoqueRequest = {
  nome: '',
  tipo: 'HARDWARE',
  quantidadeTotal: 1,
};

export default function EstoquePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<TipoItemEstoque | ''>('');
  const [apenasAtivos, setApenasAtivos] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'tipo' | 'campos'>('tipo');
  const [editando, setEditando] = useState<ItemEstoque | null>(null);
  const [form, setForm] = useState<ItemEstoqueRequest>(emptyForm);

  const isAdmin = user?.perfil === 'ADMINISTRADOR';

  const { data: itens = [], isLoading } = useQuery<ItemEstoque[]>({
    queryKey: ['estoque', { tipo: tipoFiltro || undefined, search: search || undefined, apenasAtivos }],
    queryFn: () => listarEstoque({ tipo: tipoFiltro || undefined, search: search || undefined, apenasAtivos }),
  });

  const criarMutation = useMutation({
    mutationFn: criarItemEstoque,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['estoque'] }); fecharModal(); },
  });

  const atualizarMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ItemEstoqueRequest }) => atualizarItemEstoque(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['estoque'] }); fecharModal(); },
  });

  const desativarMutation = useMutation({
    mutationFn: desativarItemEstoque,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['estoque'] }),
  });

  const reativarMutation = useMutation({
    mutationFn: reativarItemEstoque,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['estoque'] }),
  });

  const deletarMutation = useMutation({
    mutationFn: deletarItemEstoque,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['estoque'] }),
    onError: (err: unknown) => {
      const msg = (err as any)?.response?.data?.message ?? 'Erro ao excluir item.';
      alert(msg);
    },
  });

  function abrirCriar() {
    setEditando(null);
    setForm(emptyForm);
    setModalStep('tipo');
    setModalOpen(true);
  }

  function abrirEditar(item: ItemEstoque) {
    setEditando(item);
    setForm({
      nome: item.nome,
      descricao: item.descricao ?? '',
      tipo: item.tipo,
      categoria: item.categoria ?? '',
      marca: item.marca ?? '',
      modelo: item.modelo ?? '',
      quantidadeTotal: item.quantidadeTotal,
      imagemUrl: item.imagemUrl ?? '',
    });
    setModalStep('campos');
    setModalOpen(true);
  }

  function fecharModal() {
    setModalOpen(false);
    setEditando(null);
    setForm(emptyForm);
  }

  function selecionarTipo(tipo: TipoItemEstoque) {
    setForm(f => ({ ...f, tipo, categoria: '', marca: '', modelo: '' }));
    setModalStep('campos');
  }

  function voltarParaTipo() {
    setModalStep('tipo');
  }

  function salvar() {
    const payload: ItemEstoqueRequest = {
      ...form,
      descricao: form.descricao || undefined,
      categoria: form.categoria || undefined,
      marca: form.marca || undefined,
      modelo: form.modelo || undefined,
      imagemUrl: form.imagemUrl || undefined,
    };
    if (editando) {
      atualizarMutation.mutate({ id: editando.id, data: payload });
    } else {
      criarMutation.mutate(payload);
    }
  }

  const isPending = criarMutation.isPending || atualizarMutation.isPending;
  const error = criarMutation.error || atualizarMutation.error;
  const cfg = TIPO_CONFIG[form.tipo];
  const TipoIcon = TIPO_ICONS[form.tipo];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package size={24} className="text-brand-600" />
            Estoque
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {itens.length} item{itens.length !== 1 ? 's' : ''} encontrado{itens.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={abrirCriar}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Novo item
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nome, categoria, modelo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none bg-transparent"
          />
        </div>
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value as TipoItemEstoque | '')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        >
          <option value="">Todos os tipos</option>
          <option value="HARDWARE">Hardware</option>
          <option value="SOFTWARE">Software</option>
          <option value="PERIFERICO">Periférico</option>
          <option value="PAPELARIA">Papelaria</option>
        </select>
        {isAdmin && (
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={apenasAtivos}
              onChange={(e) => setApenasAtivos(e.target.checked)}
              className="rounded accent-brand-600"
            />
            Apenas ativos
          </label>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-brand-600" />
        </div>
      ) : itens.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Package size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Nenhum item encontrado.</p>
          {isAdmin && (
            <button onClick={abrirCriar} className="mt-3 text-brand-600 hover:text-brand-700 text-sm font-medium">
              Adicionar primeiro item
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {itens.map((item, i) => {
            const Icon = TIPO_ICONS[item.tipo];
            const disponivel = item.quantidadeDisponivel;
            const percentual = item.quantidadeTotal > 0 ? (disponivel / item.quantidadeTotal) * 100 : 0;
            const corBarra = percentual === 0 ? 'bg-red-400' : percentual <= 30 ? 'bg-amber-400' : 'bg-green-400';

            return (
              <div
                key={item.id}
                className={`flex items-center gap-4 px-5 py-4 ${i !== 0 ? 'border-t border-gray-100' : ''} ${!item.ativo ? 'opacity-50' : ''}`}
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  {item.imagemUrl
                    ? <img src={item.imagemUrl} alt={item.nome} className="w-full h-full object-cover rounded-lg" />
                    : <Icon size={18} className="text-gray-500" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{item.nome}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPO_COLORS[item.tipo]}`}>
                      {TIPO_LABELS[item.tipo]}
                    </span>
                    {!item.ativo && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inativo</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[item.marca, item.modelo, item.categoria].filter(Boolean).join(' · ')}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${corBarra}`} style={{ width: `${percentual}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 shrink-0 tabular-nums">
                      {disponivel}/{item.quantidadeTotal}
                    </span>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => abrirEditar(item)}
                      className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil size={15} />
                    </button>
                    {item.ativo ? (
                      <button
                        onClick={() => desativarMutation.mutate(item.id)}
                        className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Desativar"
                      >
                        <PowerOff size={15} />
                      </button>
                    ) : (
                      <button
                        onClick={() => reativarMutation.mutate(item.id)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Reativar"
                      >
                        <RotateCcw size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Excluir "${item.nome}" permanentemente? Esta ação não pode ser desfeita.`))
                          deletarMutation.mutate(item.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir permanentemente"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

            {/* ── Passo 1: escolha do tipo ── */}
            {modalStep === 'tipo' && (
              <>
                <div className="flex items-center justify-between px-6 pt-6 pb-5">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Novo item de estoque</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Qual categoria você quer cadastrar?</p>
                  </div>
                  <button onClick={fecharModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="px-6 pb-6 grid grid-cols-2 gap-3">
                  {(Object.keys(TIPO_CONFIG) as TipoItemEstoque[]).map((tipo) => {
                    const c = TIPO_CONFIG[tipo];
                    const Icon = TIPO_ICONS[tipo];
                    return (
                      <button
                        key={tipo}
                        onClick={() => selecionarTipo(tipo)}
                        className={`flex flex-col items-start gap-3 p-4 rounded-xl border-2 border-gray-200 text-left transition-all ${c.cardHover}`}
                      >
                        <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center`}>
                          <Icon size={18} className={c.iconColor} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{TIPO_LABELS[tipo]}</p>
                          <p className="text-xs text-gray-400 mt-0.5 leading-snug">{c.descricao}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── Passo 2: campos do item ── */}
            {modalStep === 'campos' && (
              <>
                <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    {!editando && (
                      <button
                        onClick={voltarParaTipo}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Voltar para seleção de tipo"
                      >
                        <ArrowLeft size={16} />
                      </button>
                    )}
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">
                        {editando ? 'Editar item' : 'Novo item'}
                      </h2>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${TIPO_COLORS[form.tipo]}`}>
                          <TipoIcon size={10} />
                          {TIPO_LABELS[form.tipo]}
                        </span>
                        {editando && (
                          <span className="text-xs text-gray-400">· tipo pode ser alterado abaixo</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={fecharModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">

                  {/* Tipo (somente no edit) */}
                  {editando && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Tipo *</label>
                      <select
                        value={form.tipo}
                        onChange={(e) => setForm(f => ({ ...f, tipo: e.target.value as TipoItemEstoque, categoria: '' }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                      >
                        <option value="HARDWARE">Hardware</option>
                        <option value="SOFTWARE">Software</option>
                        <option value="PERIFERICO">Periférico</option>
                        <option value="PAPELARIA">Papelaria</option>
                      </select>
                    </div>
                  )}

                  {/* Nome */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nome *</label>
                    <input
                      autoFocus
                      value={form.nome}
                      onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))}
                      placeholder={cfg.placeholder}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  {/* Categoria */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Categoria</label>
                    <select
                      value={form.categoria ?? ''}
                      onChange={(e) => setForm(f => ({ ...f, categoria: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    >
                      <option value="">Selecionar categoria...</option>
                      {CATEGORIAS_POR_TIPO[form.tipo].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Marca e Modelo — apenas HARDWARE e PERIFERICO */}
                  {cfg.temMarcaModelo && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Marca</label>
                        <input
                          value={form.marca ?? ''}
                          onChange={(e) => setForm(f => ({ ...f, marca: e.target.value }))}
                          placeholder="Ex: Arduino"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Modelo</label>
                        <input
                          value={form.modelo ?? ''}
                          onChange={(e) => setForm(f => ({ ...f, modelo: e.target.value }))}
                          placeholder="Ex: Uno R3"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Quantidade */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Quantidade total *
                      {editando && (
                        <span className="text-gray-400 font-normal ml-1">
                          (Disponível atual: {editando.quantidadeDisponivel})
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.quantidadeTotal}
                      onChange={(e) => setForm(f => ({ ...f, quantidadeTotal: Number(e.target.value) }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
                    <textarea
                      value={form.descricao ?? ''}
                      onChange={(e) => setForm(f => ({ ...f, descricao: e.target.value }))}
                      rows={2}
                      placeholder="Informações adicionais..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                    />
                  </div>

                  {/* Imagem */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">URL da imagem</label>
                    <input
                      value={form.imagemUrl ?? ''}
                      onChange={(e) => setForm(f => ({ ...f, imagemUrl: e.target.value }))}
                      placeholder="https://..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      {(error as any)?.response?.data?.message ?? 'Erro ao salvar item.'}
                    </p>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                  <button
                    onClick={fecharModal}
                    className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={salvar}
                    disabled={isPending || !form.nome.trim()}
                    className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                  >
                    {isPending && <Loader2 size={14} className="animate-spin" />}
                    {editando ? 'Salvar' : 'Criar item'}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
