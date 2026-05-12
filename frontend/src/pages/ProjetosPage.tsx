import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Loader2, ChevronRight, ArrowUpDown } from 'lucide-react';
import { listarProjetos, type ProjetoFilters } from '../api/projetos';
import { listarInstrutores } from '../api/usuarios';
import { listarEstoque } from '../api/estoque';
import type { Projeto, StatusProjeto, Turno, NivelTurma } from '../types';
import StatusBadge from '../components/ui/StatusBadge';
import SearchableSelect from '../components/ui/SearchableSelect';
import { useAuth } from '../contexts/AuthContext';

const FILTERS_KEY = 'projetos_filters';

type SortKey = 'recentes' | 'antigos' | 'nome_az' | 'nome_za' | 'professor_az' | 'mais_alunos' | 'menos_alunos';

interface SavedFilters {
  search: string;
  statusProjeto: StatusProjeto | '';
  turno: Turno | '';
  nivelTurma: NivelTurma | '';
  instrutorId: string;
  itemEstoqueId: string;
  sortBy: SortKey;
}

function loadFilters(): SavedFilters {
  try {
    const raw = sessionStorage.getItem(FILTERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { search: '', statusProjeto: '', turno: '', nivelTurma: '', instrutorId: '', itemEstoqueId: '', sortBy: 'recentes' };
}

const statusOptions: { value: StatusProjeto | ''; label: string }[] = [
  { value: '', label: 'Todos os status' },
  { value: 'RASCUNHO', label: 'Rascunho' },
  { value: 'SUBMETIDO', label: 'Submetido' },
  { value: 'APROVADO', label: 'Aprovado' },
  { value: 'REPROVADO', label: 'Reprovado' },
  { value: 'EM_ANDAMENTO', label: 'Em andamento' },
  { value: 'CONCLUIDO', label: 'Concluído' },
];

const turnoOptions: { value: Turno | ''; label: string }[] = [
  { value: '', label: 'Todos os turnos' },
  { value: 'MANHA', label: 'Manhã' },
  { value: 'TARDE', label: 'Tarde' },
  { value: 'NOITE', label: 'Noite' },
];

const nivelOptions: { value: NivelTurma | ''; label: string }[] = [
  { value: '', label: 'Todos os níveis' },
  { value: 'CK', label: 'CK' },
  { value: 'CT', label: 'CT' },
  { value: 'CY', label: 'CY' },
  { value: 'CP', label: 'CP' },
];

export default function ProjetosPage() {
  const { user } = useAuth();

  const saved = loadFilters();
  const [search, setSearch] = useState(saved.search);
  const [statusProjeto, setStatusProjeto] = useState<StatusProjeto | ''>(saved.statusProjeto);
  const [turno, setTurno] = useState<Turno | ''>(saved.turno);
  const [nivelTurma, setNivelTurma] = useState<NivelTurma | ''>(saved.nivelTurma);
  const [instrutorId, setInstrutorId] = useState(saved.instrutorId);
  const [itemEstoqueId, setItemEstoqueId] = useState(saved.itemEstoqueId);
  const [sortBy, setSortBy] = useState<SortKey>(saved.sortBy ?? 'recentes');

  const isInstrutor = user?.perfil === 'INSTRUTOR';

  useEffect(() => {
    const filters: SavedFilters = { search, statusProjeto, turno, nivelTurma, instrutorId, itemEstoqueId, sortBy };
    sessionStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
  }, [search, statusProjeto, turno, nivelTurma, instrutorId, itemEstoqueId, sortBy]);

  const queryFilters: ProjetoFilters = {
    search: search || undefined,
    statusProjeto: statusProjeto || undefined,
    turno: turno || undefined,
    nivelTurma: nivelTurma || undefined,
    instrutorId: isInstrutor ? user.id : (instrutorId || undefined),
    itemEstoqueId: itemEstoqueId || undefined,
  };

  const { data: projetos = [], isLoading } = useQuery<Projeto[]>({
    queryKey: ['projetos', queryFilters],
    queryFn: () => listarProjetos(queryFilters),
  });

  const sortedProjetos = useMemo(() => {
    const arr = [...projetos];
    switch (sortBy) {
      case 'antigos': return arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'nome_az': return arr.sort((a, b) => a.nomeProjeto.localeCompare(b.nomeProjeto, 'pt-BR'));
      case 'nome_za': return arr.sort((a, b) => b.nomeProjeto.localeCompare(a.nomeProjeto, 'pt-BR'));
      case 'professor_az': return arr.sort((a, b) => (a.instrutor?.nome ?? '').localeCompare(b.instrutor?.nome ?? '', 'pt-BR'));
      case 'mais_alunos': return arr.sort((a, b) => (b.qtdAlunos ?? 0) - (a.qtdAlunos ?? 0));
      case 'menos_alunos': return arr.sort((a, b) => (a.qtdAlunos ?? 0) - (b.qtdAlunos ?? 0));
      default: return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [projetos, sortBy]);

  const { data: instrutores = [] } = useQuery({
    queryKey: ['instrutores'],
    queryFn: listarInstrutores,
    enabled: !isInstrutor,
  });

  const { data: itensEstoque = [] } = useQuery({
    queryKey: ['estoque', { apenasAtivos: true }],
    queryFn: () => listarEstoque({ apenasAtivos: true }),
  });

  const canCreateProject = user?.perfil === 'INSTRUTOR' || user?.perfil === 'ADMINISTRADOR';

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projetos</h1>
          <p className="text-gray-500 text-sm mt-1">
            {projetos.length} projeto{projetos.length !== 1 ? 's' : ''} encontrado
            {projetos.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canCreateProject && (
          <Link
            to="/projetos/novo"
            className="hidden sm:flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Novo projeto
          </Link>
        )}
      </div>

      {/* FAB mobile */}
      {canCreateProject && (
        <Link
          to="/projetos/novo"
          className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-lg flex items-center justify-center z-30 transition-colors"
          aria-label="Novo projeto"
        >
          <Plus size={24} />
        </Link>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 flex flex-wrap gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar projeto ou grupo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none bg-transparent min-w-0"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={15} className="text-gray-400 shrink-0" />
          <select
            value={statusProjeto}
            onChange={(e) => setStatusProjeto(e.target.value as StatusProjeto | '')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <select
          value={turno}
          onChange={(e) => setTurno(e.target.value as Turno | '')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        >
          {turnoOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={nivelTurma}
          onChange={(e) => setNivelTurma(e.target.value as NivelTurma | '')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        >
          {nivelOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {!isInstrutor && (
          <SearchableSelect
            value={instrutorId}
            onChange={setInstrutorId}
            options={instrutores.map((i) => ({ value: i.id, label: i.nome }))}
            placeholder="Todos os professores"
          />
        )}

        <SearchableSelect
          value={itemEstoqueId}
          onChange={setItemEstoqueId}
          options={itensEstoque.map((item) => ({ value: item.id, label: item.nome }))}
          placeholder="Todos os materiais"
        />

        <div className="flex items-center gap-2">
          <ArrowUpDown size={15} className="text-gray-400 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="recentes">Mais recentes</option>
            <option value="antigos">Mais antigos</option>
            <option value="nome_az">Nome A–Z</option>
            <option value="nome_za">Nome Z–A</option>
            <option value="professor_az">Professor A–Z</option>
            <option value="mais_alunos">Mais alunos</option>
            <option value="menos_alunos">Menos alunos</option>
          </select>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-brand-600" />
        </div>
      ) : sortedProjetos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 text-sm">Nenhum projeto encontrado.</p>
          {canCreateProject && (
            <Link
              to="/projetos/novo"
              className="mt-3 inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700 text-sm font-medium"
            >
              <Plus size={14} /> Criar o primeiro projeto
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {sortedProjetos.map((projeto, i) => (
            <Link
              key={projeto.id}
              to={`/projetos/${projeto.id}`}
              className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors ${
                i !== 0 ? 'border-t border-gray-100' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {projeto.nomeProjeto ?? 'Sem nome'}
                  </p>
                  <StatusBadge type="projeto" value={projeto.statusProjeto} />
                </div>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                  <span>{projeto.instrutor?.nome}</span>
                  {projeto.codigoTurma && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span>{projeto.codigoTurma}</span>
                    </>
                  )}
                  {projeto.turno && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span>{projeto.turno === 'MANHA' ? 'Manhã' : projeto.turno === 'TARDE' ? 'Tarde' : 'Noite'}</span>
                    </>
                  )}
                  {projeto.nivelTurma && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span>{projeto.nivelTurma}</span>
                    </>
                  )}
                  {projeto.qtdAlunos != null && projeto.qtdAlunos > 0 && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span>{projeto.qtdAlunos} aluno{projeto.qtdAlunos !== 1 ? 's' : ''}</span>
                    </>
                  )}
                  {projeto.createdAt && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span>{new Date(projeto.createdAt).toLocaleDateString('pt-BR')}</span>
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0 ml-4">
                {projeto.materiais?.length > 0 && (
                  <span className="text-xs text-gray-400">
                    {projeto.materiais.length} material{projeto.materiais.length !== 1 ? 'is' : ''}
                  </span>
                )}
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
