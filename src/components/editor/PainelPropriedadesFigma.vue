<!--
========
Inspetor superior direito estilo Figma (src/components/editor/PainelPropriedadesFigma.vue).
Organiza as propriedades em seções limpas e recolhíveis:
- Conteúdo & Tipografia no topo (com destaque inline de variáveis e toggle discreto para editar variáveis fixas)
- Dimensões & Posição compacto (X, Y, W, H, Rotação e Opacidade)
- Alinhamento unificado (Folha + Caixa juntos em accordion que já vem recolhido)
- Link no PDF em accordion recolhível (sem preencher link de QR Code em variáveis comuns)
========
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type {
  CamadaCertificado,
  EixoAlinhamentoFolha,
  EstiloModuloQr,
  EstiloOlhoQr,
  ModoExibicaoLink,
  PosicaoGrade3x3,
  VariavelCertificado
} from '../../types/certificado';
import {
  POSICOES_GRADE_3X3,
  alinharTextoNaGrade3x3Caixa,
  detectarPosicaoGrade3x3Folha,
  detectarPosicaoGrade3x3Texto
} from '../../composables/gerenciadorDeAlinhamento';
import {
  normalizarDirecaoPontaSeta,
  normalizarModoExibicaoLink
} from '../../composables/gerenciadorDeCamadas';
import { normalizarEstiloModuloQr, normalizarEstiloOlhoQr } from '../../utils/qrcode';
import { usarI18nCertificado } from '../../i18n';
import CampoTextoVariavel from './CampoTextoVariavel.vue';
import { buildIcons } from '../../utils/svgFactory';
import { svgs } from '../../styles/svgs';

const icons = buildIcons(svgs);

export interface Props {
  camadaSelecionada: CamadaCertificado | null;
  dimensoesFolha: { largura: number; altura: number };
  minimizado: boolean;
  listaFontes: string[];
  listaVariaveis?: VariavelCertificado[];
  chavesExtrasValidas?: string[];
  temQrCode?: boolean;
  vazioInspetor: string;
  classeInspetor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  listaVariaveis: () => [],
  chavesExtrasValidas: () => [],
  temQrCode: false,
  classeInspetor: undefined
});

const emit = defineEmits<{
  'alternar-minimizado': [];
  'confirmar-alteracao': [];
  'duplicar': [];
  'excluir': [];
  'alinhar-eixo-folha': [eixo: EixoAlinhamentoFolha];
  'alinhar-grade-folha': [posicao: PosicaoGrade3x3];
}>();

// Função de tradução reativa conectada à instância global do vue-i18n
const { t } = usarI18nCertificado();

// Accordion de Alinhamento (Folha + Caixa) inicia recolhido por padrão para facilitar a navegação
const alinhamentoAberto = ref<boolean>(false);

// Accordion de Link no PDF inicia recolhido, abrindo automaticamente se a camada já possuir link
const linkPdfAberto = ref<boolean>(false);

// Sincroniza a abertura automática do accordion de link apenas quando a camada selecionada já tiver linkUrl
watch(
  () => props.camadaSelecionada?.id,
  () => {
    linkPdfAberto.value = Boolean(props.camadaSelecionada?.linkUrl);
  },
  { immediate: true }
);

// Ponto 3x3 ativo na folha correspondente às coordenadas atuais da camada selecionada
const posicaoAtivaFolha3x3 = computed(() =>
  detectarPosicaoGrade3x3Folha(props.camadaSelecionada, props.dimensoesFolha)
);

// Ponto 3x3 ativo de alinhamento interno do texto na caixa da camada selecionada
const posicaoAtivaTexto3x3 = computed(() =>
  detectarPosicaoGrade3x3Texto(props.camadaSelecionada)
);

// Direção canônica da ponta da seta normalizada para destacar o botão ativo no inspetor
const pontaSetaAtual = computed(() =>
  normalizarDirecaoPontaSeta(props.camadaSelecionada?.pontaSeta)
);

// Modo de exibição canônico do link da camada selecionada ('url' ou 'texto')
const modoExibicaoLinkAtual = computed(() =>
  props.camadaSelecionada?.modoExibicaoLink
    ? normalizarModoExibicaoLink(props.camadaSelecionada.modoExibicaoLink)
    : undefined
);

// Estilos canônicos normalizados dos módulos e olhos do QR Code para o select do inspetor
const estiloModulosQrAtual = computed(() =>
  normalizarEstiloModuloQr(props.camadaSelecionada?.estiloModulosQr)
);

const estiloOlhosQrAtual = computed(() =>
  normalizarEstiloOlhoQr(props.camadaSelecionada?.estiloOlhosQr)
);

/*
 * Recebe: identificador da posição 3x3 escolhida pelo usuário para o texto.
 * Devolve: nada (void).
 * Por que é usada: aplica o alinhamento horizontal e vertical correspondente na camada de texto ou variável.
 */
function selecionarPontoTexto3x3(posicao: PosicaoGrade3x3): void {
  if (!props.camadaSelecionada) return;
  if (alinharTextoNaGrade3x3Caixa(props.camadaSelecionada, posicao)) {
    emit('confirmar-alteracao');
  }
}

