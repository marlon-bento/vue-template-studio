<!--
========
Componente visualizador e emissor de templates (src/components/TemplateStudioViewer.vue).
Carrega um template pronto, detecta as variáveis existentes, aplica os dados enviados pelo cliente,
entrega a imagem de pré-visualização sanitizada e o PDF final, aceitando props, eventos, slots e
métodos tanto em inglês (para adoção no npm) quanto em português.
========
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type {
  CertificadoClasses,
  CertificadoLabels,
  DadosCertificado,
  ResultadoExportacao,
  TemplateCertificado
} from '../types/certificado';
import {
  extrairVariaveisTemplate,
  gerenciadorDeCertificado,
  globalCertificadoOptions
} from '../composables/gerenciadorDeCertificado';
import { sanitizarUrlImagemPreview } from '../utils/variaveis';
import {
  definirIdioma,
  registrarIdiomasCustomizados,
  usarI18nCertificado,
  type MensagensIdiomaParcial
} from '../i18n';
import LocaleSwitcher from './LocaleSwitcher.vue';
import { buildIcons } from '../utils/svgFactory';
import { svgs } from '../styles/svgs';

const icons = buildIcons(svgs);

export interface Props {
  template: TemplateCertificado;
  // Props em inglês (primárias para npm)
  data?: DadosCertificado;
  fileName?: string;
  generateOnMount?: boolean;
  theme?: 'dark' | 'light';
  unstyled?: boolean;
  locale?: string;
  localeMessages?: Record<string, MensagensIdiomaParcial>;
  showLocaleSwitcher?: boolean;
  labels?: CertificadoLabels;
  classes?: CertificadoClasses;
  // Props equivalentes em português (retrocompatibilidade total)
  dados?: DadosCertificado;
  nomeArquivo?: string;
  gerarImagemAoMontar?: boolean;
  tema?: 'dark' | 'light';
  mensagensIdioma?: Record<string, MensagensIdiomaParcial>;
  exibirSeletorIdioma?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  data: undefined,
  fileName: undefined,
  generateOnMount: undefined,
  theme: undefined,
  unstyled: undefined,
  locale: undefined,
  localeMessages: undefined,
  showLocaleSwitcher: undefined,
  labels: undefined,
  classes: undefined,
  dados: undefined,
  nomeArquivo: undefined,
  gerarImagemAoMontar: undefined,
  tema: undefined,
  mensagensIdioma: undefined,
  exibirSeletorIdioma: undefined
});

