import { useState } from 'react';
import { FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  baixarRelatorioEstoque,
  baixarRelatorioProjetos,
  baixarRelatorioProjetosPorInstrutor,
  baixarRelatorioSolicitacoesCompra,
  baixarRelatorioMeusProjetos,
  baixarRelatorioMinhasSolicitacoes,
} from '../api/relatorios';
import type { PerfilUsuario } from '../types';

interface ReportDef {
  id: string;
  titulo: string;
  descricao: string;
  perfis: PerfilUsuario[];
  fn: () => Promise<void>;
}

const REPORTS: ReportDef[] = [
  {
    id: 'estoque',
    titulo: 'Itens em Estoque',
    descricao: 'Lista completa de todos os itens cadastrados no estoque com quantidades disponíveis.',
    perfis: ['ADMINISTRADOR', 'COORDENACAO', 'MONITOR'],
    fn: baixarRelatorioEstoque,
  },
  {
    id: 'meus-projetos',
    titulo: 'Meus Projetos',
    descricao: 'Todos os projetos criados por você com status de acompanhamento semanal.',
    perfis: ['ADMINISTRADOR', 'INSTRUTOR'],
    fn: baixarRelatorioMeusProjetos,
  },
  {
    id: 'minhas-solicitacoes',
    titulo: 'Minhas Solicitações de Compra',
    descricao: 'Materiais solicitados para compra nos seus projetos com status atual.',
    perfis: ['ADMINISTRADOR', 'INSTRUTOR'],
    fn: baixarRelatorioMinhasSolicitacoes,
  },
  {
    id: 'projetos',
    titulo: 'Todos os Projetos',
    descricao: 'Visão geral de todos os projetos da feira com instrutores, status e cronograma.',
    perfis: ['ADMINISTRADOR', 'COORDENACAO'],
    fn: baixarRelatorioProjetos,
  },
  {
    id: 'projetos-por-instrutor',
    titulo: 'Projetos por Instrutor',
    descricao: 'Projetos organizados por instrutor — uma aba por instrutor no Excel.',
    perfis: ['ADMINISTRADOR', 'COORDENACAO'],
    fn: baixarRelatorioProjetosPorInstrutor,
  },
  {
    id: 'solicitacoes-compra',
    titulo: 'Todas as Solicitações de Compra',
    descricao: 'Todas as solicitações de compra de todos os projetos com custos e status.',
    perfis: ['ADMINISTRADOR', 'COORDENACAO'],
    fn: baixarRelatorioSolicitacoesCompra,
  },
];

export default function RelatoriosPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const perfil = user?.perfil as PerfilUsuario | undefined;
  const disponiveis = REPORTS.filter(r => perfil && r.perfis.includes(perfil));

  async function baixar(report: ReportDef) {
    setLoading(report.id);
    setError(null);
    try {
      await report.fn();
    } catch {
      setError(`Erro ao gerar "${report.titulo}". Tente novamente.`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-500 text-sm mt-1">
          Exporte dados em formato Excel (.xlsx) conforme seu perfil de acesso.
        </p>
      </div>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {disponiveis.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <FileSpreadsheet size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Nenhum relatório disponível para seu perfil.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {disponiveis.map((report) => {
            const isLoading = loading === report.id;
            return (
              <div key={report.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                    <FileSpreadsheet size={20} className="text-green-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{report.titulo}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{report.descricao}</p>
                  </div>
                </div>
                <button
                  onClick={() => baixar(report)}
                  disabled={isLoading || loading !== null}
                  className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  {isLoading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Download size={15} />
                  )}
                  {isLoading ? 'Gerando...' : 'Baixar Excel'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
