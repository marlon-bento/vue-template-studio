/*
========
Gerenciador explícito de interações do palco (src/composables/gerenciadorDePalco.ts).
Controla Pan (Espaço + Arrastar), arraste de elementos com snap magnético no centro X/Y,
redimensionamento pelas 4 alças (no, ne, so, se) com trava de proporção (Shift),
rotação interativa por alça visual no palco (com snap de 15° ao segurar Shift)
e cálculo das medidas em pixels com Alt estilo Figma.
========
*/
import { computed, ref, type Ref } from 'vue';
import type { CamadaCertificado } from '../types/certificado';

export interface LinhaMedidaAlt {
  tipo: 'h' | 'v' | 'aux';
  x: number;
  y: number;
  tamanho: number;
  orientacao?: 'h' | 'v';
  valor?: number;
  posicaoBadge?: 'acima' | 'abaixo' | 'esquerda' | 'direita' | 'centro';
}

export interface MedidasAltResultado {
  esquerda: number;
  direita: number;
  topo: number;
  baixo: number;
  cx: number;
  cy: number;
  alvoId: string | null;
  linhas: LinhaMedidaAlt[];
}

export interface OpcoesGerenciadorDePalco {
  camadas?: Ref<CamadaCertificado[]>;
  camadaSelecionadaId: Ref<string | null>;
  camadaSelecionada: Ref<CamadaCertificado | null>;
  camadaAlvoHover?: Ref<CamadaCertificado | null>;
  modoPreview: Ref<boolean>;
  espacoPressionado: Ref<boolean>;
  altPressionado: Ref<boolean>;
  zoom: Ref<number>;
  panX: Ref<number>;
  panY: Ref<number>;
  dimensoesFolha: Ref<{ largura: number; altura: number }>;
  aoConfirmarAlteracao: () => void;
}

/**
 * Encontra a camada visível do topo que contém o ponto (xFolha, yFolha), ignorando a camada selecionada.
 */
export function encontrarCamadaAlvoNoPonto(
  camadas: CamadaCertificado[],
  xFolha: number,
  yFolha: number,
  ignorarId?: string | null
): CamadaCertificado | null {
  for (let i = camadas.length - 1; i >= 0; i--) {
    const c = camadas[i];
    if (!c.visivel || c.id === ignorarId) continue;
    if (
      xFolha >= c.x &&
      xFolha <= c.x + c.largura &&
      yFolha >= c.y &&
      yFolha <= c.y + c.altura
    ) {
      return c;
    }
  }
  return null;
}

/**
 * Calcula as linhas sólidas e extensões tracejadas estilo Figma entre a camada selecionada
 * e a folha A4 (quando sem alvo) ou entre a camada selecionada e o elemento-alvo sob o cursor.
 */
