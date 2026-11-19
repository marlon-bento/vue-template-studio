<!--
========
Componente principal do Editor Visual (src/components/TemplateStudioEditor.vue).
Orquestra os subcomponentes modulares (BarraSuperiorEditor, PainelInsercaoElementos,
PalcoCanvasCertificado, PainelPropriedadesFigma e PainelCamadasLista), aceitando props,
eventos e métodos expostos tanto em inglês (para adoção global no npm) quanto em português,
com internacionalização completa via vue-i18n.
========
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import type {
  CamadaCertificado,
  CertificadoClasses,
  CertificadoLabels,
  DadosCertificado,
  DirecaoPontaSeta,
  EixoAlinhamentoFolha,
  FormatoFolha,
  ModoExibicaoLink,
  OrientacaoCertificado,
  PosicaoGrade3x3,
  TemplateCertificado,
  VariavelCertificado
} from '../types/certificado';
import {
  FONTES_PADRAO,
  VARIAVEIS_PADRAO,
  criarTemplateVazio,
  extrairVariaveisTemplate,
  gerenciadorDeCertificado,
  globalCertificadoOptions,
  montarDadosVisualizacao,
  normalizarListaVariaveis,
  obterDimensoesPorFormato,
  resolverDimensoesTemplate
} from '../composables/gerenciadorDeCertificado';
import {
  criarCamadaCirculo,
  criarCamadaImagem,
  criarCamadaLinha,
  criarCamadaLinkQrCode,
  criarCamadaMoldura,
  criarCamadaQrCode,
  criarCamadaSeta,
  criarCamadaTexto,
  duplicarCamada,
  moverCamadaPorId,
  reordenarCamadaListaInvertida
} from '../composables/gerenciadorDeCamadas';
import { gerenciadorDeHistorico } from '../composables/gerenciadorDeHistorico';
import { gerenciadorDeAtalhos } from '../composables/gerenciadorDeAtalhos';
import { gerenciadorDePalco } from '../composables/gerenciadorDePalco';
import {
  alinharCamadaNaGrade3x3Folha,
  alinharCamadaNoEixoFolha
} from '../composables/gerenciadorDeAlinhamento';
import {
  CHAVE_VARIAVEL_LINK_QRCODE,
  CHAVES_LINK_QRCODE,
  enriquecerDadosComLinkQrCode,
  temQrCodeNoTemplate
} from '../utils/variaveis';
import {
  definirIdioma,
  registrarIdiomasCustomizados,
  usarI18nCertificado,
  type MensagensIdiomaParcial
} from '../i18n';

import BarraSuperiorEditor from './editor/BarraSuperiorEditor.vue';
import PainelInsercaoElementos from './editor/PainelInsercaoElementos.vue';
import PalcoCanvasCertificado from './editor/PalcoCanvasCertificado.vue';
import PainelPropriedadesFigma from './editor/PainelPropriedadesFigma.vue';
import PainelCamadasLista from './editor/PainelCamadasLista.vue';
import { buildIcons } from '../utils/svgFactory';
import { svgs } from '../styles/svgs';

const icons = buildIcons(svgs);

export interface PacoteEventoExportacao {
  imagemDataUrl: string;
  imageDataUrl: string;
  pdfBlob: Blob;
  nomeArquivo: string;
  fileName: string;
}

export interface Props {
  modelValue?: TemplateCertificado;
  // Props em inglês (primárias para npm)
  previewData?: DadosCertificado;
  availableFonts?: string[];
  availableVariables?: VariavelCertificado[];
  allowCustomVariables?: boolean;
  theme?: 'dark' | 'light';
  unstyled?: boolean;
  locale?: string;
  localeMessages?: Record<string, MensagensIdiomaParcial>;
  showLocaleSwitcher?: boolean;
  labels?: CertificadoLabels;
  classes?: CertificadoClasses;
  maxUploadSizeMb?: number;
  // Props equivalentes em português (retrocompatibilidade total)
  dadosPreview?: DadosCertificado;
  fontesDisponiveis?: string[];
  variaveisDisponiveis?: VariavelCertificado[];
  permitirCriarVariavel?: boolean;
  tema?: 'dark' | 'light';
  mensagensIdioma?: Record<string, MensagensIdiomaParcial>;
  exibirSeletorIdioma?: boolean;
  tamanhoMaximoUploadMb?: number;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => criarTemplateVazio(),
  previewData: undefined,
  availableFonts: undefined,
  availableVariables: undefined,
  allowCustomVariables: undefined,
  theme: undefined,
  unstyled: undefined,
  locale: undefined,
  localeMessages: undefined,
  showLocaleSwitcher: undefined,
  labels: undefined,
  classes: undefined,
  maxUploadSizeMb: undefined,
  dadosPreview: undefined,
  fontesDisponiveis: undefined,
  variaveisDisponiveis: undefined,
  permitirCriarVariavel: undefined,
  tema: undefined,
  mensagensIdioma: undefined,
  exibirSeletorIdioma: undefined,
  tamanhoMaximoUploadMb: undefined
});

const emit = defineEmits<{
  'update:modelValue': [template: TemplateCertificado];
  // Eventos em inglês e português
  'save': [template: TemplateCertificado];
  'salvar': [template: TemplateCertificado];
  'export': [resultado: PacoteEventoExportacao];
  'exportar': [resultado: PacoteEventoExportacao];
  'error': [mensagem: string];
  'erro': [mensagem: string];
  'select-layer': [camada: CamadaCertificado | null];
  'selecionar-camada': [camada: CamadaCertificado | null];
  'variables-changed': [variaveis: string[]];
  'variaveis-alteradas': [variaveis: string[]];
}>();

