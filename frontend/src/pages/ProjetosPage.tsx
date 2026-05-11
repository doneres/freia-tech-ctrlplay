import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Loader2, ChevronRight } from 'lucide-react';
import { listarProjetos, type ProjetoFilters } from '../api/projetos';
import type { Projeto, StatusProjeto, Turno, NivelTurma } from '../types';
import StatusBadge from '../components/ui/StatusBadge';
import { useAuth } from '../contexts/AuthContext';

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
  const [search, setSearch] = useState('');
  const [statusProjeto, setStatusProjeto] = useState<StatusProjeto | ''>('');
  const [turno, setTurno] = useState<Turno | ''>('');
  const [nivelTurma, setNivelTurma] = useState<NivelTurma | ''>('');

  const filters: ProjetoFilters = {
    search: search || undefined,
    statusProjeto: statusProjeto || undefined,
    turno: turno || undefined,
    nivelTurma: nivelTurma || undefined,
    instrutorId:
      user?.perfil === 'INSTRUTOR' ? user.id : undefined,
  };

  const { data: projetos = [], isLoading } = useQuery<Projeto[]>({
    queryKey: ['projetos', filters],
    queryFn: () => listarProjetos(filters),
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
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar projeto ou grupo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none bg-transparent"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
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
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-brand-600" />
        </div>
      ) : projetos.length === 0 ? (
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
          {projetos.map((projeto, i) => (
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
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
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
