<!--
========
Seção inferior direita de camadas estilo Photoshop CS6 / Figma (src/components/editor/PainelCamadasLista.vue).
Exibe a listagem invertida de camadas (topo = maior z-index), suporta drag-and-drop para reordenação,
edição rápida de nome com duplo clique, visibilidade e bloqueio, com textos internacionalizados via vue-i18n.
========
-->
<script setup lang="ts">
import { ref, type FunctionalComponent } from 'vue';
import type { ItemCamadaInvertida, TipoCamada } from '../../types/certificado';
import { usarI18nCertificado } from '../../i18n';
import { buildIcons } from '../../utils/svgFactory';
import { svgs } from '../../styles/svgs';

const icons = buildIcons(svgs);

export interface Props {
  camadasInvertidas: ItemCamadaInvertida[];
  totalCamadas: number;
  camadaSelecionadaId: string | null;
  minimizado: boolean;
  labelCamadas: string;
  vazioCamadas: string;
  classePainelCamadas?: string;
}

// Mapa de associação entre cada tipo de camada e seu ícone vetorial
const mapaIconesCamada: Record<TipoCamada, FunctionalComponent> = {
  texto: icons.insert.text,
  variavel: icons.inspector.variable,
  imagem: icons.insert.image,
  qrcode: icons.insert.qrCode,
  circulo: icons.insert.circle,
  linha: icons.insert.line,
  seta: icons.insert.arrow,
  forma: icons.insert.frame
};

/*
 * Recebe: tipo da camada.
 * Devolve: componente funcional SVG correspondente ao tipo.
 * Por que é usada: exibe um ícone vetorial intuitivo para cada tipo de camada na lista.
 */
function obterIconeTipoCamada(tipo: TipoCamada): FunctionalComponent {
  return mapaIconesCamada[tipo] || icons.insert.frame;
}

defineProps<Props>();

const emit = defineEmits<{
  'alternar-minimizado': [];
  'selecionar-camada': [id: string];
  'mover-camada': [id: string, deslocamento: number | 'frente' | 'tras'];
  'reordenar-drag': [indiceOrigem: number, indiceDestino: number];
  'confirmar-alteracao': [];
}>();

// Função de tradução reativa conectada à instância global do vue-i18n
const { t } = usarI18nCertificado();

// Guarda o índice visual de origem durante o arraste de uma camada na lista
const indiceDragOrigem = ref<number | null>(null);

// Guarda o índice visual de destino sob o cursor durante o arraste de uma camada
const indiceDragAlvo = ref<number | null>(null);

// Guarda o ID da camada que está com o modo de renomeação inline ativo por duplo clique
const camadaEditandoNomeId = ref<string | null>(null);

/*
 * Recebe: evento DragEvent nativo e índice visual da linha iniciada.
 * Devolve: nada (void).
 * Por que é usada: registra a camada de origem que começou a ser arrastada na lista.
 */
function iniciarDragCamada(ev: DragEvent, indiceVisual: number): void {
  indiceDragOrigem.value = indiceVisual;
  if (ev.dataTransfer) {
    ev.dataTransfer.effectAllowed = 'move';
    ev.dataTransfer.setData('text/plain', String(indiceVisual));
  }
}

/*
 * Recebe: evento DragEvent nativo e índice visual da linha alvo sob o cursor.
 * Devolve: nada (void).
 * Por que é usada: permite o drop e marca visualmente a borda de destino na lista de camadas.
 */
function aoArrastarSobreCamada(ev: DragEvent, indiceVisual: number): void {
  ev.preventDefault();
  if (ev.dataTransfer) {
    ev.dataTransfer.dropEffect = 'move';
  }
  indiceDragAlvo.value = indiceVisual;
}

/*
 * Recebe: evento DragEvent nativo e índice visual onde a camada foi solta.
 * Devolve: nada (void).
 * Por que é usada: emite o evento de reordenação entre os índices visuais de origem e destino.
 */
function aoSoltarCamada(ev: DragEvent, indiceVisualDestino: number): void {
  ev.preventDefault();
  const origem =
    indiceDragOrigem.value ??
    (ev.dataTransfer ? Number.parseInt(ev.dataTransfer.getData('text/plain'), 10) : NaN);

  if (!Number.isNaN(origem)) {
    emit('reordenar-drag', origem, indiceVisualDestino);
  }
  indiceDragOrigem.value = null;
  indiceDragAlvo.value = null;
}

/*
 * Recebe: nenhum parâmetro.
 * Devolve: nada (void).
 * Por que é usada: limpa os indicadores visuais de drag-and-drop ao encerrar o arraste.
 */
function finalizarDragCamada(): void {
  indiceDragOrigem.value = null;
  indiceDragAlvo.value = null;
}
</script>

