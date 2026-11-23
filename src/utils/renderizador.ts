/*
========
Motor de renderização Canvas 2D nativo do vue-template-studio (src/utils/renderizador.ts).
Desenha fundo, retângulos/molduras, círculos/elipses, linhas, setas (com pontas configuráveis),
imagens com clip, QR Codes dinâmicos customizáveis (módulos, olhos e logo central)
e textos multilinha com quebra automática, alinhamento horizontal/vertical, rotação e opacidade.
========
*/
import type {
  CamadaCertificado,
  DadosCertificado,
  EstiloBorda,
  OrientacaoCertificado,
  TemplateCertificado
} from '../types/certificado';
import { normalizarDirecaoPontaSeta } from '../composables/gerenciadorDeCamadas';
import {
  ehModuloAreaLogoQr,
  ehModuloOlhoQr,
  normalizarEstiloModuloQr,
  normalizarEstiloOlhoQr,
  obterMatrizQrCode
} from './qrcode';
import {
  enriquecerDadosComLinkQrCode,
  resolverConteudoInternoQrCode,
  resolverVariaveisTexto
} from './variaveis';

// Dimensões lógicas padrão em pixels (96 DPI) para folha A4
export const DIMENSOES_A4: Record<OrientacaoCertificado, { largura: number; altura: number }> = {
  landscape: { largura: 1123, altura: 794 },
  portrait: { largura: 794, altura: 1123 }
};

/**
 * Carrega uma imagem a partir de URL ou Data URL com suporte a CORS.
 */