export function calcularMedidasAltFigma(
  cam: CamadaCertificado,
  dimensoesFolha: { largura: number; altura: number },
  alvo?: CamadaCertificado | null
): MedidasAltResultado {
  const aEsq = Math.round(cam.x);
  const aDir = Math.round(cam.x + cam.largura);
  const aTopo = Math.round(cam.y);
  const aBase = Math.round(cam.y + cam.altura);
  const cx = Math.round(cam.x + cam.largura / 2);
  const cy = Math.round(cam.y + cam.altura / 2);

  if (!alvo || alvo.id === cam.id) {
    const esquerda = Math.max(0, aEsq);
    const direita = Math.max(0, Math.round(dimensoesFolha.largura - aDir));
    const topo = Math.max(0, aTopo);
    const baixo = Math.max(0, Math.round(dimensoesFolha.altura - aBase));
    const linhas: LinhaMedidaAlt[] = [];

    if (esquerda > 0) {
      linhas.push({
        tipo: 'h',
        x: 0,
        y: cy,
        tamanho: esquerda,
        valor: esquerda,
        posicaoBadge: 'acima'
      });
    }
    if (direita > 0) {
      linhas.push({
        tipo: 'h',
        x: aDir,
        y: cy,
        tamanho: direita,
        valor: direita,
        posicaoBadge: 'acima'
      });
    }
    if (topo > 0) {
      linhas.push({
        tipo: 'v',
        x: cx,
        y: 0,
        tamanho: topo,
        valor: topo,
        posicaoBadge: 'direita'
      });
    }
    if (baixo > 0) {
      linhas.push({
        tipo: 'v',
        x: cx,
        y: aBase,
        tamanho: baixo,
        valor: baixo,
        posicaoBadge: 'direita'
      });
    }

    return {
      esquerda,
      direita,
      topo,
      baixo,
      cx,
      cy,
      alvoId: null,
      linhas
    };
  }

  const bEsq = Math.round(alvo.x);
  const bDir = Math.round(alvo.x + alvo.largura);
  const bTopo = Math.round(alvo.y);
  const bBase = Math.round(alvo.y + alvo.altura);

  const linhas: LinhaMedidaAlt[] = [];
  let esquerda = 0;
  let direita = 0;
  let topo = 0;
  let baixo = 0;

  const sobrepoeX = Math.max(aEsq, bEsq) < Math.min(aDir, bDir);
  const sobrepoeY = Math.max(aTopo, bTopo) < Math.min(aBase, bBase);

  const xComum = sobrepoeX
    ? Math.round((Math.max(aEsq, bEsq) + Math.min(aDir, bDir)) / 2)
    : cx;
  const yComum = sobrepoeY
    ? Math.round((Math.max(aTopo, bTopo) + Math.min(aBase, bBase)) / 2)
    : cy;

  // --- EIXO HORIZONTAL ---
  if (aEsq > bDir) {
    esquerda = aEsq - bDir;
    linhas.push({
      tipo: 'h',
      x: bDir,
      y: yComum,
      tamanho: esquerda,
      valor: esquerda,
      posicaoBadge: 'abaixo'
    });

    if (!sobrepoeY) {
      if (aTopo >= bBase) {
        linhas.push({
          tipo: 'aux',
          orientacao: 'v',
          x: bDir,
          y: bBase,
          tamanho: yComum - bBase
        });
      } else if (bTopo >= aBase) {
        linhas.push({
          tipo: 'aux',
          orientacao: 'v',
          x: bDir,
          y: yComum,
          tamanho: bTopo - yComum
        });
      }
    }
  } else if (bEsq > aDir) {
    direita = bEsq - aDir;
    linhas.push({
      tipo: 'h',
      x: aDir,
      y: yComum,
      tamanho: direita,
      valor: direita,
      posicaoBadge: 'abaixo'
    });

    if (!sobrepoeY) {
      if (aTopo >= bBase) {
        linhas.push({
          tipo: 'aux',
          orientacao: 'v',
          x: bEsq,
          y: bBase,
          tamanho: yComum - bBase
        });
      } else if (bTopo >= aBase) {
        linhas.push({
          tipo: 'aux',
          orientacao: 'v',
          x: bEsq,
          y: yComum,
          tamanho: bTopo - yComum
        });
      }
    }
  } else {
    const diffEsq = Math.abs(aEsq - bEsq);
    const diffDir = Math.abs(aDir - bDir);

    if (diffEsq > 0) {
      esquerda = diffEsq;
      const xMin = Math.min(aEsq, bEsq);
      linhas.push({
        tipo: 'h',
        x: xMin,
        y: yComum,
        tamanho: diffEsq,
        valor: diffEsq,
        posicaoBadge: 'acima'
      });
      if (!sobrepoeY) {
        const yBordaB = aTopo >= bBase ? bBase : bTopo;
        const yIni = Math.min(yComum, yBordaB);
        const yFim = Math.max(yComum, yBordaB);
        if (yFim > yIni) {
          linhas.push({
            tipo: 'aux',
            orientacao: 'v',
            x: bEsq,
            y: yIni,
            tamanho: yFim - yIni
          });
        }
      }
    }

    if (diffDir > 0) {
      direita = diffDir;
      const xMin = Math.min(aDir, bDir);
      linhas.push({
        tipo: 'h',
        x: xMin,
        y: yComum,
        tamanho: diffDir,
        valor: diffDir,
        posicaoBadge: 'abaixo'
      });
      if (!sobrepoeY) {
        const yBordaB = aTopo >= bBase ? bBase : bTopo;
        const yIni = Math.min(yComum, yBordaB);
        const yFim = Math.max(yComum, yBordaB);
        if (yFim > yIni) {
          linhas.push({
            tipo: 'aux',
            orientacao: 'v',
            x: bDir,
            y: yIni,
            tamanho: yFim - yIni
          });
        }
      }
    }
  }

  // --- EIXO VERTICAL ---
  if (aTopo > bBase) {
    topo = aTopo - bBase;
    linhas.push({
      tipo: 'v',
      x: xComum,
      y: bBase,
      tamanho: topo,
      valor: topo,
      posicaoBadge: 'direita'
    });

    if (!sobrepoeX) {
      if (aEsq >= bDir) {
        linhas.push({
          tipo: 'aux',
          orientacao: 'h',
          x: bDir,
          y: bBase,
          tamanho: xComum - bDir
        });
      } else if (bEsq >= aDir) {
        linhas.push({
          tipo: 'aux',
          orientacao: 'h',
          x: xComum,
          y: bBase,
          tamanho: bEsq - xComum
        });
      }
    }
  } else if (bTopo > aBase) {
    baixo = bTopo - aBase;
    linhas.push({
      tipo: 'v',
      x: xComum,
      y: aBase,
      tamanho: baixo,
      valor: baixo,
      posicaoBadge: 'direita'
    });

    if (!sobrepoeX) {
      if (aEsq >= bDir) {
        linhas.push({
          tipo: 'aux',
          orientacao: 'h',
          x: bDir,
          y: bTopo,
          tamanho: xComum - bDir
        });
      } else if (bEsq >= aDir) {
        linhas.push({
          tipo: 'aux',
          orientacao: 'h',
          x: xComum,
          y: bTopo,
          tamanho: bEsq - xComum
        });
      }
    }
  } else {
    const diffTopo = Math.abs(aTopo - bTopo);
    const diffBase = Math.abs(aBase - bBase);

    if (diffTopo > 0) {
      topo = diffTopo;
      const yMin = Math.min(aTopo, bTopo);
      linhas.push({
        tipo: 'v',
        x: xComum,
        y: yMin,
        tamanho: diffTopo,
        valor: diffTopo,
        posicaoBadge: 'direita'
      });
      if (!sobrepoeX) {
        const xBordaB = aEsq >= bDir ? bDir : bEsq;
        const xIni = Math.min(xComum, xBordaB);
        const xFim = Math.max(xComum, xBordaB);
        if (xFim > xIni) {
          linhas.push({
            tipo: 'aux',
            orientacao: 'h',
            x: xIni,
            y: bTopo,
            tamanho: xFim - xIni
          });
        }
      }
    }

    if (diffBase > 0) {
      baixo = diffBase;
      const yMin = Math.min(aBase, bBase);
      linhas.push({
        tipo: 'v',
        x: xComum,
        y: yMin,
        tamanho: diffBase,
        valor: diffBase,
        posicaoBadge: 'direita'
      });
      if (!sobrepoeX) {
        const xBordaB = aEsq >= bDir ? bDir : bEsq;
        const xIni = Math.min(xComum, xBordaB);
        const xFim = Math.max(xComum, xBordaB);
        if (xFim > xIni) {
          linhas.push({
            tipo: 'aux',
            orientacao: 'h',
            x: xIni,
            y: bBase,
            tamanho: xFim - xIni
          });
        }
      }
    }
  }

  return {
    esquerda,
    direita,
    topo,
    baixo,
    cx,
    cy,
    alvoId: alvo.id,
    linhas
  };
}

