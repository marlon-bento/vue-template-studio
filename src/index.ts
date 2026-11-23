/*
========
Ponto de entrada principal da biblioteca vue-template-studio (src/index.ts).
Exporta os componentes principais (TemplateStudioEditor, TemplateStudioViewer e LocaleSwitcher),
subcomponentes do editor, utilitários, composables, tipos e o plugin de instalação global
usando reexportação ES Module pura compatível com declaration: true no vue-tsc.
========
*/
import type { App } from 'vue';
import type { CertificadoOptions } from './types/certificado';
import TemplateStudioEditor from './components/TemplateStudioEditor.vue';
import TemplateStudioViewer from './components/TemplateStudioViewer.vue';
import LocaleSwitcher from './components/LocaleSwitcher.vue';
import BarraSuperiorEditor from './components/editor/BarraSuperiorEditor.vue';
import PainelInsercaoElementos from './components/editor/PainelInsercaoElementos.vue';
import PalcoCanvasCertificado from './components/editor/PalcoCanvasCertificado.vue';
import PainelPropriedadesFigma from './components/editor/PainelPropriedadesFigma.vue';
import PainelCamadasLista from './components/editor/PainelCamadasLista.vue';
import CampoTextoVariavel from './components/editor/CampoTextoVariavel.vue';
import i18n, {
  loadLocaleMessages,
  normalizarCodigoIdioma,
  normalizeLocaleCode,
  adicionarIdioma,
  addLocale,
  registrarIdiomasCustomizados,
  registerCustomLocales,
  definirIdioma,
  setLocale,
  obterIdiomasDisponiveis,
  getAvailableLocales,
  usarI18nCertificado,
  useTemplateI18n,
  type MensagensIdiomaCertificado,
  type TemplateLocaleMessages,
  type MensagensIdiomaParcial,
  type PartialTemplateLocaleMessages
} from './i18n';
import pt_br from './locales/pt-br.json';
import en from './locales/en.json';
import {
  DIMENSOES_A4,
  FONTES_PADRAO,
  DEFAULT_FONTS,
  VARIAVEIS_PADRAO,
  DEFAULT_VARIABLES,
  globalCertificadoOptions,
  globalTemplateStudioOptions,
  normalizarListaVariaveis,
  normalizeVariableList,
  montarDadosVisualizacao,
  buildPreviewData,
  configureCertificado,
  configureTemplateStudio,
  criarTemplateVazio,
  createEmptyTemplate,
  duplicarTemplate,
  duplicateTemplate,
  exportarTemplateJson,
  exportTemplateJson,
  importarTemplateJson,
  importTemplateJson,
  resolverVariaveisTexto,
  extrairVariaveisTemplate,
  temVariavelNoTemplate,
  renderizarParaCanvas2D,
  gerenciadorDeCertificado,
  useCertificado,
  useTemplateStudio
} from './composables/gerenciadorDeCertificado';
import {
  gerenciadorDeHistorico,
  useHistorico
} from './composables/gerenciadorDeHistorico';
import {
  DIMENSOES_CAMADAS_A4,
  PRESETS_FORMATOS_FOLHA,
  normalizarFormatoFolha,
  normalizarDirecaoPontaSeta,
  normalizarModoExibicaoLink,
  obterDimensoesPorFormato,
  resolverDimensoesTemplate,
  reordenarCamadaListaInvertida,
  moverCamadaPorId,
  criarCamadaTexto,
  criarCamadaMoldura,
  criarCamadaCirculo,
  criarCamadaLinha,
  criarCamadaSeta,
  criarCamadaImagem,
  criarCamadaQrCode,
  criarCamadaLinkQrCode,
  duplicarCamada,
  obterSimboloTipoCamada
} from './composables/gerenciadorDeCamadas';
import { gerenciadorDeAtalhos } from './composables/gerenciadorDeAtalhos';
import {
  gerenciadorDePalco,
  calcularMedidasAltFigma,
  encontrarCamadaAlvoNoPonto
} from './composables/gerenciadorDePalco';
import {
  POSICOES_GRADE_3X3,
  normalizarEixoAlinhamentoFolha,
  normalizarPosicaoGrade3x3,
  alinharCamadaNoEixoFolha,
  alinharCamadaNaGrade3x3Folha,
  detectarPosicaoGrade3x3Folha,
  alinharTextoNaGrade3x3Caixa,
  detectarPosicaoGrade3x3Texto
} from './composables/gerenciadorDeAlinhamento';
import {
  normalizarEstiloModuloQr,
  normalizarEstiloOlhoQr,
  ehModuloAreaLogoQr,
  ehModuloOlhoQr,
  obterMatrizQrCode,
  gerarPathSvgQrCode
} from './utils/qrcode';
import {
  gerarId,
  normalizarNomeVariavel,
  sanitizarNomeArquivo,
  ehUrlImagemPreviewSegura,
  sanitizarUrlImagemPreview,
  resolverConteudoInternoQrCode,
  temQrCodeNoTemplate,
  CHAVE_VARIAVEL_LINK_QRCODE,
  QR_CODE_LINK_VARIABLE_KEY,
  CHAVES_LINK_QRCODE,
  obterLinkPadraoQrCodeTemplate,
  enriquecerDadosComLinkQrCode,
  extrairUrlDoTexto,
  resolverUrlClicavelCamada
} from './utils/variaveis';
import {
  buildIcons,
  type SvgSource,
  type IconTree
} from './utils/svgFactory';
import { svgs } from './styles/svgs';

