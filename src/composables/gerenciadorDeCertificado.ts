/*
========
Gerenciador explícito de templates, opções globais, formatos de folha, internacionalização e exportação (src/composables/gerenciadorDeCertificado.ts).
Suporta configuração e variáveis tanto em português quanto em inglês para adoção via npm,
A4 padrão e formatos customizados com cálculo automático em milímetros para o jsPDF.
========
*/
import { ref } from 'vue';
import { jsPDF } from 'jspdf';
import type {
  CertificadoOptions,
  DadosCertificado,
  FormatoFolha,
  OpcoesExportacao,
  OrientacaoCertificado,
  ResultadoExportacao,
  TemplateCertificado,
  VariavelCertificado,
  VariavelNormalizada
} from '../types/certificado';
import { DIMENSOES_A4, renderizarParaCanvas2D } from '../utils/renderizador';
import {
  PRESETS_FORMATOS_FOLHA,
  normalizarFormatoFolha,
  obterDimensoesPorFormato,
  resolverDimensoesTemplate
} from './gerenciadorDeCamadas';
import {
  clonarSeguro,
  extrairVariaveisTemplate,
  gerarId,
  resolverUrlClicavelCamada,
  resolverVariaveisTexto,
  sanitizarNomeArquivo,
  temVariavelNoTemplate
} from '../utils/variaveis';
import i18n, { definirIdioma, registrarIdiomasCustomizados } from '../i18n';

export {
  DIMENSOES_A4,
  PRESETS_FORMATOS_FOLHA,
  obterDimensoesPorFormato,
  resolverDimensoesTemplate,
  renderizarParaCanvas2D,
  resolverVariaveisTexto,
  extrairVariaveisTemplate,
  temVariavelNoTemplate
};

// Lista padrão de fontes tipográficas oferecidas no inspetor
export const FONTES_PADRAO: string[] = [
  "'Playfair Display', serif",
  "'Cinzel', serif",
  "'Great Vibes', cursive",
  "'Lora', serif",
  "'Merriweather', serif",
  "'Montserrat', sans-serif",
  "'Inter', sans-serif",
  "'Roboto', sans-serif",
  "'Open Sans', sans-serif"
];
export const DEFAULT_FONTS = FONTES_PADRAO;

// Biblioteca agnóstica: lista de variáveis padrão inicia vazia (o cliente informa as variáveis do seu domínio)
export const VARIAVEIS_PADRAO: VariavelNormalizada[] = [];
export const DEFAULT_VARIABLES = VARIAVEIS_PADRAO;

// Estado reativo das opções globais configuradas pelo cliente via Plugin ou configureTemplateStudio
export const globalCertificadoOptions = ref<CertificadoOptions>({
  unstyled: false,
  tema: 'dark',
  theme: 'dark',
  locale: 'pt_br',
  mensagensIdioma: {},
  localeMessages: {},
  exibirSeletorIdioma: true,
  showLocaleSwitcher: true,
  permitirCriarVariavel: false,
  allowCustomVariables: false,
  escalaExportacao: 2,
  exportScale: 2,
  escalaPreview: 1.5,
  previewScale: 1.5,
  qualidadeImagem: 0.95,
  imageQuality: 0.95,
  zoomInicial: 0.66,
  initialZoom: 0.66,
  limiteHistorico: 50,
  historyLimit: 50,
  fontesDisponiveis: [...FONTES_PADRAO],
  availableFonts: [...FONTES_PADRAO],
  variaveisDisponiveis: [],
  availableVariables: [],
  dadosPreview: {},
  previewData: {},
  labels: {},
  classes: {}
});
export const globalTemplateStudioOptions = globalCertificadoOptions;

/*
 * Recebe: lista de objetos VariavelCertificado/TemplateVariable (em português ou inglês).
 * Devolve: lista de objetos VariavelNormalizada com chave e rotulo garantidos.
 * Por que é usada: permite que o usuário passe variáveis com { key, label, layerName, previewValue, defaultValue } ou { chave, rotulo, nomeCamada, valorVisualizacao, valorPadrao }.
 */
export function normalizarListaVariaveis(
  variaveis: VariavelCertificado[] = []
): VariavelNormalizada[] {
  const resultado: VariavelNormalizada[] = [];

  for (const v of variaveis || []) {
    const chave = (v.chave ?? v.key ?? '').trim();
    if (!chave) continue;
    const rotulo = (v.rotulo ?? v.label ?? chave).trim();
    const nomeCamada = v.nomeCamada ?? v.layerName;
    const valorVisualizacao = v.valorVisualizacao ?? v.previewValue;
    const valorPadrao = v.valorPadrao ?? v.defaultValue;

    resultado.push({
      chave,
      rotulo,
      nomeCamada,
      valorVisualizacao,
      valorPadrao
    });
  }

  return resultado;
}
export const normalizeVariableList = normalizarListaVariaveis;

