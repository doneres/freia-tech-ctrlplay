import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Check, Loader2, Plus, X, ChevronRight, ChevronLeft, CheckCircle2,
  Cpu, Code2, Search, Gamepad2,
} from 'lucide-react';
import { criarProjeto } from '../api/projetos';
import { listarInstrutores } from '../api/usuarios';
import { listarFerramentas } from '../api/ferramentas';
import { listarEstoque } from '../api/estoque';
import type { ProjetoRequest, Turno, NivelTurma, TipoProjeto, FerramentaSoftware, ItemEstoque, TipoItemEstoque } from '../types';
import { useAuth } from '../contexts/AuthContext';

type EquipamentoSelecionado = { item: ItemEstoque; quantidade: number };

const STEPS = ['Identificação', 'Proposta', 'Ferramentas', 'Revisão'];

const ODS_LIST = [
  { n: 1,  label: 'Erradicação da Pobreza' },
  { n: 2,  label: 'Fome Zero' },
  { n: 3,  label: 'Saúde e Bem-Estar' },
  { n: 4,  label: 'Educação de Qualidade' },
  { n: 5,  label: 'Igualdade de Gênero' },
  { n: 6,  label: 'Água Potável e Saneamento' },
  { n: 7,  label: 'Energia Limpa e Acessível' },
  { n: 8,  label: 'Trabalho Decente' },
  { n: 9,  label: 'Indústria e Inovação' },
  { n: 10, label: 'Redução das Desigualdades' },
  { n: 11, label: 'Cidades Sustentáveis' },
  { n: 12, label: 'Consumo Responsável' },
  { n: 13, label: 'Ação Climática' },
  { n: 14, label: 'Vida na Água' },
  { n: 15, label: 'Vida Terrestre' },
  { n: 16, label: 'Paz e Justiça' },
  { n: 17, label: 'Parcerias Globais' },
];

const TURNO_LABEL: Record<string, string> = { MANHA: 'Manhã', TARDE: 'Tarde', NOITE: 'Noite' };

function ReviewItem({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-1 min-w-0">
      <span className="text-xs text-gray-500 shrink-0">{label}:</span>
      <span className="text-xs text-gray-800 font-medium truncate">{value}</span>
    </div>
  );
}

// ── Sub-componentes do step 2 ────────────────────────────────────────────────

