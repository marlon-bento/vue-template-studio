<!--
========
Barra superior do editor (src/components/editor/BarraSuperiorEditor.vue).
Controla o nome do template, histórico (Desfazer/Refazer), seletor de formato de folha
(A4, A5, Carta, Crachá, Cartão CR80, Social, Personalizado L × A), orientação,
seletor de idioma (LocaleSwitcher), pré-visualização, salvar e exportar PDF,
com todos os textos e atributos de acessibilidade internacionalizados via vue-i18n.
========
-->
<script setup lang="ts">
import { computed } from 'vue';
import type {
  FormatoFolha,
  FormatoFolhaCanonico,
  OrientacaoCertificado,
  TemplateCertificado
} from '../../types/certificado';
import {
  PRESETS_FORMATOS_FOLHA,
  normalizarFormatoFolha,
  resolverDimensoesTemplate
} from '../../composables/gerenciadorDeCamadas';
import { usarI18nCertificado } from '../../i18n';
import LocaleSwitcher from '../LocaleSwitcher.vue';
import { buildIcons } from '../../utils/svgFactory';
import { svgs } from '../../styles/svgs';

const icons = buildIcons(svgs);

export interface Props {
  template: TemplateCertificado;
  podeDesfazer: boolean;
  podeRefazer: boolean;
  modoPreview: boolean;
  exportando: boolean;
  isUnstyled: boolean;
  exibirSeletorIdioma?: boolean;
  classeTopo?: string;
  labels: {
    paisagem: string;
    retrato: string;
    editandoDados: string;
    preVisualizar: string;
    salvar: string;
    exportandoPdf: string;
    exportarPdf: string;
  };
}

const props = withDefaults(defineProps<Props>(), {
  exibirSeletorIdioma: true,
  classeTopo: undefined
});

const emit = defineEmits<{
  'confirmar-alteracao': [];
  'desfazer': [];
  'refazer': [];
  'selecionar-formato': [formato: FormatoFolha];
  'alterar-dimensoes': [largura: number, altura: number];
  'alternar-orientacao': [nova: OrientacaoCertificado];
  'alternar-preview': [];
  'salvar': [];
  'exportar': [];
}>();

// Função de tradução reativa conectada à instância global do vue-i18n
const { t } = usarI18nCertificado();

// Formato canônico atual da folha selecionado no template (padrão A4)
const formatoAtual = computed<FormatoFolhaCanonico>(() =>
  normalizarFormatoFolha(props.template.formato || 'a4')
);

// Dimensões efetivas de largura e altura da folha atual em pixels
const dimensoesAtuais = computed(() => resolverDimensoesTemplate(props.template));

/*
 * Recebe: evento nativo de alteração do elemento select de formato.
 * Devolve: nada (void).
 * Por que é usada: emite o novo formato de folha selecionado pelo usuário para atualizar as dimensões do palco.
 */
function aoMudarSelectFormato(ev: Event): void {
  const novoFormato = (ev.target as HTMLSelectElement).value as FormatoFolha;
  emit('selecionar-formato', novoFormato);
}

/*
 * Recebe: evento nativo de alteração do input numérico de largura personalizada.
 * Devolve: nada (void).
 * Por que é usada: valida e emite a nova largura mínima de 120px quando o formato é personalizado.
 */
function aoAlterarLarguraCustom(ev: Event): void {
  const val = Number.parseInt((ev.target as HTMLInputElement).value, 10);
  if (Number.isNaN(val)) return;
  emit('alterar-dimensoes', Math.max(120, val), dimensoesAtuais.value.altura);
}

/*
 * Recebe: evento nativo de alteração do input numérico de altura personalizada.
 * Devolve: nada (void).
 * Por que é usada: valida e emite a nova altura mínima de 120px quando o formato é personalizado.
 */
function aoAlterarAlturaCustom(ev: Event): void {
  const val = Number.parseInt((ev.target as HTMLInputElement).value, 10);
  if (Number.isNaN(val)) return;
  emit('alterar-dimensoes', dimensoesAtuais.value.largura, Math.max(120, val));
}
</script>