/*
 * Recebe: template completo, dicionário de dados e fator de escala.
 * Devolve: Promise<HTMLCanvasElement> renderizado nas dimensões do template.
 * Por que é usada: resolve as dimensões do template e delega a renderização de forma isolada.
 */
async function renderizarCanvasComDimensoesTemplate(
  template: TemplateCertificado,
  dados: DadosCertificado,
  escala: number
): Promise<HTMLCanvasElement> {
  const dim = resolverDimensoesTemplate(template);
  return renderizarParaCanvas2D(template, dados, escala, dim);
}

/*
 * Recebe: lista de variáveis do cliente e objetos opcionais de dadosPreview (prop e global).
 * Devolve: dicionário DadosCertificado consolidado para pré-visualização.
 * Por que é usada: monta os valores de exemplo exibidos quando o usuário ativa o modo Pré-visualizar no editor.
 */
export function montarDadosVisualizacao(
  variaveis: VariavelCertificado[] = [],
  dadosPreviewProp?: DadosCertificado,
  dadosPreviewGlobal?: DadosCertificado
): DadosCertificado {
  const resultado: DadosCertificado = {};
  const normalizadas = normalizarListaVariaveis(variaveis);

  for (const v of normalizadas) {
    const valor = v.valorVisualizacao ?? v.valorPadrao;
    if (valor !== undefined && valor !== '') {
      resultado[v.chave] = valor;
    }
  }

  if (dadosPreviewGlobal) {
    for (const [chave, valor] of Object.entries(dadosPreviewGlobal)) {
      if (valor !== undefined) {
        resultado[chave] = valor;
      }
    }
  }

  if (dadosPreviewProp) {
    for (const [chave, valor] of Object.entries(dadosPreviewProp)) {
      if (valor !== undefined) {
        resultado[chave] = valor;
      }
    }
  }

  return resultado;
}
export const buildPreviewData = montarDadosVisualizacao;

/*
 * Recebe: objeto parcial CertificadoOptions / TemplateStudioOptions (em português ou inglês).
 * Devolve: nada (void).
 * Por que é usada: aplica configurações globais para todos os componentes e sincroniza o vue-i18n.
 */