// Função de tradução reativa conectada à instância global do vue-i18n
const { t } = usarI18nCertificado();

// Registra idiomas customizados enviados via localeMessages ou mensagensIdioma
watch(
  () => props.localeMessages ?? props.mensagensIdioma,
  (novosIdiomas) => {
    if (novosIdiomas) {
      registrarIdiomasCustomizados(novosIdiomas);
    }
  },
  { immediate: true, deep: true }
);

// Sincroniza o idioma do vue-i18n sempre que a prop locale for alterada pelo componente pai
watch(
  () => props.locale,
  (novoIdioma) => {
    const idiomaAlvo = novoIdioma ?? globalCertificadoOptions.value.locale;
    if (idiomaAlvo) {
      definirIdioma(idiomaAlvo);
    }
  },
  { immediate: true }
);

// Cópia reativa local do template editado no estúdio
const template = ref<TemplateCertificado>(JSON.parse(JSON.stringify(props.modelValue)));

// Identificador da camada atualmente selecionada no palco ou na lista
const camadaSelecionadaId = ref<string | null>(null);

// Alterna entre o modo de edição de placeholders e a pré-visualização com dados reais
const modoPreview = ref(false);

// Controla a exibição da grade quadriculada sobre a folha
const mostrarGrade = ref(false);

// Nível de zoom atual aplicado ao palco central (0.25 a 2.0)
const zoom = ref(globalCertificadoOptions.value.zoomInicial ?? 0.66);

// Deslocamento horizontal do pan do palco em pixels
const panX = ref(0);

// Deslocamento vertical do pan do palco em pixels
const panY = ref(0);

// Indica se a geração de PDF/imagem está em andamento para evitar cliques duplos
const exportando = ref(false);

// Referência à instância do componente de palco central
const palcoComponenteRef = ref<InstanceType<typeof PalcoCanvasCertificado> | null>(null);

// Estado de recolhimento do painel lateral esquerdo (Inserir)
const painelEsquerdoMinimizado = ref(false);

// Estado de recolhimento do painel lateral direito (Propriedades e Camadas)
const painelDireitoMinimizado = ref(false);

// Estado de recolhimento da seção superior de propriedades dentro do painel direito
const propriedadesMinimizado = ref(false);

// Estado de recolhimento da seção inferior de camadas dentro do painel direito
const camadasMinimizado = ref(false);

const { podeDesfazer, podeRefazer, iniciar, registrar, desfazer, refazer } =
  gerenciadorDeHistorico<TemplateCertificado>(globalCertificadoOptions.value.limiteHistorico ?? 50);
const { gerarPacoteExportacao, baixarPdf } = gerenciadorDeCertificado();

// Define se o componente deve ser renderizado sem as classes visuais padrão (modo headless)
const isUnstyled = computed(
  () => props.unstyled ?? globalCertificadoOptions.value.unstyled ?? false
);

// Define o tema visual efetivo ('dark' ou 'light') aceitando theme ou tema
const temaEfetivo = computed(
  () =>
    props.theme ??
    props.tema ??
    globalCertificadoOptions.value.theme ??
    globalCertificadoOptions.value.tema ??
    'dark'
);

// Define se o seletor de idioma (LocaleSwitcher) deve ser exibido na barra superior
const mostrarSeletorIdioma = computed(
  () =>
    props.showLocaleSwitcher ??
    props.exibirSeletorIdioma ??
    globalCertificadoOptions.value.showLocaleSwitcher ??
    globalCertificadoOptions.value.exibirSeletorIdioma ??
    true
);

// Define se o usuário pode criar novas variáveis diretamente pelo painel esquerdo
const podeCriarVariavel = computed(
  () =>
    props.allowCustomVariables ??
    props.permitirCriarVariavel ??
    globalCertificadoOptions.value.allowCustomVariables ??
    globalCertificadoOptions.value.permitirCriarVariavel ??
    false
);

// Limite máximo de upload de imagem em MB aceitando maxUploadSizeMb ou tamanhoMaximoUploadMb
const limiteUploadMb = computed(
  () => props.maxUploadSizeMb ?? props.tamanhoMaximoUploadMb ?? 8
);

// Lista de famílias de fontes disponíveis no seletor de tipografia
const listaFontes = computed(
  () =>
    props.availableFonts ??
    props.fontesDisponiveis ??
    globalCertificadoOptions.value.availableFonts ??
    globalCertificadoOptions.value.fontesDisponiveis ??
    FONTES_PADRAO
);

// Lista de variáveis de domínio normalizada (aceita formato em inglês ou português)
const listaVariaveis = computed(() =>
  normalizarListaVariaveis(
    props.availableVariables ??
      props.variaveisDisponiveis ??
      globalCertificadoOptions.value.availableVariables ??
      globalCertificadoOptions.value.variaveisDisponiveis ??
      VARIAVEIS_PADRAO
  )
);

// Indica se o template atual possui ao menos uma camada de QR Code ativa
const temQrCode = computed<boolean>(() => temQrCodeNoTemplate(template.value));

// Dados de visualização montados a partir das variáveis, previewData e link automático do QR Code
const dadosPreviewEfetivos = computed<DadosCertificado>(() => {
  const base = montarDadosVisualizacao(
    listaVariaveis.value,
    props.previewData ?? props.dadosPreview,
    globalCertificadoOptions.value.previewData ?? globalCertificadoOptions.value.dadosPreview
  );
  return enriquecerDadosComLinkQrCode(template.value, base);
});

