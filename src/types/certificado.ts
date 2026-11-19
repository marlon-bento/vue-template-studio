/*
========
Definições de tipos e interfaces da biblioteca vue-template-studio (src/types/certificado.ts).
Inclui contratos completos em português e equivalentes em inglês (TemplateDocument, TemplateLayer,
TemplateVariable, TemplateStudioOptions, etc.) para facilitar a adoção global via npm mantendo
100% de compatibilidade com os nomes em português.
========
*/
import type { MensagensIdiomaParcial } from '../i18n';

// Orientações suportadas na folha
export type OrientacaoCertificado = 'landscape' | 'portrait';
export type SheetOrientation = OrientacaoCertificado;

// Formatos de folha pré-definidos ou personalizado
export type FormatoFolha =
  | 'a4'
  | 'a5'
  | 'carta'
  | 'cracha'
  | 'cartao'
  | 'quadrado'
  | 'custom';
export type SheetFormat = FormatoFolha;

// Estrutura de metadados de cada preset de formato de folha
export interface PresetFormatoFolha {
  id: FormatoFolha;
  rotulo: string;
  larguraBase: number;
  alturaBase: number;
}
export type SheetFormatPreset = PresetFormatoFolha;

// Tipos de camadas permitidos no editor
export type TipoCamada =
  | 'texto'
  | 'variavel'
  | 'imagem'
  | 'forma'
  | 'circulo'
  | 'linha'
  | 'seta'
  | 'qrcode';
export type LayerType = TipoCamada;

// Alinhamentos horizontais para camadas de texto
export type AlinhamentoTexto = 'left' | 'center' | 'right';
export type TextAlignment = AlinhamentoTexto;

// Alinhamentos verticais dentro da caixa de texto
export type AlinhamentoVertical = 'top' | 'middle' | 'bottom';
export type VerticalAlignment = AlinhamentoVertical;

// Eixos de alinhamento rápido na folha
export type EixoAlinhamentoFolha =
  | 'esquerda'
  | 'centro-h'
  | 'direita'
  | 'topo'
  | 'centro-v'
  | 'base';
export type SheetAlignmentAxis = EixoAlinhamentoFolha;

// Posições da grade 3x3 estilo Figma (Quadrado de posicionamento explícito)
export type PosicaoGrade3x3 =
  | 'topo-esquerda'
  | 'topo-centro'
  | 'topo-direita'
  | 'meio-esquerda'
  | 'centro'
  | 'meio-direita'
  | 'base-esquerda'
  | 'base-centro'
  | 'base-direita';
export type Grid3x3Position = PosicaoGrade3x3;

// Estilo do traço para formas, círculos, linhas e setas
export type EstiloBorda = 'solid' | 'dashed' | 'dotted';
export type BorderStyle = EstiloBorda;

// Direção da ponta da seta
export type DirecaoPontaSeta = 'direita' | 'esquerda' | 'ambas';
export type ArrowheadDirection = DirecaoPontaSeta;

// Ajuste de preenchimento de imagem na folha ou camada
export type AjusteImagem = 'contain' | 'cover' | 'fill';
export type ImageFit = AjusteImagem;

// Estilo visual dos módulos internos do QR Code
export type EstiloModuloQr = 'quadrado' | 'arredondado' | 'pontos';
export type QrModuleStyle = EstiloModuloQr;

// Estilo visual dos 3 olhos (cantos de detecção) do QR Code
export type EstiloOlhoQr = 'quadrado' | 'arredondado' | 'circulo';
export type QrEyeStyle = EstiloOlhoQr;

// Modo de exibição de uma camada de link (URL completa ou texto personalizado clicável)
export type ModoExibicaoLink = 'url' | 'texto';
export type LinkDisplayMode = ModoExibicaoLink;

// Definição de variável aceitando propriedades em português ou em inglês (key, label, layerName, previewValue, defaultValue)
export interface VariavelCertificado {
  chave?: string;
  rotulo?: string;
  nomeCamada?: string;
  valorVisualizacao?: string;
  valorPadrao?: string;
  key?: string;
  label?: string;
  layerName?: string;
  previewValue?: string;
  defaultValue?: string;
}
export type TemplateVariable = VariavelCertificado;

// Variável normalizada internamente garantindo chave e rótulo sempre preenchidos
export interface VariavelNormalizada {
  chave: string;
  rotulo: string;
  nomeCamada?: string;
  valorVisualizacao?: string;
  valorPadrao?: string;
}

// Estrutura completa de uma camada no template
export interface CamadaCertificado {
  id: string;
  tipo: TipoCamada;
  nome: string;
  x: number;
  y: number;
  largura: number;
  altura: number;
  opacidade: number;
  rotacao: number;
  visivel: boolean;
  bloqueada: boolean;
  texto?: string;
  fonte?: string;
  tamanhoFonte?: number;
  corTexto?: string;
  negrito?: boolean;
  italico?: boolean;
  sublinhado?: boolean;
  alinhamento?: AlinhamentoTexto;
  alinhamentoVertical?: AlinhamentoVertical;
  src?: string;
  ajusteImagem?: AjusteImagem;
  raioImagem?: number;
  corPreenchimento?: string;
  semPreenchimento?: boolean;
  corBorda?: string;
  espessuraBorda?: number;
  raioBorda?: number;
  estiloBorda?: EstiloBorda;
  pontaSeta?: DirecaoPontaSeta;
  conteudoQr?: string;
  corQr?: string;
  corOlhosQr?: string;
  corFundoQr?: string;
  fundoTransparenteQr?: boolean;
  margemQr?: number;
  raioFundoQr?: number;
  estiloModulosQr?: EstiloModuloQr;
  estiloOlhosQr?: EstiloOlhoQr;
  logoQr?: string;
  tamanhoLogoQr?: number;
  fundoLogoQr?: boolean;
  raioLogoQr?: number;
  permitirEdicaoTexto?: boolean;
  linkUrl?: string;
  modoExibicaoLink?: ModoExibicaoLink;
}
export type TemplateLayer = CamadaCertificado;