export function configureCertificado(options: Partial<CertificadoOptions>): void {
  const mensagens = options.mensagensIdioma ?? options.localeMessages;
  if (mensagens) {
    registrarIdiomasCustomizados(mensagens);
  }
  if (options.locale) {
    definirIdioma(options.locale);
  }

  const temaResolvido =
    options.tema ??
    options.theme ??
    globalCertificadoOptions.value.tema ??
    globalCertificadoOptions.value.theme;
  const exibirSeletorResolvido =
    options.exibirSeletorIdioma ??
    options.showLocaleSwitcher ??
    globalCertificadoOptions.value.exibirSeletorIdioma ??
    globalCertificadoOptions.value.showLocaleSwitcher;
  const permitirVariavelResolvido =
    options.permitirCriarVariavel ??
    options.allowCustomVariables ??
    globalCertificadoOptions.value.permitirCriarVariavel ??
    globalCertificadoOptions.value.allowCustomVariables;
  const escalaExportResolvida =
    options.escalaExportacao ??
    options.exportScale ??
    globalCertificadoOptions.value.escalaExportacao ??
    globalCertificadoOptions.value.exportScale;
  const escalaPrevResolvida =
    options.escalaPreview ??
    options.previewScale ??
    globalCertificadoOptions.value.escalaPreview ??
    globalCertificadoOptions.value.previewScale;
  const qualidadeResolvida =
    options.qualidadeImagem ??
    options.imageQuality ??
    globalCertificadoOptions.value.qualidadeImagem ??
    globalCertificadoOptions.value.imageQuality;
  const zoomResolvido =
    options.zoomInicial ??
    options.initialZoom ??
    globalCertificadoOptions.value.zoomInicial ??
    globalCertificadoOptions.value.initialZoom;
  const historicoResolvido =
    options.limiteHistorico ??
    options.historyLimit ??
    globalCertificadoOptions.value.limiteHistorico ??
    globalCertificadoOptions.value.historyLimit;
  const fontesResolvidas =
    options.fontesDisponiveis ??
    options.availableFonts ??
    globalCertificadoOptions.value.fontesDisponiveis ??
    globalCertificadoOptions.value.availableFonts;
  const variaveisResolvidas =
    options.variaveisDisponiveis ??
    options.availableVariables ??
    globalCertificadoOptions.value.variaveisDisponiveis ??
    globalCertificadoOptions.value.availableVariables;
  const dadosPreviewInput = options.dadosPreview ?? options.previewData;
  const dadosPreviewResolvidos =
    dadosPreviewInput !== undefined
      ? { ...dadosPreviewInput }
      : globalCertificadoOptions.value.dadosPreview ?? globalCertificadoOptions.value.previewData;
  const mensagensResolvidas =
    mensagens !== undefined
      ? {
          ...(globalCertificadoOptions.value.mensagensIdioma || {}),
          ...mensagens
        }
      : globalCertificadoOptions.value.mensagensIdioma;

  globalCertificadoOptions.value = {
    ...globalCertificadoOptions.value,
    ...options,
    tema: temaResolvido,
    theme: temaResolvido,
    exibirSeletorIdioma: exibirSeletorResolvido,
    showLocaleSwitcher: exibirSeletorResolvido,
    permitirCriarVariavel: permitirVariavelResolvido,
    allowCustomVariables: permitirVariavelResolvido,
    escalaExportacao: escalaExportResolvida,
    exportScale: escalaExportResolvida,
    escalaPreview: escalaPrevResolvida,
    previewScale: escalaPrevResolvida,
    qualidadeImagem: qualidadeResolvida,
    imageQuality: qualidadeResolvida,
    zoomInicial: zoomResolvido,
    initialZoom: zoomResolvido,
    limiteHistorico: historicoResolvido,
    historyLimit: historicoResolvido,
    fontesDisponiveis: fontesResolvidas,
    availableFonts: fontesResolvidas,
    variaveisDisponiveis: variaveisResolvidas,
    availableVariables: variaveisResolvidas,
    mensagensIdioma: mensagensResolvidas,
    localeMessages: mensagensResolvidas,
    dadosPreview: dadosPreviewResolvidos,
    previewData: dadosPreviewResolvidos,
    labels: {
      ...globalCertificadoOptions.value.labels,
      ...options.labels
    },
    classes: {
      ...globalCertificadoOptions.value.classes,
      ...options.classes
    }
  };
}
export const configureTemplateStudio = configureCertificado;

/*
 * Recebe: nome opcional, orientação, formato de folha (PT ou EN) e dimensões customizadas opcionais.
 * Devolve: objeto TemplateCertificado vazio pronto para edição.
 * Por que é usada: inicializa um novo template em branco usando o título padrão do idioma ativo quando omitido.
 */
export function criarTemplateVazio(
  nome?: string,
  orientacao: OrientacaoCertificado = 'landscape',
  formato?: FormatoFolha,
  largura?: number,
  altura?: number
): TemplateCertificado {
  const nomeResolvido = nome ?? String(i18n.global.t('camadasPadrao.novoTemplate'));
  const base: TemplateCertificado = {
    id: gerarId('tpl'),
    nome: nomeResolvido,
    orientacao,
    fundoCor: '#ffffff',
    fundoImagem: '',
    fundoAjuste: 'cover',
    camadas: []
  };

  if (formato) {
    const formatoCanonico = normalizarFormatoFolha(formato);
    base.formato = formatoCanonico;
    const dim = obterDimensoesPorFormato(formatoCanonico, orientacao, largura, altura);
    base.largura = dim.largura;
    base.altura = dim.altura;
  } else if (largura && altura) {
    base.formato = 'custom';
    base.largura = Math.max(120, Math.round(largura));
    base.altura = Math.max(120, Math.round(altura));
  }

  return base;
}
export const createEmptyTemplate = criarTemplateVazio;

/*
 * Recebe: template de origem e novo nome opcional.
 * Devolve: novo TemplateCertificado clonado com ID próprio.
 * Por que é usada: duplica um template completo adicionando o sufixo (Cópia)/(Copy) do idioma ativo.
 */
export function duplicarTemplate(
  template: TemplateCertificado,
  novoNome?: string
): TemplateCertificado {
  const copia: TemplateCertificado = clonarSeguro(template);
  copia.id = gerarId('tpl');
  copia.nome =
    novoNome || `${template.nome} ${String(i18n.global.t('camadasPadrao.sufixoCopia'))}`;
  return copia;
}
export const duplicateTemplate = duplicarTemplate;

/*
 * Recebe: objeto TemplateCertificado.
 * Devolve: string JSON identada.
 * Por que é usada: serializa o template para persistência ou exportação.
 */
export function exportarTemplateJson(template: TemplateCertificado): string {
  return JSON.stringify(template, null, 2);
}
export const exportTemplateJson = exportarTemplateJson;