// Lista de variáveis exibida no autocompletar do inspetor (inclui {{link_qrcode}} quando há QR Code)
const listaVariaveisInspetor = computed(() => {
  if (!temQrCode.value) return listaVariaveis.value;
  const jaPossuiLinkQr = listaVariaveis.value.some(
    (v) => v.chave === CHAVE_VARIAVEL_LINK_QRCODE
  );
  if (jaPossuiLinkQr) return listaVariaveis.value;
  return [
    ...listaVariaveis.value,
    {
      chave: CHAVE_VARIAVEL_LINK_QRCODE,
      rotulo: t('painelInserir.rotuloVariavelLinkQr'),
      nomeCamada: t('painelInserir.nomeCamadaLinkQr'),
      valorVisualizacao: String(
        dadosPreviewEfetivos.value[CHAVE_VARIAVEL_LINK_QRCODE] ||
          'https://vue-template-studio.dev'
      )
    }
  ];
});

// Chaves extras reconhecidas como válidas (badge azul) no CampoTextoVariavel quando há QR Code no template
const chavesExtrasValidas = computed<string[]>(() =>
  temQrCode.value ? [...CHAVES_LINK_QRCODE] : []
);

// Lista de chaves de variáveis atualmente presentes nas camadas do template
const variaveisUsadas = computed(() => extrairVariaveisTemplate(template.value));

watch(
  variaveisUsadas,
  (novas) => {
    emit('variaveis-alteradas', novas);
    emit('variables-changed', novas);
  },
  { immediate: true }
);

// Mescla classes CSS customizadas aceitando chaves em inglês e português
const mergedClasses = computed<CertificadoClasses>(() => {
  const g = globalCertificadoOptions.value.classes || {};
  const p = props.classes || {};
  return {
    root: p.root ?? g.root,
    topo: p.topBar ?? p.topo ?? g.topBar ?? g.topo,
    workspace: p.workspace ?? g.workspace,
    dockEsquerdo: p.leftDock ?? p.dockEsquerdo ?? g.leftDock ?? g.dockEsquerdo,
    canvasPalco: p.canvasStage ?? p.canvasPalco ?? g.canvasStage ?? g.canvasPalco,
    folha: p.sheet ?? p.folha ?? g.sheet ?? g.folha,
    dockDireito: p.rightDock ?? p.dockDireito ?? g.rightDock ?? g.dockDireito,
    inspetor: p.inspector ?? p.inspetor ?? g.inspector ?? g.inspetor,
    painelCamadas: p.layersPanel ?? p.painelCamadas ?? g.layersPanel ?? g.painelCamadas,
    dockFlutuante: p.floatingDock ?? p.dockFlutuante ?? g.floatingDock ?? g.dockFlutuante,
    visualizador: p.viewer ?? p.visualizador ?? g.viewer ?? g.visualizador
  };
});

// Resolve todos os textos principais com prioridade para props.labels (EN/PT) e fallback no vue-i18n
const mergedLabels = computed(() => {
  const l = props.labels;
  const g = globalCertificadoOptions.value.labels;
  return {
    salvar: l?.save ?? l?.salvar ?? g?.save ?? g?.salvar ?? t('barraSuperior.salvar'),
    exportarPdf: l?.exportPdf ?? l?.exportarPdf ?? g?.exportPdf ?? g?.exportarPdf ?? t('barraSuperior.exportarPdf'),
    exportandoPdf: l?.exportingPdf ?? l?.exportandoPdf ?? g?.exportingPdf ?? g?.exportandoPdf ?? t('barraSuperior.exportandoPdf'),
    preVisualizar: l?.preview ?? l?.preVisualizar ?? g?.preview ?? g?.preVisualizar ?? t('barraSuperior.preVisualizar'),
    editandoDados: l?.editingData ?? l?.editandoDados ?? g?.editingData ?? g?.editandoDados ?? t('barraSuperior.editandoDados'),
    paisagem: l?.landscape ?? l?.paisagem ?? g?.landscape ?? g?.paisagem ?? t('barraSuperior.paisagem'),
    retrato: l?.portrait ?? l?.retrato ?? g?.portrait ?? g?.retrato ?? t('barraSuperior.retrato'),
    inserir: l?.insert ?? l?.inserir ?? g?.insert ?? g?.inserir ?? t('painelInserir.inserir'),
    camadas: l?.layers ?? l?.camadas ?? g?.layers ?? g?.camadas ?? t('camadasLista.camadas'),
    propriedades: l?.properties ?? l?.propriedades ?? g?.properties ?? g?.propriedades ?? t('inspetor.propriedades'),
    fundo: l?.background ?? l?.fundo ?? g?.background ?? g?.fundo ?? t('painelInserir.fundo'),
    enviarFundo: l?.uploadBackground ?? l?.enviarFundo ?? g?.uploadBackground ?? g?.enviarFundo ?? t('painelInserir.enviarFundo'),
    corFolha: l?.sheetColor ?? l?.corFolha ?? g?.sheetColor ?? g?.corFolha ?? t('painelInserir.corFolha'),
    removerFundo: l?.removeBackground ?? l?.removerFundo ?? g?.removeBackground ?? g?.removerFundo ?? t('painelInserir.removerFundo'),
    camposCertificado: l?.templateFields ?? l?.camposCertificado ?? g?.templateFields ?? g?.camposCertificado ?? t('painelInserir.camposCertificado'),
    semVariaveisCliente:
      l?.noClientVariables ??
      l?.semVariaveisCliente ??
      g?.noClientVariables ??
      g?.semVariaveisCliente ??
      t('painelInserir.semVariaveisCliente'),
    camadasLivres: l?.freeLayers ?? l?.camadasLivres ?? g?.freeLayers ?? g?.camadasLivres ?? t('painelInserir.camadasLivres'),
    textoLivre: l?.freeText ?? l?.textoLivre ?? g?.freeText ?? g?.textoLivre ?? t('painelInserir.textoLivre'),
    adicionarImagem: l?.addImage ?? l?.adicionarImagem ?? g?.addImage ?? g?.adicionarImagem ?? t('painelInserir.adicionarImagem'),
    adicionarMoldura: l?.addFrame ?? l?.adicionarMoldura ?? g?.addFrame ?? g?.adicionarMoldura ?? t('painelInserir.adicionarMoldura'),
    adicionarCirculo: l?.addCircle ?? l?.adicionarCirculo ?? g?.addCircle ?? g?.adicionarCirculo ?? t('painelInserir.adicionarCirculo'),
    adicionarLinha: l?.addLine ?? l?.adicionarLinha ?? g?.addLine ?? g?.adicionarLinha ?? t('painelInserir.adicionarLinha'),
    adicionarSeta: l?.addArrow ?? l?.adicionarSeta ?? g?.addArrow ?? g?.adicionarSeta ?? t('painelInserir.adicionarSeta'),
    adicionarQrCode: l?.addQrCode ?? l?.adicionarQrCode ?? g?.addQrCode ?? g?.adicionarQrCode ?? t('painelInserir.adicionarQrCode'),
    grade: l?.grid ?? l?.grade ?? g?.grid ?? g?.grade ?? t('palco.grade'),
    vazioInspetor: l?.emptyInspector ?? l?.vazioInspetor ?? g?.emptyInspector ?? g?.vazioInspetor ?? t('inspetor.vazioInspetor'),
    vazioCamadas: l?.emptyLayers ?? l?.vazioCamadas ?? g?.emptyLayers ?? g?.vazioCamadas ?? t('camadasLista.vazioCamadas')
  };
});