<template>
  <header :class="[!isUnstyled && 'vc-topo', classeTopo]">
    <div class="vc-topo-esq">
      <input
        v-model="template.nome"
        @change="emit('confirmar-alteracao')"
        class="vc-titulo-input"
        :aria-label="t('barraSuperior.nomeTemplateAria')"
      />
      <div class="vc-divisor"></div>

      <div class="vc-grupo-icones" role="group" :aria-label="t('barraSuperior.historicoAria')">
        <button
          type="button"
          :disabled="!podeDesfazer"
          @click="emit('desfazer')"
          class="vc-icon-btn"
          :title="t('barraSuperior.desfazerTitulo')"
          :aria-label="t('barraSuperior.desfazerAria')"
        >
          <component :is="icons.topBar.undo" />
        </button>
        <button
          type="button"
          :disabled="!podeRefazer"
          @click="emit('refazer')"
          class="vc-icon-btn"
          :title="t('barraSuperior.refazerTitulo')"
          :aria-label="t('barraSuperior.refazerAria')"
        >
          <component :is="icons.topBar.redo" />
        </button>
      </div>
    </div>

    <div class="vc-topo-dir">
      <slot
        name="topo-acoes"
        :template="template"
        :modo-preview="modoPreview"
        :preview-mode="modoPreview"
      />

      <LocaleSwitcher v-if="exibirSeletorIdioma" />

      <select
        :value="formatoAtual"
        @change="aoMudarSelectFormato"
        class="vc-formato-select"
        :aria-label="t('barraSuperior.formatoFolhaAria')"
        data-testid="select-formato-folha"
      >
        <option
          v-for="preset in PRESETS_FORMATOS_FOLHA"
          :key="preset.id"
          :value="preset.id"
        >
          {{ t(`formatos.${preset.id}`) }}
        </option>
      </select>

      <div
        v-if="formatoAtual === 'custom'"
        class="vc-dimensoes-custom-topo"
        data-testid="inputs-dimensoes-custom"
      >
        <label
          class="vc-figma-pill-input vc-pill-topo-dim"
          :title="t('barraSuperior.larguraFolhaTitulo')"
        >
          <span class="vc-pill-prefix">{{ t('barraSuperior.prefixoLargura') }}</span>
          <input
            type="number"
            min="120"
            max="4000"
            :value="dimensoesAtuais.largura"
            @change="aoAlterarLarguraCustom"
            class="vc-pill-number"
            data-testid="input-largura-folha"
          />
        </label>
        <label
          class="vc-figma-pill-input vc-pill-topo-dim"
          :title="t('barraSuperior.alturaFolhaTitulo')"
        >
          <span class="vc-pill-prefix">{{ t('barraSuperior.prefixoAltura') }}</span>
          <input
            type="number"
            min="120"
            max="4000"
            :value="dimensoesAtuais.altura"
            @change="aoAlterarAlturaCustom"
            class="vc-pill-number"
            data-testid="input-altura-folha"
          />
        </label>
      </div>

      <button
        type="button"
        @click="emit('alternar-orientacao', template.orientacao === 'landscape' ? 'portrait' : 'landscape')"
        class="vc-pill-btn"
        data-testid="btn-orientacao"
      >
        <component :is="template.orientacao === 'landscape' ? icons.topBar.landscape : icons.topBar.portrait" />
        <span>{{ template.orientacao === 'landscape' ? labels.paisagem : labels.retrato }}</span>
      </button>
      <button
        type="button"
        @click="emit('alternar-preview')"
        :class="['vc-pill-btn', modoPreview ? 'ativo' : '']"
        data-testid="btn-preview"
      >
        <component :is="modoPreview ? icons.topBar.editData : icons.topBar.preview" />
        <span>{{ modoPreview ? labels.editandoDados : labels.preVisualizar }}</span>
      </button>
      <button
        type="button"
        @click="emit('salvar')"
        class="vc-pill-btn sucesso"
        data-testid="btn-salvar"
      >
        <component :is="icons.topBar.save" />
        <span>{{ labels.salvar }}</span>
      </button>
      <button
        type="button"
        :disabled="exportando"
        @click="emit('exportar')"
        class="vc-pill-btn primario"
        data-testid="btn-exportar-pdf"
      >
        <component :is="icons.topBar.exportPdf" />
        <span>{{ exportando ? labels.exportandoPdf : labels.exportarPdf }}</span>
      </button>
    </div>
  </header>
</template>