/*
 * Recebe: string JSON contendo a estrutura de um template.
 * Devolve: objeto TemplateCertificado validado e normalizado.
 * Por que é usada: importa templates externos garantindo integridade de camadas e dimensões.
 */
export function importarTemplateJson(json: string): TemplateCertificado {
  const parsed = JSON.parse(json) as Partial<TemplateCertificado>;
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.camadas)) {
    throw new Error(String(i18n.global.t('erros.templateJsonInvalido')));
  }

  const resultado: TemplateCertificado = {
    id: parsed.id || gerarId('tpl'),
    nome: parsed.nome || String(i18n.global.t('camadasPadrao.templateImportado')),
    orientacao: parsed.orientacao === 'portrait' ? 'portrait' : 'landscape',
    fundoCor: parsed.fundoCor || '#ffffff',
    fundoImagem: parsed.fundoImagem || '',
    fundoAjuste: parsed.fundoAjuste || 'cover',
    camadas: parsed.camadas
  };

  if (parsed.formato) resultado.formato = normalizarFormatoFolha(parsed.formato);
  if (typeof parsed.largura === 'number' && parsed.largura >= 120) {
    resultado.largura = Math.round(parsed.largura);
  }
  if (typeof parsed.altura === 'number' && parsed.altura >= 120) {
    resultado.altura = Math.round(parsed.altura);
  }

  return resultado;
}
export const importTemplateJson = importarTemplateJson;

/*
 * Recebe: opções parciais de configuração global.
 * Devolve: utilitários de renderização, exportação PDF/PNG e manipulação de templates (em português e inglês).
 * Por que é usada: fornece a API programática principal da biblioteca vue-template-studio.
 */