// Dimensões efetivas resolvidas para o formato e orientação atuais do template
const dimensoes = computed(() => resolverDimensoesTemplate(template.value));

// Objeto completo da camada atualmente selecionada ou null se nenhuma estiver ativa
const camadaSelecionada = computed<CamadaCertificado | null>(() => {
  if (!camadaSelecionadaId.value) return null;
  return template.value.camadas.find((c) => c.id === camadaSelecionadaId.value) || null;
});

// Lista de camadas em ordem inversa para exibição estilo Photoshop/Figma (topo = maior z-index)
const camadasInvertidas = computed(() =>
  [...template.value.camadas]
    .map((camada, indiceReal) => ({ camada, indiceReal }))
    .reverse()
);

watch(camadaSelecionada, (nova) => {
  emit('selecionar-camada', nova);
  emit('select-layer', nova);
});

// Flag interna para evitar loop de atualização quando o próprio editor emite update:modelValue
let atualizacaoInterna = false;

watch(
  () => props.modelValue,
  (novo) => {
    if (!novo) return;
    if (atualizacaoInterna) {
      atualizacaoInterna = false;
      return;
    }
    const serialNovo = JSON.stringify(novo);
    if (serialNovo === JSON.stringify(template.value)) return;
    const trocouTemplate = novo.id !== template.value.id;
    template.value = JSON.parse(serialNovo);
    if (trocouTemplate) {
      camadaSelecionadaId.value = null;
      iniciar(template.value);
    } else {
      registrar(template.value);
    }
  },
  { deep: true }
);

/*
 * Recebe: mensagem de erro.
 * Devolve: nada (void).
 * Por que é usada: emite o evento de erro simultaneamente em português ('erro') e inglês ('error').
 */
function emitirErro(mensagem: string): void {
  emit('erro', mensagem);
  emit('error', mensagem);
}

/*
 * Recebe: nenhum parâmetro.
 * Devolve: nada (void).
 * Por que é usada: emite o template salvo simultaneamente nos eventos 'salvar' e 'save'.
 */
function emitirSalvar(): void {
  const copia = JSON.parse(JSON.stringify(template.value)) as TemplateCertificado;
  emit('salvar', copia);
  emit('save', copia);
}

/*
 * Recebe: nenhum parâmetro.
 * Devolve: nada (void).
 * Por que é usada: salva um snapshot no histórico (Ctrl+Z) e sincroniza o v-model com o componente pai.
 */
function confirmarAlteracao(): void {
  registrar(template.value);
  atualizacaoInterna = true;
  emit('update:modelValue', JSON.parse(JSON.stringify(template.value)));
}

/*
 * Recebe: novo formato de folha selecionado (ex.: 'a4', 'cracha', 'custom').
 * Devolve: nada (void).
 * Por que é usada: aplica o preset de formato selecionado e recalcula a largura e altura da folha.
 */
function selecionarFormatoFolha(novoFormato: FormatoFolha): void {
  template.value.formato = novoFormato;
  const novasDimensoes = obterDimensoesPorFormato(
    novoFormato,
    template.value.orientacao,
    template.value.largura,
    template.value.altura
  );
  template.value.largura = novasDimensoes.largura;
  template.value.altura = novasDimensoes.altura;
  confirmarAlteracao();
}

/*
 * Recebe: largura e altura numéricas em pixels.
 * Devolve: nada (void).
 * Por que é usada: define dimensões customizadas na folha e ajusta automaticamente a orientação.
 */
function alterarDimensoesFolha(largura: number, altura: number): void {
  const l = Math.max(120, Math.round(largura));
  const a = Math.max(120, Math.round(altura));
  template.value.formato = 'custom';
  template.value.largura = l;
  template.value.altura = a;
  template.value.orientacao = l >= a ? 'landscape' : 'portrait';
  confirmarAlteracao();
}

/*
 * Recebe: nova orientação ('landscape' ou 'portrait').
 * Devolve: nada (void).
 * Por que é usada: inverte entre Paisagem e Retrato ajustando as dimensões do formato atual.
 */
