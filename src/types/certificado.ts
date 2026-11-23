/*
========
Definições de tipos e interfaces públicas da biblioteca (src/types/certificado.ts).
Centraliza a tipagem de templates, camadas, formatos de folha, alinhamento,
variáveis, exportação, classes e rótulos com suporte bilíngue (português e inglês).
========
*/
import type { MensagensIdiomaParcial } from '../i18n';

export type OrientacaoCertificado = 'landscape' | 'portrait';

export type AjusteFundo = 'cover' | 'contain' | '100% 100%';

export type AjusteImagem = 'contain' | 'cover' | 'fill';

export type EstiloBorda = 'solid' | 'dashed' | 'dotted';

export type AlinhamentoTexto = 'left' | 'center' | 'right';

export type AlinhamentoVertical = 'top' | 'middle' | 'bottom';

// Estilos canônicos de módulos do QR Code usados internamente nos selects
export type EstiloModuloQrCanonico = 'quadrado' | 'arredondado' | 'pontos';

// Estilos de módulos do QR Code aceitos na API pública em português e inglês
export type EstiloModuloQr = EstiloModuloQrCanonico | 'square' | 'rounded' | 'dots';

// Estilos canônicos de olhos/cantos do QR Code usados internamente nos selects
export type EstiloOlhoQrCanonico = 'quadrado' | 'arredondado' | 'circulo';

// Estilos de olhos/cantos do QR Code aceitos na API pública em português e inglês
export type EstiloOlhoQr = EstiloOlhoQrCanonico | 'square' | 'rounded' | 'circle';

// Modos canônicos de exibição de link usados internamente nos selects
export type ModoExibicaoLinkCanonico = 'url' | 'texto';

// Modos de exibição de link aceitos na API pública em português e inglês
export type ModoExibicaoLink = ModoExibicaoLinkCanonico | 'text';

export type TipoCamada =
  | 'texto'
  | 'variavel'
  | 'imagem'
  | 'qrcode'
  | 'circulo'
  | 'linha'
  | 'seta'
  | 'forma';

// Formatos de folha canônicos usados internamente nos presets e traduções
export type FormatoFolhaCanonico =
  | 'a4'
  | 'a5'
  | 'carta'
  | 'cracha'
  | 'cartao'
  | 'quadrado'
  | 'custom';

// Formatos de folha aceitos na API pública em português e inglês
export type FormatoFolha =
  | FormatoFolhaCanonico
  | 'letter'
  | 'badge'
  | 'card'
  | 'square';

// Direções canônicas da ponta de seta usadas na renderização
export type DirecaoPontaSetaCanonica = 'esquerda' | 'direita' | 'ambas';

// Direções de ponta de seta aceitas na API pública em português e inglês
export type DirecaoPontaSeta =
  | DirecaoPontaSetaCanonica
  | 'left'
  | 'right'
  | 'both';

// Eixos canônicos de alinhamento na folha
export type EixoAlinhamentoFolhaCanonico =
  | 'esquerda'
  | 'centro-h'
  | 'direita'
  | 'topo'
  | 'centro-v'
  | 'base';

// Eixos de alinhamento na folha aceitos na API pública em português e inglês
export type EixoAlinhamentoFolha =
  | EixoAlinhamentoFolhaCanonico
  | 'left'
  | 'center-h'
  | 'right'
  | 'top'
  | 'center-v'
  | 'bottom';

// Posições canônicas da matriz 3x3 usadas na UI e nas chaves do vue-i18n
export type PosicaoGrade3x3Canonica =
  | 'topo-esquerda'
  | 'topo-centro'
  | 'topo-direita'
  | 'meio-esquerda'
  | 'centro'
  | 'meio-direita'
  | 'base-esquerda'
  | 'base-centro'
  | 'base-direita';

// Posições da matriz 3x3 aceitas na API pública em português e inglês
export type PosicaoGrade3x3 =
  | PosicaoGrade3x3Canonica
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface PresetFormatoFolha {
  id: FormatoFolhaCanonico;
  rotulo: string;
  larguraBase: number;
  alturaBase: number;
}

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
  permitirEdicaoTexto?: boolean;
  linkUrl?: string;
  modoExibicaoLink?: ModoExibicaoLink;
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
  raioLogoQr?: number;
  fundoLogoQr?: boolean;
}

export interface ItemCamadaInvertida {
  camada: CamadaCertificado;
  indiceReal: number;
}

export interface TemplateCertificado {
  id: string;
  nome: string;
  orientacao: OrientacaoCertificado;
  formato?: FormatoFolha;
  largura?: number;
  altura?: number;
  fundoCor: string;
  fundoImagem: string;
  fundoAjuste: AjusteFundo;
  camadas: CamadaCertificado[];
  criadoEm?: string;
  atualizadoEm?: string;
}

export type DadosCertificado = Record<string, string | number | boolean | null | undefined>;

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

export interface VariavelNormalizada {
  chave: string;
  rotulo: string;
  nomeCamada?: string;
  valorVisualizacao?: string;
  valorPadrao?: string;
}

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

export interface OpcoesExportacao {
  nomeArquivo?: string;
  fileName?: string;
  escala?: number;
  scale?: number;
  qualidade?: number;
  quality?: number;
  qualidadeImagem?: number;
  imageQuality?: number;
}

export interface ResultadoExportacao {
  imagemDataUrl: string;
  imageDataUrl?: string;
  imagemBlob: Blob | null;
  imageBlob?: Blob | null;
  pdfBlob: Blob;
  nomeArquivo: string;
  fileName?: string;
}

// Aliases completos em inglês para exportação pública no npm
export type TemplateDocument = TemplateCertificado;
export type TemplateLayer = CamadaCertificado;
export type TemplateVariable = VariavelCertificado;
export type NormalizedVariable = VariavelNormalizada;
export type TemplateData = DadosCertificado;
export type TemplateStudioLabels = CertificadoLabels;
export type TemplateStudioClasses = CertificadoClasses;
export type TemplateStudioOptions = CertificadoOptions;
export type ExportOptions = OpcoesExportacao;
export type ExportResult = ResultadoExportacao;
export type SheetFormat = FormatoFolha;
export type SheetFormatPreset = PresetFormatoFolha;
export type SheetOrientation = OrientacaoCertificado;
export type LayerType = TipoCamada;
export type TextAlignment = AlinhamentoTexto;
export type VerticalAlignment = AlinhamentoVertical;
export type SheetAlignmentAxis = EixoAlinhamentoFolha;
export type Grid3x3Position = PosicaoGrade3x3;
export type BorderStyle = EstiloBorda;
export type ArrowheadDirection = DirecaoPontaSeta;
export type ImageFit = AjusteImagem;
export type BackgroundFit = AjusteFundo;
export type QrModuleStyle = EstiloModuloQr;
export type QrEyeStyle = EstiloOlhoQr;
export type LinkDisplayMode = ModoExibicaoLink;
export type ReversedLayerItem = ItemCamadaInvertida;