export function gerenciadorDeCertificado(options?: Partial<CertificadoOptions>) {
  if (options) {
    configureCertificado(options);
  }

  /*
   * Recebe: template, dados dinâmicos e opções de exportação.
   * Devolve: Promise<string> com a Data URL PNG renderizada.
   * Por que é usada: gera a imagem de pré-visualização rápida via Canvas 2D.
   */
  async function gerarImagemPreview(
    template: TemplateCertificado,
    dados: DadosCertificado = {},
    opcoes: OpcoesExportacao = {}
  ): Promise<string> {
    const escala =
      opcoes.escala ?? opcoes.scale ?? globalCertificadoOptions.value.escalaPreview ?? 1.5;
    const qualidade =
      opcoes.qualidadeImagem ??
      opcoes.imageQuality ??
      opcoes.qualidade ??
      opcoes.quality ??
      0.92;
    const canvas = await renderizarCanvasComDimensoesTemplate(template, dados, escala);
    return canvas.toDataURL('image/png', qualidade);
  }

  /*
   * Recebe: template, dados dinâmicos e opções de exportação.
   * Devolve: Promise<ResultadoExportacao> contendo Data URL, Blob PNG, Blob PDF e nome do arquivo.
   * Por que é usada: gera simultaneamente a imagem de alta resolução e o documento PDF final.
   */
  async function gerarPacoteExportacao(
    template: TemplateCertificado,
    dados: DadosCertificado = {},
    opcoes: OpcoesExportacao = {}
  ): Promise<ResultadoExportacao> {
    const escala =
      opcoes.escala ?? opcoes.scale ?? globalCertificadoOptions.value.escalaExportacao ?? 2;
    const qualidade =
      opcoes.qualidadeImagem ??
      opcoes.imageQuality ??
      opcoes.qualidade ??
      opcoes.quality ??
      globalCertificadoOptions.value.qualidadeImagem ??
      globalCertificadoOptions.value.imageQuality ??
      0.95;

    const canvas = await renderizarCanvasComDimensoesTemplate(template, dados, escala);
    const imagemDataUrl = canvas.toDataURL('image/png', qualidade);
    const imagemBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((blob) => resolve(blob), 'image/png', qualidade)
    );

    const dim = resolverDimensoesTemplate(template);
    const padraoA4 = DIMENSOES_A4[template.orientacao] || DIMENSOES_A4.landscape;
    const formatoNormalizado = template.formato ? normalizarFormatoFolha(template.formato) : 'a4';
    const ehA4Padrao =
      formatoNormalizado === 'a4' &&
      dim.largura === padraoA4.largura &&
      dim.altura === padraoA4.altura;

    const orientacaoPdf = dim.largura >= dim.altura ? 'l' : 'p';
    const formatoPdf: string | [number, number] = ehA4Padrao
      ? 'a4'
      : [
          +(dim.largura * (25.4 / 96)).toFixed(2),
          +(dim.altura * (25.4 / 96)).toFixed(2)
        ];

    const pdf = new jsPDF({
      orientation: orientacaoPdf,
      unit: 'mm',
      format: formatoPdf,
      compress: true
    });

    const larguraPdf = pdf.internal.pageSize.getWidth();
    const alturaPdf = pdf.internal.pageSize.getHeight();
    pdf.addImage(imagemDataUrl, 'PNG', 0, 0, larguraPdf, alturaPdf, undefined, 'FAST');

    // Adiciona anotações clicáveis no PDF sobre camadas que possuem link (URL ou {{link_qrcode}})
    if (typeof pdf.link === 'function' && dim.largura > 0 && dim.altura > 0) {
      const fatorX = larguraPdf / dim.largura;
      const fatorY = alturaPdf / dim.altura;
      for (const camada of template.camadas || []) {
        if (!camada.visivel) continue;
        const urlClicavel = resolverUrlClicavelCamada(camada, dados, template);
        if (!urlClicavel) continue;
        const xMm = +(camada.x * fatorX).toFixed(2);
        const yMm = +(camada.y * fatorY).toFixed(2);
        const wMm = +(camada.largura * fatorX).toFixed(2);
        const hMm = +(camada.altura * fatorY).toFixed(2);
        pdf.link(xMm, yMm, wMm, hMm, { url: urlClicavel });
      }
    }

    const nomeInformado = opcoes.nomeArquivo ?? opcoes.fileName ?? template.nome ?? 'template';
    const nomeBase = sanitizarNomeArquivo(nomeInformado);
    const pdfBlob = pdf.output('blob');
    const nomeArquivo = `${nomeBase}.pdf`;

    return {
      imagemDataUrl,
      imagemBlob,
      pdfBlob,
      nomeArquivo,
      imageDataUrl: imagemDataUrl,
      imageBlob: imagemBlob,
      fileName: nomeArquivo
    };
  }

  /*
   * Recebe: objeto Blob e nome do arquivo com extensão.
   * Devolve: nada (void).
   * Por que é usada: dispara o download do arquivo no navegador criando um link temporário.
   */
  function dispararDownload(blob: Blob, nomeArquivo: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /*
   * Recebe: pacote ResultadoExportacao.
   * Devolve: nada (void).
   * Por que é usada: inicia o download do arquivo PDF gerado.
   */
  function baixarPdf(resultado: ResultadoExportacao): void {
    const nome = resultado.nomeArquivo || resultado.fileName || 'template.pdf';
    dispararDownload(resultado.pdfBlob, nome);
  }

  /*
   * Recebe: pacote ResultadoExportacao.
   * Devolve: nada (void).
   * Por que é usada: inicia o download da imagem PNG gerada.
   */
  function baixarImagem(resultado: ResultadoExportacao): void {
    const blob = resultado.imagemBlob ?? resultado.imageBlob;
    if (!blob) return;
    const nome = resultado.nomeArquivo || resultado.fileName || 'template.pdf';
    const nomePng = nome.replace(/\.pdf$/i, '.png');
    dispararDownload(blob, nomePng);
  }

  return {
    globalOptions: globalCertificadoOptions,
    configureCertificado,
    configureTemplateStudio: configureCertificado,
    montarDadosVisualizacao,
    buildPreviewData: montarDadosVisualizacao,
    criarTemplateVazio,
    createEmptyTemplate: criarTemplateVazio,
    duplicarTemplate,
    duplicateTemplate: duplicarTemplate,
    exportarTemplateJson,
    exportTemplateJson: exportarTemplateJson,
    importarTemplateJson,
    importTemplateJson: importarTemplateJson,
    resolverDimensoesTemplate,
    resolveTemplateDimensions: resolverDimensoesTemplate,
    obterDimensoesPorFormato,
    getDimensionsByFormat: obterDimensoesPorFormato,
    resolverVariaveisTexto,
    resolveTextVariables: resolverVariaveisTexto,
    extrairVariaveisTemplate,
    extractTemplateVariables: extrairVariaveisTemplate,
    temVariavelNoTemplate,
    hasVariableInTemplate: temVariavelNoTemplate,
    gerarImagemPreview,
    generatePreviewImage: gerarImagemPreview,
    gerarPacoteExportacao,
    generateExportPackage: gerarPacoteExportacao,
    baixarPdf,
    downloadPdf: baixarPdf,
    baixarImagem,
    downloadImage: baixarImagem
  };
}

export const useCertificado = gerenciadorDeCertificado;
export const useTemplateStudio = gerenciadorDeCertificado;