export {
  TemplateStudioEditor,
  TemplateStudioViewer,
  LocaleSwitcher,
  BarraSuperiorEditor,
  BarraSuperiorEditor as StudioTopBar,
  PainelInsercaoElementos,
  PainelInsercaoElementos as ElementInsertPanel,
  PalcoCanvasCertificado,
  PalcoCanvasCertificado as TemplateCanvasStage,
  PainelPropriedadesFigma,
  PainelPropriedadesFigma as FigmaPropertiesPanel,
  PainelCamadasLista,
  PainelCamadasLista as LayerListPanel,
  CampoTextoVariavel,
  CampoTextoVariavel as VariableTextInput,
  i18n,
  pt_br,
  en,
  loadLocaleMessages,
  normalizarCodigoIdioma,
  normalizeLocaleCode,
  adicionarIdioma,
  addLocale,
  registrarIdiomasCustomizados,
  registerCustomLocales,
  definirIdioma,
  setLocale,
  obterIdiomasDisponiveis,
  getAvailableLocales,
  usarI18nCertificado,
  useTemplateI18n,
  DIMENSOES_A4,
  DIMENSOES_A4 as A4_DIMENSIONS,
  DIMENSOES_CAMADAS_A4,
  PRESETS_FORMATOS_FOLHA,
  PRESETS_FORMATOS_FOLHA as SHEET_FORMAT_PRESETS,
  FONTES_PADRAO,
  DEFAULT_FONTS,
  VARIAVEIS_PADRAO,
  DEFAULT_VARIABLES,
  POSICOES_GRADE_3X3,
  globalCertificadoOptions,
  globalTemplateStudioOptions,
  normalizarListaVariaveis,
  normalizeVariableList,
  normalizarFormatoFolha,
  normalizarFormatoFolha as normalizeSheetFormat,
  normalizarDirecaoPontaSeta,
  normalizarDirecaoPontaSeta as normalizeArrowheadDirection,
  normalizarModoExibicaoLink,
  normalizarModoExibicaoLink as normalizeLinkDisplayMode,
  normalizarEixoAlinhamentoFolha,
  normalizarEixoAlinhamentoFolha as normalizeSheetAlignmentAxis,
  normalizarPosicaoGrade3x3,
  normalizarPosicaoGrade3x3 as normalizeGrid3x3Position,
  normalizarEstiloModuloQr,
  normalizarEstiloModuloQr as normalizeQrModuleStyle,
  normalizarEstiloOlhoQr,
  normalizarEstiloOlhoQr as normalizeQrEyeStyle,
  montarDadosVisualizacao,
  buildPreviewData,
  configureCertificado,
  configureTemplateStudio,
  criarTemplateVazio,
  createEmptyTemplate,
  duplicarTemplate,
  duplicateTemplate,
  exportarTemplateJson,
  exportTemplateJson,
  importarTemplateJson,
  importTemplateJson,
  obterDimensoesPorFormato,
  obterDimensoesPorFormato as getDimensionsByFormat,
  resolverDimensoesTemplate,
  resolverDimensoesTemplate as resolveTemplateDimensions,
  resolverVariaveisTexto,
  resolverVariaveisTexto as resolveTextVariables,
  resolverConteudoInternoQrCode,
  extrairVariaveisTemplate,
  extrairVariaveisTemplate as extractTemplateVariables,
  temVariavelNoTemplate,
  temVariavelNoTemplate as hasVariableInTemplate,
  temQrCodeNoTemplate,
  temQrCodeNoTemplate as hasQrCodeInTemplate,
  CHAVE_VARIAVEL_LINK_QRCODE,
  QR_CODE_LINK_VARIABLE_KEY,
  CHAVES_LINK_QRCODE,
  obterLinkPadraoQrCodeTemplate,
  enriquecerDadosComLinkQrCode,
  extrairUrlDoTexto,
  resolverUrlClicavelCamada,
  renderizarParaCanvas2D,
  renderizarParaCanvas2D as renderToCanvas2D,
  gerenciadorDeCertificado,
  useCertificado,
  useTemplateStudio,
  gerenciadorDeHistorico,
  useHistorico,
  useHistorico as useHistory,
  gerenciadorDeAtalhos,
  gerenciadorDePalco,
  calcularMedidasAltFigma,
  encontrarCamadaAlvoNoPonto,
  alinharCamadaNoEixoFolha,
  alinharCamadaNaGrade3x3Folha,
  detectarPosicaoGrade3x3Folha,
  alinharTextoNaGrade3x3Caixa,
  detectarPosicaoGrade3x3Texto,
  reordenarCamadaListaInvertida,
  moverCamadaPorId,
  criarCamadaTexto,
  criarCamadaMoldura,
  criarCamadaCirculo,
  criarCamadaLinha,
  criarCamadaSeta,
  criarCamadaImagem,
  criarCamadaQrCode,
  criarCamadaLinkQrCode,
  duplicarCamada,
  obterSimboloTipoCamada,
  ehModuloAreaLogoQr,
  ehModuloOlhoQr,
  obterMatrizQrCode,
  gerarPathSvgQrCode,
  gerarId,
  normalizarNomeVariavel,
  sanitizarNomeArquivo,
  ehUrlImagemPreviewSegura,
  sanitizarUrlImagemPreview,
  buildIcons,
  svgs
};