export function carregarElementoImagem(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src || typeof Image === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    if (!src.startsWith('data:') && !src.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Configura o padrão de tracejado (solid, dashed, dotted) no contexto 2D com segurança.
 */
export function aplicarEstiloTracoCanvas(
  ctx: CanvasRenderingContext2D,
  estilo: EstiloBorda | undefined,
  espessura: number
): void {
  if (typeof ctx.setLineDash !== 'function') return;
  const esp = Math.max(1, espessura);
  if (estilo === 'dashed') {
    ctx.setLineDash([esp * 3, esp * 2]);
  } else if (estilo === 'dotted') {
    ctx.setLineDash([esp, esp * 1.5]);
  } else {
    ctx.setLineDash([]);
  }
}

/**
 * Traça um retângulo com cantos arredondados no contexto 2D.
 */
export function trazarRetanguloArredondado(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const raio = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + raio, y);
  ctx.lineTo(x + w - raio, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + raio);
  ctx.lineTo(x + w, y + h - raio);
  ctx.quadraticCurveTo(x + w, y + h, x + w - raio, y + h);
  ctx.lineTo(x + raio, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - raio);
  ctx.lineTo(x, y + raio);
  ctx.quadraticCurveTo(x, y, x + raio, y);
  ctx.closePath();
}

/**
 * Traça uma elipse ou círculo inscrito na caixa informada.
 */
export function trazarElipseInscrita(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  const rx = Math.max(0.5, w / 2);
  const ry = Math.max(0.5, h / 2);
  const cx = x + rx;
  const cy = y + ry;

  ctx.beginPath();
  if (typeof ctx.ellipse === 'function') {
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  } else {
    ctx.moveTo(cx, y);
    ctx.quadraticCurveTo(x + w, y, x + w, cy);
    ctx.quadraticCurveTo(x + w, y + h, cx, y + h);
    ctx.quadraticCurveTo(x, y + h, x, cy);
    ctx.quadraticCurveTo(x, y, cx, y);
  }
  ctx.closePath();
}

/**
 * Desenha uma camada de linha ou seta horizontal centralizada na caixa da camada.
 */
export function desenharLinhaOuSetaCanvas(
  ctx: CanvasRenderingContext2D,
  camada: CamadaCertificado
): void {
  const espessura = Math.max(1, camada.espessuraBorda ?? 3);
  const cor = camada.corBorda || camada.corPreenchimento || '#0f172a';
  const cy = camada.y + camada.altura / 2;
  const tamanhoPonta = Math.min(
    Math.max(10, espessura * 3.2),
    camada.largura * 0.4,
    Math.max(12, camada.altura * 0.8)
  );

  const ehSeta = camada.tipo === 'seta';
  const direcao = normalizarDirecaoPontaSeta(camada.pontaSeta);
  const temPontaEsquerda = ehSeta && (direcao === 'esquerda' || direcao === 'ambas');
  const temPontaDireita = ehSeta && (direcao === 'direita' || direcao === 'ambas');

  const inicioX = camada.x + (temPontaEsquerda ? tamanhoPonta * 0.7 : 0);
  const fimX = camada.x + camada.largura - (temPontaDireita ? tamanhoPonta * 0.7 : 0);

  ctx.strokeStyle = cor;
  ctx.fillStyle = cor;
  ctx.lineWidth = espessura;
  aplicarEstiloTracoCanvas(ctx, camada.estiloBorda, espessura);

  ctx.beginPath();
  ctx.moveTo(inicioX, cy);
  ctx.lineTo(fimX, cy);
  ctx.stroke();

  aplicarEstiloTracoCanvas(ctx, 'solid', espessura);

  if (temPontaDireita) {
    const xPonta = camada.x + camada.largura;
    ctx.beginPath();
    ctx.moveTo(xPonta, cy);
    ctx.lineTo(xPonta - tamanhoPonta, cy - tamanhoPonta * 0.55);
    ctx.lineTo(xPonta - tamanhoPonta, cy + tamanhoPonta * 0.55);
    ctx.closePath();
    ctx.fill();
  }

  if (temPontaEsquerda) {
    const xPonta = camada.x;
    ctx.beginPath();
    ctx.moveTo(xPonta, cy);
    ctx.lineTo(xPonta + tamanhoPonta, cy - tamanhoPonta * 0.55);
    ctx.lineTo(xPonta + tamanhoPonta, cy + tamanhoPonta * 0.55);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * Quebra texto multilinha respeitando a largura máxima e quebrando palavras muito longas.
 */
export function quebrarLinhasTexto(
  ctx: CanvasRenderingContext2D,
  texto: string,
  larguraMaxima: number
): string[] {
  const larguraSegura = Math.max(10, larguraMaxima);
  const paragrafos = texto.split('\n');
  const linhas: string[] = [];

  for (const paragrafo of paragrafos) {
    if (!paragrafo) {
      linhas.push('');
      continue;
    }
    const palavras = paragrafo.split(' ');
    let linhaAtual = '';

    for (const palavra of palavras) {
      const teste = linhaAtual ? `${linhaAtual} ${palavra}` : palavra;
      if (ctx.measureText(teste).width <= larguraSegura) {
        linhaAtual = teste;
      } else {
        if (linhaAtual) {
          linhas.push(linhaAtual);
          linhaAtual = '';
        }
        if (ctx.measureText(palavra).width > larguraSegura) {
          let pedaco = '';
          for (const char of palavra) {
            if (ctx.measureText(pedaco + char).width <= larguraSegura || !pedaco) {
              pedaco += char;
            } else {
              linhas.push(pedaco);
              pedaco = char;
            }
          }
          linhaAtual = pedaco;
        } else {
          linhaAtual = palavra;
        }
      }
    }

    if (linhaAtual || paragrafo === '') {
      linhas.push(linhaAtual);
    }
  }
  return linhas;
}

/**
 * Desenha uma imagem dentro de uma caixa respeitando cover, contain ou fill.
 */
export function desenharImagemAjustada(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  ajuste: string
): void {
  if (!img.width || !img.height) {
    ctx.drawImage(img, x, y, w, h);
    return;
  }

  if (ajuste === 'fill' || ajuste === '100% 100%') {
    ctx.drawImage(img, x, y, w, h);
    return;
  }

  const propImg = img.width / img.height;
  const propCaixa = w / h;
  let dw = w;
  let dh = h;
  let dx = x;
  let dy = y;

  if (ajuste === 'cover') {
    if (propImg > propCaixa) {
      dh = h;
      dw = h * propImg;
      dx = x - (dw - w) / 2;
    } else {
      dw = w;
      dh = w / propImg;
      dy = y - (dh - h) / 2;
    }
  } else {
    if (propImg > propCaixa) {
      dw = w;
      dh = w / propImg;
      dy = y + (h - dh) / 2;
    } else {
      dh = h;
      dw = h * propImg;
      dx = x + (w - dw) / 2;
    }
  }
  ctx.drawImage(img, dx, dy, dw, dh);
}

/*
 * Recebe: template, dados dinâmicos, fator de escala e dimensões customizadas opcionais.
 * Devolve: Promise<HTMLCanvasElement> com o template renderizado.
 * Por que é usada: renderiza o template em Canvas 2D sem depender de estado global mutável.
 */
export async function renderizarParaCanvas2D(
  template: TemplateCertificado,
  dados: DadosCertificado = {},
  escala = 2,
  dimensoesCustom?: { largura: number; altura: number }
): Promise<HTMLCanvasElement> {
  const orientacao = template.orientacao === 'portrait' ? 'portrait' : 'landscape';

  // Dimensões finais usadas no canvas, priorizando o valor customizado recebido por parâmetro
  const dim = dimensoesCustom ?? DIMENSOES_A4[orientacao] ?? DIMENSOES_A4.landscape;
  const canvas = document.createElement('canvas');
  canvas.width = dim.largura * escala;
  canvas.height = dim.altura * escala;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.scale(escala, escala);

  // Fundo sólido
  ctx.fillStyle = template.fundoCor || '#ffffff';
  ctx.fillRect(0, 0, dim.largura, dim.altura);

  // Imagem de fundo (com clip da folha para evitar vazamento no modo cover)
  if (template.fundoImagem) {
    const imgFundo = await carregarElementoImagem(template.fundoImagem);
    if (imgFundo) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, dim.largura, dim.altura);
      ctx.clip();
      desenharImagemAjustada(
        ctx,
        imgFundo,
        0,
        0,
        dim.largura,
        dim.altura,
        template.fundoAjuste || 'cover'
      );
      ctx.restore();
    }
  }

  // Camadas ordenadas (do fundo para o topo)
  for (const camada of template.camadas || []) {
    if (!camada.visivel) continue;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, (camada.opacidade ?? 100) / 100));

    const cx = camada.x + camada.largura / 2;
    const cy = camada.y + camada.altura / 2;
    if (camada.rotacao) {
      ctx.translate(cx, cy);
      ctx.rotate((camada.rotacao * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }

    if (camada.tipo === 'forma') {
      const espessura = camada.espessuraBorda ?? 0;
      const raio = camada.raioBorda || 0;

      if (!camada.semPreenchimento) {
        trazarRetanguloArredondado(ctx, camada.x, camada.y, camada.largura, camada.altura, raio);
        ctx.fillStyle = camada.corPreenchimento || '#ffffff';
        ctx.fill();
      }
      if (espessura > 0) {
        const inset = espessura / 2;
        aplicarEstiloTracoCanvas(ctx, camada.estiloBorda, espessura);
        trazarRetanguloArredondado(
          ctx,
          camada.x + inset,
          camada.y + inset,
          Math.max(1, camada.largura - espessura),
          Math.max(1, camada.altura - espessura),
          Math.max(0, raio - inset)
        );
        ctx.lineWidth = espessura;
        ctx.strokeStyle = camada.corBorda || '#000000';
        ctx.stroke();
        aplicarEstiloTracoCanvas(ctx, 'solid', espessura);
      }
    } else if (camada.tipo === 'circulo') {
      const espessura = camada.espessuraBorda ?? 0;
      if (!camada.semPreenchimento) {
        trazarElipseInscrita(ctx, camada.x, camada.y, camada.largura, camada.altura);
        ctx.fillStyle = camada.corPreenchimento || '#ffffff';
        ctx.fill();
      }
      if (espessura > 0) {
        const inset = espessura / 2;
        aplicarEstiloTracoCanvas(ctx, camada.estiloBorda, espessura);
        trazarElipseInscrita(
          ctx,
          camada.x + inset,
          camada.y + inset,
          Math.max(1, camada.largura - espessura),
          Math.max(1, camada.altura - espessura)
        );
        ctx.lineWidth = espessura;
        ctx.strokeStyle = camada.corBorda || '#000000';
        ctx.stroke();
        aplicarEstiloTracoCanvas(ctx, 'solid', espessura);
      }
    } else if (camada.tipo === 'linha' || camada.tipo === 'seta') {
      desenharLinhaOuSetaCanvas(ctx, camada);
    } else if (camada.tipo === 'imagem' && camada.src) {
      const img = await carregarElementoImagem(camada.src);
      if (img) {
        trazarRetanguloArredondado(
          ctx,
          camada.x,
          camada.y,
          camada.largura,
          camada.altura,
          camada.raioImagem || 0
        );
        ctx.clip();
        desenharImagemAjustada(
          ctx,
          img,
          camada.x,
          camada.y,
          camada.largura,
          camada.altura,
          camada.ajusteImagem || 'contain'
        );
      }
    } else if (camada.tipo === 'qrcode') {
      const conteudoResolvido = resolverConteudoInternoQrCode(camada, dados, true);
      const { tamanho, modulos } = obterMatrizQrCode(conteudoResolvido, 'H');
      const pad = camada.margemQr ?? 6;
      const raioCaixa = camada.raioFundoQr || 0;
      const estiloModulos = normalizarEstiloModuloQr(camada.estiloModulosQr);
      const estiloOlhos = normalizarEstiloOlhoQr(camada.estiloOlhosQr);
      const corModulos = camada.corQr || '#0f172a';
      const corOlhos = camada.corOlhosQr || corModulos;
      const corFundo = camada.corFundoQr || '#ffffff';
      const temLogo = Boolean(camada.logoQr);
      const tamanhoLogoPct = Math.max(12, Math.min(30, camada.tamanhoLogoQr ?? 22));

      if (!camada.fundoTransparenteQr) {
        ctx.fillStyle = corFundo;
        if (raioCaixa > 0) {
          trazarRetanguloArredondado(
            ctx,
            camada.x,
            camada.y,
            camada.largura,
            camada.altura,
            raioCaixa
          );
          ctx.fill();
        } else {
          ctx.fillRect(camada.x, camada.y, camada.largura, camada.altura);
        }
      }

      const areaUtil = Math.max(10, Math.min(camada.largura, camada.altura) - pad * 2);
      const celula = areaUtil / tamanho;
      const offsetX = camada.x + (camada.largura - areaUtil) / 2;
      const offsetY = camada.y + (camada.altura - areaUtil) / 2;

      // 1. Módulos internos
      ctx.fillStyle = corModulos;
      for (let my = 0; my < tamanho; my++) {
        for (let mx = 0; mx < tamanho; mx++) {
          if (!modulos[my * tamanho + mx]) continue;
          if (ehModuloOlhoQr(mx, my, tamanho)) continue;
          if (ehModuloAreaLogoQr(mx, my, tamanho, temLogo, tamanhoLogoPct)) continue;

          const px = offsetX + mx * celula;
          const py = offsetY + my * celula;

          if (estiloModulos === 'pontos') {
            trazarElipseInscrita(
              ctx,
              px + celula * 0.08,
              py + celula * 0.08,
              celula * 0.84,
              celula * 0.84
            );
            ctx.fill();
          } else if (estiloModulos === 'arredondado') {
            trazarRetanguloArredondado(
              ctx,
              px + celula * 0.04,
              py + celula * 0.04,
              celula * 0.92,
              celula * 0.92,
              celula * 0.32
            );
            ctx.fill();
          } else {
            ctx.fillRect(
              px,
              py,
              Math.ceil(celula * 100) / 100,
              Math.ceil(celula * 100) / 100
            );
          }
        }
      }

      // 2. Três olhos (cantos 7x7)
      const cantosOlhos = [
        { ox: 0, oy: 0 },
        { ox: tamanho - 7, oy: 0 },
        { ox: 0, oy: tamanho - 7 }
      ];
      for (const { ox, oy } of cantosOlhos) {
        const bx = offsetX + ox * celula;
        const by = offsetY + oy * celula;

        if (estiloOlhos === 'circulo') {
          ctx.fillStyle = corOlhos;
          trazarElipseInscrita(ctx, bx, by, celula * 7, celula * 7);
          ctx.fill();

          ctx.fillStyle = camada.fundoTransparenteQr ? '#ffffff' : corFundo;
          trazarElipseInscrita(ctx, bx + celula, by + celula, celula * 5, celula * 5);
          ctx.fill();

          ctx.fillStyle = corOlhos;
          trazarElipseInscrita(ctx, bx + celula * 2, by + celula * 2, celula * 3, celula * 3);
          ctx.fill();
        } else if (estiloOlhos === 'arredondado') {
          ctx.fillStyle = corOlhos;
          trazarRetanguloArredondado(
            ctx,
            bx,
            by,
            celula * 7,
            celula * 7,
            celula * 1.8
          );
          ctx.fill();

          ctx.fillStyle = camada.fundoTransparenteQr ? '#ffffff' : corFundo;
          trazarRetanguloArredondado(
            ctx,
            bx + celula,
            by + celula,
            celula * 5,
            celula * 5,
            celula * 1.1
          );
          ctx.fill();

          ctx.fillStyle = corOlhos;
          trazarRetanguloArredondado(
            ctx,
            bx + celula * 2,
            by + celula * 2,
            celula * 3,
            celula * 3,
            celula * 0.75
          );
          ctx.fill();
        } else {
          ctx.fillStyle = corOlhos;
          for (let dy = 0; dy < 7; dy++) {
            for (let dx = 0; dx < 7; dx++) {
              const bordaExterna = dx === 0 || dx === 6 || dy === 0 || dy === 6;
              const mioloInterno = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
              if (bordaExterna || mioloInterno) {
                ctx.fillRect(
                  bx + dx * celula,
                  by + dy * celula,
                  Math.ceil(celula * 100) / 100,
                  Math.ceil(celula * 100) / 100
                );
              }
            }
          }
        }
      }

      // 3. Logo centralizada no meio do QR Code
      if (camada.logoQr) {
        const imgLogo = await carregarElementoImagem(camada.logoQr);
        if (imgLogo) {
          const ladoLogo = areaUtil * (tamanhoLogoPct / 100);
          const lx = offsetX + (areaUtil - ladoLogo) / 2;
          const ly = offsetY + (areaUtil - ladoLogo) / 2;
          const raioLogo = camada.raioLogoQr ?? 6;
          const padLogo = Math.max(2, ladoLogo * 0.1);

          if (camada.fundoLogoQr !== false) {
            ctx.fillStyle = camada.fundoTransparenteQr ? '#ffffff' : corFundo;
            trazarRetanguloArredondado(
              ctx,
              lx - padLogo,
              ly - padLogo,
              ladoLogo + padLogo * 2,
              ladoLogo + padLogo * 2,
              raioLogo + 2
            );
            ctx.fill();
          }

          ctx.save();
          trazarRetanguloArredondado(ctx, lx, ly, ladoLogo, ladoLogo, raioLogo);
          ctx.clip();
          desenharImagemAjustada(ctx, imgLogo, lx, ly, ladoLogo, ladoLogo, 'contain');
          ctx.restore();
        }
      }
    } else if (camada.tipo === 'texto' || camada.tipo === 'variavel') {
      const dadosComLinkQr = enriquecerDadosComLinkQrCode(template, dados);
      const textoFinal = resolverVariaveisTexto(camada.texto || '', dadosComLinkQr, true);
      const tamanho = camada.tamanhoFonte || 24;
      const peso = camada.negrito ? '700' : '400';
      const estilo = camada.italico ? 'italic' : 'normal';
      const fonte = camada.fonte || 'Inter, sans-serif';

      ctx.font = `${estilo} ${peso} ${tamanho}px ${fonte}`;
      ctx.fillStyle = camada.corTexto || '#0f172a';
      ctx.textBaseline = 'middle';

      const alinhamento = camada.alinhamento || 'center';
      ctx.textAlign = alinhamento;

      const linhas = quebrarLinhasTexto(ctx, textoFinal, camada.largura);
      const alturaLinha = tamanho * 1.3;
      const alturaTotal = linhas.length * alturaLinha;

      const alinhamentoV = camada.alinhamentoVertical || 'middle';
      let inicioY: number;
      if (alinhamentoV === 'top') {
        inicioY = camada.y + alturaLinha / 2;
      } else if (alinhamentoV === 'bottom') {
        inicioY = camada.y + camada.altura - alturaTotal + alturaLinha / 2;
      } else {
        inicioY = camada.y + (camada.altura - alturaTotal) / 2 + alturaLinha / 2;
      }

      const posX =
        alinhamento === 'left'
          ? camada.x
          : alinhamento === 'right'
          ? camada.x + camada.largura
          : camada.x + camada.largura / 2;

      linhas.forEach((linha, idx) => {
        const yLinha = inicioY + idx * alturaLinha;
        ctx.fillText(linha, posX, yLinha);
        if (camada.sublinhado && linha.trim()) {
          const larguraTexto = ctx.measureText(linha).width;
          const xInicioSub =
            alinhamento === 'left'
              ? posX
              : alinhamento === 'right'
              ? posX - larguraTexto
              : posX - larguraTexto / 2;
          ctx.fillRect(
            xInicioSub,
            yLinha + tamanho * 0.45,
            larguraTexto,
            Math.max(1, tamanho * 0.06)
          );
        }
      });
    }

    ctx.restore();
  }

  return canvas;
}