function FerramentasCatalogoSelector({
  ferramentas, selecionados, onToggle,
}: {
  ferramentas: FerramentaSoftware[];
  selecionados: string[];
  onToggle: (id: string) => void;
}) {
  const porCategoria = ferramentas.reduce<Record<string, FerramentaSoftware[]>>((acc, f) => {
    const cat = f.categoria ?? 'Outros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(f);
    return acc;
  }, {});

  if (ferramentas.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <p className="text-xs text-gray-400">Nenhuma ferramenta de software cadastrada ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-gray-600">Ferramentas de software <span className="text-gray-400">(selecione as que serão utilizadas)</span></p>
      {Object.entries(porCategoria).sort(([a], [b]) => a.localeCompare(b)).map(([cat, itens]) => (
        <div key={cat}>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{cat}</p>
          <div className="grid grid-cols-3 gap-2">
            {itens.map(f => {
              const sel = selecionados.includes(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onToggle(f.id)}
                  className={[
                    'flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-left',
                    sel ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50',
                  ].join(' ')}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${sel ? 'bg-brand-100' : 'bg-gray-100'}`}>
                    {f.imagemUrl
                      ? <img src={f.imagemUrl} alt={f.nome} className="w-full h-full object-contain rounded-lg" />
                      : <Code2 size={14} className={sel ? 'text-brand-600' : 'text-gray-400'} />
                    }
                  </div>
                  <span className={`text-xs font-medium leading-tight ${sel ? 'text-brand-700' : 'text-gray-700'}`}>
                    {f.nome}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const TIPO_ICONS_EST: Record<TipoItemEstoque, React.ElementType> = {
  HARDWARE: Cpu, SOFTWARE: Code2, PERIFERICO: Gamepad2,
};

function EquipamentosEstoqueSelector({
  tipo, itens, selecionados, search, tipoFiltro,
  onSearchChange, onTipoFiltroChange, onAdicionar, onRemover, onAlterarQtd,
}: {
  tipo: TipoProjeto;
  itens: ItemEstoque[];
  selecionados: EquipamentoSelecionado[];
  search: string;
  tipoFiltro: TipoItemEstoque | '';
  onSearchChange: (v: string) => void;
  onTipoFiltroChange: (v: TipoItemEstoque | '') => void;
  onAdicionar: (item: ItemEstoque) => void;
  onRemover: (id: string) => void;
  onAlterarQtd: (id: string, qtd: number) => void;
}) {
  const titulo = tipo === 'HARDWARE'
    ? 'Equipamentos e periféricos'
    : 'Periféricos necessários (opcional)';

  const naoSelecionados = itens.filter(i => !selecionados.some(s => s.item.id === i.id));

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-600">{titulo}</p>

      {/* Itens selecionados */}
      {selecionados.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {selecionados.map(({ item, quantidade }) => {
            const Icon = TIPO_ICONS_EST[item.tipo];
            return (
              <div key={item.id} className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-lg px-3 py-2">
                <div className="w-7 h-7 rounded-md bg-white border border-brand-100 flex items-center justify-center shrink-0">
                  {item.imagemUrl
                    ? <img src={item.imagemUrl} alt={item.nome} className="w-full h-full object-cover rounded-md" />
                    : <Icon size={13} className="text-brand-500" />
                  }
                </div>
                <span className="flex-1 text-xs font-medium text-brand-800 truncate">{item.nome}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <label className="text-xs text-brand-600">Qtd:</label>
                  <input
                    type="number"
                    min={1}
                    max={item.quantidadeDisponivel}
                    value={quantidade}
                    onChange={e => onAlterarQtd(item.id, Number(e.target.value))}
                    className="w-14 text-xs border border-brand-300 rounded px-1.5 py-1 text-center focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <span className="text-[10px] text-brand-500">/ {item.quantidadeDisponivel}</span>
                </div>
                <button type="button" onClick={() => onRemover(item.id)} className="text-brand-400 hover:text-red-500 ml-1">
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Busca */}
      <div className="flex gap-2">
        <div className="flex items-center gap-1.5 flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white">
          <Search size={13} className="text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Buscar equipamento..."
            className="flex-1 text-xs outline-none"
          />
        </div>
        {tipo === 'HARDWARE' && (
          <select
            value={tipoFiltro}
            onChange={e => onTipoFiltroChange(e.target.value as TipoItemEstoque | '')}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none bg-white"
          >
            <option value="">Todos</option>
            <option value="HARDWARE">Hardware</option>
            <option value="PERIFERICO">Periférico</option>
          </select>
        )}
      </div>

      {/* Lista de disponíveis */}
      <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 rounded-xl p-2 bg-white">
        {naoSelecionados.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">
            {itens.length === 0 ? 'Nenhum item disponível no estoque.' : 'Todos os itens já foram adicionados.'}
          </p>
        ) : naoSelecionados.map(item => {
          const Icon = TIPO_ICONS_EST[item.tipo];
          const semEstoque = item.quantidadeDisponivel === 0;
          return (
            <button
              key={item.id}
              type="button"
              disabled={semEstoque}
              onClick={() => onAdicionar(item)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all ${
                semEstoque
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-brand-50 hover:border-brand-200'
              }`}
            >
              <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                {item.imagemUrl
                  ? <img src={item.imagemUrl} alt={item.nome} className="w-full h-full object-cover rounded-md" />
                  : <Icon size={13} className="text-gray-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{item.nome}</p>
                <p className="text-[10px] text-gray-400">{[item.marca, item.modelo].filter(Boolean).join(' ')}</p>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-xs font-semibold ${semEstoque ? 'text-red-500' : 'text-green-600'}`}>
                  {item.quantidadeDisponivel}
                </span>
                <p className="text-[10px] text-gray-400">disp.</p>
              </div>
              {!semEstoque && (
                <div className="shrink-0">
                  <Plus size={14} className="text-brand-500" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function NovoProjetoPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Partial<ProjetoRequest>>({
    instrutorId: user?.perfil === 'INSTRUTOR' ? user.id : '',
    integrantes: [],
    ferramentasSoftwareIds: [],
    equipamentosEstoque: [],
  });
  const [novoIntegrante, setNovoIntegrante] = useState('');
  const [stepError, setStepError] = useState('');

  // step 2 — estado local de equipamentos selecionados (para exibir nome/img no wizard)
  const [equipamentosSelecionados, setEquipamentosSelecionados] = useState<EquipamentoSelecionado[]>([]);
  const [estoqueSearch, setEstoqueSearch] = useState('');
  const [estoqueTipoFiltro, setEstoqueTipoFiltro] = useState<TipoItemEstoque | ''>('');

  const { data: instrutores = [] } = useQuery({
    queryKey: ['instrutores'],
    queryFn: listarInstrutores,
    enabled: user?.perfil !== 'INSTRUTOR',
  });

  const { data: ferramentasCatalogo = [] } = useQuery({
    queryKey: ['ferramentas', true],
    queryFn: () => listarFerramentas(true),
    enabled: step === 2,
  });

  const tiposEstoque: TipoItemEstoque[] =
    form.tipoProjeto === 'HARDWARE' ? ['HARDWARE', 'PERIFERICO'] : ['PERIFERICO'];

  const { data: itensEstoque = [] } = useQuery({
    queryKey: ['estoque', { tipos: tiposEstoque, search: estoqueSearch }],
    queryFn: () => listarEstoque({ search: estoqueSearch || undefined, apenasAtivos: true }),
    enabled: step === 2 && form.tipoProjeto != null,
    select: (data) => data.filter(i =>
      tiposEstoque.includes(i.tipo) &&
      (estoqueTipoFiltro === '' || i.tipo === estoqueTipoFiltro)
    ),
  });

  const mutation = useMutation({
    mutationFn: criarProjeto,
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setStepError(msg ?? 'Erro ao criar projeto. Tente novamente.');
    },
  });

  useEffect(() => {
    if (mutation.isSuccess && mutation.data) {
      navigate(`/projetos/${mutation.data.id}`);
    }
  }, [mutation.isSuccess, mutation.data, navigate]);

  function f<K extends keyof ProjetoRequest>(key: K, value: ProjetoRequest[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleFerramenta(id: string) {
    const atual = form.ferramentasSoftwareIds ?? [];
    f('ferramentasSoftwareIds', atual.includes(id) ? atual.filter(x => x !== id) : [...atual, id]);
  }

  function adicionarEquipamento(item: ItemEstoque) {
    if (equipamentosSelecionados.some(e => e.item.id === item.id)) return;
    const novo = [...equipamentosSelecionados, { item, quantidade: 1 }];
    setEquipamentosSelecionados(novo);
    f('equipamentosEstoque', novo.map(e => ({ itemEstoqueId: e.item.id, quantidade: e.quantidade })));
  }

  function removerEquipamento(id: string) {
    const novo = equipamentosSelecionados.filter(e => e.item.id !== id);
    setEquipamentosSelecionados(novo);
    f('equipamentosEstoque', novo.map(e => ({ itemEstoqueId: e.item.id, quantidade: e.quantidade })));
  }

  function alterarQtdEquipamento(id: string, qtd: number) {
    const novo = equipamentosSelecionados.map(e =>
      e.item.id === id ? { ...e, quantidade: Math.max(1, Math.min(qtd, e.item.quantidadeDisponivel)) } : e
    );
    setEquipamentosSelecionados(novo);
    f('equipamentosEstoque', novo.map(e => ({ itemEstoqueId: e.item.id, quantidade: e.quantidade })));
  }

  function addIntegrante() {
    if (!novoIntegrante.trim()) return;
    f('integrantes', [...(form.integrantes ?? []), novoIntegrante.trim()]);
    setNovoIntegrante('');
  }

  function removeIntegrante(idx: number) {
    f('integrantes', (form.integrantes ?? []).filter((_, i) => i !== idx));
  }

  // ODS stored as comma-separated string: "1,5,13"
  const selectedOds = (form.ods ?? '').split(',').filter(Boolean).map(Number);

  function toggleOds(n: number) {
    const next = selectedOds.includes(n)
      ? selectedOds.filter((x) => x !== n)
      : [...selectedOds, n].sort((a, b) => a - b);
    f('ods', next.length > 0 ? next.join(',') : '');
  }

  function goNext() {
    setStepError('');
    if (step === 0) {
      if (!form.nomeProjeto?.trim()) return setStepError('Nome do projeto é obrigatório.');
      if (user?.perfil !== 'INSTRUTOR' && !form.instrutorId) return setStepError('Selecione um instrutor.');
      if (!form.codigoTurma?.trim()) return setStepError('Código da turma é obrigatório.');
      if (!form.turno) return setStepError('Turno é obrigatório.');
      if (!form.nivelTurma) return setStepError('Nível da turma é obrigatório.');
      if (!form.qtdAlunos || form.qtdAlunos < 1) return setStepError('Quantidade de alunos é obrigatória.');
    }
    if (step === 1) {
      if (selectedOds.length === 0) return setStepError('Selecione pelo menos uma ODS.');
      if (!form.problemaIdentificado?.trim()) return setStepError('Problema identificado é obrigatório.');
      if (!form.solucaoProposta?.trim()) return setStepError('Solução proposta é obrigatória.');
      if (!form.objetivoProjeto?.trim()) return setStepError('Objetivo do projeto é obrigatório.');
    }
    if (step === 2) {
      if (!form.tipoProjeto) return setStepError('Selecione o tipo do projeto.');
      if (form.tipoProjeto === 'SOFTWARE' && (form.ferramentasSoftwareIds ?? []).length === 0) {
        return setStepError('Selecione pelo menos uma ferramenta de software.');
      }
      if (form.tipoProjeto === 'HARDWARE' && equipamentosSelecionados.length === 0) {
        return setStepError('Selecione pelo menos um equipamento do estoque.');
      }
    }
    setStep((s) => s + 1);
  }

  function goPrev() {
    setStepError('');
    setStep((s) => s - 1);
  }

  function submit() {
    setStepError('');
    mutation.mutate(form as ProjetoRequest);
  }

  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white';
  const lbl = 'block text-xs font-medium text-gray-600 mb-1';

  const instructorName =
    instrutores.find((i) => i.id === form.instrutorId)?.nome ??
    (user?.perfil === 'INSTRUTOR' ? user.nome : undefined);

  return (
    <div className="h-full flex flex-col overflow-hidden relative bg-white">

      {/* ── Loading overlay ─────────────────────────────────────────────────── */}
      {mutation.isPending && (
        <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center z-50">
          <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mb-4">
            <Loader2 size={30} className="animate-spin text-brand-600" />
          </div>
          <p className="font-semibold text-gray-900 text-base">Criando projeto...</p>
          <p className="text-sm text-gray-500 mt-1">Salvando as informações, aguarde</p>
        </div>
      )}

      {/* ── Header: voltar + indicador de etapas ────────────────────────────── */}
      <div className="flex-shrink-0 px-8 pt-5 pb-4 border-b border-gray-100">
        <Link
          to="/projetos"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft size={13} /> Voltar para projetos
        </Link>

        <div className="flex items-center">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center">
              <button
                type="button"
                onClick={() => { if (i < step) { setStepError(''); setStep(i); } }}
                disabled={i >= step}
                className="flex items-center gap-2 group"
              >
                <span
                  className={[
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0',
                    i === step ? 'bg-brand-600 text-white shadow-sm' : '',
                    i < step ? 'bg-brand-100 text-brand-700 group-hover:bg-brand-200 cursor-pointer' : '',
                    i > step ? 'bg-gray-100 text-gray-400 cursor-default' : '',
                  ].join(' ')}
                >
                  {i < step ? <Check size={12} /> : i + 1}
                </span>
                <span
                  className={[
                    'text-xs font-medium hidden sm:block',
                    i === step ? 'text-gray-900' : i < step ? 'text-brand-600' : 'text-gray-400',
                  ].join(' ')}
                >
                  {label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-px mx-3 flex-shrink-0 ${i < step ? 'bg-brand-200' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Título da etapa ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-8 pt-4 pb-1">
        <h1 className="text-base font-bold text-gray-900">
          {['Identificação do projeto', 'Proposta e objetivos', 'Ferramentas e tecnologia', 'Revisão e envio'][step]}
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          {[
            'Informações básicas do projeto e da turma',
            'Descreva o problema, a solução e os objetivos',
            'Defina o tipo do projeto e as ferramentas utilizadas',
            'Confira os dados antes de criar o projeto',
          ][step]}
        </p>
      </div>

      {/* ── Conteúdo da etapa ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-8 py-3 min-h-0">
        {stepError && (
          <div className="mb-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2.5">
            {stepError}
          </div>
        )}

        {/* ── Etapa 0: Identificação ─────────────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-3">
            <div>
              <label className={lbl}>Nome do projeto *</label>
              <input
                autoFocus
                type="text"
                value={form.nomeProjeto ?? ''}
                onChange={(e) => f('nomeProjeto', e.target.value)}
                className={inp}
                placeholder="Ex: Sistema de monitoramento de qualidade do ar"
              />
            </div>

            {user?.perfil !== 'INSTRUTOR' && (
              <div>
                <label className={lbl}>Instrutor *</label>
                <select
                  value={form.instrutorId ?? ''}
                  onChange={(e) => f('instrutorId', e.target.value)}
                  className={inp}
                >
                  <option value="">Selecionar instrutor...</option>
                  {instrutores.map((i) => (
                    <option key={i.id} value={i.id}>{i.nome}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Código da turma</label>
                <input
                  type="text"
                  value={form.codigoTurma ?? ''}
                  onChange={(e) => f('codigoTurma', e.target.value)}
                  className={inp}
                  placeholder="Ex: #4508"
                />
              </div>
              <div>
                <label className={lbl}>Turno</label>
                <select
                  value={form.turno ?? ''}
                  onChange={(e) => f('turno', (e.target.value || undefined) as Turno | undefined)}
                  className={inp}
                >
                  <option value="">Selecionar...</option>
                  <option value="MANHA">Manhã</option>
                  <option value="TARDE">Tarde</option>
                  <option value="NOITE">Noite</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Nível da turma</label>
                <select
                  value={form.nivelTurma ?? ''}
                  onChange={(e) => f('nivelTurma', (e.target.value || undefined) as NivelTurma | undefined)}
                  className={inp}
                >
                  <option value="">Selecionar...</option>
                  <option value="CK">CK</option>
                  <option value="CT">CT</option>
                  <option value="CY">CY</option>
                  <option value="CP">CP</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Qtd. alunos</label>
                <input
                  type="number"
                  min={1}
                  value={form.qtdAlunos ?? ''}
                  onChange={(e) => f('qtdAlunos', e.target.value ? Number(e.target.value) : undefined)}
                  className={inp}
                />
              </div>
            </div>

            <div>
              <label className={lbl}>Integrantes</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={novoIntegrante}
                  onChange={(e) => setNovoIntegrante(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addIntegrante(); } }}
                  className={inp}
                  placeholder="Nome do integrante (Enter para adicionar)"
                />
                <button
                  type="button"
                  onClick={addIntegrante}
                  className="px-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                >
                  <Plus size={15} className="text-gray-600" />
                </button>
              </div>
              {(form.integrantes ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(form.integrantes ?? []).map((nome, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-xs px-2.5 py-1 rounded-full"
                    >
                      {nome}
                      <button type="button" onClick={() => removeIntegrante(i)}>
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Etapa 1: Proposta ──────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className={`${lbl} mb-2`}>
                ODS — Objetivos de Desenvolvimento Sustentável *
                <span className="ml-1 font-normal text-gray-400">(selecione as que o projeto aborda)</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
                {ODS_LIST.map(({ n, label }) => {
                  const selected = selectedOds.includes(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => toggleOds(n)}
                      className={[
                        'flex flex-col items-center justify-center p-1.5 rounded-lg border text-center transition-all',
                        selected
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-brand-300 hover:bg-brand-50/50',
                      ].join(' ')}
                    >
                      <span className={`text-base font-bold leading-none ${selected ? 'text-brand-600' : 'text-gray-400'}`}>
                        {n}
                      </span>
                      <span className="text-[10px] leading-tight mt-0.5 line-clamp-2">{label}</span>
                    </button>
                  );
                })}
              </div>
              {selectedOds.length > 0 && (
                <p className="mt-1.5 text-xs text-brand-600 font-medium">
                  ODS selecionadas: {selectedOds.join(', ')}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Problema identificado</label>
                <textarea
                  rows={3}
                  value={form.problemaIdentificado ?? ''}
                  onChange={(e) => f('problemaIdentificado', e.target.value)}
                  className={`${inp} resize-none`}
                  placeholder="Qual problema o projeto resolve?"
                />
              </div>
              <div>
                <label className={lbl}>Solução proposta</label>
                <textarea
                  rows={3}
                  value={form.solucaoProposta ?? ''}
                  onChange={(e) => f('solucaoProposta', e.target.value)}
                  className={`${inp} resize-none`}
                  placeholder="Como o projeto resolve o problema?"
                />
              </div>
            </div>

            <div>
              <label className={lbl}>Objetivo do projeto</label>
              <textarea
                rows={2}
                value={form.objetivoProjeto ?? ''}
                onChange={(e) => f('objetivoProjeto', e.target.value)}
                className={`${inp} resize-none`}
                placeholder="Qual o objetivo principal que o projeto busca alcançar?"
              />
            </div>
          </div>
        )}

        {/* ── Etapa 2: Ferramentas ───────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Tipo do projeto */}
            <div>
              <label className={`${lbl} mb-2`}>Tipo do projeto</label>
              <div className="grid grid-cols-2 gap-3">
                {(['HARDWARE', 'SOFTWARE'] as TipoProjeto[]).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => {
                      f('tipoProjeto', tipo);
                      setEquipamentosSelecionados([]);
                      f('equipamentosEstoque', []);
                      f('ferramentasSoftwareIds', []);
                      setEstoqueSearch('');
                      setEstoqueTipoFiltro('');
                    }}
                    className={[
                      'flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left',
                      form.tipoProjeto === tipo
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    <div className={`p-2 rounded-lg ${form.tipoProjeto === tipo ? 'bg-brand-100' : 'bg-gray-100'}`}>
                      {tipo === 'HARDWARE'
                        ? <Cpu size={20} className={form.tipoProjeto === tipo ? 'text-brand-600' : 'text-gray-500'} />
                        : <Code2 size={20} className={form.tipoProjeto === tipo ? 'text-brand-600' : 'text-gray-500'} />
                      }
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${form.tipoProjeto === tipo ? 'text-brand-700' : 'text-gray-700'}`}>
                        {tipo === 'HARDWARE' ? 'Hardware' : 'Software'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {tipo === 'HARDWARE' ? 'Robótica, IoT, eletrônica' : 'Web, app, jogos'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── SOFTWARE: seleção de ferramentas do catálogo ──────────── */}
            {form.tipoProjeto === 'SOFTWARE' && (
              <FerramentasCatalogoSelector
                ferramentas={ferramentasCatalogo}
                selecionados={form.ferramentasSoftwareIds ?? []}
                onToggle={toggleFerramenta}
              />
            )}

            {/* ── HARDWARE ou SOFTWARE: seleção de equipamentos do estoque ─ */}
            {form.tipoProjeto && (
              <EquipamentosEstoqueSelector
                tipo={form.tipoProjeto}
                itens={itensEstoque}
                selecionados={equipamentosSelecionados}
                search={estoqueSearch}
                tipoFiltro={estoqueTipoFiltro}
                onSearchChange={setEstoqueSearch}
                onTipoFiltroChange={setEstoqueTipoFiltro}
                onAdicionar={adicionarEquipamento}
                onRemover={removerEquipamento}
                onAlterarQtd={alterarQtdEquipamento}
              />
            )}

            {!form.tipoProjeto && (
              <p className="text-xs text-gray-400 text-center py-2">
                Selecione o tipo do projeto para ver as opções de ferramentas
              </p>
            )}
          </div>
        )}

        {/* ── Etapa 3: Revisão ───────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Identificação</span>
                <button type="button" onClick={() => { setStepError(''); setStep(0); }} className="text-xs text-brand-600 hover:underline">Editar</button>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                <ReviewItem label="Projeto" value={form.nomeProjeto} />
                <ReviewItem label="Instrutor" value={instructorName} />
                <ReviewItem label="Código da turma" value={form.codigoTurma} />
                <ReviewItem label="Turno" value={form.turno ? TURNO_LABEL[form.turno] : undefined} />
                <ReviewItem label="Nível" value={form.nivelTurma} />
                <ReviewItem label="Alunos" value={form.qtdAlunos?.toString()} />
              </div>
              {(form.integrantes ?? []).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {(form.integrantes ?? []).map((n, i) => (
                    <span key={i} className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{n}</span>
                  ))}
                </div>
              )}
            </div>

            {(selectedOds.length > 0 || form.problemaIdentificado || form.solucaoProposta || form.objetivoProjeto) && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Proposta</span>
                  <button type="button" onClick={() => { setStepError(''); setStep(1); }} className="text-xs text-brand-600 hover:underline">Editar</button>
                </div>
                {selectedOds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {selectedOds.map((n) => (
                      <span key={n} className="text-xs bg-brand-100 text-brand-700 font-semibold px-2 py-0.5 rounded-full">ODS {n}</span>
                    ))}
                  </div>
                )}
                <div className="space-y-1">
                  <ReviewItem label="Problema" value={form.problemaIdentificado} />
                  <ReviewItem label="Solução" value={form.solucaoProposta} />
                  <ReviewItem label="Objetivo" value={form.objetivoProjeto} />
                </div>
              </div>
            )}

            {form.tipoProjeto && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ferramentas</span>
                  <button type="button" onClick={() => { setStepError(''); setStep(2); }} className="text-xs text-brand-600 hover:underline">Editar</button>
                </div>
                <ReviewItem label="Tipo" value={form.tipoProjeto === 'HARDWARE' ? 'Hardware' : 'Software'} />
                {form.tipoProjeto === 'SOFTWARE' && (form.ferramentasSoftwareIds ?? []).length > 0 && (
                  <div className="mt-1">
                    <p className="text-xs text-gray-500 mb-1">Ferramentas:</p>
                    <div className="flex flex-wrap gap-1">
                      {(form.ferramentasSoftwareIds ?? []).map(id => {
                        const f = ferramentasCatalogo.find(f => f.id === id);
                        return f ? (
                          <span key={id} className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">{f.nome}</span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
                {equipamentosSelecionados.length > 0 && (
                  <div className="mt-1">
                    <p className="text-xs text-gray-500 mb-1">Equipamentos reservados:</p>
                    <div className="space-y-0.5">
                      {equipamentosSelecionados.map(e => (
                        <p key={e.item.id} className="text-xs text-gray-700">
                          {e.item.nome} — {e.quantidade} un
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Navegação (footer) ───────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-8 py-4 bg-white border-t border-gray-100">
        <div className="flex items-center justify-between">
          {step === 0 ? (
            <Link to="/projetos" className="text-sm text-gray-500 hover:text-gray-700 font-medium">
              Cancelar
            </Link>
          ) : (
            <button
              type="button"
              onClick={goPrev}
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              <ChevronLeft size={16} /> Anterior
            </button>
          )}

          <span className="text-xs text-gray-400">{step + 1} / {STEPS.length}</span>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              Próximo <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={mutation.isPending}
              className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              <CheckCircle2 size={16} />
              Criar projeto
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
