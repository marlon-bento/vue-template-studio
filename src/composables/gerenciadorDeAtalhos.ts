/*
========
Gerenciador explícito de atalhos de teclado e zoom do estúdio (src/composables/gerenciadorDeAtalhos.ts).
Centraliza atalhos estilo Figma/Photoshop: Espaço+Arrastar ou Espaço+Setas para navegação,
Setas (1px) e Shift+Setas (10px) para mover camadas, Alt para exibir distâncias em pixels,
Ctrl+Scroll para zoom no palco, Ctrl+Z (Desfazer), Ctrl+Y/Ctrl+Shift+Z (Refazer),
Ctrl+D (Duplicar) e Delete/Backspace (Excluir).
========
*/
import { ref, type Ref } from 'vue';
import type { CamadaCertificado } from '../types/certificado';

export interface OpcoesGerenciadorDeAtalhos {
  camadaSelecionada: Ref<CamadaCertificado | null>;
  modoPreview: Ref<boolean>;
  zoom: Ref<number>;
  panX?: Ref<number>;
  panY?: Ref<number>;
  aoDesfazer: () => void;
  aoRefazer: () => void;
  aoDuplicar: () => void;
  aoExcluir: () => void;
  aoConfirmarAlteracao: () => void;
  aoCancelarPan?: () => void;
}

/**
 * Gerencia todos os atalhos de teclado e roda do mouse (Ctrl+Scroll) do editor de certificados.
 */
export function gerenciadorDeAtalhos(opcoes: OpcoesGerenciadorDeAtalhos) {
  const espacoPressionado = ref(false);
  const altPressionado = ref(false);

  function elementoEhCampoEditavel(alvo: EventTarget | null): boolean {
    const el = alvo as HTMLElement | null;
    if (!el || !el.tagName) return false;
    const tag = el.tagName.toUpperCase();
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || Boolean(el.isContentEditable);
  }

  function ehEventoTeclaAlt(ev: KeyboardEvent): boolean {
    return (
      ev.key === 'Alt' ||
      ev.key === 'AltGraph' ||
      ev.code === 'AltLeft' ||
      ev.code === 'AltRight'
    );
  }

  /**
   * Sincroniza o estado do Alt a partir de qualquer evento de mouse ou teclado (evita travamentos do navegador/Linux).
   */
  function sincronizarAltPorEvento(altKey: boolean): void {
    if (altPressionado.value !== altKey) {
      altPressionado.value = altKey;
    }
  }

  /**
   * Trata o pressionamento de teclas globais no editor.
   */
  function aoPressionarTecla(ev: KeyboardEvent): void {
    if (ehEventoTeclaAlt(ev) || ev.altKey) {
      altPressionado.value = true;
      if (ehEventoTeclaAlt(ev)) {
        ev.preventDefault();
        return;
      }
    }

    if (elementoEhCampoEditavel(ev.target)) return;

    if (ev.code === 'Space' || ev.key === ' ') {
      ev.preventDefault();
      espacoPressionado.value = true;
      return;
    }

    const ctrl = ev.ctrlKey || ev.metaKey;
    const tecla = ev.key.toLowerCase();

    if (ctrl && tecla === 'z' && !ev.shiftKey) {
      ev.preventDefault();
      opcoes.aoDesfazer();
      return;
    }

    if ((ctrl && tecla === 'y') || (ctrl && ev.shiftKey && tecla === 'z')) {
      ev.preventDefault();
      opcoes.aoRefazer();
      return;
    }

    if (opcoes.modoPreview.value) return;

    if (ctrl && tecla === 'd') {
      ev.preventDefault();
      opcoes.aoDuplicar();
      return;
    }

    const passo = ev.shiftKey || espacoPressionado.value ? 10 : 1;
    const cam = opcoes.camadaSelecionada.value;

    // Se Espaço estiver pressionado e não houver camada selecionada, move o pan do palco com as setas
    if (espacoPressionado.value && !cam && opcoes.panX && opcoes.panY) {
      if (ev.key === 'ArrowLeft') { opcoes.panX.value -= 20; ev.preventDefault(); return; }
      if (ev.key === 'ArrowRight') { opcoes.panX.value += 20; ev.preventDefault(); return; }
      if (ev.key === 'ArrowUp') { opcoes.panY.value -= 20; ev.preventDefault(); return; }
      if (ev.key === 'ArrowDown') { opcoes.panY.value += 20; ev.preventDefault(); return; }
    }

    if (!cam || cam.bloqueada) return;

    if (ev.key === 'ArrowLeft') {
      cam.x -= passo;
      ev.preventDefault();
      opcoes.aoConfirmarAlteracao();
    } else if (ev.key === 'ArrowRight') {
      cam.x += passo;
      ev.preventDefault();
      opcoes.aoConfirmarAlteracao();
    } else if (ev.key === 'ArrowUp') {
      cam.y -= passo;
      ev.preventDefault();
      opcoes.aoConfirmarAlteracao();
    } else if (ev.key === 'ArrowDown') {
      cam.y += passo;
      ev.preventDefault();
      opcoes.aoConfirmarAlteracao();
    } else if (ev.key === 'Delete' || ev.key === 'Backspace') {
      ev.preventDefault();
      opcoes.aoExcluir();
    }
  }

  /**
   * Trata a liberação de teclas modificadoras (Alt e Espaço).
   */
  function aoSoltarTecla(ev: KeyboardEvent): void {
    if (ehEventoTeclaAlt(ev) || !ev.altKey) {
      altPressionado.value = false;
    }
    if (ev.code === 'Space' || ev.key === ' ') {
      espacoPressionado.value = false;
      opcoes.aoCancelarPan?.();
    }
  }

  /**
   * Reseta estados modificadores quando a janela perde o foco.
   */
  function aoPerderFocoJanela(): void {
    altPressionado.value = false;
    espacoPressionado.value = false;
    opcoes.aoCancelarPan?.();
  }

  /**
   * Controla o zoom no palco ao rolar o mouse segurando Ctrl ou Cmd (estilo Figma).
   */
  function aoRolarRodaCanvas(ev: WheelEvent): void {
    if (!ev.ctrlKey && !ev.metaKey) return;
    ev.preventDefault();
    const delta = ev.deltaY < 0 ? 0.08 : -0.08;
    opcoes.zoom.value = Math.min(2, Math.max(0.25, +(opcoes.zoom.value + delta).toFixed(2)));
  }

  /**
   * Registra os listeners globais de teclado e wheel no elemento do palco.
   */
  function registrarListenersAtalhos(elementoPalco?: HTMLElement | null): void {
    window.addEventListener('keydown', aoPressionarTecla);
    window.addEventListener('keyup', aoSoltarTecla);
    window.addEventListener('blur', aoPerderFocoJanela);
    elementoPalco?.addEventListener('wheel', aoRolarRodaCanvas, { passive: false });
  }

  /**
   * Remove todos os listeners registrados para evitar vazamento de memória após unmount.
   */
  function removerListenersAtalhos(elementoPalco?: HTMLElement | null): void {
    window.removeEventListener('keydown', aoPressionarTecla);
    window.removeEventListener('keyup', aoSoltarTecla);
    window.removeEventListener('blur', aoPerderFocoJanela);
    elementoPalco?.removeEventListener('wheel', aoRolarRodaCanvas);
  }

  return {
    espacoPressionado,
    altPressionado,
    sincronizarAltPorEvento,
    aoPressionarTecla,
    aoSoltarTecla,
    aoPerderFocoJanela,
    aoRolarRodaCanvas,
    registrarListenersAtalhos,
    removerListenersAtalhos
  };
}
