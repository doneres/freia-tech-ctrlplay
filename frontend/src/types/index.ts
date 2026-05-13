export type PerfilUsuario = 'ADMINISTRADOR' | 'INSTRUTOR' | 'COORDENACAO' | 'MONITOR';
export type TipoProjeto = 'HARDWARE' | 'SOFTWARE';
export type TipoItemEstoque = 'HARDWARE' | 'SOFTWARE' | 'PERIFERICO' | 'PAPELARIA';

export type StatusProjeto =
  | 'RASCUNHO'
  | 'SUBMETIDO'
  | 'APROVADO'
  | 'REPROVADO'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDO';

export type StatusCompra =
  | 'A_COMPRAR'
  | 'AGUARDANDO_APROVACAO'
  | 'APROVADO'
  | 'REPROVADO'
  | 'EM_PROCESSO_DE_COMPRA'
  | 'COMPRADO_E_EM_ESTOQUE'
  | 'DISPONIVEL_ESCOLA'
  | 'NAO_NECESSARIO';

export type StatusSemana = 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'ATRASADO';
export type NivelTurma = 'CK' | 'CT' | 'CY' | 'CP';
export type Turno = 'MANHA' | 'TARDE' | 'NOITE';
export type FormatoDemo = 'AO_VIVO' | 'VIDEO' | 'SLIDES' | 'HIBRIDO';
export type FaseDesignThinking = 'EMPATIA' | 'DEFINICAO' | 'IDEACAO' | 'PROTOTIPACAO' | 'TESTE' | 'GERAL';
export type TipoArquivo = 'GITHUB' | 'GOOGLE_DRIVE' | 'FIGMA' | 'YOUTUBE' | 'SITE' | 'OUTRO';
export type CategoriaForum = 'PUBLICACAO_WEB' | 'PLATAFORMAS' | 'DICAS_GERAIS' | 'DUVIDAS';

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  token: string;
  telefone?: string;
  fotoPerfil?: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  fotoPerfil?: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  createdAt: string;
}

export interface ItemEstoque {
  id: string;
  nome: string;
  descricao: string | null;
  tipo: TipoItemEstoque;
  categoria: string | null;
  marca: string | null;
  modelo: string | null;
  quantidadeTotal: number;
  quantidadeDisponivel: number;
  imagemUrl: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LinkCompra {
  id: string;
  nomeSite: string;
  url: string;
  valorEncontrado: number | null;
}

export interface Material {
  id: string;
  item: string;
  quantidade: number;
  unidade: string | null;
  custoUnitario: number | null;
  custoTotal: number;
  statusCompra: StatusCompra;
  estoqueSubtraido: boolean;
  imagemUrl: string | null;
  justificativaReprovacao: string | null;
  links: LinkCompra[];
  itemEstoque: ItemEstoque | null;
  createdAt: string;
}

export interface FerramentaSoftware {
  id: string;
  nome: string;
  categoria: string | null;
  descricao: string | null;
  imagemUrl: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PapelariaItem {
  id: string;
  nome: string;
  imagemUrl: string | null;
  quantidade: number;
  estoqueSubtraido: boolean;
  itemEstoque: ItemEstoque | null;
  statusAquisicao: StatusCompra;
  justificativaReprovacao: string | null;
  createdAt: string;
}

export interface RegistroAcompanhamento {
  id: string;
  autor: Usuario;
  fase: FaseDesignThinking;
  titulo: string;
  descricao: string;
  semana: number | null;
  createdAt: string;
}

export interface ArquivoProjeto {
  id: string;
  autor: Usuario;
  titulo: string;
  url: string;
  tipo: TipoArquivo;
  descricao: string | null;
  createdAt: string;
}

export interface RespostaForum {
  id: string;
  autor: Usuario;
  conteudo: string;
  createdAt: string;
}

export interface PostForum {
  id: string;
  autor: Usuario;
  titulo: string;
  conteudo: string;
  categoria: CategoriaForum;
  fixado: boolean;
  totalRespostas: number;
  respostas: RespostaForum[];
  createdAt: string;
  updatedAt: string;
}

export interface Projeto {
  id: string;
  nomeProjeto: string;
  instrutor: Usuario;
  statusProjeto: StatusProjeto;
  justificativaReprovacao: string | null;
  codigoTurma: string | null;
  turno: Turno | null;
  nivelTurma: NivelTurma | null;
  qtdAlunos: number | null;
  integrantes: string[];
  ods: string | null;
  problemaIdentificado: string | null;
  solucaoProposta: string | null;
  objetivoProjeto: string | null;
  tipoProjeto: TipoProjeto | null;
  ferramentasSoftware: FerramentaSoftware[];
  linkProjeto: string | null;
  infraNecessaria: string | null;
  custoEstimado: number | null;
  statusS1: StatusSemana;
  statusS2: StatusSemana;
  statusS3: StatusSemana;
  statusS4: StatusSemana;
  pitchAto1: string | null;
  pitchAto2: string | null;
  pitchAto3: string | null;
  duracaoPitch: number | null;
  formatoDemo: FormatoDemo | null;
  observacoes: string | null;
  materiais: Material[];
  itensPapelaria: PapelariaItem[];
  dataSubmissao: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialPendente {
  id: string;
  item: string;
  quantidade: number;
  unidade: string | null;
  custoUnitario: number | null;
  statusCompra: StatusCompra;
  imagemUrl: string | null;
  links: LinkCompra[];
  projetoId: string;
  nomeProjeto: string;
  nomeInstrutor: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface ProjetoRequest {
  nomeProjeto: string;
  instrutorId: string;
  codigoTurma?: string;
  turno?: Turno;
  nivelTurma?: NivelTurma;
  qtdAlunos?: number;
  integrantes?: string[];
  ods?: string;
  problemaIdentificado?: string;
  solucaoProposta?: string;
  objetivoProjeto?: string;
  tipoProjeto?: TipoProjeto;
  ferramentasSoftwareIds?: string[];
  equipamentosEstoque?: { itemEstoqueId: string; quantidade: number }[];
  linkProjeto?: string;
  infraNecessaria?: string;
  custoEstimado?: number;
  pitchAto1?: string;
  pitchAto2?: string;
  pitchAto3?: string;
  duracaoPitch?: number;
  formatoDemo?: FormatoDemo;
  observacoes?: string;
}
