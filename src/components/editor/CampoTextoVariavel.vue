<!--
========
Componente de campo de texto livre com autocompletar de variáveis (src/components/editor/CampoTextoVariavel.vue).
Detecta chaves duplas ({{) para abrir o menu de variáveis disponíveis do template,
insere a variável diretamente na posição do cursor e destaca inline no próprio campo
variáveis válidas (azul) e variáveis inexistentes (vermelho), sem duplicar o texto abaixo.
========
-->
<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import type { VariavelCertificado, VariavelNormalizada } from '../../types/certificado';
import { normalizarListaVariaveis } from '../../composables/gerenciadorDeCertificado';
import { usarI18nCertificado } from '../../i18n';

export interface SegmentoTextoVariavel {
  id: string;
  conteudo: string;
  ehVariavel: boolean;
  chaveVariavel?: string;
  ehValida?: boolean;
}

export interface Props {
  modelValue?: string;
  variaveisDisponiveis?: VariavelCertificado[];
  availableVariables?: VariavelCertificado[];
  chavesExtrasValidas?: string[];
  extraValidKeys?: string[];
  linhas?: number;
  rows?: number;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  variaveisDisponiveis: undefined,
  availableVariables: undefined,
  chavesExtrasValidas: undefined,
  extraValidKeys: undefined,
  linhas: undefined,
  rows: undefined,
  placeholder: undefined
});

const emit = defineEmits<{
  'update:modelValue': [valor: string];
  'confirmar-alteracao': [];
  'change-confirmed': [];
}>();

// Função de tradução reativa conectada à instância global do vue-i18n
const { t } = usarI18nCertificado();

// Quantidade de linhas do textarea resolvida entre rows (inglês) e linhas (português)
const linhasResolvidas = computed<number>(() => props.rows ?? props.linhas ?? 3);

// Texto de placeholder resolvido entre a prop informada ou a tradução ativa
const placeholderResolvido = computed<string>(
  () => props.placeholder ?? t('campoTextoVariavel.placeholder')
);

// Lista de variáveis normalizada a partir de availableVariables (inglês) ou variaveisDisponiveis (português)
const listaVariaveisNormalizada = computed<VariavelNormalizada[]>(() =>
  normalizarListaVariaveis(props.availableVariables ?? props.variaveisDisponiveis ?? [])
);

// Referência ao elemento textarea para leitura, scroll e posicionamento exato do cursor
const elementoTextarea = ref<HTMLTextAreaElement | null>(null);

// Referência à camada de destaque inline sincronizada com o scroll do textarea
const elementoBackdrop = ref<HTMLElement | null>(null);

// Controla a exibição do menu flutuante de sugestões de variáveis
const menuAberto = ref<boolean>(false);

// Guarda o texto digitado logo após {{ para filtrar as opções do menu
const termoFiltro = ref<string>('');

// Guarda a posição inicial onde o gatilho {{ foi aberto no texto
const indiceAberturaChaves = ref<number>(-1);

// Guarda o índice da opção ativa no menu para navegação por teclado
const indiceOpcaoAtiva = ref<number>(0);

// Conjunto com todas as chaves válidas cadastradas (incluindo variáveis especiais como link do QR Code)
const conjuntoChavesValidas = computed<Set<string>>(() => {
  const chaves = listaVariaveisNormalizada.value.map((v) => v.chave.trim());
  const extras = props.extraValidKeys ?? props.chavesExtrasValidas ?? [];
  for (const extra of extras) {
    if (extra && extra.trim()) {
      chaves.push(extra.trim());
    }
  }
  return new Set(chaves);
});

// Lista de variáveis filtradas conforme o que o usuário digita após {{
const variaveisFiltradas = computed<VariavelNormalizada[]>(() => {
  const busca = termoFiltro.value.trim().toLowerCase();
  if (!busca) {
    return listaVariaveisNormalizada.value;
  }
  return listaVariaveisNormalizada.value.filter(
    (v) =>
      v.chave.toLowerCase().includes(busca) ||
      v.rotulo.toLowerCase().includes(busca) ||
      (v.nomeCamada && v.nomeCamada.toLowerCase().includes(busca))
  );
});

// Quebra o texto completo em segmentos normais e tokens {{variavel}} validando cada um
const segmentosTexto = computed<SegmentoTextoVariavel[]>(() => {
  const texto = props.modelValue || '';
  if (!texto) return [];

  const regexTokens = /(\{\{[^{}]+\}\})/g;
  const partes = texto.split(regexTokens);
  const resultado: SegmentoTextoVariavel[] = [];

  for (let i = 0; i < partes.length; i++) {
    const parte = partes[i];
    if (!parte) continue;

    if (parte.startsWith('{{') && parte.endsWith('}}')) {
      const chaveLimpa = parte.slice(2, -2).trim();
      if (chaveLimpa.length > 0) {
        resultado.push({
          id: `seg-var-${i}-${chaveLimpa}`,
          conteudo: parte,
          ehVariavel: true,
          chaveVariavel: chaveLimpa,
          ehValida: conjuntoChavesValidas.value.has(chaveLimpa)
        });
        continue;
      }
    }

    resultado.push({
      id: `seg-txt-${i}`,
      conteudo: parte,
      ehVariavel: false
    });
  }

  return resultado;
});

/*
 * Recebe: nenhum parâmetro.
 * Devolve: nada (void).
 * Por que é usada: mantém o scroll do backdrop de destaque inline perfeitamente alinhado com o textarea.
 */
function sincronizarScrollBackdrop(): void {
  if (!elementoTextarea.value || !elementoBackdrop.value) return;
  elementoBackdrop.value.scrollTop = elementoTextarea.value.scrollTop;
  elementoBackdrop.value.scrollLeft = elementoTextarea.value.scrollLeft;
}

/*
 * Recebe: nenhum parâmetro.
 * Devolve: nada (void).
 * Por que é usada: emite confirmação de alteração tanto em português quanto em inglês.
 */
function emitirConfirmacao(): void {
  emit('confirmar-alteracao');
  emit('change-confirmed');
}

/*
 * Recebe: nenhum parâmetro.
 * Devolve: nada (void).
 * Por que é usada: fecha o menu de sugestões e limpa os estados temporários de busca do gatilho.
 */
function fecharMenuSugestoes(): void {
  menuAberto.value = false;
  termoFiltro.value = '';
  indiceAberturaChaves.value = -1;
  indiceOpcaoAtiva.value = 0;
}

/*
 * Recebe: texto completo atual do campo e posição numérica do cursor.
 * Devolve: nada (void).
 * Por que é usada: verifica se antes do cursor existe uma abertura {{ ainda não fechada para acionar o menu.
 */
function verificarGatilhoVariavel(textoAtual: string, posicaoCursor: number): void {
  const textoAteCursor = textoAtual.slice(0, posicaoCursor);
  const ultimoIndice = textoAteCursor.lastIndexOf('{{');

  if (ultimoIndice === -1) {
    fecharMenuSugestoes();
    return;
  }

  const trechoDigitado = textoAteCursor.slice(ultimoIndice + 2);

  if (trechoDigitado.includes('}}') || trechoDigitado.includes('{') || /\s/.test(trechoDigitado)) {
    fecharMenuSugestoes();
    return;
  }

  indiceAberturaChaves.value = ultimoIndice;
  termoFiltro.value = trechoDigitado;
  indiceOpcaoAtiva.value = 0;
  menuAberto.value = true;
}

/*
 * Recebe: evento nativo de input do textarea.
 * Devolve: nada (void).
 * Por que é usada: atualiza o v-model do texto, sincroniza o scroll e verifica se o gatilho {{ foi digitado.
 */
function aoDigitarNoCampo(evento: Event): void {
  const alvo = evento.target as HTMLTextAreaElement;
  const novoTexto = alvo.value;
  const posicaoCursor = alvo.selectionStart ?? novoTexto.length;

  emit('update:modelValue', novoTexto);
  verificarGatilhoVariavel(novoTexto, posicaoCursor);
  nextTick(sincronizarScrollBackdrop);
}

/*
 * Recebe: evento de teclado ou clique do mouse no textarea.
 * Devolve: nada (void).
 * Por que é usada: reavalia a posição do cursor quando o usuário navega pelo texto sem alterar o conteúdo.
 */
function atualizarPosicaoCursor(evento: KeyboardEvent | MouseEvent): void {
  if (evento instanceof KeyboardEvent) {
    const teclasControleMenu = ['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Tab'];
    if (menuAberto.value && teclasControleMenu.includes(evento.key)) {
      return;
    }
  }

  const alvo = elementoTextarea.value;
  if (!alvo) return;
  verificarGatilhoVariavel(alvo.value, alvo.selectionStart ?? alvo.value.length);
}

/*
 * Recebe: chave identificadora da variável escolhida pelo usuário.
 * Devolve: nada (void).
 * Por que é usada: insere o token {{chave}} no lugar do gatilho aberto e reposiciona o cursor logo após o fechamento.
 */
function selecionarVariavelDoMenu(chave: string): void {
  const textoAtual = props.modelValue || '';
  const alvo = elementoTextarea.value;
  const posicaoCursor = alvo?.selectionStart ?? textoAtual.length;
  const inicio =
    indiceAberturaChaves.value !== -1
      ? indiceAberturaChaves.value
      : textoAtual.lastIndexOf('{{');

  if (inicio === -1) return;

  const antes = textoAtual.slice(0, inicio);
  let depois = textoAtual.slice(posicaoCursor);

  if (depois.startsWith('}}')) {
    depois = depois.slice(2);
  } else if (depois.startsWith('}')) {
    depois = depois.slice(1);
  }

  const tokenFormatado = `{{${chave}}}`;
  const novoTexto = `${antes}${tokenFormatado}${depois}`;
  const novaPosicaoCursor = antes.length + tokenFormatado.length;

  fecharMenuSugestoes();
  emit('update:modelValue', novoTexto);
  emitirConfirmacao();

  nextTick(() => {
    if (elementoTextarea.value) {
      elementoTextarea.value.focus();
      elementoTextarea.value.setSelectionRange(novaPosicaoCursor, novaPosicaoCursor);
      sincronizarScrollBackdrop();
    }
  });
}

/*
 * Recebe: evento de pressionamento de tecla no textarea.
 * Devolve: nada (void).
 * Por que é usada: permite navegar pelas variáveis sugeridas usando as setas do teclado, Enter, Tab e Escape.
 */
function aoPressionarTeclaNoCampo(evento: KeyboardEvent): void {
  if (!menuAberto.value || variaveisFiltradas.value.length === 0) return;

  if (evento.key === 'ArrowDown') {
    evento.preventDefault();
    indiceOpcaoAtiva.value = (indiceOpcaoAtiva.value + 1) % variaveisFiltradas.value.length;
  } else if (evento.key === 'ArrowUp') {
    evento.preventDefault();
    indiceOpcaoAtiva.value =
      (indiceOpcaoAtiva.value - 1 + variaveisFiltradas.value.length) %
      variaveisFiltradas.value.length;
  } else if (evento.key === 'Enter' || evento.key === 'Tab') {
    evento.preventDefault();
    const escolhida = variaveisFiltradas.value[indiceOpcaoAtiva.value];
    if (escolhida) {
      selecionarVariavelDoMenu(escolhida.chave);
    }
  } else if (evento.key === 'Escape') {
    evento.preventDefault();
    fecharMenuSugestoes();
  }
}

/*
 * Recebe: nenhum parâmetro.
 * Devolve: nada (void).
 * Por que é usada: fecha o menu ao sair do campo e dispara a confirmação de alteração para o histórico.
 */
function aoSairDoCampo(): void {
  fecharMenuSugestoes();
  emitirConfirmacao();
}
</script>

<template>
  <div class="vc-campo-texto-variavel">
    <div class="vc-campo-texto-variavel-editor">
      <div class="vc-campo-texto-stack">
        <div
          ref="elementoBackdrop"
          class="vc-campo-texto-backdrop"
          aria-hidden="true"
          data-testid="preview-badges-variaveis"
        >
          <template v-for="segmento in segmentosTexto" :key="segmento.id">
            <mark
              v-if="segmento.ehVariavel"
              :class="[
                'vc-token-inline',
                segmento.ehValida ? 'vc-badge-variavel--valida' : 'vc-badge-variavel--invalida'
              ]"
              :data-testid="segmento.ehValida ? 'badge-variavel-valida' : 'badge-variavel-invalida'"
              :title="
                segmento.ehValida
                  ? t('campoTextoVariavel.variavelValidaTitulo', { chave: segmento.chaveVariavel })
                  : t('campoTextoVariavel.variavelInexistenteTitulo', { chave: segmento.chaveVariavel })
              "
            >{{ segmento.conteudo }}</mark>
            <span v-else>{{ segmento.conteudo }}</span>
          </template>
          <span v-if="(modelValue || '').endsWith('\n')">&nbsp;</span>
        </div>

        <textarea
          ref="elementoTextarea"
          :value="modelValue"
          :rows="linhasResolvidas"
          :placeholder="placeholderResolvido"
          spellcheck="false"
          class="vc-field vc-campo-texto-textarea"
          data-testid="textarea-texto-livre"
          @input="aoDigitarNoCampo"
          @scroll="sincronizarScrollBackdrop"
          @click="atualizarPosicaoCursor"
          @keyup="atualizarPosicaoCursor"
          @keydown="aoPressionarTeclaNoCampo"
          @change="emitirConfirmacao"
          @blur="aoSairDoCampo"
        ></textarea>
      </div>

      <div
        v-if="menuAberto"
        class="vc-menu-variaveis"
        data-testid="menu-sugestoes-variaveis"
        role="listbox"
      >
        <div class="vc-menu-variaveis-topo">
          {{ t('campoTextoVariavel.variaveisDisponiveis') }}
        </div>

        <template v-if="variaveisFiltradas.length > 0">
          <button
            v-for="(variavel, idx) in variaveisFiltradas"
            :key="variavel.chave"
            type="button"
            role="option"
            :aria-selected="idx === indiceOpcaoAtiva"
            :class="[
              'vc-menu-variaveis-item',
              idx === indiceOpcaoAtiva ? 'ativo' : ''
            ]"
            :data-testid="`opcao-variavel-${variavel.chave}`"
            @mousedown.prevent="selecionarVariavelDoMenu(variavel.chave)"
          >
            <span class="vc-badge-variavel vc-badge-variavel--valida">
              &#123;&#123;{{ variavel.chave }}&#125;&#125;
            </span>
            <span class="vc-menu-variaveis-rotulo">
              {{ variavel.nomeCamada || variavel.rotulo }}
            </span>
          </button>
        </template>

        <div
          v-else
          class="vc-menu-variaveis-vazio"
          data-testid="menu-variaveis-vazio"
        >
          {{ t('campoTextoVariavel.nenhumaVariavelEncontrada', { termo: termoFiltro }) }}
        </div>
      </div>
    </div>
  </div>
</template>