function alternarOrientacaoFolha(nova: OrientacaoCertificado): void {
  const formato = template.value.formato;
  template.value.orientacao = nova;

  if (formato === 'custom' && template.value.largura && template.value.altura) {
    const lAtual = template.value.largura;
    const aAtual = template.value.altura;
    template.value.largura = aAtual;
    template.value.altura = lAtual;
  } else if (formato && formato !== 'a4') {
    const dim = obterDimensoesPorFormato(formato, nova);
    template.value.largura = dim.largura;
    template.value.altura = dim.altura;
  } else if (template.value.largura && template.value.altura) {
    const dim = obterDimensoesPorFormato('a4', nova);
    template.value.largura = dim.largura;
    template.value.altura = dim.altura;
  }

  confirmarAlteracao();
}

/*
 * Recebe: nenhum parâmetro.
 * Devolve: nada (void).
 * Por que é usada: restaura o estado anterior da pilha de histórico (Ctrl+Z).
 */
function acaoDesfazer(): void {
  const anterior = desfazer();
  if (!anterior) return;
  template.value = anterior;
  if (
    camadaSelecionadaId.value &&
    !template.value.camadas.some((c) => c.id === camadaSelecionadaId.value)
  ) {
    camadaSelecionadaId.value = null;
  }
  atualizacaoInterna = true;
  emit('update:modelValue', JSON.parse(JSON.stringify(template.value)));
}

/*
 * Recebe: nenhum parâmetro.
 * Devolve: nada (void).
 * Por que é usada: avança um estado na pilha de histórico (Ctrl+Y).
 */
function acaoRefazer(): void {
  const proximo = refazer();
  if (!proximo) return;
  template.value = proximo;
  atualizacaoInterna = true;
  emit('update:modelValue', JSON.parse(JSON.stringify(template.value)));
}

/*
 * Recebe: ID da camada a selecionar ou null para limpar a seleção.
 * Devolve: nada (void).
 * Por que é usada: define qual camada está ativa para edição no inspetor e no palco.
 */
function selecionarCamada(id: string | null): void {
  camadaSelecionadaId.value = id;
}

/*
 * Recebe: nenhum parâmetro.
 * Devolve: nada (void).
 * Por que é usada: clona a camada selecionada deslocando sua posição em 20px (Ctrl+D).
 */
function duplicarCamadaSelecionada(): void {
  if (!camadaSelecionada.value) return;
  const copia = duplicarCamada(camadaSelecionada.value);
  template.value.camadas.push(copia);
  camadaSelecionadaId.value = copia.id;
  confirmarAlteracao();
}

/*
 * Recebe: nenhum parâmetro.
 * Devolve: nada (void).
 * Por que é usada: remove a camada selecionada do template (Delete / Backspace).
 */
function excluirCamadaSelecionada(): void {
  if (!camadaSelecionadaId.value) return;
  template.value.camadas = template.value.camadas.filter((c) => c.id !== camadaSelecionadaId.value);
  camadaSelecionadaId.value = null;
  confirmarAlteracao();
}

/*
 * Recebe: eixo de alinhamento na folha ('esquerda', 'centro-h', 'direita', 'topo', 'centro-v', 'base').
 * Devolve: nada (void).
 * Por que é usada: posiciona a camada selecionada alinhada à borda ou centro da folha.
 */
function alinharNaFolha(eixo: EixoAlinhamentoFolha): void {
  if (alinharCamadaNoEixoFolha(camadaSelecionada.value, eixo, dimensoes.value)) {
    confirmarAlteracao();
  }
}

/*
 * Recebe: uma das 9 posições da matriz 3x3 da folha.
 * Devolve: nada (void).
 * Por que é usada: posiciona a camada selecionada diretamente no ponto correspondente da grade 3x3.
 */
function alinharNaGrade3x3Folha(posicao: PosicaoGrade3x3): void {
  if (alinharCamadaNaGrade3x3Folha(camadaSelecionada.value, posicao, dimensoes.value)) {
    confirmarAlteracao();
  }
}

/*
 * Recebe: conteúdo textual inicial, nome da camada e flag indicando se é variável fixa.
 * Devolve: nada (void).
 * Por que é usada: insere uma nova camada de texto livre ou variável no centro da folha.
 */
function adicionarTexto(texto: string, nome: string, ehVariavel: boolean): void {
  const nova = criarCamadaTexto({
    texto,
    nome,
    ehVariavel,
    orientacao: dimensoes.value,
    fonte: listaFontes.value[0]
  });
  template.value.camadas.push(nova);
  camadaSelecionadaId.value = nova.id;
  confirmarAlteracao();
}

/*
 * Recebe: nenhum parâmetro.
 * Devolve: nada (void).
 * Por que é usada: insere uma nova camada de moldura/retângulo no palco.
 */
function adicionarMoldura(): void {
  const nova = criarCamadaMoldura(dimensoes.value);
  template.value.camadas.push(nova);
  camadaSelecionadaId.value = nova.id;
  confirmarAlteracao();
}

/*
 * Recebe: nenhum parâmetro.
 * Devolve: nada (void).
 * Por que é usada: insere uma nova camada de círculo/elipse no centro da folha.
 */
function adicionarCirculo(): void {
  const nova = criarCamadaCirculo(dimensoes.value);
  template.value.camadas.push(nova);
  camadaSelecionadaId.value = nova.id;
  confirmarAlteracao();
}

/*
 * Recebe: nenhum parâmetro.
 * Devolve: nada (void).
 * Por que é usada: insere uma nova camada de linha reta horizontal no centro da folha.
 */
