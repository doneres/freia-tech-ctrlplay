import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, Clock, AlertTriangle, Package, Sun, Sunset, Info, Settings } from 'lucide-react';
import { buscarRecomendacao, type ProjetoAgendado } from '../api/agenda';
import { buscarProximoEvento } from '../api/eventos';
import StatusBadge from '../components/ui/StatusBadge';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Countdown({ dataEvento }: { dataEvento: string }) {
  const diff = new Date(dataEvento).getTime() - Date.now();
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="flex items-center gap-4">
      <div className="text-center">
        <p className="text-2xl font-bold text-white leading-none">{days}</p>
        <p className="text-xs text-brand-200 mt-0.5">dias</p>
      </div>
      <span className="text-brand-300 text-xl font-light">:</span>
      <div className="text-center">
        <p className="text-2xl font-bold text-white leading-none">{hours}</p>
        <p className="text-xs text-brand-200 mt-0.5">horas</p>
      </div>
      <span className="text-brand-300 text-xl font-light">:</span>
      <div className="text-center">
        <p className="text-2xl font-bold text-white leading-none">{mins}</p>
        <p className="text-xs text-brand-200 mt-0.5">min</p>
      </div>
    </div>
  );
}

function ProjetoCard({ pa }: { pa: ProjetoAgendado }) {
  return (
    <Link
      to={`/projetos/${pa.projeto.id}`}
      className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-brand-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-gray-900 leading-snug">{pa.projeto.nomeProjeto}</p>
        <StatusBadge type="projeto" value={pa.projeto.statusProjeto} />
      </div>
      <p className="text-xs text-gray-500 mb-2">{pa.projeto.instrutor?.nome}</p>
      {pa.projeto.codigoTurma && (
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
          {pa.projeto.codigoTurma}
        </span>
      )}
      {pa.materiaisConflitantes.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {pa.materiaisConflitantes.map(m => (
            <span key={m} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Package size={10} />
              {m}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

export default function AgendaPage() {
  const { user } = useAuth();
  const isAdmin = user?.perfil === 'ADMINISTRADOR';

  const { data: evento } = useQuery({
    queryKey: ['evento-proximo'],
    queryFn: buscarProximoEvento,
  });

  const { data: agenda, isLoading } = useQuery({
    queryKey: ['agenda-recomendacao'],
    queryFn: buscarRecomendacao,
  });

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda da Feira</h1>
          <p className="text-gray-500 text-sm mt-1">Recomendação de organização de projetos por turno</p>
        </div>
        {isAdmin && (
          <Link
            to="/evento"
            className="flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <Settings size={15} />
            Gerenciar evento
          </Link>
        )}
      </div>

      {/* Countdown banner */}
      {evento ? (
        <div className="bg-brand-600 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={16} className="text-brand-200" />
              <p className="text-brand-200 text-xs font-medium uppercase tracking-wide">Próximo evento</p>
            </div>
            <h2 className="text-white text-xl font-bold">{evento.nome}</h2>
            <p className="text-brand-200 text-sm mt-0.5">
              {new Date(evento.dataEvento).toLocaleString('pt-BR', {
                weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
            {evento.descricao && (
              <p className="text-brand-100 text-xs mt-2">{evento.descricao}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Clock size={16} className="text-brand-200" />
            <Countdown dataEvento={evento.dataEvento} />
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Info size={16} className="text-gray-400 shrink-0" />
          <p className="text-sm text-gray-500">
            Nenhum evento cadastrado.
            {isAdmin && (
              <Link to="/evento" className="ml-1 text-brand-600 hover:underline font-medium">
                Cadastrar evento
              </Link>
            )}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin text-brand-600" />
        </div>
      ) : agenda ? (
        <>
          {/* Oversubscribed items warning */}
          {agenda.itensSuperlotados.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                <p className="text-sm font-semibold text-amber-800">Itens com demanda acima do estoque</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {agenda.itensSuperlotados.map(({ item, demandaTotal, disponivel }) => (
                  <div key={item.id} className="bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs">
                    <p className="font-semibold text-gray-900">{item.nome}</p>
                    <p className="text-amber-700 mt-0.5">
                      Solicitado: <strong>{demandaTotal}</strong> · Disponível: <strong>{disponivel}</strong>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Schedule columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {/* Morning */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Sun size={16} className="text-amber-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Manhã</h2>
                  <p className="text-xs text-gray-500">{agenda.manha.length} projeto{agenda.manha.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="space-y-3">
                {agenda.manha.length > 0
                  ? agenda.manha.map(pa => <ProjetoCard key={pa.projeto.id} pa={pa} />)
                  : <p className="text-sm text-gray-400 py-4 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">Nenhum projeto alocado</p>
                }
              </div>
            </div>

            {/* Afternoon */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Sunset size={16} className="text-orange-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Tarde</h2>
                  <p className="text-xs text-gray-500">{agenda.tarde.length} projeto{agenda.tarde.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="space-y-3">
                {agenda.tarde.length > 0
                  ? agenda.tarde.map(pa => <ProjetoCard key={pa.projeto.id} pa={pa} />)
                  : <p className="text-sm text-gray-400 py-4 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">Nenhum projeto alocado</p>
                }
              </div>
            </div>
          </div>

          {/* Unallocated */}
          {agenda.naoAlocados.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-red-500" />
                <h2 className="text-sm font-semibold text-red-700">Projetos sem alocação possível ({agenda.naoAlocados.length})</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {agenda.naoAlocados.map(pa => <ProjetoCard key={pa.projeto.id} pa={pa} />)}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Estes projetos não puderam ser alocados em nenhum turno dentro da capacidade de estoque disponível.
              </p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
