import type { StatusProjeto, StatusCompra, StatusSemana } from '../../types';

const projetoColors: Record<StatusProjeto, string> = {
  RASCUNHO: 'bg-gray-100 text-gray-700',
  SUBMETIDO: 'bg-blue-100 text-blue-700',
  APROVADO: 'bg-green-100 text-green-700',
  REPROVADO: 'bg-red-100 text-red-700',
  EM_ANDAMENTO: 'bg-yellow-100 text-yellow-700',
  CONCLUIDO: 'bg-purple-100 text-purple-700',
};

const projetoLabels: Record<StatusProjeto, string> = {
  RASCUNHO: 'Rascunho',
  SUBMETIDO: 'Submetido',
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDO: 'Concluído',
};

const compraColors: Record<StatusCompra, string> = {
  A_COMPRAR: 'bg-gray-100 text-gray-700',
  AGUARDANDO_APROVACAO: 'bg-orange-100 text-orange-700',
  APROVADO: 'bg-green-100 text-green-700',
  REPROVADO: 'bg-red-100 text-red-700',
  EM_PROCESSO_DE_COMPRA: 'bg-blue-100 text-blue-700',
  COMPRADO_E_EM_ESTOQUE: 'bg-emerald-100 text-emerald-700',
  DISPONIVEL_ESCOLA: 'bg-teal-100 text-teal-700',
  NAO_NECESSARIO: 'bg-gray-100 text-gray-500',
};

const compraLabels: Record<StatusCompra, string> = {
  A_COMPRAR: 'A comprar',
  AGUARDANDO_APROVACAO: 'Ag. aprovação',
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
  EM_PROCESSO_DE_COMPRA: 'Em processo',
  COMPRADO_E_EM_ESTOQUE: 'Comprado ✓',
  DISPONIVEL_ESCOLA: 'Na escola',
  NAO_NECESSARIO: 'Não necessário',
};

const semanaColors: Record<StatusSemana, string> = {
  NAO_INICIADO: 'bg-gray-100 text-gray-600',
  EM_ANDAMENTO: 'bg-blue-100 text-blue-700',
  CONCLUIDO: 'bg-green-100 text-green-700',
  ATRASADO: 'bg-red-100 text-red-700',
};

const semanaLabels: Record<StatusSemana, string> = {
  NAO_INICIADO: 'Não iniciado',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDO: 'Concluído',
  ATRASADO: 'Atrasado',
};

interface Props {
  type: 'projeto' | 'compra' | 'semana';
  value: string;
}

export default function StatusBadge({ type, value }: Props) {
  let color = '';
  let label = value;

  if (type === 'projeto') {
    color = projetoColors[value as StatusProjeto] ?? 'bg-gray-100 text-gray-600';
    label = projetoLabels[value as StatusProjeto] ?? value;
  } else if (type === 'compra') {
    color = compraColors[value as StatusCompra] ?? 'bg-gray-100 text-gray-600';
    label = compraLabels[value as StatusCompra] ?? value;
  } else if (type === 'semana') {
    color = semanaColors[value as StatusSemana] ?? 'bg-gray-100 text-gray-600';
    label = semanaLabels[value as StatusSemana] ?? value;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
