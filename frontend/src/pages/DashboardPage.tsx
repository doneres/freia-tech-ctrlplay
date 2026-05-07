import { useQuery } from '@tanstack/react-query';
import { FolderKanban, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { listarProjetos } from '../api/projetos';
import type { Projeto } from '../types';
import StatusBadge from '../components/ui/StatusBadge';
import { Link } from 'react-router-dom';

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: projetos = [], isLoading } = useQuery<Projeto[]>({
    queryKey: ['projetos'],
    queryFn: () => listarProjetos(),
  });

  const total = projetos.length;
  const submetidos = projetos.filter((p) => p.statusProjeto === 'SUBMETIDO').length;
  const emAndamento = projetos.filter((p) => p.statusProjeto === 'EM_ANDAMENTO').length;
  const concluidos = projetos.filter((p) => p.statusProjeto === 'CONCLUIDO').length;

  const recentes = projetos.slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={32} className="animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral da Feira Tecnológica</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total de projetos" value={total} icon={FolderKanban} color="bg-brand-600" />
        <StatCard label="Aguardando revisão" value={submetidos} icon={Clock} color="bg-orange-500" />
        <StatCard label="Em andamento" value={emAndamento} icon={AlertCircle} color="bg-blue-500" />
        <StatCard label="Concluídos" value={concluidos} icon={CheckCircle} color="bg-green-500" />
      </div>

      {/* Recent projects */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Projetos recentes</h2>
          <Link to="/projetos" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            Ver todos
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentes.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">Nenhum projeto cadastrado.</p>
          ) : (
            recentes.map((projeto) => (
              <Link
                key={projeto.id}
                to={`/projetos/${projeto.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {projeto.nomeProjeto ?? 'Sem nome'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {projeto.instrutor?.nome} • {projeto.nomeGrupo ?? '—'}
                  </p>
                </div>
                <StatusBadge type="projeto" value={projeto.statusProjeto} />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
