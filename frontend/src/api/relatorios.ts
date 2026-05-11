import client from './client';

async function baixar(endpoint: string, filename: string): Promise<void> {
  const response = await client.get(`/relatorios/${endpoint}`, { responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const baixarRelatorioEstoque = () =>
  baixar('estoque', 'relatorio-estoque.xlsx');

export const baixarRelatorioProjetos = () =>
  baixar('projetos', 'relatorio-projetos.xlsx');

export const baixarRelatorioProjetosPorInstrutor = () =>
  baixar('projetos-por-instrutor', 'relatorio-projetos-por-instrutor.xlsx');

export const baixarRelatorioSolicitacoesCompra = () =>
  baixar('solicitacoes-compra', 'relatorio-solicitacoes-compra.xlsx');

export const baixarRelatorioMeusProjetos = () =>
  baixar('meus-projetos', 'relatorio-meus-projetos.xlsx');

export const baixarRelatorioMinhasSolicitacoes = () =>
  baixar('minhas-solicitacoes', 'relatorio-minhas-solicitacoes.xlsx');