// Item da lista invertida de camadas exibida no painel lateral
export interface ItemCamadaInvertida {
  camada: CamadaCertificado;
  indiceReal: number;
}
export type ReversedLayerItem = ItemCamadaInvertida;

// Estrutura completa de um template (retrocompatível com A4 padrão e extensível para qualquer dimensão)
export interface TemplateCertificado {
  id: string;
  nome: string;
  orientacao: OrientacaoCertificado;
  formato?: FormatoFolha;
  largura?: number;
  altura?: number;
  fundoCor: string;
  fundoImagem: string;
  fundoAjuste: 'cover' | 'contain' | '100% 100%';
  camadas: CamadaCertificado[];
}
export type TemplateDocument = TemplateCertificado;

// Dicionário de dados dinâmicos enviados pelo cliente para substituição de variáveis
export type DadosCertificado = Record<string, string | number | undefined>;
export type TemplateData = DadosCertificado;

// Opções de exportação de imagem e PDF (aceita chaves em português e inglês)
export interface OpcoesExportacao {
  escala?: number;
  nomeArquivo?: string;
  qualidadeImagem?: number;
  scale?: number;
  fileName?: string;
  imageQuality?: number;
}
export type ExportOptions = OpcoesExportacao;

// Resultado retornado pelas funções de exportação (inclui chaves em português e inglês)
export interface ResultadoExportacao {
  imagemDataUrl: string;
  imagemBlob: Blob | null;
  pdfBlob: Blob;
  nomeArquivo: string;
  imageDataUrl?: string;
  imageBlob?: Blob | null;
  fileName?: string;
}
export type ExportResult = ResultadoExportacao;

// Textos customizáveis de sobrescrita direta do editor e visualizador (aceita português e inglês)
export interface CertificadoLabels {
  salvar?: string;
  exportarPdf?: string;
  exportandoPdf?: string;
  preVisualizar?: string;
  editandoDados?: string;
  paisagem?: string;
  retrato?: string;
  inserir?: string;
  camadas?: string;
  propriedades?: string;
  fundo?: string;
  enviarFundo?: string;
  corFolha?: string;
  removerFundo?: string;
  camposCertificado?: string;
  semVariaveisCliente?: string;
  camadasLivres?: string;
  textoLivre?: string;
  adicionarImagem?: string;
  adicionarMoldura?: string;
  adicionarCirculo?: string;
  adicionarLinha?: string;
  adicionarSeta?: string;
  adicionarQrCode?: string;
  grade?: string;
  vazioInspetor?: string;
  vazioCamadas?: string;
  atualizarPreview?: string;
  baixarPdf?: string;
  renderizando?: string;
  // Chaves equivalentes em inglês
  save?: string;
  exportPdf?: string;
  exportingPdf?: string;
  preview?: string;
  editingData?: string;
  landscape?: string;
  portrait?: string;
  insert?: string;
  layers?: string;
  properties?: string;
  background?: string;
  uploadBackground?: string;
  sheetColor?: string;
  removeBackground?: string;
  templateFields?: string;
  noClientVariables?: string;
  freeLayers?: string;
  freeText?: string;
  addImage?: string;
  addFrame?: string;
  addCircle?: string;
  addLine?: string;
  addArrow?: string;
  addQrCode?: string;
  grid?: string;
  emptyInspector?: string;
  emptyLayers?: string;
  updatePreview?: string;
  downloadPdf?: string;
  rendering?: string;
}
export type TemplateStudioLabels = CertificadoLabels;

// Classes CSS extras para customização externa (aceita português e inglês)
export interface CertificadoClasses {
  root?: string;
  topo?: string;
  workspace?: string;
  dockEsquerdo?: string;
  canvasPalco?: string;
  folha?: string;
  dockDireito?: string;
  inspetor?: string;
  painelCamadas?: string;
  dockFlutuante?: string;
  visualizador?: string;
  // Chaves equivalentes em inglês
  topBar?: string;
  leftDock?: string;
  canvasStage?: string;
  sheet?: string;
  rightDock?: string;
  inspector?: string;
  layersPanel?: string;
  floatingDock?: string;
  viewer?: string;
}
export type TemplateStudioClasses = CertificadoClasses;

// Opções globais configuráveis via app.use(TemplateStudioPlugin, options) ou configureTemplateStudio
export interface CertificadoOptions {
  unstyled?: boolean;
  tema?: 'dark' | 'light';
  theme?: 'dark' | 'light';
  locale?: string;
  mensagensIdioma?: Record<string, MensagensIdiomaParcial>;
  localeMessages?: Record<string, MensagensIdiomaParcial>;
  exibirSeletorIdioma?: boolean;
  showLocaleSwitcher?: boolean;
  permitirCriarVariavel?: boolean;
  allowCustomVariables?: boolean;
  escalaExportacao?: number;
  exportScale?: number;
  escalaPreview?: number;
  previewScale?: number;
  qualidadeImagem?: number;
  imageQuality?: number;
  zoomInicial?: number;
  initialZoom?: number;
  limiteHistorico?: number;
  historyLimit?: number;
  fontesDisponiveis?: string[];
  availableFonts?: string[];
  variaveisDisponiveis?: VariavelCertificado[];
  availableVariables?: VariavelCertificado[];
  dadosPreview?: DadosCertificado;
  previewData?: DadosCertificado;
  labels?: CertificadoLabels;
  classes?: CertificadoClasses;
}
export type TemplateStudioOptions = CertificadoOptions;
