/*
========
Reexportação compatível do gerenciador de templates e certificados (src/composables/useCertificado.ts).
Expõe funções tanto em português quanto em inglês para adoção via npm.
========
*/
export {
  DIMENSOES_A4,
  PRESETS_FORMATOS_FOLHA,
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
  obterDimensoesPorFormato,
  resolverDimensoesTemplate,
  resolverVariaveisTexto,
  extrairVariaveisTemplate,
  temVariavelNoTemplate,
  renderizarParaCanvas2D,
  gerenciadorDeCertificado,
  useCertificado,
  useTemplateStudio
} from './gerenciadorDeCertificado';