<template>
  <section
    :class="[
      'vc-secao-camadas',
      minimizado && 'minimizado',
      classePainelCamadas
    ]"
  >
    <div
      class="vc-painel-cabecalho vc-painel-cabecalho-clicable"
      @click="emit('alternar-minimizado')"
      :title="t('camadasLista.minimizarExpandirTitulo')"
    >
      <span>{{ labelCamadas }} ({{ totalCamadas }})</span>
      <button
        type="button"
        class="vc-collapse-btn"
        :aria-label="t('camadasLista.alternarPainelAria')"
      >
        <component :is="minimizado ? icons.panel.chevronUp : icons.panel.chevronDown" />
      </button>
    </div>

    <div v-if="!minimizado" class="vc-camadas-lista">
      <slot
        name="camadas"
        :camadas="camadasInvertidas"
        :layers="camadasInvertidas"
        :selecionada-id="camadaSelecionadaId"
        :selected-id="camadaSelecionadaId"
      >
        <div v-if="camadasInvertidas.length === 0" class="vc-vazio">
          {{ vazioCamadas }}
        </div>

        <div
          v-for="({ camada }, indiceVisual) in camadasInvertidas"
          :key="camada.id"
          draggable="true"
          @dragstart="iniciarDragCamada($event, indiceVisual)"
          @dragover="aoArrastarSobreCamada($event, indiceVisual)"
          @drop="aoSoltarCamada($event, indiceVisual)"
          @dragend="finalizarDragCamada"
          @click="emit('selecionar-camada', camada.id)"
          :class="[
            'vc-camada-row',
            camada.id === camadaSelecionadaId ? 'selecionada' : '',
            indiceDragOrigem === indiceVisual ? 'arrastando' : '',
            indiceDragAlvo === indiceVisual && indiceDragOrigem !== null && indiceDragOrigem > indiceVisual ? 'alvo-drop-acima' : '',
            indiceDragAlvo === indiceVisual && indiceDragOrigem !== null && indiceDragOrigem < indiceVisual ? 'alvo-drop-abaixo' : ''
          ]"
        >
          <span class="vc-drag-handle" :title="t('camadasLista.arrasteReordenar')">
            <component :is="icons.layers.dragHandle" />
          </span>

          <span class="vc-camada-tipo-badge">
            <component :is="obterIconeTipoCamada(camada.tipo)" />
          </span>

          <input
            v-if="camadaEditandoNomeId === camada.id"
            v-model="camada.nome"
            @blur="camadaEditandoNomeId = null; emit('confirmar-alteracao')"
            @keydown.enter="camadaEditandoNomeId = null; emit('confirmar-alteracao')"
            @click.stop
            class="vc-field"
          />
          <span
            v-else
            class="vc-camada-nome"
            @dblclick.stop="camadaEditandoNomeId = camada.id"
            :title="t('camadasLista.duploCliqueRenomear')"
          >
            {{ camada.nome }}
          </span>

          <div class="vc-camada-acoes">
            <button
              type="button"
              class="vc-mini-icon"
              @click.stop="emit('mover-camada', camada.id, 1)"
              :title="t('camadasLista.subirCamada')"
              :aria-label="t('camadasLista.subirCamada')"
            >
              <component :is="icons.layers.moveUp" />
            </button>
            <button
              type="button"
              class="vc-mini-icon"
              @click.stop="emit('mover-camada', camada.id, -1)"
              :title="t('camadasLista.descerCamada')"
              :aria-label="t('camadasLista.descerCamada')"
            >
              <component :is="icons.layers.moveDown" />
            </button>
            <button
              type="button"
              :class="['vc-mini-icon', !camada.visivel ? 'desligado' : '']"
              @click.stop="camada.visivel = !camada.visivel; emit('confirmar-alteracao')"
              :title="camada.visivel ? t('camadasLista.ocultarCamada') : t('camadasLista.mostrarCamada')"
              :aria-label="t('camadasLista.alternarVisibilidadeAria')"
              data-testid="btn-visibilidade-camada"
            >
              <component :is="camada.visivel ? icons.actions.eye : icons.actions.eyeOff" width="13" height="13" />
            </button>
            <button
              type="button"
              :class="['vc-mini-icon', camada.bloqueada ? 'bloqueado' : '']"
              @click.stop="camada.bloqueada = !camada.bloqueada; emit('confirmar-alteracao')"
              :title="camada.bloqueada ? t('camadasLista.desbloquearCamada') : t('camadasLista.bloquearCamada')"
              :aria-label="t('camadasLista.alternarBloqueioAria')"
              data-testid="btn-bloqueio-camada"
            >
              <component :is="camada.bloqueada ? icons.actions.lock : icons.actions.unlock" width="13" height="13" />
            </button>
          </div>
        </div>
      </slot>
    </div>
  </section>
</template>