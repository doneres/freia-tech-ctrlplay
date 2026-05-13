import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ShoppingCart, CheckCircle, XCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { listarSolicitacoesPendentes } from '../api/materiais';
import { atualizarStatusCompra } from '../api/materiais';
import type { MaterialPendente, StatusCompra } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

function formatCurrency(val: number | null) {
  if (val == null) return '—';
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function JustificativaModal({ onConfirm, onClose, isPending }: {
  onConfirm: (justificativa: string) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const [text, setText] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Motivo da reprovação</h3>
        <textarea
          rows={3}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Descreva o motivo..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none mb-4"
        />
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={() => text.trim() && onConfirm(text.trim())}
            disabled={!text.trim() || isPending}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2">
            {isPending && <Loader2 size={13} className="animate-spin" />}
            Reprovar
          </button>
        </div>
      </div>
    </div>
  );
}

function MaterialCard({ m, onApprove, onReject, loadingId }: {
  m: MaterialPendente;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  loadingId: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLoading = loadingId === m.id;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-gray-900">{m.item}</p>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {m.quantidade}{m.unidade ? ` ${m.unidade}` : ' un.'}
              </span>
              {m.custoUnitario != null && (
                <span className="text-xs text-gray-500">
                  {formatCurrency(m.custoUnitario)} / un.
                </span>
              )}
            </div>
            <Link to={`/projetos/${m.projetoId}`}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium mt-1 inline-block">
              {m.nomeProjeto} — {m.nomeInstrutor}
            </Link>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onApprove(m.id)}
              disabled={isLoading || loadingId !== null}
              title="Aprovar"
              className="p-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <CheckCircle size={16} />
            </button>
            <button
              onClick={() => onReject(m.id)}
              disabled={isLoading || loadingId !== null}
              title="Reprovar"
              className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors disabled:opacity-50"
            >
              <XCircle size={16} />
            </button>
          </div>
        </div>

        {m.links.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {m.links.length} link{m.links.length !== 1 ? 's' : ''} de pesquisa
            </button>
            {expanded && (
              <div className="mt-2 space-y-1.5">
                {m.links.map(l => (
                  <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{l.nomeSite}</p>
                      {l.valorEncontrado != null && (
                        <p className="text-xs text-gray-500">{formatCurrency(l.valorEncontrado)}</p>
                      )}
                    </div>
                    <ExternalLink size={12} className="text-gray-400 group-hover:text-brand-600 shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SolicitacoesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const canApprove = user?.perfil === 'COORDENACAO' || user?.perfil === 'ADMINISTRADOR';

  const { data: solicitacoes = [], isLoading } = useQuery<MaterialPendente[]>({
    queryKey: ['solicitacoes-pendentes'],
    queryFn: listarSolicitacoesPendentes,
    enabled: canApprove,
  });

  const mutStatus = useMutation({
    mutationFn: ({ id, status, justificativa }: { id: string; status: StatusCompra; justificativa?: string }) =>
      atualizarStatusCompra(id, status, justificativa),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-pendentes'] });
      queryClient.invalidateQueries({ queryKey: ['projetos'] });
      setLoadingId(null);
      setRejectingId(null);
    },
    onError: () => {
      setLoadingId(null);
      setRejectingId(null);
    },
  });

  function handleApprove(id: string) {
    setLoadingId(id);
    mutStatus.mutate({ id, status: 'APROVADO' });
  }

  function handleReject(id: string) {
    setRejectingId(id);
  }

  function confirmReject(justificativa: string) {
    if (!rejectingId) return;
    setLoadingId(rejectingId);
    mutStatus.mutate({ id: rejectingId, status: 'REPROVADO', justificativa });
  }

  if (!canApprove) {
    return (
      <div className="p-4 md:p-6">
        <p className="text-gray-500 text-sm">Acesso restrito a coordenação e administradores.</p>
      </div>
    );
  }

  // Group by project
  const byProject = solicitacoes.reduce<Record<string, { nome: string; instrutorNome: string; items: MaterialPendente[] }>>((acc, m) => {
    if (!acc[m.projetoId]) acc[m.projetoId] = { nome: m.nomeProjeto, instrutorNome: m.nomeInstrutor, items: [] };
    acc[m.projetoId].items.push(m);
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Solicitações de Compra</h1>
        <p className="text-gray-500 text-sm mt-1">
          {isLoading ? '...' : `${solicitacoes.length} solicitaç${solicitacoes.length !== 1 ? 'ões' : 'ão'} aguardando aprovação`}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin text-brand-600" />
        </div>
      ) : solicitacoes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">Tudo em dia!</p>
          <p className="text-xs text-gray-400 mt-1">Nenhuma solicitação aguardando aprovação.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byProject).map(([projetoId, group]) => (
            <div key={projetoId}>
              <div className="flex items-center gap-3 mb-3">
                <ShoppingCart size={15} className="text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <Link to={`/projetos/${projetoId}`}
                    className="text-sm font-semibold text-gray-900 hover:text-brand-600">
                    {group.nome}
                  </Link>
                  <span className="text-xs text-gray-400 ml-2">{group.instrutorNome}</span>
                </div>
                <span className="ml-auto text-xs text-gray-400 shrink-0">
                  {group.items.length} item{group.items.length !== 1 ? 'ns' : ''}
                </span>
              </div>
              <div className="space-y-3">
                {group.items.map(m => (
                  <MaterialCard
                    key={m.id}
                    m={m}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    loadingId={loadingId}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectingId && (
        <JustificativaModal
          onConfirm={confirmReject}
          onClose={() => setRejectingId(null)}
          isPending={mutStatus.isPending}
        />
      )}
    </div>
  );
}