function adicionarLinha(): void {
  const nova = criarCamadaLinha(dimensoes.value);
  template.value.camadas.push(nova);
  camadaSelecionadaId.value = nova.id;
  confirmarAlteracao();
}

/*
 * Recebe: direção inicial da ponta da seta ('direita', 'esquerda' ou 'ambas').
 * Devolve: nada (void).
 * Por que é usada: insere uma nova camada de seta direcional vetorial no palco.
 */
function adicionarSeta(pontaSeta: DirecaoPontaSeta = 'direita'): void {
  const nova = criarCamadaSeta(dimensoes.value, pontaSeta);
  template.value.camadas.push(nova);
  camadaSelecionadaId.value = nova.id;
  confirmarAlteracao();
}

/*
 * Recebe: URL ou texto padrão para codificação inicial do QR Code.
 * Devolve: nada (void).
 * Por que é usada: insere uma camada de QR Code de validação no canto inferior direito da folha.
 */
function adicionarQrCode(conteudoQr = 'https://vue-template-studio.dev'): void {
  const nova = criarCamadaQrCode(dimensoes.value, conteudoQr);
  template.value.camadas.push(nova);
  camadaSelecionadaId.value = nova.id;
  confirmarAlteracao();
}

/*
 * Recebe: modo de exibição do link ('url' ou 'texto') e texto personalizado opcional.
 * Devolve: nada (void).
 * Por que é usada: insere uma camada clicável vinculada à variável especial {{link_qrcode}} do QR Code.
 */
function adicionarLinkQrCode(
  modoExibicao: ModoExibicaoLink = 'url',
  textoPersonalizado = ''
): void {
  const nova = criarCamadaLinkQrCode({
    orientacao: dimensoes.value,
    modoExibicao,
    textoPersonalizado,
    fonte: listaFontes.value[0]
  });
  template.value.camadas.push(nova);
  camadaSelecionadaId.value = nova.id;
  confirmarAlteracao();
}

/*
 * Recebe: evento de seleção de arquivo e o destino ('fundo' ou 'camada').
 * Devolve: nada (void).
 * Por que é usada: valida o tamanho do arquivo de imagem, converte para Data URL e aplica no fundo ou cria camada de imagem.
 */
function carregarArquivoImagem(evento: Event, destino: 'fundo' | 'camada'): void {
  const input = evento.target as HTMLInputElement;
  const arquivo = input.files?.[0];
  if (!arquivo) return;

  const limiteBytes = limiteUploadMb.value * 1024 * 1024;
  if (arquivo.size > limiteBytes) {
    emitirErro(t('erros.imagemExcedeLimite', { limite: limiteUploadMb.value }));
    input.value = '';
    return;
  }

  const leitor = new FileReader();
  leitor.onload = (e) => {
    const src = String(e.target?.result || '');
    if (!src) {
      emitirErro(t('erros.falhaLerImagem'));
      return;
    }
    if (destino === 'fundo') {
      template.value.fundoImagem = src;
      confirmarAlteracao();
    } else {
      const nomeLimpo = arquivo.name.replace(/\.[^.]+$/, '');
      const nova = criarCamadaImagem(src, nomeLimpo, dimensoes.value);
      template.value.camadas.push(nova);
      camadaSelecionadaId.value = nova.id;
      confirmarAlteracao();
    }
  };
  leitor.onerror = () => {
    emitirErro(t('erros.erroCarregarImagem'));
  };
  leitor.readAsDataURL(arquivo);
  input.value = '';
}

/*
 * Recebe: ID da camada e deslocamento relativo (+1, -1, 'frente' ou 'tras').
 * Devolve: nada (void).
 * Por que é usada: altera a ordem z-index de uma camada pelos botões rápidos da lista.
 */
function moverCamada(id: string, deslocamento: number | 'frente' | 'tras'): void {
  if (moverCamadaPorId(template.value.camadas, id, deslocamento)) {
    confirmarAlteracao();
  }
}

/*
 * Recebe: índice visual de origem e índice visual de destino na lista invertida.
 * Devolve: nada (void).
 * Por que é usada: conclui a reordenação de camadas por drag-and-drop e registra no histórico.
 */
function reordenarPorDrag(indiceOrigem: number, indiceDestino: number): void {
  if (reordenarCamadaListaInvertida(template.value.camadas, indiceOrigem, indiceDestino)) {
    confirmarAlteracao();
  }
}

// Composable explícito de Atalhos (Espaço, Alt, Setas, Ctrl+Z/Y/D, Delete, Ctrl+Scroll)
const {
  espacoPressionado,
  altPressionado,
  sincronizarAltPorEvento,
  registrarListenersAtalhos,
  removerListenersAtalhos
} = gerenciadorDeAtalhos({
  camadaSelecionada,
  modoPreview,
  zoom,
  panX,
  panY,
  aoDesfazer: acaoDesfazer,
  aoRefazer: acaoRefazer,
  aoDuplicar: duplicarCamadaSelecionada,
  aoExcluir: excluirCamadaSelecionada,
  aoConfirmarAlteracao: confirmarAlteracao,
  aoCancelarPan: () => cancelarPan()
});

// Composable explícito de Palco (Pan, Arraste com Snap, Redimensionamento e Medidas Alt)
const {
  arrastandoPalco,
  guiaXVisivel,
  guiaYVisivel,
  medidasAlt,
  definirCamadaHoverAlt,
  atualizarHoverPorCoordenadaFolha,
  cancelarPan,
  aoClicarPalco,
  iniciarArrasteCamada,
  iniciarRedimensionamentoCamada,
  iniciarRotacaoCamada,
  registrarListenersPalco,
  removerListenersPalco
} = gerenciadorDePalco({
  camadas: computed(() => template.value.camadas),
  camadaSelecionadaId,
  camadaSelecionada,
  modoPreview,
  espacoPressionado,
  altPressionado,
  zoom,
  panX,
  panY,
  dimensoesFolha: dimensoes,
  aoConfirmarAlteracao: confirmarAlteracao
});

