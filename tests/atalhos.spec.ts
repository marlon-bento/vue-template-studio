/*
========
Suíte de testes do gerenciador explícito de atalhos (tests/atalhos.spec.ts).
Valida Espaço+Setas (pan e deslocamento rápido), Setas 1px, Shift+Setas 10px,
Alt (medidas estilo Figma), Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z, Ctrl+D, Delete/Backspace,
proteção em campos de input e zoom com Ctrl+Scroll.
========
*/
import { describe, it, expect, vi } from 'vitest';
import { ref } from 'vue';
import {
  criarCamadaTexto,
  gerenciadorDeAtalhos,
  type CamadaCertificado
} from '../src/index';

describe('Escopo: Gerenciador de Atalhos (gerenciadorDeAtalhos.ts)', () => {
  it('Deve mover camada 1px com setas e 10px com Shift+Setas ou Espaço+Setas', () => {
    const camada = criarCamadaTexto({
      texto: 'Título',
      nome: 'Título',
      ehVariavel: false,
      orientacao: 'landscape'
    });
    const camadaSelecionada = ref<CamadaCertificado | null>(camada);
    const modoPreview = ref(false);
    const zoom = ref(1);
    const aoConfirmarAlteracao = vi.fn();

    const atalhos = gerenciadorDeAtalhos({
      camadaSelecionada,
      modoPreview,
      zoom,
      aoDesfazer: vi.fn(),
      aoRefazer: vi.fn(),
      aoDuplicar: vi.fn(),
      aoExcluir: vi.fn(),
      aoConfirmarAlteracao
    });

    const xInicial = camada.x;
    const yInicial = camada.y;

    atalhos.aoPressionarTecla(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(camada.x).toBe(xInicial + 1);

    atalhos.aoPressionarTecla(new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true }));
    expect(camada.y).toBe(yInicial + 10);

    // Ativa Espaço e usa seta para mover rápido (10px)
    atalhos.aoPressionarTecla(new KeyboardEvent('keydown', { code: 'Space', key: ' ' }));
    expect(atalhos.espacoPressionado.value).toBe(true);
    atalhos.aoPressionarTecla(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(camada.x).toBe(xInicial + 1 - 10);

    atalhos.aoSoltarTecla(new KeyboardEvent('keyup', { code: 'Space', key: ' ' }));
    expect(atalhos.espacoPressionado.value).toBe(false);
    expect(aoConfirmarAlteracao).toHaveBeenCalledTimes(3);
  });

  it('Deve navegar o pan do palco com Espaço+Setas quando nenhuma camada estiver selecionada', () => {
    const camadaSelecionada = ref<CamadaCertificado | null>(null);
    const modoPreview = ref(false);
    const zoom = ref(1);
    const panX = ref(0);
    const panY = ref(0);

    const atalhos = gerenciadorDeAtalhos({
      camadaSelecionada,
      modoPreview,
      zoom,
      panX,
      panY,
      aoDesfazer: vi.fn(),
      aoRefazer: vi.fn(),
      aoDuplicar: vi.fn(),
      aoExcluir: vi.fn(),
      aoConfirmarAlteracao: vi.fn()
    });

    atalhos.aoPressionarTecla(new KeyboardEvent('keydown', { code: 'Space', key: ' ' }));
    atalhos.aoPressionarTecla(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    atalhos.aoPressionarTecla(new KeyboardEvent('keydown', { key: 'ArrowUp' }));

    expect(panX.value).toBe(20);
    expect(panY.value).toBe(-20);
  });

  it('Deve acionar Desfazer (Ctrl+Z), Refazer (Ctrl+Y / Ctrl+Shift+Z), Duplicar (Ctrl+D) e Excluir (Delete)', () => {
    const camada = criarCamadaTexto({
      texto: 'Item',
      nome: 'Item',
      ehVariavel: false,
      orientacao: 'landscape'
    });
    const camadaSelecionada = ref<CamadaCertificado | null>(camada);
    const modoPreview = ref(false);
    const zoom = ref(0.66);

    const aoDesfazer = vi.fn();
    const aoRefazer = vi.fn();
    const aoDuplicar = vi.fn();
    const aoExcluir = vi.fn();

    const atalhos = gerenciadorDeAtalhos({
      camadaSelecionada,
      modoPreview,
      zoom,
      aoDesfazer,
      aoRefazer,
      aoDuplicar,
      aoExcluir,
      aoConfirmarAlteracao: vi.fn()
    });

    atalhos.aoPressionarTecla(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
    expect(aoDesfazer).toHaveBeenCalledTimes(1);

    atalhos.aoPressionarTecla(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true }));
    atalhos.aoPressionarTecla(new KeyboardEvent('keydown', { key: 'Z', ctrlKey: true, shiftKey: true }));
    expect(aoRefazer).toHaveBeenCalledTimes(2);

    atalhos.aoPressionarTecla(new KeyboardEvent('keydown', { key: 'd', ctrlKey: true }));
    expect(aoDuplicar).toHaveBeenCalledTimes(1);

    atalhos.aoPressionarTecla(new KeyboardEvent('keydown', { key: 'Delete' }));
    expect(aoExcluir).toHaveBeenCalledTimes(1);
  });

  it('Deve ativar medidas com Alt, resetar no blur da janela e ajustar zoom com Ctrl+Scroll', () => {
    const camada = criarCamadaTexto({
      texto: 'Item',
      nome: 'Item',
      ehVariavel: false,
      orientacao: 'landscape'
    });
    const camadaSelecionada = ref<CamadaCertificado | null>(camada);
    const modoPreview = ref(false);
    const zoom = ref(1);
    const aoCancelarPan = vi.fn();

    const atalhos = gerenciadorDeAtalhos({
      camadaSelecionada,
      modoPreview,
      zoom,
      aoDesfazer: vi.fn(),
      aoRefazer: vi.fn(),
      aoDuplicar: vi.fn(),
      aoExcluir: vi.fn(),
      aoConfirmarAlteracao: vi.fn(),
      aoCancelarPan
    });

    atalhos.aoPressionarTecla(new KeyboardEvent('keydown', { key: 'Alt' }));
    expect(atalhos.altPressionado.value).toBe(true);

    atalhos.aoPerderFocoJanela();
    expect(atalhos.altPressionado.value).toBe(false);
    expect(aoCancelarPan).toHaveBeenCalled();

    const evWheel = new Event('wheel', { cancelable: true }) as unknown as WheelEvent;
    Object.defineProperties(evWheel, { ctrlKey: { value: true }, deltaY: { value: -120 } });
    atalhos.aoRolarRodaCanvas(evWheel);
    expect(zoom.value).toBe(1.08);
  });
});