/**
 * Gerencia arraste de camadas, redimensionamento (com trava proporcional Shift),
 * rotação por alça visual no palco, pan do palco e guias de distância estilo Figma.
 */
export function gerenciadorDePalco(opcoes: OpcoesGerenciadorDePalco) {
  const arrastandoPalco = ref(false);
  const rotacionandoCamada = ref(false);
  const guiaXVisivel = ref(false);
  const guiaYVisivel = ref(false);
  const camadaHoverInterna = ref<CamadaCertificado | null>(null);
  const camadaAlvoHover = opcoes.camadaAlvoHover ?? camadaHoverInterna;

  let estadoArraste: {
    camada: CamadaCertificado;
    inicioMouseX: number;
    inicioMouseY: number;
    inicioX: number;
    inicioY: number;
  } | null = null;

  let estadoRedimensionar: {
    camada: CamadaCertificado;
    direcao: string;
    inicioMouseX: number;
    inicioMouseY: number;
    inicioX: number;
    inicioY: number;
    inicioL: number;
    inicioA: number;
    proporcao: number;
  } | null = null;

  let estadoRotacao: {
    camada: CamadaCertificado;
    centroTelaX: number;
    centroTelaY: number;
    anguloMouseInicialRad: number;
    rotacaoInicialGraus: number;
  } | null = null;

  let estadoPan: {
    inicioMouseX: number;
    inicioMouseY: number;
    inicioPanX: number;
    inicioPanY: number;
  } | null = null;

  const medidasAlt = computed<MedidasAltResultado | null>(() => {
    const cam = opcoes.camadaSelecionada.value;
    if (!opcoes.altPressionado.value || !cam || opcoes.modoPreview.value) return null;
    return calcularMedidasAltFigma(cam, opcoes.dimensoesFolha.value, camadaAlvoHover.value);
  });

  function definirCamadaHoverAlt(camada: CamadaCertificado | null): void {
    camadaAlvoHover.value = camada;
  }

  function atualizarHoverPorCoordenadaFolha(xFolha: number, yFolha: number): void {
    if (!opcoes.camadas?.value) return;
    const encontrada = encontrarCamadaAlvoNoPonto(
      opcoes.camadas.value,
      xFolha,
      yFolha,
      opcoes.camadaSelecionadaId.value
    );
    camadaAlvoHover.value = encontrada;
  }

  function cancelarPan(): void {
    arrastandoPalco.value = false;
    estadoPan = null;
  }

  function iniciarPanPalco(ev: MouseEvent): void {
    if (!opcoes.espacoPressionado.value) return;
    ev.preventDefault();
    ev.stopPropagation();
    arrastandoPalco.value = true;
    estadoPan = {
      inicioMouseX: ev.clientX,
      inicioMouseY: ev.clientY,
      inicioPanX: opcoes.panX.value,
      inicioPanY: opcoes.panY.value
    };
  }

  function aoClicarPalco(ev: MouseEvent): void {
    if (opcoes.espacoPressionado.value) {
      iniciarPanPalco(ev);
      return;
    }
    if (ev.target === ev.currentTarget) {
      opcoes.camadaSelecionadaId.value = null;
    }
  }

  function iniciarArrasteCamada(ev: MouseEvent, camada: CamadaCertificado): void {
    if (ev.altKey) {
      opcoes.altPressionado.value = true;
    }
    if (opcoes.espacoPressionado.value) {
      iniciarPanPalco(ev);
      return;
    }
    if (opcoes.modoPreview.value) return;
    opcoes.camadaSelecionadaId.value = camada.id;
    if (camada.bloqueada) return;
    estadoArraste = {
      camada,
      inicioMouseX: ev.clientX,
      inicioMouseY: ev.clientY,
      inicioX: camada.x,
      inicioY: camada.y
    };
  }

  function iniciarRedimensionamentoCamada(
    ev: MouseEvent,
    camada: CamadaCertificado,
    direcao: string
  ): void {
    if (opcoes.modoPreview.value || camada.bloqueada || opcoes.espacoPressionado.value) return;
    ev.stopPropagation();
    const alturaSegura = Math.max(1, camada.altura);
    estadoRedimensionar = {
      camada,
      direcao,
      inicioMouseX: ev.clientX,
      inicioMouseY: ev.clientY,
      inicioX: camada.x,
      inicioY: camada.y,
      inicioL: camada.largura,
      inicioA: camada.altura,
      proporcao: camada.largura / alturaSegura
    };
  }

  /**
   * Inicia a rotação interativa da camada pelo pino superior de rotação no palco (estilo Figma).
   * Segurar Shift durante o giro faz snap em múltiplos de 15°.
   */
  function iniciarRotacaoCamada(
    ev: MouseEvent,
    camada: CamadaCertificado,
    centroTela?: { x: number; y: number }
  ): void {
    if (opcoes.modoPreview.value || camada.bloqueada || opcoes.espacoPressionado.value) return;
    ev.preventDefault();
    ev.stopPropagation();

    let cxTela = centroTela?.x;
    let cyTela = centroTela?.y;

    if (cxTela === undefined || cyTela === undefined) {
      const alvo = ev.currentTarget as HTMLElement | null;
      const caixaCamada = alvo?.closest('.vc-camada') as HTMLElement | null;
      if (caixaCamada) {
        const rect = caixaCamada.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          cxTela = rect.left + rect.width / 2;
          cyTela = rect.top + rect.height / 2;
        }
      }
    }

    const cxFinal = cxTela ?? (camada.x + camada.largura / 2) * opcoes.zoom.value;
    const cyFinal = cyTela ?? (camada.y + camada.altura / 2) * opcoes.zoom.value;

    rotacionandoCamada.value = true;
    estadoRotacao = {
      camada,
      centroTelaX: cxFinal,
      centroTelaY: cyFinal,
      anguloMouseInicialRad: Math.atan2(ev.clientY - cyFinal, ev.clientX - cxFinal),
      rotacaoInicialGraus: camada.rotacao || 0
    };
  }

  function aoMoverMouseGlobal(ev: MouseEvent): void {
    if (ev.altKey && !opcoes.altPressionado.value) {
      opcoes.altPressionado.value = true;
    } else if (!ev.altKey && opcoes.altPressionado.value && (ev.clientX !== 0 || ev.clientY !== 0)) {
      opcoes.altPressionado.value = false;
    }

    if (estadoPan) {
      opcoes.panX.value = estadoPan.inicioPanX + (ev.clientX - estadoPan.inicioMouseX);
      opcoes.panY.value = estadoPan.inicioPanY + (ev.clientY - estadoPan.inicioMouseY);
      return;
    }

    if (estadoRotacao) {
      const {
        camada,
        centroTelaX,
        centroTelaY,
        anguloMouseInicialRad,
        rotacaoInicialGraus
      } = estadoRotacao;
      const anguloAtualRad = Math.atan2(ev.clientY - centroTelaY, ev.clientX - centroTelaX);
      const deltaGraus = ((anguloAtualRad - anguloMouseInicialRad) * 180) / Math.PI;
      let novoAngulo = rotacaoInicialGraus + deltaGraus;

      // Normaliza para [-180, 180]
      novoAngulo = ((((novoAngulo + 180) % 360) + 360) % 360) - 180;

      // Segurar Shift faz snap de 15 em 15 graus igual ao Figma
      if (ev.shiftKey) {
        novoAngulo = Math.round(novoAngulo / 15) * 15;
      } else {
        novoAngulo = Math.round(novoAngulo);
      }

      if (Object.is(novoAngulo, -0)) novoAngulo = 0;
      camada.rotacao = novoAngulo;
      return;
    }

    if (estadoArraste) {
      const { camada, inicioMouseX, inicioMouseY, inicioX, inicioY } = estadoArraste;
      let novoX = inicioX + (ev.clientX - inicioMouseX) / opcoes.zoom.value;
      let novoY = inicioY + (ev.clientY - inicioMouseY) / opcoes.zoom.value;

      const centroX = novoX + camada.largura / 2;
      const centroY = novoY + camada.altura / 2;

      if (Math.abs(centroX - opcoes.dimensoesFolha.value.largura / 2) < 8) {
        novoX = opcoes.dimensoesFolha.value.largura / 2 - camada.largura / 2;
        guiaXVisivel.value = true;
      } else {
        guiaXVisivel.value = false;
      }

      if (Math.abs(centroY - opcoes.dimensoesFolha.value.altura / 2) < 8) {
        novoY = opcoes.dimensoesFolha.value.altura / 2 - camada.altura / 2;
        guiaYVisivel.value = true;
      } else {
        guiaYVisivel.value = false;
      }

      camada.x = Math.round(novoX);
      camada.y = Math.round(novoY);
    } else if (estadoRedimensionar) {
      const {
        camada,
        direcao,
        inicioMouseX,
        inicioMouseY,
        inicioX,
        inicioY,
        inicioL,
        inicioA,
        proporcao
      } = estadoRedimensionar;
      const dx = (ev.clientX - inicioMouseX) / opcoes.zoom.value;
      const dy = (ev.clientY - inicioMouseY) / opcoes.zoom.value;
      const alturaMinima = camada.tipo === 'linha' || camada.tipo === 'seta' ? 12 : 24;

      let novaL = inicioL;
      let novaA = inicioA;

      if (direcao.includes('e')) novaL = Math.max(30, Math.round(inicioL + dx));
      if (direcao.includes('o')) novaL = Math.max(30, Math.round(inicioL - dx));
      if (direcao.includes('s')) novaA = Math.max(alturaMinima, Math.round(inicioA + dy));
      if (direcao.includes('n')) novaA = Math.max(alturaMinima, Math.round(inicioA - dy));

      // Trava de Proporção (Aspect Ratio Lock) ao segurar Shift (ideal para Logos, Imagens e QR Codes)
      if (ev.shiftKey && proporcao > 0) {
        const variacaoRelL = Math.abs(novaL - inicioL) / Math.max(1, inicioL);
        const variacaoRelA = Math.abs(novaA - inicioA) / Math.max(1, inicioA);

        if (variacaoRelL >= variacaoRelA) {
          novaA = Math.max(alturaMinima, Math.round(novaL / proporcao));
          novaL = Math.max(30, Math.round(novaA * proporcao));
        } else {
          novaL = Math.max(30, Math.round(novaA * proporcao));
          novaA = Math.max(alturaMinima, Math.round(novaL / proporcao));
        }
      }

      if (direcao.includes('o')) {
        camada.x = Math.round(inicioX + (inicioL - novaL));
      }
      if (direcao.includes('n')) {
        camada.y = Math.round(inicioY + (inicioA - novaA));
      }

      camada.largura = novaL;
      camada.altura = novaA;
    }
  }

  function aoSoltarMouseGlobal(): void {
    if (estadoPan) {
      estadoPan = null;
      arrastandoPalco.value = false;
      return;
    }
    if (estadoArraste || estadoRedimensionar || estadoRotacao) {
      opcoes.aoConfirmarAlteracao();
    }
    estadoArraste = null;
    estadoRedimensionar = null;
    estadoRotacao = null;
    rotacionandoCamada.value = false;
    guiaXVisivel.value = false;
    guiaYVisivel.value = false;
  }

  function registrarListenersPalco(): void {
    window.addEventListener('mousemove', aoMoverMouseGlobal);
    window.addEventListener('mouseup', aoSoltarMouseGlobal);
  }

  function removerListenersPalco(): void {
    window.removeEventListener('mousemove', aoMoverMouseGlobal);
    window.removeEventListener('mouseup', aoSoltarMouseGlobal);
  }

  return {
    arrastandoPalco,
    rotacionandoCamada,
    guiaXVisivel,
    guiaYVisivel,
    camadaAlvoHover,
    medidasAlt,
    definirCamadaHoverAlt,
    atualizarHoverPorCoordenadaFolha,
    cancelarPan,
    iniciarPanPalco,
    aoClicarPalco,
    iniciarArrasteCamada,
    iniciarRedimensionamentoCamada,
    iniciarRotacaoCamada,
    aoMoverMouseGlobal,
    aoSoltarMouseGlobal,
    registrarListenersPalco,
    removerListenersPalco
  };
}
