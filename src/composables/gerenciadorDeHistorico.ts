/*
========
Gerenciador explícito de histórico Desfazer/Refazer (src/composables/gerenciadorDeHistorico.ts).
Gerencia uma pilha de snapshots clonados com limite de memória configurável,
isolamento total de referências e proteção contra duplicatas consecutivas.
========
*/
import { ref, shallowRef, computed } from 'vue';
import { clonarSeguro } from '../utils/variaveis';

/*
 * Recebe: quantidade máxima de estados mantidos na memória (mínimo 2).
 * Devolve: controles reativos e funções para iniciar, registrar, desfazer, refazer e limpar o histórico.
 * Por que é usada: gerencia a pilha de estados do editor para suportar Ctrl+Z e Ctrl+Y sem serializar base64 a cada restauração.
 */
export function gerenciadorDeHistorico<T>(limiteMaximo = 50) {
  // Limite mínimo de segurança para a pilha de histórico
  const limiteSeguro = Math.max(2, limiteMaximo);

  // Pilha rasa de snapshots clonados em memória (evita proxies profundos e UnwrapRefSimple em T)
  const pilha = shallowRef<T[]>([]);

  // Assinaturas serializadas usadas apenas para evitar duplicatas consecutivas
  const assinaturas = ref<string[]>([]);

  // Posição ativa na pilha de histórico
  const indiceAtual = ref<number>(-1);

  const podeDesfazer = computed(() => indiceAtual.value > 0);
  const podeRefazer = computed(
    () => indiceAtual.value >= 0 && indiceAtual.value < pilha.value.length - 1
  );
  const tamanho = computed(() => pilha.value.length);

  /*
   * Recebe: estado inicial do documento.
   * Devolve: nada (void).
   * Por que é usada: inicializa o histórico com o estado base, limpando entradas anteriores.
   */
  function iniciar(estadoInicial: T): void {
    const copia = clonarSeguro(estadoInicial);
    pilha.value = [copia];
    assinaturas.value = [JSON.stringify(copia)];
    indiceAtual.value = 0;
  }

  /*
   * Recebe: novo estado após uma alteração do usuário.
   * Devolve: nada (void).
   * Por que é usada: registra um novo snapshot no histórico, descartando o ramo futuro caso tenha havido desfazer.
   */
  function registrar(novoEstado: T): void {
    const copia = clonarSeguro(novoEstado);
    const assinatura = JSON.stringify(copia);

    if (pilha.value.length === 0) {
      pilha.value = [copia];
      assinaturas.value = [assinatura];
      indiceAtual.value = 0;
      return;
    }

    if (indiceAtual.value >= 0 && assinaturas.value[indiceAtual.value] === assinatura) {
      return;
    }

    const novaPilha =
      indiceAtual.value < pilha.value.length - 1
        ? pilha.value.slice(0, indiceAtual.value + 1)
        : [...pilha.value];

    const novasAssinaturas =
      indiceAtual.value < assinaturas.value.length - 1
        ? assinaturas.value.slice(0, indiceAtual.value + 1)
        : [...assinaturas.value];

    novaPilha.push(copia);
    novasAssinaturas.push(assinatura);

    if (novaPilha.length > limiteSeguro) {
      novaPilha.shift();
      novasAssinaturas.shift();
    }

    pilha.value = novaPilha;
    assinaturas.value = novasAssinaturas;
    indiceAtual.value = novaPilha.length - 1;
  }

  /*
   * Recebe: nenhum parâmetro.
   * Devolve: cópia isolada do estado anterior ou null se não houver o que desfazer.
   * Por que é usada: restaura o passo anterior no histórico (Ctrl+Z).
   */
  function desfazer(): T | null {
    if (!podeDesfazer.value) return null;
    indiceAtual.value--;
    return clonarSeguro(pilha.value[indiceAtual.value]);
  }

  /*
   * Recebe: nenhum parâmetro.
   * Devolve: cópia isolada do próximo estado ou null se não houver o que refazer.
   * Por que é usada: avança um passo no histórico (Ctrl+Y).
   */
  function refazer(): T | null {
    if (!podeRefazer.value) return null;
    indiceAtual.value++;
    return clonarSeguro(pilha.value[indiceAtual.value]);
  }

  /*
   * Recebe: nenhum parâmetro.
   * Devolve: nada (void).
   * Por que é usada: limpa completamente a pilha de histórico e suas assinaturas.
   */
  function limpar(): void {
    pilha.value = [];
    assinaturas.value = [];
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