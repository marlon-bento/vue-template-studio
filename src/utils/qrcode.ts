/*
========
Gerador de matriz e paths SVG de QR Code customizável (src/utils/qrcode.ts).
Suporta estilos de módulos (quadrado, arredondado, pontos/dots), estilos de olhos/cantos
(quadrado, arredondado, círculo), área central limpa para Logo e nível de correção H.
========
*/
import QRCode from 'qrcode';
import type { EstiloModuloQr, EstiloOlhoQr } from '../types/certificado';

export interface MatrizQrCode {
  tamanho: number;
  modulos: boolean[];
}

export interface OpcoesSvgQrCode {
  estiloModulos?: EstiloModuloQr;
  estiloOlhos?: EstiloOlhoQr;
  temLogo?: boolean;
  tamanhoLogoPct?: number;
}

export interface SvgQrCodeEstilizado {
  viewBox: string;
  path: string;
  pathOlhos: string;
  tamanho: number;
}

/**
 * Verifica se a coordenada (x, y) faz parte de um dos 3 olhos de detecção (7x7) nos cantos.
 */
export function ehModuloOlhoQr(x: number, y: number, tamanho: number): boolean {
  const cantoSupEsq = x < 7 && y < 7;
  const cantoSupDir = x >= tamanho - 7 && y < 7;
  const cantoInfEsq = x < 7 && y >= tamanho - 7;
  return cantoSupEsq || cantoSupDir || cantoInfEsq;
}

/**
 * Verifica se o módulo cai dentro da zona central reservada para a logo.
 */
export function ehModuloAreaLogoQr(
  x: number,
  y: number,
  tamanho: number,
  temLogo = false,
  tamanhoLogoPct = 22
): boolean {
  if (!temLogo) return false;
  const pctSeguro = Math.max(12, Math.min(30, tamanhoLogoPct)) / 100;
  const raioModulos = (tamanho * pctSeguro) / 2 + 0.65;
  const centro = tamanho / 2;
  const cx = x + 0.5;
  const cy = y + 0.5;
  return Math.abs(cx - centro) <= raioModulos && Math.abs(cy - centro) <= raioModulos;
}

/**
 * Gera a matriz booleana de módulos de um QR Code (usa nível 'H' por padrão para suportar logo no centro).
 */
export function obterMatrizQrCode(
  conteudo: string,
  nivelCorrecao: 'L' | 'M' | 'Q' | 'H' = 'H'
): MatrizQrCode {
  const textoSeguro = (conteudo || '').trim() || 'https://vue-template-studio.dev';
  const qr = QRCode.create(textoSeguro, { errorCorrectionLevel: nivelCorrecao });
  const tamanho = qr.modules.size;
  const modulos: boolean[] = [];

  for (let i = 0; i < qr.modules.data.length; i++) {
    modulos.push(Boolean(qr.modules.data[i]));
  }

  return { tamanho, modulos };
}

function pathRetanguloArredondadoSvg(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): string {
  const raio = Math.max(0, Math.min(r, w / 2, h / 2));
  if (raio <= 0.01) {
    return `M${x},${y}h${w}v${h}h-${w}z`;
  }
  const x2 = +(x + w).toFixed(3);
  const y2 = +(y + h).toFixed(3);
  const rx = +raio.toFixed(3);
  return [
    `M${+(x + rx).toFixed(3)},${y}`,
    `H${+(x2 - rx).toFixed(3)}`,
    `A${rx},${rx} 0 0 1 ${x2},${+(y + rx).toFixed(3)}`,
    `V${+(y2 - rx).toFixed(3)}`,
    `A${rx},${rx} 0 0 1 ${+(x2 - rx).toFixed(3)},${y2}`,
    `H${+(x + rx).toFixed(3)}`,
    `A${rx},${rx} 0 0 1 ${x},${+(y2 - rx).toFixed(3)}`,
    `V${+(y + rx).toFixed(3)}`,
    `A${rx},${rx} 0 0 1 ${+(x + rx).toFixed(3)},${y}Z`
  ].join('');
}

function pathCirculoSvg(cx: number, cy: number, r: number): string {
  const rx = +r.toFixed(3);
  const xEsq = +(cx - r).toFixed(3);
  const yC = +cy.toFixed(3);
  return `M${xEsq},${yC}a${rx},${rx} 0 1,0 ${+(r * 2).toFixed(3)},0a${rx},${rx} 0 1,0 -${+(r * 2).toFixed(3)},0Z`;
}

function gerarPathOlhoUnicoSvg(ox: number, oy: number, estilo: EstiloOlhoQr): string {
  if (estilo === 'circulo') {
    const cx = ox + 3.5;
    const cy = oy + 3.5;
    return [
      `M${ox},${cy}a3.5,3.5 0 1,0 7,0a3.5,3.5 0 1,0 -7,0Z`,
      `M${ox + 1},${cy}a2.5,2.5 0 1,1 5,0a2.5,2.5 0 1,1 -5,0Z`,
      pathCirculoSvg(cx, cy, 1.5)
    ].join('');
  }

  const rExt = estilo === 'arredondado' ? 1.8 : 0;
  const rInt = estilo === 'arredondado' ? 1.1 : 0;
  const rMiolo = estilo === 'arredondado' ? 0.75 : 0;

  return [
    pathRetanguloArredondadoSvg(ox, oy, 7, 7, rExt),
    pathRetanguloArredondadoSvg(ox + 1, oy + 1, 5, 5, rInt),
    pathRetanguloArredondadoSvg(ox + 2, oy + 2, 3, 3, rMiolo)
  ].join('');
}

/**
 * Converte a matriz do QR Code em paths SVG separados para módulos e olhos (cantos).
 */
export function gerarPathSvgQrCode(
  conteudo: string,
  opcoes: OpcoesSvgQrCode = {}
): SvgQrCodeEstilizado {
  const estiloModulos = opcoes.estiloModulos || 'quadrado';
  const estiloOlhos = opcoes.estiloOlhos || 'quadrado';
  const temLogo = Boolean(opcoes.temLogo);
  const tamanhoLogoPct = opcoes.tamanhoLogoPct ?? 22;

  const { tamanho, modulos } = obterMatrizQrCode(conteudo, 'H');
  const partesModulos: string[] = [];

  for (let y = 0; y < tamanho; y++) {
    for (let x = 0; x < tamanho; x++) {
      if (!modulos[y * tamanho + x]) continue;
      if (ehModuloOlhoQr(x, y, tamanho)) continue;
      if (ehModuloAreaLogoQr(x, y, tamanho, temLogo, tamanhoLogoPct)) continue;

      if (estiloModulos === 'pontos') {
        partesModulos.push(pathCirculoSvg(x + 0.5, y + 0.5, 0.42));
      } else if (estiloModulos === 'arredondado') {
        partesModulos.push(pathRetanguloArredondadoSvg(x + 0.04, y + 0.04, 0.92, 0.92, 0.32));
      } else {
        partesModulos.push(`M${x},${y}h1v1h-1z`);
      }
    }
  }

  const partesOlhos = [
    gerarPathOlhoUnicoSvg(0, 0, estiloOlhos),
    gerarPathOlhoUnicoSvg(tamanho - 7, 0, estiloOlhos),
    gerarPathOlhoUnicoSvg(0, tamanho - 7, estiloOlhos)
  ];

  const pathModulos = partesModulos.join('');
  const pathOlhos = partesOlhos.join('');

  return {
    viewBox: `0 0 ${tamanho} ${tamanho}`,
    path: pathModulos,
    pathOlhos,
    tamanho
  };
}