/*
 * Recebe: nenhum parâmetro.
 * Devolve: Promise<void>.
 * Por que é usada: renderiza o template em alta resolução, baixa o PDF e emite os eventos 'exportar' e 'export'.
 */
async function exportarAgora(): Promise<void> {
  if (exportando.value) return;
  exportando.value = true;
  try {
    const dadosParaExportar = modoPreview.value ? dadosPreviewEfetivos.value : {};
    const resultado = await gerarPacoteExportacao(template.value, dadosParaExportar);
    baixarPdf(resultado);
    const pacoteEvento: PacoteEventoExportacao = {
      imagemDataUrl: resultado.imagemDataUrl,
      imageDataUrl: resultado.imagemDataUrl,
      pdfBlob: resultado.pdfBlob,
      nomeArquivo: resultado.nomeArquivo,
      fileName: resultado.nomeArquivo
    };
    emit('exportar', pacoteEvento);
    emit('export', pacoteEvento);
  } catch {
    emitirErro(t('erros.falhaGerarPdf'));
  } finally {
    exportando.value = false;
  }
}

// Referência ao elemento DOM do palco com listeners de atalhos registrados
let elementoPalcoRegistrado: HTMLElement | null = null;

onMounted(() => {
  iniciar(template.value);
  elementoPalcoRegistrado = palcoComponenteRef.value?.elementoPalcoRef ?? null;
  registrarListenersAtalhos(elementoPalcoRegistrado);
  registrarListenersPalco();
});

onBeforeUnmount(() => {
  removerListenersAtalhos(elementoPalcoRegistrado);
  removerListenersPalco();
});

defineExpose({
  // Propriedades e métodos em português
  zoom,
  dimensoes,
  variaveisUsadas,
  dadosPreviewEfetivos,
  acaoDesfazer,
  acaoRefazer,
  exportarAgora,
  duplicarCamadaSelecionada,
  excluirCamadaSelecionada,
  selecionarCamada,
  selecionarFormatoFolha,
  alterarDimensoesFolha,
  alternarOrientacaoFolha,
  alinharNaFolha,
  alinharNaGrade3x3Folha,
  adicionarTexto,
  adicionarMoldura,
  adicionarCirculo,
  adicionarLinha,
  adicionarSeta,
  adicionarQrCode,
  adicionarLinkQrCode,
  // Equivalentes em inglês
  dimensions: dimensoes,
  usedVariables: variaveisUsadas,
  effectivePreviewData: dadosPreviewEfetivos,
  undo: acaoDesfazer,
  redo: acaoRefazer,
  exportNow: exportarAgora,
  duplicateSelectedLayer: duplicarCamadaSelecionada,
  deleteSelectedLayer: excluirCamadaSelecionada,
  selectLayer: selecionarCamada,
  selectSheetFormat: selecionarFormatoFolha,
  setSheetDimensions: alterarDimensoesFolha,
  toggleSheetOrientation: alternarOrientacaoFolha,
  alignOnSheet: alinharNaFolha,
  alignOnSheetGrid3x3: alinharNaGrade3x3Folha,
  addText: adicionarTexto,
  addFrame: adicionarMoldura,
  addCircle: adicionarCirculo,
  addLine: adicionarLinha,
  addArrow: adicionarSeta,
  addQrCode: adicionarQrCode,
  addQrCodeLink: adicionarLinkQrCode
});
</script>