/*
 * Recebe: evento de alteração do toggle de liberação de edição em camadas do tipo variável.
 * Devolve: nada (void).
 * Por que é usada: habilita ou bloqueia a digitação livre com autocompletar {{ em camadas de variável.
 */
function alterarPermitirEdicaoVariavel(ev: Event): void {
  if (!props.camadaSelecionada) return;
  props.camadaSelecionada.permitirEdicaoTexto = (ev.target as HTMLInputElement).checked;
  emit('confirmar-alteracao');
}

/*
 * Recebe: evento de input do campo de destino do link no PDF.
 * Devolve: nada (void).
 * Por que é usada: atualiza ou limpa linkUrl da camada sem exigir checkbox separado.
 */
function alterarDestinoLinkPdf(ev: Event): void {
  if (!props.camadaSelecionada) return;
  const valor = (ev.target as HTMLInputElement).value;
  props.camadaSelecionada.linkUrl = valor.trim() ? valor : undefined;
}

/*
 * Recebe: nenhum parâmetro.
 * Devolve: nada (void).
 * Por que é usada: remove o link clicável configurado na camada atual.
 */
function limparLinkPdf(): void {
  if (!props.camadaSelecionada) return;
  props.camadaSelecionada.linkUrl = undefined;
  props.camadaSelecionada.modoExibicaoLink = undefined;
  emit('confirmar-alteracao');
}

/*
 * Recebe: evento de alteração do seletor de modo de exibição do link (URL completa ou texto personalizado).
 * Devolve: nada (void).
 * Por que é usada: alterna a exibição da camada entre {{link_qrcode}} e um texto personalizado clicável.
 */
function alterarModoExibicaoLink(ev: Event): void {
  if (!props.camadaSelecionada) return;
  const modo = normalizarModoExibicaoLink((ev.target as HTMLSelectElement).value as ModoExibicaoLink);
  props.camadaSelecionada.modoExibicaoLink = modo;
  if (modo === 'url') {
    props.camadaSelecionada.texto = props.camadaSelecionada.linkUrl || '{{link_qrcode}}';
  } else if (
    !props.camadaSelecionada.texto ||
    props.camadaSelecionada.texto.trim() === '{{link_qrcode}}' ||
    props.camadaSelecionada.texto.trim() === '{{link_validacao}}'
  ) {
    props.camadaSelecionada.texto = t('painelInserir.textoPadraoLinkQr');
    props.camadaSelecionada.permitirEdicaoTexto = true;
  }
  emit('confirmar-alteracao');
}

/*
 * Recebe: evento de alteração do select de estilo dos módulos do QR Code.
 * Devolve: nada (void).
 * Por que é usada: atualiza o formato dos pontos internos do QR Code (quadrado, arredondado ou pontos).
 */
function alterarEstiloModulosQr(ev: Event): void {
  if (!props.camadaSelecionada) return;
  const val = normalizarEstiloModuloQr((ev.target as HTMLSelectElement).value as EstiloModuloQr);
  props.camadaSelecionada.estiloModulosQr = val;
  emit('confirmar-alteracao');
}

/*
 * Recebe: evento de alteração do select de estilo dos olhos do QR Code.
 * Devolve: nada (void).
 * Por que é usada: atualiza o formato dos três cantos de leitura do QR Code.
 */
function alterarEstiloOlhosQr(ev: Event): void {
  if (!props.camadaSelecionada) return;
  const val = normalizarEstiloOlhoQr((ev.target as HTMLSelectElement).value as EstiloOlhoQr);
  props.camadaSelecionada.estiloOlhosQr = val;
  emit('confirmar-alteracao');
}

/*
 * Recebe: evento de input de cor para os cantos do QR Code.
 * Devolve: nada (void).
 * Por que é usada: define a cor personalizada dos três olhos do QR Code em tempo real.
 */
function alterarCorOlhosQr(ev: Event): void {
  if (!props.camadaSelecionada) return;
  props.camadaSelecionada.corOlhosQr = (ev.target as HTMLInputElement).value;
}

/*
 * Recebe: evento de mudança do checkbox de moldura limpa atrás da logo do QR Code.
 * Devolve: nada (void).
 * Por que é usada: ativa ou desativa o recorte de fundo atrás da logo central do QR Code.
 */
function alterarFundoLogoQr(ev: Event): void {
  if (!props.camadaSelecionada) return;
  props.camadaSelecionada.fundoLogoQr = (ev.target as HTMLInputElement).checked;
  emit('confirmar-alteracao');
}

/*
 * Recebe: evento de seleção de arquivo de imagem para o centro do QR Code.
 * Devolve: nada (void).
 * Por que é usada: converte a imagem escolhida para Data URL e configura a logo central da camada de QR Code.
 */
function carregarLogoQrCode(evento: Event): void {
  const input = evento.target as HTMLInputElement;
  const arquivo = input.files?.[0];
  if (!arquivo || !props.camadaSelecionada) return;

  const leitor = new FileReader();
  leitor.onload = (e) => {
    const src = String(e.target?.result || '');
    if (src && props.camadaSelecionada) {
      props.camadaSelecionada.logoQr = src;
      if (!props.camadaSelecionada.tamanhoLogoQr) {
        props.camadaSelecionada.tamanhoLogoQr = 22;
      }
      if (props.camadaSelecionada.fundoLogoQr === undefined) {
        props.camadaSelecionada.fundoLogoQr = true;
      }
      emit('confirmar-alteracao');
    }
  };
  leitor.readAsDataURL(arquivo);
  input.value = '';
}
</script>

