/*
========
Gerenciador explícito de histórico Desfazer/Refazer (src/composables/gerenciadorDeHistorico.ts).
Gerencia uma pilha de snapshots serializados com limite de memória configurável,
isolamento total de referências e proteção contra duplicatas consecutivas.
========
*/
import { ref, computed } from 'vue';

/**
 * Gerencia uma pilha de estados serializados para suportar desfazer (Ctrl+Z) e refazer (Ctrl+Y).
 * @param limiteMaximo - Quantidade máxima de estados mantidos na memória (mínimo 2).
 */
export function gerenciadorDeHistorico<T>(limiteMaximo = 50) {
  const limiteSeguro = Math.max(2, limiteMaximo);
  const pilha = ref<string[]>([]);
  const indiceAtual = ref<number>(-1);

  const podeDesfazer = computed(() => indiceAtual.value > 0);
  const podeRefazer = computed(
    () => indiceAtual.value >= 0 && indiceAtual.value < pilha.value.length - 1
  );
  const tamanho = computed(() => pilha.value.length);

  /**
   * Inicializa o histórico com o estado base, limpando entradas anteriores.
   */
  function iniciar(estadoInicial: T): void {
    pilha.value = [JSON.stringify(estadoInicial)];
    indiceAtual.value = 0;
  }

  /**
   * Registra um novo snapshot no histórico, descartando o ramo futuro caso tenha havido desfazer.
   */
  function registrar(novoEstado: T): void {
    const serializado = JSON.stringify(novoEstado);

    if (pilha.value.length === 0) {
      iniciar(novoEstado);
      return;
    }

    if (indiceAtual.value >= 0 && pilha.value[indiceAtual.value] === serializado) {
      return;
    }

    if (indiceAtual.value < pilha.value.length - 1) {
      pilha.value = pilha.value.slice(0, indiceAtual.value + 1);
    }

    pilha.value.push(serializado);

    if (pilha.value.length > limiteSeguro) {
      pilha.value.shift();
    }

    indiceAtual.value = pilha.value.length - 1;
  }

  /**
   * Volta um passo no histórico e retorna uma cópia isolada do estado restaurado.
   */
  function desfazer(): T | null {
    if (!podeDesfazer.value) return null;
    indiceAtual.value--;
    return JSON.parse(pilha.value[indiceAtual.value]) as T;
  }

  /**
   * Avança um passo no histórico e retorna uma cópia isolada do estado restaurado.
   */
  function refazer(): T | null {
    if (!podeRefazer.value) return null;
    indiceAtual.value++;
    return JSON.parse(pilha.value[indiceAtual.value]) as T;
  }

  /**
   * Limpa completamente a pilha de histórico.
   */
  function limpar(): void {
    pilha.value = [];
    indiceAtual.value = -1;
  }

  return {
    podeDesfazer,
    podeRefazer,
    tamanho,
    indiceAtual,
    iniciar,
    registrar,
    desfazer,
    refazer,
    limpar
  };
}

export const useHistorico = gerenciadorDeHistorico;
