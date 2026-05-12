import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FolderKanban, CheckCircle, Clock, AlertCircle, ChevronRight,
  Loader2, Package, CalendarDays, AlertTriangle, ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { listarProjetos } from '../api/projetos';
import { listarEstoque } from '../api/estoque';
import { buscarProximoEvento } from '../api/eventos';
import type { Projeto, ItemEstoque } from '../types';
import StatusBadge from '../components/ui/StatusBadge';
import { useAuth } from '../contexts/AuthContext';

// ── Greeting helpers ─────────────────────────────────────────────────────────

function greeting(nome: string) {
  const h = new Date().getHours();
  const period = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const firstName = nome.split(' ')[0];
  return `${period}, ${firstName}!`;
}

function formatDate() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
}

// ── Countdown ────────────────────────────────────────────────────────────────

function EventBanner({ dataEvento, nome }: { dataEvento: string; nome: string }) {
  const diff = new Date(dataEvento).getTime() - Date.now();
  if (diff <= 0) return null;

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);

  return (
    <Link
      to="/agenda"
      className="flex items-center justify-between gap-4 bg-brand-600 text-white rounded-2xl px-5 py-4 mb-6 hover:bg-brand-700 transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <CalendarDays size={20} className="text-brand-200 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs text-brand-200 font-medium uppercase tracking-wide">Próximo evento</p>
          <p className="font-semibold truncate">{nome}</p>
          <p className="text-brand-200 text-xs mt-0.5">
            {new Date(dataEvento).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 text-sm font-semibold tabular-nums">
          <span className="bg-brand-500 rounded-lg px-2.5 py-1">{days}d</span>
          <span className="text-brand-300">:</span>
          <span className="bg-brand-500 rounded-lg px-2.5 py-1">{String(hours).padStart(2, '0')}h</span>
          <span className="text-brand-300">:</span>
          <span className="bg-brand-500 rounded-lg px-2.5 py-1">{String(mins).padStart(2, '0')}m</span>
        </div>
        <ArrowRight size={16} className="text-brand-200 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, colorBg, colorText, to,
}: {
  label: string; value: number; icon: React.ElementType;
  colorBg: string; colorText: string; to?: string;
}) {
  const content = (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:border-gray-300 transition-colors">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorBg}`}>
        <Icon size={20} className={colorText} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : <div>{content}</div>;
}

// ── Project row ──────────────────────────────────────────────────────────────

function ProjectRow({ projeto }: { projeto: Projeto }) {
  return (
    <Link
      to={`/projetos/${projeto.id}`}
      className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors border-t border-gray-50 first:border-t-0"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate">
          {projeto.nomeProjeto ?? 'Sem nome'}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          {projeto.instrutor?.nome}
          {projeto.codigoTurma && ` • ${projeto.codigoTurma}`}
        </p>
      </div>
      <div className="flex items-center gap-3 ml-3 shrink-0">
        <StatusBadge type="projeto" value={projeto.statusProjeto} />
        <ChevronRight size={14} className="text-gray-300" />
      </div>
    </Link>
  );
}

// ── Stock alert row ──────────────────────────────────────────────────────────

function StockRow({ item }: { item: ItemEstoque }) {
  const pct = item.quantidadeTotal > 0
    ? Math.round((item.quantidadeDisponivel / item.quantidadeTotal) * 100)
    : 0;
  const color = pct === 0 ? 'bg-red-500' : pct <= 20 ? 'bg-orange-400' : 'bg-amber-400';
  return (
    <Link
      to="/estoque"
      className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors border-t border-gray-50 first:border-t-0"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate">{item.nome}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[80px]">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-gray-500">
            {item.quantidadeDisponivel}/{item.quantidadeTotal}
          </p>
        </div>
      </div>
      <ChevronRight size={14} className="text-gray-300 ml-3 shrink-0" />
    </Link>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const isInstrutor = user?.perfil === 'INSTRUTOR';
  const canSeeStock = user?.perfil === 'ADMINISTRADOR' || user?.perfil === 'COORDENACAO' || user?.perfil === 'MONITOR';
  const canSeeAllProjects = !isInstrutor;

  const projetoFilters = isInstrutor ? { instrutorId: user.id } : {};

  const { data: projetos = [], isLoading: loadingProjetos } = useQuery<Projeto[]>({
    queryKey: ['projetos', projetoFilters],
    queryFn: () => listarProjetos(projetoFilters),
  });

  const { data: estoque = [] } = useQuery<ItemEstoque[]>({
    queryKey: ['estoque', { apenasAtivos: true }],
    queryFn: () => listarEstoque({ apenasAtivos: true }),
    enabled: canSeeStock,
  });

  const { data: evento } = useQuery({
    queryKey: ['evento-proximo'],
    queryFn: buscarProximoEvento,
  });

  // Stats
  const stats = useMemo(() => ({
    total: projetos.length,
    submetidos: projetos.filter(p => p.statusProjeto === 'SUBMETIDO').length,
    emAndamento: projetos.filter(p => p.statusProjeto === 'EM_ANDAMENTO').length,
    concluidos: projetos.filter(p => p.statusProjeto === 'CONCLUIDO').length,
    rascunhos: projetos.filter(p => p.statusProjeto === 'RASCUNHO').length,
    reprovados: projetos.filter(p => p.statusProjeto === 'REPROVADO').length,
  }), [projetos]);

  // Projetos aguardando revisão (para coord/admin)
  const aguardandoRevisao = useMemo(
    () => projetos.filter(p => p.statusProjeto === 'SUBMETIDO').slice(0, 5),
    [projetos],
  );

  // Projetos do instrutor que precisam de ação
  const meusPendentes = useMemo(
    () => projetos.filter(p => p.statusProjeto === 'RASCUNHO' || p.statusProjeto === 'REPROVADO').slice(0, 5),
    [projetos],
  );

  // Recentes (para todos)
  const recentes = useMemo(() => projetos.slice(0, 5), [projetos]);

  // Estoque com baixa disponibilidade (≤ 30% ou ≤ 2 unidades)
  const estoqueBaixo = useMemo(
    () => estoque
      .filter(i => i.quantidadeDisponivel <= 2 || (i.quantidadeTotal > 0 && i.quantidadeDisponivel / i.quantidadeTotal <= 0.3))
      .slice(0, 5),
    [estoque],
  );

  return (
    <div className="p-4 md:p-6">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {user ? greeting(user.nome) : 'Dashboard'}
        </h1>
        <p className="text-gray-500 text-sm mt-0.5 capitalize">{formatDate()}</p>
      </div>

      {/* Event countdown */}
      {evento && <EventBanner dataEvento={evento.dataEvento} nome={evento.nome} />}

      {loadingProjetos ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-brand-600" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard
              label={isInstrutor ? 'Meus projetos' : 'Total de projetos'}
              value={stats.total}
              icon={FolderKanban}
              colorBg="bg-brand-50"
              colorText="text-brand-600"
              to="/projetos"
            />
            <StatCard
              label="Aguardando revisão"
              value={stats.submetidos}
              icon={Clock}
              colorBg="bg-orange-50"
              colorText="text-orange-500"
              to="/projetos"
            />
            <StatCard
              label="Em andamento"
              value={stats.emAndamento}
              icon={AlertCircle}
              colorBg="bg-blue-50"
              colorText="text-blue-500"
              to="/projetos"
            />
            <StatCard
              label="Concluídos"
              value={stats.concluidos}
              icon={CheckCircle}
              colorBg="bg-green-50"
              colorText="text-green-500"
              to="/projetos"
            />
          </div>

          {/* Instrutor: projetos que precisam de ação */}
          {isInstrutor && meusPendentes.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl mb-5">
              <div className="px-5 py-3.5 border-b border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} className="text-amber-600" />
                  <h2 className="text-sm font-semibold text-amber-800">
                    Requer sua atenção ({meusPendentes.length})
                  </h2>
                </div>
                <Link to="/projetos" className="text-xs text-amber-700 hover:text-amber-800 font-medium">
                  Ver todos
                </Link>
              </div>
              <div>
                {meusPendentes.map(p => <ProjectRow key={p.id} projeto={p} />)}
              </div>
            </div>
          )}

          <div className={`grid gap-5 ${canSeeStock ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Left: projetos aguardando revisão (coord/admin) ou recentes */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderKanban size={15} className="text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-900">
                    {canSeeAllProjects && stats.submetidos > 0
                      ? `Aguardando revisão (${stats.submetidos})`
                      : 'Projetos recentes'}
                  </h2>
                </div>
                <Link to="/projetos" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                  Ver todos <ArrowRight size={12} />
                </Link>
              </div>
              <div>
                {(canSeeAllProjects && aguardandoRevisao.length > 0 ? aguardandoRevisao : recentes).length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">Nenhum projeto.</p>
                ) : (
                  (canSeeAllProjects && aguardandoRevisao.length > 0 ? aguardandoRevisao : recentes)
                    .map(p => <ProjectRow key={p.id} projeto={p} />)
                )}
              </div>
            </div>

            {/* Right: stock alerts (admin/coord/monitor) */}
            {canSeeStock && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package size={15} className="text-gray-400" />
                    <h2 className="text-sm font-semibold text-gray-900">
                      {estoqueBaixo.length > 0 ? `Estoque baixo (${estoqueBaixo.length})` : 'Estoque'}
                    </h2>
                  </div>
                  <Link to="/estoque" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                    Ver estoque <ArrowRight size={12} />
                  </Link>
                </div>
                <div>
                  {estoqueBaixo.length === 0 ? (
                    <div className="flex flex-col items-center py-8 gap-2">
                      <CheckCircle size={24} className="text-green-400" />
                      <p className="text-sm text-gray-400">Estoque em dia</p>
                    </div>
                  ) : (
                    estoqueBaixo.map(i => <StockRow key={i.id} item={i} />)
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Extra info row */}
          {(stats.rascunhos > 0 || stats.reprovados > 0) && !isInstrutor && (
            <div className="flex flex-wrap gap-3 mt-5">
              {stats.rascunhos > 0 && (
                <Link to="/projetos" className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-300 transition-colors text-sm text-gray-600">
                  <span className="w-2 h-2 bg-gray-400 rounded-full" />
                  <span><strong className="text-gray-900">{stats.rascunhos}</strong> projeto{stats.rascunhos !== 1 ? 's' : ''} em rascunho</span>
                </Link>
              )}
              {stats.reprovados > 0 && (
                <Link to="/projetos" className="flex items-center gap-2 bg-white border border-red-200 rounded-xl px-4 py-3 hover:border-red-300 transition-colors text-sm text-red-600">
                  <span className="w-2 h-2 bg-red-400 rounded-full" />
                  <span><strong className="text-red-700">{stats.reprovados}</strong> projeto{stats.reprovados !== 1 ? 's' : ''} reprovado{stats.reprovados !== 1 ? 's' : ''}</span>
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