<template>
  <div
    :class="[
      !isUnstyled && 'vc-estudio',
      !isUnstyled && temaEfetivo === 'light' && 'is-light',
      mergedClasses.root
    ]"
  >
    <BarraSuperiorEditor
      :template="template"
      :pode-desfazer="podeDesfazer"
      :pode-refazer="podeRefazer"
      :modo-preview="modoPreview"
      :exportando="exportando"
      :is-unstyled="isUnstyled"
      :exibir-seletor-idioma="mostrarSeletorIdioma"
      :classe-topo="mergedClasses.topo"
      :labels="mergedLabels"
      @confirmar-alteracao="confirmarAlteracao"
      @desfazer="acaoDesfazer"
      @refazer="acaoRefazer"
      @selecionar-formato="selecionarFormatoFolha"
      @alterar-dimensoes="alterarDimensoesFolha"
      @alternar-orientacao="alternarOrientacaoFolha"
      @alternar-preview="modoPreview = !modoPreview"
      @salvar="emitirSalvar"
      @exportar="exportarAgora"
    >
      <template #topo-acoes="slotProps">
        <slot name="topo-acoes" v-bind="slotProps" />
        <slot name="top-actions" v-bind="slotProps" />
      </template>
    </BarraSuperiorEditor>

    <div :class="[!isUnstyled && 'vc-workspace', mergedClasses.workspace]">
      <PainelInsercaoElementos
        :template="template"
        :minimizado="painelEsquerdoMinimizado"
        :is-unstyled="isUnstyled"
        :classe-dock-esquerdo="mergedClasses.dockEsquerdo"
        :lista-variaveis="listaVariaveis"
        :pode-criar-variavel="podeCriarVariavel"
        :tem-qr-code="temQrCode"
        :labels="mergedLabels"
        @alternar-minimizado="painelEsquerdoMinimizado = !painelEsquerdoMinimizado"
        @confirmar-alteracao="confirmarAlteracao"
        @upload-imagem="carregarArquivoImagem"
        @adicionar-texto="adicionarTexto"
        @adicionar-moldura="adicionarMoldura"
        @adicionar-circulo="adicionarCirculo"
        @adicionar-linha="adicionarLinha"
        @adicionar-seta="() => adicionarSeta('direita')"
        @adicionar-qrcode="() => adicionarQrCode()"
        @adicionar-link-qrcode="adicionarLinkQrCode"
      >
        <template v-if="$slots['painel-inserir'] || $slots['insert-panel']" #painel-inserir="slotProps">
          <slot name="painel-inserir" v-bind="slotProps" />
          <slot name="insert-panel" v-bind="slotProps" />
        </template>
      </PainelInsercaoElementos>

      <PalcoCanvasCertificado
        ref="palcoComponenteRef"
        :template="template"
        :dimensoes="dimensoes"
        :camada-selecionada-id="camadaSelecionadaId"
        :camada-selecionada="camadaSelecionada"
        :dados-preview-efetivos="dadosPreviewEfetivos"
        :modo-preview="modoPreview"
        :mostrar-grade="mostrarGrade"
        :zoom="zoom"
        :pan-x="panX"
        :pan-y="panY"
        :espaco-pressionado="espacoPressionado"
        :arrastando-palco="arrastandoPalco"
        :guia-x-visivel="guiaXVisivel"
        :guia-y-visivel="guiaYVisivel"
        :medidas-alt="medidasAlt"
        :is-unstyled="isUnstyled"
        :classe-canvas-palco="mergedClasses.canvasPalco"
        :classe-folha="mergedClasses.folha"
        :classe-dock-flutuante="mergedClasses.dockFlutuante"
        :label-grade="mergedLabels.grade"
        @clicar-palco="aoClicarPalco"
        @iniciar-arraste="iniciarArrasteCamada"
        @iniciar-redimensionar="iniciarRedimensionamentoCamada"
        @iniciar-rotacao="iniciarRotacaoCamada"
        @hover-camada="definirCamadaHoverAlt"
        @mover-mouse-folha="(x, y, alt) => { sincronizarAltPorEvento(alt); atualizarHoverPorCoordenadaFolha(x, y); }"
        @alternar-grade="mostrarGrade = !mostrarGrade"
        @alterar-zoom="(novo) => { zoom = novo; }"
      />

      <aside
        :class="[
          !isUnstyled && 'vc-dock-dir',
          painelDireitoMinimizado && 'minimizado',
          mergedClasses.dockDireito
        ]"
      >
        <div class="vc-painel-cabecalho">
          <span v-if="!painelDireitoMinimizado">{{ mergedLabels.propriedades }}</span>
          <button
            type="button"
            class="vc-collapse-btn"
            @click="painelDireitoMinimizado = !painelDireitoMinimizado"
            :title="painelDireitoMinimizado ? t('inspetor.expandirPainelDireito') : t('inspetor.minimizarPainelDireito')"
            :aria-label="t('inspetor.alternarPainelDireitoAria')"
            data-testid="btn-alternar-painel-direito"
          >
            <component :is="painelDireitoMinimizado ? icons.panel.chevronLeft : icons.panel.chevronRight" />
          </button>
        </div>

        <div
          v-if="painelDireitoMinimizado"
          class="vc-dock-vertical-label"
          @click="painelDireitoMinimizado = false"
        >
          {{ mergedLabels.propriedades }} &amp; {{ mergedLabels.camadas }}
        </div>

        <template v-else>
          <PainelPropriedadesFigma
            :camada-selecionada="camadaSelecionada"
            :dimensoes-folha="dimensoes"
            :minimizado="propriedadesMinimizado"
            :lista-fontes="listaFontes"
            :lista-variaveis="listaVariaveisInspetor"
            :chaves-extras-validas="chavesExtrasValidas"
            :tem-qr-code="temQrCode"
            :vazio-inspetor="mergedLabels.vazioInspetor"
            :classe-inspetor="mergedClasses.inspetor"
            @alternar-minimizado="propriedadesMinimizado = !propriedadesMinimizado"
            @confirmar-alteracao="confirmarAlteracao"
            @duplicar="duplicarCamadaSelecionada"
            @excluir="excluirCamadaSelecionada"
            @alinhar-eixo-folha="alinharNaFolha"
            @alinhar-grade-folha="alinharNaGrade3x3Folha"
          >
            <template v-if="$slots.vazio || $slots.empty" #vazio>
              <slot name="vazio" />
              <slot name="empty" />
            </template>
            <template v-if="$slots.inspetor || $slots.inspector" #inspetor="slotProps">
              <slot name="inspetor" v-bind="slotProps" />
              <slot name="inspector" v-bind="slotProps" />
            </template>
          </PainelPropriedadesFigma>

          <PainelCamadasLista
            :camadas-invertidas="camadasInvertidas"
            :total-camadas="template.camadas.length"
            :camada-selecionada-id="camadaSelecionadaId"
            :minimizado="camadasMinimizado"
            :label-camadas="mergedLabels.camadas"
            :vazio-camadas="mergedLabels.vazioCamadas"
            :classe-painel-camadas="mergedClasses.painelCamadas"
            @alternar-minimizado="camadasMinimizado = !camadasMinimizado"
            @selecionar-camada="selecionarCamada"
            @mover-camada="moverCamada"
            @reordenar-drag="reordenarPorDrag"
            @confirmar-alteracao="confirmarAlteracao"
          >
            <template v-if="$slots.camadas || $slots.layers" #camadas="slotProps">
              <slot name="camadas" v-bind="slotProps" />
              <slot name="layers" v-bind="slotProps" />
            </template>
          </PainelCamadasLista>
        </template>
      </aside>
    </div>
  </div>
</template>

<style lang="scss">
@use '../styles/certificado.scss';
</style>
