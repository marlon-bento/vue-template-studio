/*
========
Utilitários e mocks compartilhados para os testes do vue-template-studio (tests/helpers.ts).
Mocka Canvas 2D (getContext, toDataURL, toBlob, ellipse, setLineDash), carregamento de Image,
jsPDF, URL.createObjectURL e restaura opções globais e idioma padrão (pt_br) entre testes.
========
*/
import { vi } from 'vitest';
import {
  FONTES_PADRAO,
  configureCertificado,
  definirIdioma
} from '../src/index';

export interface MockCanvasContext2D {
  scale: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  restore: ReturnType<typeof vi.fn>;
  translate: ReturnType<typeof vi.fn>;
  rotate: ReturnType<typeof vi.fn>;
  beginPath: ReturnType<typeof vi.fn>;
  closePath: ReturnType<typeof vi.fn>;
  moveTo: ReturnType<typeof vi.fn>;
  lineTo: ReturnType<typeof vi.fn>;
  quadraticCurveTo: ReturnType<typeof vi.fn>;
  ellipse: ReturnType<typeof vi.fn>;
  setLineDash: ReturnType<typeof vi.fn>;
  rect: ReturnType<typeof vi.fn>;
  clip: ReturnType<typeof vi.fn>;
  fill: ReturnType<typeof vi.fn>;
  stroke: ReturnType<typeof vi.fn>;
  fillRect: ReturnType<typeof vi.fn>;
  fillText: ReturnType<typeof vi.fn>;
  drawImage: ReturnType<typeof vi.fn>;
  measureText: ReturnType<typeof vi.fn>;
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  globalAlpha: number;
  font: string;
  textBaseline: string;
  textAlign: string;
}

/*
 * Recebe: nenhum parâmetro.
 * Devolve: objeto MockCanvasContext2D simulado.
 * Por que é usada: instala mock de CanvasRenderingContext2D em HTMLCanvasElement.prototype para happy-dom.
 */
export function instalarMockCanvas2D(): MockCanvasContext2D {
  const ctxMock: MockCanvasContext2D = {
    scale: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    ellipse: vi.fn(),
    setLineDash: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    drawImage: vi.fn(),
    measureText: vi.fn((texto: string) => ({ width: texto.length * 8 })),
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    globalAlpha: 1,
    font: '16px sans-serif',
    textBaseline: 'alphabetic',
    textAlign: 'left'
  };

  HTMLCanvasElement.prototype.getContext = vi.fn(() => ctxMock as unknown as CanvasRenderingContext2D) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,MOCKPNGDATA==');
  HTMLCanvasElement.prototype.toBlob = vi.fn((cb: BlobCallback) => {
    cb(new Blob(['mock-png'], { type: 'image/png' }));
  });

  return ctxMock;
}

/*
 * Recebe: opções com flag de falha e dimensões simuladas da imagem.
 * Devolve: nada (void).
 * Por que é usada: instala mock global para Image permitindo simular sucesso ou falha no carregamento.
 */
export function instalarMockImage(opcoes: { falhar?: boolean; width?: number; height?: number } = {}): void {
  class MockImage {
    width = opcoes.width ?? 800;
    height = opcoes.height ?? 600;
    crossOrigin = '';
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    private _src = '';

    get src(): string {
      return this._src;
    }

    set src(val: string) {
      this._src = val;
      setTimeout(() => {
        if (opcoes.falhar) {
          this.onerror?.();
        } else {
          this.onload?.();
        }
      }, 0);
    }
  }

  vi.stubGlobal('Image', MockImage);
}

/*
 * Recebe: nenhum parâmetro.
 * Devolve: nada (void).
 * Por que é usada: restaura as configurações globais padrão e o idioma 'pt_br' entre as suítes de testes.
 */
export function resetarEstadoCertificado(): void {
  document.body.innerHTML = '';
  definirIdioma('pt_br');
  configureCertificado({
    unstyled: false,
    tema: 'dark',
    locale: 'pt_br',
    mensagensIdioma: {},
    exibirSeletorIdioma: true,
    permitirCriarVariavel: false,
    escalaExportacao: 2,
    escalaPreview: 1.5,
    qualidadeImagem: 0.95,
    zoomInicial: 0.66,
    limiteHistorico: 50,
    fontesDisponiveis: [...FONTES_PADRAO],
    variaveisDisponiveis: [],
    dadosPreview: {},
    labels: {},
    classes: {}
  });
}