<template>
  <section
    :class="[
      'vc-secao-propriedades',
      minimizado && 'minimizado',
      classeInspetor
    ]"
  >
    <div
      v-if="camadaSelecionada"
      class="vc-painel-cabecalho vc-painel-cabecalho-clicable"
      @click="emit('alternar-minimizado')"
    >
      <span>{{ camadaSelecionada.nome }}</span>
      <span class="vc-mini-icon"><component :is="minimizado ? icons.panel.plus : icons.panel.minus" width="13" height="13" /></span>
    </div>

    <div v-if="!minimizado" class="vc-painel-scroll">
      <slot v-if="!camadaSelecionada" name="vazio">
        <div class="vc-vazio">{{ vazioInspetor }}</div>
      </slot>

      <slot
        v-else
        name="inspetor"
        :camada="camadaSelecionada"
        :layer="camadaSelecionada"
        :confirmar="() => emit('confirmar-alteracao')"
        :confirm="() => emit('confirmar-alteracao')"
      >
        <div class="vc-bloco">
          <div class="vc-row-gap">
            <input
              v-model="camadaSelecionada.nome"
              @change="emit('confirmar-alteracao')"
              class="vc-field"
              :aria-label="t('inspetor.nomeCamadaAria')"
            />
            <div class="vc-grupo-icones" role="group" :aria-label="t('inspetor.acoesCamadaAria')">
              <button
                type="button"
                @click="camadaSelecionada.visivel = !camadaSelecionada.visivel; emit('confirmar-alteracao')"
                class="vc-icon-btn"
                :title="camadaSelecionada.visivel ? t('inspetor.ocultarCamada') : t('inspetor.mostrarCamada')"
                :aria-label="t('inspetor.alternarVisibilidadeAria')"
              >
                <component :is="camadaSelecionada.visivel ? icons.actions.eye : icons.actions.eyeOff" />
              </button>
              <button
                type="button"
                @click="camadaSelecionada.bloqueada = !camadaSelecionada.bloqueada; emit('confirmar-alteracao')"
                :class="['vc-icon-btn', camadaSelecionada.bloqueada ? 'ativo-alerta' : '']"
                :title="camadaSelecionada.bloqueada ? t('inspetor.desbloquearCamada') : t('inspetor.bloquearCamada')"
                :aria-label="t('inspetor.alternarBloqueioAria')"
              >
                <component :is="camadaSelecionada.bloqueada ? icons.actions.lock : icons.actions.unlock" />
              </button>
              <button
                type="button"
                @click="emit('duplicar')"
                class="vc-icon-btn"
                :title="t('inspetor.duplicarTitulo')"
                :aria-label="t('inspetor.duplicarAria')"
              >
                <component :is="icons.actions.duplicate" />
              </button>
              <button
                type="button"
                @click="emit('excluir')"
                class="vc-icon-btn perigo"
                :title="t('inspetor.excluirTitulo')"
                :aria-label="t('inspetor.excluirAria')"
              >
                <component :is="icons.actions.trash" />
              </button>
            </div>
          </div>
        </div>

        <div class="vc-bloco vc-bloco-sep">
          <span class="vc-bloco-titulo">{{ t('inspetor.dimensoesAparencia') }}</span>
          <div class="vc-grid-2">
            <label class="vc-figma-pill-input" :title="t('inspetor.posicaoHorizontalTitulo')">
              <span class="vc-pill-prefix">X</span>
              <input
                type="number"
                v-model.number="camadaSelecionada.x"
                @change="emit('confirmar-alteracao')"
                class="vc-pill-number"
              />
            </label>
            <label class="vc-figma-pill-input" :title="t('inspetor.posicaoVerticalTitulo')">
              <span class="vc-pill-prefix">Y</span>
              <input
                type="number"
                v-model.number="camadaSelecionada.y"
                @change="emit('confirmar-alteracao')"
                class="vc-pill-number"
              />
            </label>
            <label class="vc-figma-pill-input" :title="t('inspetor.larguraTitulo')">
              <span class="vc-pill-prefix">W</span>
              <input
                type="number"
                v-model.number="camadaSelecionada.largura"
                @change="emit('confirmar-alteracao')"
                class="vc-pill-number"
              />
            </label>
            <label class="vc-figma-pill-input" :title="t('inspetor.alturaTitulo')">
              <span class="vc-pill-prefix">H</span>
              <input
                type="number"
                v-model.number="camadaSelecionada.altura"
                @change="emit('confirmar-alteracao')"
                class="vc-pill-number"
              />
            </label>
            <label class="vc-figma-pill-input" :title="t('inspetor.rotacaoTitulo')">
              <span class="vc-pill-prefix">°</span>
              <input
                type="number"
                v-model.number="camadaSelecionada.rotacao"
                @change="emit('confirmar-alteracao')"
                class="vc-pill-number"
              />
            </label>
            <label class="vc-label">
              {{ t('inspetor.opacidade', { valor: camadaSelecionada.opacidade }) }}
              <input
                type="range"
                min="0"
                max="100"
                v-model.number="camadaSelecionada.opacidade"
                @change="emit('confirmar-alteracao')"
                class="vc-range"
              />
            </label>
          </div>
        </div>

        <div v-if="camadaSelecionada.tipo === 'texto' || camadaSelecionada.tipo === 'variavel'" class="vc-bloco vc-bloco-sep">
          <template v-if="camadaSelecionada.tipo === 'texto'">
            <span class="vc-bloco-titulo">{{ t('inspetor.conteudoTexto') }}</span>
            <CampoTextoVariavel
              v-model="camadaSelecionada.texto"
              :variaveis-disponiveis="listaVariaveis"
              :chaves-extras-validas="chavesExtrasValidas"
              @confirmar-alteracao="emit('confirmar-alteracao')"
            />
          </template>

          <template v-else>
            <div class="vc-row-between">
              <span class="vc-bloco-titulo">{{ t('inspetor.variavelFixaCliente') }}</span>
              <label class="vc-switch-inline" data-testid="checkbox-editar-variavel-wrap">
                <span class="vc-switch-texto">{{ t('inspetor.permitirEditarVariavel') }}</span>
                <input
                  type="checkbox"
                  class="vc-switch-input"
                  :checked="Boolean(camadaSelecionada.permitirEdicaoTexto)"
                  data-testid="checkbox-permitir-edicao-variavel"
                  @change="alterarPermitirEdicaoVariavel"
                />
                <span class="vc-switch-track">
                  <span class="vc-switch-thumb"></span>
                </span>
              </label>
            </div>

            <CampoTextoVariavel
              v-if="camadaSelecionada.permitirEdicaoTexto"
              v-model="camadaSelecionada.texto"
              :variaveis-disponiveis="listaVariaveis"
              :chaves-extras-validas="chavesExtrasValidas"
              @confirmar-alteracao="emit('confirmar-alteracao')"
            />
            <div v-else class="vc-variavel-fixa-badge" data-testid="badge-variavel-fixa">
              <span class="vc-item-ico"><component :is="icons.inspector.variable" /></span>
              <code>{{ camadaSelecionada.texto }}</code>
            </div>
          </template>

          <span class="vc-bloco-titulo">{{ t('inspetor.estiloFonte') }}</span>
          <select
            v-model="camadaSelecionada.fonte"
            @change="emit('confirmar-alteracao')"
            class="vc-field"
          >
            <option v-for="f in listaFontes" :key="f" :value="f">{{ f }}</option>
          </select>

          <div class="vc-grid-2">
            <label class="vc-figma-pill-input" :title="t('inspetor.tamanhoFonteTitulo')">
              <span class="vc-pill-prefix">{{ t('inspetor.prefixoTamanhoFonte') }}</span>
              <input
                type="number"
                v-model.number="camadaSelecionada.tamanhoFonte"
                @change="emit('confirmar-alteracao')"
                class="vc-pill-number"
              />
            </label>
            <div class="vc-row-between vc-figma-pill-input">
              <span class="vc-pill-prefix">{{ t('inspetor.prefixoCor') }}</span>
              <input
                type="color"
                v-model="camadaSelecionada.corTexto"
                @change="emit('confirmar-alteracao')"
                class="vc-color-dot"
              />
            </div>
          </div>

          <div class="vc-row-gap">
            <button
              type="button"
              @click="camadaSelecionada.negrito = !camadaSelecionada.negrito; emit('confirmar-alteracao')"
              :class="['vc-chip', camadaSelecionada.negrito ? 'ativo' : '']"
            >
              B
            </button>
            <button
              type="button"
              @click="camadaSelecionada.italico = !camadaSelecionada.italico; emit('confirmar-alteracao')"
              :class="['vc-chip', camadaSelecionada.italico ? 'ativo' : '']"
            >
              I
            </button>
            <button
              type="button"
              @click="camadaSelecionada.sublinhado = !camadaSelecionada.sublinhado; emit('confirmar-alteracao')"
              :class="['vc-chip', camadaSelecionada.sublinhado ? 'ativo' : '']"
            >
              U
            </button>
          </div>
        </div>

        <div class="vc-bloco vc-bloco-sep">
          <button
            type="button"
            class="vc-accordion-header"
            data-testid="accordion-alinhamento"
            :aria-expanded="alinhamentoAberto"
            @click="alinhamentoAberto = !alinhamentoAberto"
          >
            <span class="vc-bloco-titulo">{{ t('inspetor.alinhamentoSecao') }}</span>
            <component
              :is="icons.panel.chevronRight"
              :class="['vc-accordion-chevron', alinhamentoAberto && 'aberto']"
              width="13"
              height="13"
            />
          </button>

          <div v-if="alinhamentoAberto" class="vc-accordion-body">
            <span class="vc-sub-rotulo">{{ t('inspetor.alinharNaFolha') }}</span>
            <div class="vc-figma-alignment-row">
              <div
                class="vc-figma-quadrado-3x3"
                role="group"
                :aria-label="t('inspetor.mapa3x3FolhaAria')"
                data-testid="quadrado-alinhamento-folha"
              >
                <button
                  v-for="ponto in POSICOES_GRADE_3X3"
                  :key="ponto.id"
                  type="button"
                  :class="[
                    'vc-figma-ponto-3x3',
                    posicaoAtivaFolha3x3 === ponto.id ? 'ativo' : ''
                  ]"
                  :title="t('inspetor.posicionarNaFolhaTitulo', { rotulo: t(`grade3x3.${ponto.id}`) })"
                  :aria-label="t('inspetor.folhaPontoAria', { rotulo: t(`grade3x3.${ponto.id}`) })"
                  :data-testid="`folha-3x3-${ponto.id}`"
                  @click="emit('alinhar-grade-folha', ponto.id)"
                >
                  <span v-if="posicaoAtivaFolha3x3 === ponto.id" class="vc-figma-barrinhas">
                    <i></i><i></i><i></i>
                  </span>
                  <span v-else class="vc-figma-dot"></span>
                </button>
              </div>

              <div class="vc-figma-col-direita">
                <div class="vc-figma-align-bar">
                  <button type="button" class="vc-align-btn" @click="emit('alinhar-eixo-folha', 'esquerda')" :title="t('inspetor.alinharEsquerda')" :aria-label="t('inspetor.alinharEsquerda')" data-testid="btn-alinhar-esquerda">
                    <component :is="icons.align.sheetLeft" />
                  </button>
                  <button type="button" class="vc-align-btn" @click="emit('alinhar-eixo-folha', 'centro-h')" :title="t('inspetor.centralizarHorizontalmente')" :aria-label="t('inspetor.centralizarHorizontalmente')" data-testid="btn-alinhar-centro-h">
                    <component :is="icons.align.sheetCenterH" />
                  </button>
                  <button type="button" class="vc-align-btn" @click="emit('alinhar-eixo-folha', 'direita')" :title="t('inspetor.alinharDireita')" :aria-label="t('inspetor.alinharDireita')" data-testid="btn-alinhar-direita">
                    <component :is="icons.align.sheetRight" />
                  </button>
                  <button type="button" class="vc-align-btn" @click="emit('alinhar-eixo-folha', 'topo')" :title="t('inspetor.alinharTopo')" :aria-label="t('inspetor.alinharTopo')" data-testid="btn-alinhar-topo">
                    <component :is="icons.align.sheetTop" />
                  </button>
                  <button type="button" class="vc-align-btn" @click="emit('alinhar-eixo-folha', 'centro-v')" :title="t('inspetor.centralizarVerticalmente')" :aria-label="t('inspetor.centralizarVerticalmente')" data-testid="btn-alinhar-centro-v">
                    <component :is="icons.align.sheetCenterV" />
                  </button>
                  <button type="button" class="vc-align-btn" @click="emit('alinhar-eixo-folha', 'base')" :title="t('inspetor.alinharEmbaixo')" :aria-label="t('inspetor.alinharEmbaixo')" data-testid="btn-alinhar-base">
                    <component :is="icons.align.sheetBottom" />
                  </button>
                </div>
              </div>
            </div>

            <template v-if="camadaSelecionada.tipo === 'texto' || camadaSelecionada.tipo === 'variavel'">
              <span class="vc-sub-rotulo">{{ t('inspetor.alinhamentoNaCaixa') }}</span>
              <div class="vc-figma-alignment-row">
                <div
                  class="vc-figma-quadrado-3x3"
                  role="group"
                  :aria-label="t('inspetor.mapa3x3CaixaAria')"
                  data-testid="quadrado-alinhamento-texto"
                >
                  <button
                    v-for="ponto in POSICOES_GRADE_3X3"
                    :key="ponto.id"
                    type="button"
                    :class="[
                      'vc-figma-ponto-3x3',
                      posicaoAtivaTexto3x3 === ponto.id ? 'ativo' : ''
                    ]"
                    :title="t('inspetor.textoNaCaixaTitulo', { rotulo: t(`grade3x3.${ponto.id}`) })"
                    :aria-label="t('inspetor.caixaPontoAria', { rotulo: t(`grade3x3.${ponto.id}`) })"
                    :data-testid="`texto-3x3-${ponto.id}`"
                    @click="selecionarPontoTexto3x3(ponto.id)"
                  >
                    <span v-if="posicaoAtivaTexto3x3 === ponto.id" class="vc-figma-barrinhas">
                      <i></i><i></i><i></i>
                    </span>
                    <span v-else class="vc-figma-dot"></span>
                  </button>
                </div>

                <div class="vc-figma-col-direita">
                  <div class="vc-figma-align-bar">
                    <button type="button" @click="camadaSelecionada.alinhamento = 'left'; emit('confirmar-alteracao')" :class="['vc-align-btn', camadaSelecionada.alinhamento === 'left' ? 'ativo' : '']" :title="t('inspetor.textoEsquerda')" :aria-label="t('inspetor.textoEsquerda')" data-testid="btn-texto-esquerda">
                      <component :is="icons.align.textLeft" />
                    </button>
                    <button type="button" @click="camadaSelecionada.alinhamento = 'center'; emit('confirmar-alteracao')" :class="['vc-align-btn', (!camadaSelecionada.alinhamento || camadaSelecionada.alinhamento === 'center') ? 'ativo' : '']" :title="t('inspetor.textoCentralizado')" :aria-label="t('inspetor.textoCentralizado')" data-testid="btn-texto-centro">
                      <component :is="icons.align.textCenter" />
                    </button>
                    <button type="button" @click="camadaSelecionada.alinhamento = 'right'; emit('confirmar-alteracao')" :class="['vc-align-btn', camadaSelecionada.alinhamento === 'right' ? 'ativo' : '']" :title="t('inspetor.textoDireita')" :aria-label="t('inspetor.textoDireita')" data-testid="btn-texto-direita">
                      <component :is="icons.align.textRight" />
                    </button>
                    <button type="button" @click="camadaSelecionada.alinhamentoVertical = 'top'; emit('confirmar-alteracao')" :class="['vc-align-btn', camadaSelecionada.alinhamentoVertical === 'top' ? 'ativo' : '']" :title="t('inspetor.textoTopoTitulo')" :aria-label="t('inspetor.textoTopoAria')" data-testid="btn-texto-topo">
                      <component :is="icons.align.textTop" />
                    </button>
                    <button type="button" @click="camadaSelecionada.alinhamentoVertical = 'middle'; emit('confirmar-alteracao')" :class="['vc-align-btn', (!camadaSelecionada.alinhamentoVertical || camadaSelecionada.alinhamentoVertical === 'middle') ? 'ativo' : '']" :title="t('inspetor.textoMeioTitulo')" :aria-label="t('inspetor.textoMeioAria')" data-testid="btn-texto-meio">
                      <component :is="icons.align.textMiddle" />
                    </button>
                    <button type="button" @click="camadaSelecionada.alinhamentoVertical = 'bottom'; emit('confirmar-alteracao')" :class="['vc-align-btn', camadaSelecionada.alinhamentoVertical === 'bottom' ? 'ativo' : '']" :title="t('inspetor.textoEmbaixoTitulo')" :aria-label="t('inspetor.textoEmbaixoAria')" data-testid="btn-texto-embaixo">
                      <component :is="icons.align.textBottom" />
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <div
          v-if="camadaSelecionada.tipo === 'texto' || camadaSelecionada.tipo === 'variavel'"
          class="vc-bloco vc-bloco-sep"
          data-testid="bloco-link-clicavel-pdf"
        >
          <button
            type="button"
            class="vc-accordion-header"
            data-testid="accordion-link-pdf"
            :aria-expanded="linkPdfAberto"
            @click="linkPdfAberto = !linkPdfAberto"
          >
            <span class="vc-bloco-titulo">
              {{ t('inspetor.linkClicavelPdf') }}
              <span v-if="camadaSelecionada.linkUrl" class="vc-dot-ativo"></span>
            </span>
            <component
              :is="icons.panel.chevronRight"
              :class="['vc-accordion-chevron', linkPdfAberto && 'aberto']"
              width="13"
              height="13"
            />
          </button>

          <div v-if="linkPdfAberto" class="vc-accordion-body">
            <label class="vc-label">
              {{ t('inspetor.destinoLinkPdf') }}
              <input
                :value="camadaSelecionada.linkUrl || ''"
                type="text"
                class="vc-field"
                data-testid="input-destino-link-pdf"
                :placeholder="t('inspetor.placeholderDestinoLinkPdf')"
                @input="alterarDestinoLinkPdf"
                @change="emit('confirmar-alteracao')"
              />
            </label>

            <label v-if="modoExibicaoLinkAtual" class="vc-label">
              {{ t('inspetor.modoExibicaoLinkLabel') }}
              <select
                :value="modoExibicaoLinkAtual"
                class="vc-field"
                data-testid="select-modo-exibicao-link-inspetor"
                @change="alterarModoExibicaoLink"
              >
                <option value="url">{{ t('painelInserir.modoLinkUrl') }}</option>
                <option value="texto">{{ t('painelInserir.modoLinkTexto') }}</option>
              </select>
            </label>

            <button
              v-if="camadaSelecionada.linkUrl"
              type="button"
              class="vc-btn-sutil perigo"
              data-testid="btn-limpar-link-pdf"
              @click="limparLinkPdf"
            >
              {{ t('inspetor.limparLinkPdf') }}
            </button>

            <div v-else class="vc-txt-muted-sm">
              {{ t('inspetor.dicaLinkClicavelPdf') }}
            </div>
          </div>
        </div>

        <div
          v-if="camadaSelecionada.tipo === 'forma' || camadaSelecionada.tipo === 'circulo'"
          class="vc-bloco vc-bloco-sep"
        >
          <span class="vc-bloco-titulo">
            {{ camadaSelecionada.tipo === 'circulo' ? t('inspetor.estiloCirculo') : t('inspetor.estiloMoldura') }}
          </span>
          <label class="vc-checkbox-label">
            <input
              type="checkbox"
              v-model="camadaSelecionada.semPreenchimento"
              @change="emit('confirmar-alteracao')"
            />
            {{ t('inspetor.fundoTransparente') }}
          </label>
          <div class="vc-grid-2">
            <label v-if="!camadaSelecionada.semPreenchimento" class="vc-label">
              {{ t('inspetor.corPreenchimento') }}
              <input
                type="color"
                v-model="camadaSelecionada.corPreenchimento"
                @change="emit('confirmar-alteracao')"
                class="vc-color-dot"
              />
            </label>
            <label class="vc-label">
              {{ t('inspetor.corBorda') }}
              <input
                type="color"
                v-model="camadaSelecionada.corBorda"
                @change="emit('confirmar-alteracao')"
                class="vc-color-dot"
              />
            </label>
            <label class="vc-label">
              {{ t('inspetor.espessuraPx') }}
              <input
                type="number"
                min="0"
                v-model.number="camadaSelecionada.espessuraBorda"
                @change="emit('confirmar-alteracao')"
                class="vc-field"
              />
            </label>
            <label v-if="camadaSelecionada.tipo === 'forma'" class="vc-label">
              {{ t('inspetor.raioPx') }}
              <input
                type="number"
                min="0"
                v-model.number="camadaSelecionada.raioBorda"
                @change="emit('confirmar-alteracao')"
                class="vc-field"
              />
            </label>
          </div>
          <label class="vc-label">
            {{ t('inspetor.tracoBorda') }}
            <select
              v-model="camadaSelecionada.estiloBorda"
              @change="emit('confirmar-alteracao')"
              class="vc-field"
            >
              <option value="solid">{{ t('inspetor.tracoSolido') }}</option>
              <option value="dashed">{{ t('inspetor.tracoTracejado') }}</option>
              <option value="dotted">{{ t('inspetor.tracoPontilhado') }}</option>
            </select>
          </label>
        </div>

        <div
          v-if="camadaSelecionada.tipo === 'linha' || camadaSelecionada.tipo === 'seta'"
          class="vc-bloco vc-bloco-sep"
        >
          <span class="vc-bloco-titulo">
            {{ camadaSelecionada.tipo === 'seta' ? t('inspetor.estiloSeta') : t('inspetor.estiloLinha') }}
          </span>
          <div class="vc-grid-2">
            <label class="vc-label">
              {{ t('inspetor.corTraco') }}
              <input
                type="color"
                v-model="camadaSelecionada.corBorda"
                @change="emit('confirmar-alteracao')"
                class="vc-color-dot"
              />
            </label>
            <label class="vc-label">
              {{ t('inspetor.espessuraPx') }}
              <input
                type="number"
                min="1"
                v-model.number="camadaSelecionada.espessuraBorda"
                @change="emit('confirmar-alteracao')"
                class="vc-field"
              />
            </label>
          </div>
          <label class="vc-label">
            {{ t('inspetor.estiloTraco') }}
            <select
              v-model="camadaSelecionada.estiloBorda"
              @change="emit('confirmar-alteracao')"
              class="vc-field"
            >
              <option value="solid">{{ t('inspetor.tracoSolido') }}</option>
              <option value="dashed">{{ t('inspetor.tracoTracejado') }}</option>
              <option value="dotted">{{ t('inspetor.tracoPontilhado') }}</option>
            </select>
          </label>

          <div v-if="camadaSelecionada.tipo === 'seta'" class="vc-bloco">
            <span class="vc-bloco-titulo">{{ t('inspetor.direcaoPonta') }}</span>
            <div class="vc-row-gap">
              <button
                type="button"
                @click="camadaSelecionada.pontaSeta = 'esquerda'; emit('confirmar-alteracao')"
                :class="['vc-chip', pontaSetaAtual === 'esquerda' ? 'ativo' : '']"
                data-testid="seta-esquerda"
              >
                {{ t('inspetor.setaEsquerda') }}
              </button>
              <button
                type="button"
                @click="camadaSelecionada.pontaSeta = 'direita'; emit('confirmar-alteracao')"
                :class="['vc-chip', pontaSetaAtual === 'direita' ? 'ativo' : '']"
                data-testid="seta-direita"
              >
                {{ t('inspetor.setaDireita') }}
              </button>
              <button
                type="button"
                @click="camadaSelecionada.pontaSeta = 'ambas'; emit('confirmar-alteracao')"
                :class="['vc-chip', pontaSetaAtual === 'ambas' ? 'ativo' : '']"
                data-testid="seta-ambas"
              >
                {{ t('inspetor.setaAmbas') }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="camadaSelecionada.tipo === 'imagem'" class="vc-bloco vc-bloco-sep">
          <span class="vc-bloco-titulo">{{ t('inspetor.ajusteImagem') }}</span>
          <select
            v-model="camadaSelecionada.ajusteImagem"
            @change="emit('confirmar-alteracao')"
            class="vc-field"
          >
            <option value="contain">{{ t('painelInserir.ajusteContain') }}</option>
            <option value="cover">{{ t('painelInserir.ajusteCover') }}</option>
            <option value="fill">{{ t('inspetor.ajusteFill') }}</option>
          </select>
          <label class="vc-label">
            {{ t('inspetor.raioCantosPx') }}
            <input
              type="number"
              min="0"
              v-model.number="camadaSelecionada.raioImagem"
              @change="emit('confirmar-alteracao')"
              class="vc-field"
            />
          </label>
        </div>

        <div v-if="camadaSelecionada.tipo === 'qrcode'" class="vc-bloco vc-bloco-sep">
          <span class="vc-bloco-titulo">{{ t('inspetor.estiloCoresQr') }}</span>

          <div class="vc-grid-2">
            <label class="vc-label">
              {{ t('inspetor.pontosModulosQr') }}
              <select
                :value="estiloModulosQrAtual"
                @change="alterarEstiloModulosQr"
                class="vc-field"
                data-testid="select-estilo-modulos-qr"
              >
                <option value="quadrado">{{ t('inspetor.qrQuadrado') }}</option>
                <option value="arredondado">{{ t('inspetor.qrArredondado') }}</option>
                <option value="pontos">{{ t('inspetor.qrPontos') }}</option>
              </select>
            </label>

            <label class="vc-label">
              {{ t('inspetor.cantosOlhosQr') }}
              <select
                :value="estiloOlhosQrAtual"
                @change="alterarEstiloOlhosQr"
                class="vc-field"
                data-testid="select-estilo-olhos-qr"
              >
                <option value="quadrado">{{ t('inspetor.qrQuadrado') }}</option>
                <option value="arredondado">{{ t('inspetor.qrArredondado') }}</option>
                <option value="circulo">{{ t('inspetor.qrCircular') }}</option>
              </select>
            </label>
          </div>

          <div class="vc-grid-2">
            <label class="vc-label">
              {{ t('inspetor.corPontosQr') }}
              <input
                type="color"
                v-model="camadaSelecionada.corQr"
                @change="emit('confirmar-alteracao')"
                class="vc-color-dot"
              />
            </label>

            <label class="vc-label">
              {{ t('inspetor.corCantosQr') }}
              <input
                type="color"
                :value="camadaSelecionada.corOlhosQr || camadaSelecionada.corQr || '#0f172a'"
                @input="alterarCorOlhosQr"
                @change="emit('confirmar-alteracao')"
                class="vc-color-dot"
              />
            </label>
          </div>

          <label class="vc-checkbox-label">
            <input
              type="checkbox"
              v-model="camadaSelecionada.fundoTransparenteQr"
              @change="emit('confirmar-alteracao')"
            />
            {{ t('inspetor.fundoTransparente') }}
          </label>

          <div class="vc-grid-2">
            <label v-if="!camadaSelecionada.fundoTransparenteQr" class="vc-label">
              {{ t('inspetor.corFundoQr') }}
              <input
                type="color"
                v-model="camadaSelecionada.corFundoQr"
                @change="emit('confirmar-alteracao')"
                class="vc-color-dot"
              />
            </label>

            <label class="vc-label">
              {{ t('inspetor.margemPx') }}
              <input
                type="number"
                min="0"
                max="24"
                v-model.number="camadaSelecionada.margemQr"
                @change="emit('confirmar-alteracao')"
                class="vc-field"
              />
            </label>

            <label v-if="!camadaSelecionada.fundoTransparenteQr" class="vc-label">
              {{ t('inspetor.raioCaixaPx') }}
              <input
                type="number"
                min="0"
                max="40"
                v-model.number="camadaSelecionada.raioFundoQr"
                @change="emit('confirmar-alteracao')"
                class="vc-field"
              />
            </label>
          </div>

          <div class="vc-bloco vc-bloco-sep">
            <span class="vc-bloco-titulo">{{ t('inspetor.logoCentroQr') }}</span>

            <label class="vc-upload-box">
              <component :is="icons.insert.upload" />
              <span>{{ camadaSelecionada.logoQr ? t('inspetor.trocarLogoQr') : t('inspetor.enviarLogoQr') }}</span>
              <input
                type="file"
                accept="image/*"
                class="vc-oculto"
                @change="carregarLogoQrCode"
                data-testid="input-upload-logo-qr"
              />
            </label>

            <template v-if="camadaSelecionada.logoQr">
              <div class="vc-grid-2">
                <label class="vc-label">
                  {{ t('inspetor.tamanhoLogoQr', { valor: camadaSelecionada.tamanhoLogoQr ?? 22 }) }}
                  <input
                    type="range"
                    min="14"
                    max="30"
                    v-model.number="camadaSelecionada.tamanhoLogoQr"
                    @change="emit('confirmar-alteracao')"
                    class="vc-range"
                  />
                </label>

                <label class="vc-label">
                  {{ t('inspetor.arredondarLogoPx') }}
                  <input
                    type="number"
                    min="0"
                    max="50"
                    v-model.number="camadaSelecionada.raioLogoQr"
                    @change="emit('confirmar-alteracao')"
                    class="vc-field"
                  />
                </label>
              </div>

              <label class="vc-checkbox-label">
                <input
                  type="checkbox"
                  :checked="camadaSelecionada.fundoLogoQr !== false"
                  @change="alterarFundoLogoQr"
                />
                {{ t('inspetor.molduraLimpaLogo') }}
              </label>

              <button
                type="button"
                class="vc-btn-sutil perigo"
                data-testid="btn-remover-logo-qr"
                @click="camadaSelecionada.logoQr = ''; emit('confirmar-alteracao')"
              >
                {{ t('inspetor.removerLogoQr') }}
              </button>
            </template>
          </div>
        </div>
      </slot>
    </div>
  </section>
</template>