const emit = defineEmits<{
  // Eventos em inglês e português
  'image-generated': [dataUrl: string];
  'imagem-gerada': [dataUrl: string];
  'pdf-generated': [resultado: ResultadoExportacao];
  'pdf-gerado': [resultado: ResultadoExportacao];
  'variables-detected': [variaveis: string[]];
  'variaveis-detectadas': [variaveis: string[]];
  'error': [mensagem: string];
  'erro': [mensagem: string];
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

// Dicionário de dados dinâmicos resolvido entre data (inglês) e dados (português)
const dadosEfetivos = computed<DadosCertificado>(() => props.data ?? props.dados ?? {});

// Flag indicando se deve gerar a imagem de preview automaticamente ao montar
const deveGerarAoMontar = computed<boolean>(
  () => props.generateOnMount ?? props.gerarImagemAoMontar ?? true
);

// URL bruta gerada pelo renderizador Canvas 2D para exibição do preview
const imagemPreviewUrl = ref<string>('');

// Indica se o componente está renderizando a imagem ou gerando o PDF no momento
const processando = ref<boolean>(false);

// Contador incremental para descartar renderizações antigas e evitar condição de corrida
let sequenciaRender = 0;

// Garante que apenas URLs seguras (data:image/... ou blob:...) sejam injetadas no atributo src
const imagemPreviewSeguraUrl = computed(() =>
  sanitizarUrlImagemPreview(imagemPreviewUrl.value)
);

const { gerarImagemPreview, gerarPacoteExportacao, baixarPdf, baixarImagem } =
  gerenciadorDeCertificado();

// Lista de chaves de variáveis detectadas nas camadas do template atual
const variaveisTemplate = computed(() => extrairVariaveisTemplate(props.template));

/*
 * Recebe: chave de uma variável (ex.: 'student_name' ou 'nome_aluno').
 * Devolve: verdadeiro se a variável existir no template ou falso caso contrário.
 * Por que é usada: permite ao componente pai renderizar inputs apenas para variáveis usadas no template.
 */
function temVariavel(chave: string): boolean {
  return variaveisTemplate.value.includes(chave);
}

watch(
  variaveisTemplate,
  (novas) => {
    emit('variaveis-detectadas', novas);
    emit('variables-detected', novas);
  },
  { immediate: true }
);

// Define se o visualizador está em modo sem estilo padrão (headless)
const isUnstyled = computed(
  () => props.unstyled ?? globalCertificadoOptions.value.unstyled ?? false
);

// Define o tema visual efetivo ('dark' ou 'light')
const temaEfetivo = computed(
  () =>
    props.theme ??
    props.tema ??
    globalCertificadoOptions.value.theme ??
    globalCertificadoOptions.value.tema ??
    'dark'
);

// Define se o seletor de idioma (LocaleSwitcher) deve ser exibido na barra do visualizador
const mostrarSeletorIdioma = computed(
  () =>
    props.showLocaleSwitcher ??
    props.exibirSeletorIdioma ??
    globalCertificadoOptions.value.showLocaleSwitcher ??
    globalCertificadoOptions.value.exibirSeletorIdioma ??
    false
);

// Mescla classes CSS customizadas aceitando chaves em inglês e português
const mergedClasses = computed<CertificadoClasses>(() => {
  const g = globalCertificadoOptions.value.classes || {};
  const p = props.classes || {};
  return {
    ...g,
    ...p,
    visualizador: p.viewer ?? p.visualizador ?? g.viewer ?? g.visualizador
  };
});

// Resolve os textos da barra do visualizador com prioridade para props.labels (EN/PT) e fallback no vue-i18n
const mergedLabels = computed(() => {
  const l = props.labels;
  const g = globalCertificadoOptions.value.labels;
  return {
    atualizarPreview:
      l?.updatePreview ??
      l?.atualizarPreview ??
      g?.updatePreview ??
      g?.atualizarPreview ??
      t('visualizador.atualizarPreview'),
    baixarPdf:
      l?.downloadPdf ??
      l?.baixarPdf ??
      g?.downloadPdf ??
      g?.baixarPdf ??
      t('visualizador.baixarPdf'),
    renderizando:
      l?.rendering ??
      l?.renderizando ??
      g?.rendering ??
      g?.renderizando ??
      t('visualizador.renderizando'),
    exportandoPdf:
      l?.exportingPdf ??
      l?.exportandoPdf ??
      g?.exportingPdf ??
      g?.exportandoPdf ??
      t('visualizador.exportandoPdf')
  };
});

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
 * Devolve: string com o nome base para o arquivo PDF/PNG exportado.
 * Por que é usada: monta um nome de arquivo legível combinando o nome do template e o primeiro dado preenchido.
 */
function resolverNomeBaseArquivo(): string {
  const nomeExplicito = props.fileName ?? props.nomeArquivo;
  if (nomeExplicito && nomeExplicito.trim()) {
    return nomeExplicito.trim();
  }
  const chavesCandidatas =
    variaveisTemplate.value.length > 0
      ? variaveisTemplate.value
      : Object.keys(dadosEfetivos.value || {});

  const primeiraChaveValida = chavesCandidatas.find((chave) => {
    const val = dadosEfetivos.value?.[chave];
    return (
      val !== undefined &&
      val !== null &&
      String(val).trim() !== '' &&
      !String(val).startsWith('http')
    );
  });

  const sufixo = primeiraChaveValida
    ? String(dadosEfetivos.value[primeiraChaveValida])
    : 'certificado';
  return `${props.template.nome}_${sufixo}`;
}

/*
 * Recebe: nenhum parâmetro.
 * Devolve: Promise<string> contendo a Data URL PNG segura gerada.
 * Por que é usada: atualiza a imagem de pré-visualização protegendo contra condições de corrida e URLs inseguras.
 */
async function atualizarPreviewImagem(): Promise<string> {
  const idAtual = ++sequenciaRender;
  processando.value = true;
  try {
    const urlBruta = await gerarImagemPreview(props.template, dadosEfetivos.value);
    if (idAtual !== sequenciaRender) return sanitizarUrlImagemPreview(urlBruta);
    const urlSegura = sanitizarUrlImagemPreview(urlBruta);
    if (!urlSegura) {
      imagemPreviewUrl.value = '';
      emitirErro(t('erros.urlPreviewInvalida'));
      return '';
    }
    imagemPreviewUrl.value = urlSegura;
    emit('imagem-gerada', urlSegura);
    emit('image-generated', urlSegura);
    return urlSegura;
  } catch {
    if (idAtual === sequenciaRender) {
      emitirErro(t('erros.falhaRenderizarImagem'));
    }
    return '';
  } finally {
    if (idAtual === sequenciaRender) {
      processando.value = false;
    }
  }
}

/*
 * Recebe: flag booleana indicando se o download no navegador deve ser disparado automaticamente.
 * Devolve: Promise<ResultadoExportacao | null> com os blobs e metadados gerados.
 * Por que é usada: renderiza o PDF final na orientação e dimensões do template e inicia o download opcional.
 */
async function exportarPdf(baixarAutomaticamente = true): Promise<ResultadoExportacao | null> {
  processando.value = true;
  try {
    const resultado = await gerarPacoteExportacao(props.template, dadosEfetivos.value, {
      nomeArquivo: resolverNomeBaseArquivo()
    });
    const urlSegura = sanitizarUrlImagemPreview(resultado.imagemDataUrl);
    if (urlSegura) {
      imagemPreviewUrl.value = urlSegura;
    }
    if (baixarAutomaticamente) {
      baixarPdf(resultado);
    }
    emit('pdf-gerado', resultado);
    emit('pdf-generated', resultado);
    return resultado;
  } catch {
    emitirErro(t('erros.falhaGerarPdfCertificado'));
    return null;
  } finally {
    processando.value = false;
  }
}

/*
 * Recebe: nenhum parâmetro.
 * Devolve: Promise<ResultadoExportacao | null> com os dados da imagem PNG exportada.
 * Por que é usada: gera o pacote de alta resolução e baixa a imagem PNG diretamente no navegador.
 */
async function exportarImagem(): Promise<ResultadoExportacao | null> {
  processando.value = true;
  try {
    const resultado = await gerarPacoteExportacao(props.template, dadosEfetivos.value, {
      nomeArquivo: resolverNomeBaseArquivo()
    });
    const urlSegura = sanitizarUrlImagemPreview(resultado.imagemDataUrl);
    if (urlSegura) {
      imagemPreviewUrl.value = urlSegura;
    }
    baixarImagem(resultado);
    return resultado;
  } catch {
    emitirErro(t('erros.falhaGerarImagemCertificado'));
    return null;
  } finally {
    processando.value = false;
  }
}

watch(
  () => [props.template, dadosEfetivos.value],
  () => {
    if (deveGerarAoMontar.value) {
      atualizarPreviewImagem();
    }
  },
  { deep: true, immediate: true }
);

defineExpose({
  // Propriedades e métodos em português
  imagemPreviewUrl,
  imagemPreviewSeguraUrl,
  variaveisTemplate,
  temVariavel,
  atualizarPreviewImagem,
  exportarPdf,
  exportarImagem,
  // Equivalentes em inglês
  previewImageUrl: imagemPreviewUrl,
  safePreviewImageUrl: imagemPreviewSeguraUrl,
  templateVariables: variaveisTemplate,
  hasVariable: temVariavel,
  updatePreviewImage: atualizarPreviewImagem,
  exportPdf: exportarPdf,
  exportImage: exportarImagem
});
</script>

<template>
  <div
    :class="[
      !isUnstyled && 'vc-visualizador',
      !isUnstyled && temaEfetivo === 'light' && 'is-light',
      mergedClasses.visualizador
    ]"
  >
    <slot
      name="barra"
      :processando="processando"
      :processing="processando"
      :variaveis="variaveisTemplate"
      :variables="variaveisTemplate"
      :tem-variavel="temVariavel"
      :has-variable="temVariavel"
      :atualizar-preview="atualizarPreviewImagem"
      :update-preview="atualizarPreviewImagem"
      :exportar-pdf="exportarPdf"
      :export-pdf="exportarPdf"
      :exportar-imagem="exportarImagem"
      :export-image="exportarImagem"
    >
      <slot
        name="toolbar"
        :processando="processando"
        :processing="processando"
        :variaveis="variaveisTemplate"
        :variables="variaveisTemplate"
        :tem-variavel="temVariavel"
        :has-variable="temVariavel"
        :atualizar-preview="atualizarPreviewImagem"
        :update-preview="atualizarPreviewImagem"
        :exportar-pdf="exportarPdf"
        :export-pdf="exportarPdf"
        :exportar-imagem="exportarImagem"
        :export-image="exportarImagem"
      >
        <div class="vc-vis-barra">
          <button type="button" :disabled="processando" @click="atualizarPreviewImagem" class="vc-vis-btn" data-testid="btn-atualizar-preview">
            <component :is="icons.viewer.refresh" />
            <span>{{ processando ? mergedLabels.renderizando : mergedLabels.atualizarPreview }}</span>
          </button>
          <button type="button" :disabled="processando" @click="exportarPdf(true)" class="vc-vis-btn vc-vis-btn-pdf" data-testid="btn-baixar-pdf">
            <component :is="icons.topBar.exportPdf" />
            <span>{{ processando ? mergedLabels.exportandoPdf : mergedLabels.baixarPdf }}</span>
          </button>
          <LocaleSwitcher v-if="mostrarSeletorIdioma" />
        </div>
      </slot>
    </slot>

    <slot
      name="campos"
      :variaveis="variaveisTemplate"
      :variables="variaveisTemplate"
      :tem-variavel="temVariavel"
      :has-variable="temVariavel"
      :dados="dadosEfetivos"
      :data="dadosEfetivos"
      :template="template"
    />
    <slot
      name="fields"
      :variaveis="variaveisTemplate"
      :variables="variaveisTemplate"
      :tem-variavel="temVariavel"
      :has-variable="temVariavel"
      :dados="dadosEfetivos"
      :data="dadosEfetivos"
      :template="template"
    />

    <div class="vc-vis-palco">
      <slot
        name="preview"
        :imagem-url="imagemPreviewSeguraUrl"
        :image-url="imagemPreviewSeguraUrl"
        :processando="processando"
        :processing="processando"
      >
        <img
          v-if="imagemPreviewSeguraUrl"
          :src="imagemPreviewSeguraUrl"
          :alt="t('visualizador.altPreview')"
          class="vc-vis-img"
        />
        <div v-else class="vc-vis-carregando">{{ t('visualizador.gerandoVisualizacao') }}</div>
      </slot>
    </div>
  </div>
</template>

<style lang="scss">
@use '../styles/certificado.scss';
</style>