export type {
  MensagensIdiomaCertificado,
  TemplateLocaleMessages,
  MensagensIdiomaParcial,
  PartialTemplateLocaleMessages
};

export type {
  OrientacaoCertificado,
  SheetOrientation,
  FormatoFolhaCanonico,
  FormatoFolha,
  SheetFormat,
  PresetFormatoFolha,
  SheetFormatPreset,
  TipoCamada,
  LayerType,
  AlinhamentoTexto,
  TextAlignment,
  AlinhamentoVertical,
  VerticalAlignment,
  EixoAlinhamentoFolhaCanonico,
  EixoAlinhamentoFolha,
  SheetAlignmentAxis,
  PosicaoGrade3x3Canonica,
  PosicaoGrade3x3,
  Grid3x3Position,
  EstiloBorda,
  BorderStyle,
  DirecaoPontaSetaCanonica,
  DirecaoPontaSeta,
  ArrowheadDirection,
  AjusteImagem,
  ImageFit,
  AjusteFundo,
  BackgroundFit,
  EstiloModuloQrCanonico,
  EstiloModuloQr,
  QrModuleStyle,
  EstiloOlhoQrCanonico,
  EstiloOlhoQr,
  QrEyeStyle,
  ModoExibicaoLinkCanonico,
  ModoExibicaoLink,
  LinkDisplayMode,
  VariavelCertificado,
  TemplateVariable,
  VariavelNormalizada,
  NormalizedVariable,
  CamadaCertificado,
  TemplateLayer,
  ItemCamadaInvertida,
  ReversedLayerItem,
  TemplateCertificado,
  TemplateDocument,
  DadosCertificado,
  TemplateData,
  OpcoesExportacao,
  ExportOptions,
  ResultadoExportacao,
  ExportResult,
  CertificadoLabels,
  TemplateStudioLabels,
  CertificadoClasses,
  TemplateStudioClasses,
  CertificadoOptions,
  TemplateStudioOptions
} from './types/certificado';

export type {
  DimensoesFolha,
  AlvoDimensoesFolha
} from './composables/gerenciadorDeCamadas';

export type {
  LinhaMedidaAlt,
  MedidasAltResultado
} from './composables/gerenciadorDePalco';

export type {
  MatrizQrCode,
  OpcoesSvgQrCode,
  SvgQrCodeEstilizado
} from './utils/qrcode';

export type {
  SvgSource,
  IconTree
};

// Plugin Vue para instalação global dos componentes e opções padrão da biblioteca
export const TemplateStudioPlugin = {
  /*
   * Recebe: instância da aplicação Vue e opções parciais de configuração global.
   * Devolve: nada (void).
   * Por que é usada: registra os componentes globais e inicializa o i18n ao instalar o plugin via app.use().
   */
  install(app: App, options?: Partial<CertificadoOptions>) {
    if (options) {
      configureCertificado(options);
    }
    if (!app.config.globalProperties.$t) {
      app.use(i18n);
    }
    app.component('TemplateStudioEditor', TemplateStudioEditor);
    app.component('TemplateStudioViewer', TemplateStudioViewer);
    app.component('LocaleSwitcher', LocaleSwitcher);
  }
};

export { TemplateStudioPlugin as CertificadoPlugin };

export default TemplateStudioPlugin;

declare module 'vue' {
  export interface GlobalComponents {
    TemplateStudioEditor: typeof TemplateStudioEditor;
    TemplateStudioViewer: typeof TemplateStudioViewer;
    LocaleSwitcher: typeof LocaleSwitcher;
  }
}