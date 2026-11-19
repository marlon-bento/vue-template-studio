/*
========
Reexportação compatível do gerenciador de camadas e formatos de folha (src/composables/useCamadas.ts).
========
*/
export {
  DIMENSOES_CAMADAS_A4,
  PRESETS_FORMATOS_FOLHA,
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
} from './gerenciadorDeCamadas';
