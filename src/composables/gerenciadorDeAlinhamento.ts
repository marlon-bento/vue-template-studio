/*
========
Gerenciador explícito de alinhamento na folha e no quadrado 3x3 estilo Figma (src/composables/gerenciadorDeAlinhamento.ts).
Cuida do alinhamento por eixo (esquerda, centro-h, direita, topo, centro-v, base),
do posicionamento nos 9 pontos do quadrado visual 3x3 da folha A4 e do alinhamento
interno de texto nos 9 pontos da caixa (estilo Auto Layout do Figma).
========
*/
import type {
  AlinhamentoTexto,
  AlinhamentoVertical,
  CamadaCertificado,
  EixoAlinhamentoFolha,
  PosicaoGrade3x3
} from '../types/certificado';

export const POSICOES_GRADE_3X3: {
  id: PosicaoGrade3x3;
  rotulo: string;
  alinhamentoH: AlinhamentoTexto;
  alinhamentoV: AlinhamentoVertical;
}[] = [
  { id: 'topo-esquerda', rotulo: 'Topo à esquerda', alinhamentoH: 'left', alinhamentoV: 'top' },
  { id: 'topo-centro', rotulo: 'Topo ao centro', alinhamentoH: 'center', alinhamentoV: 'top' },
  { id: 'topo-direita', rotulo: 'Topo à direita', alinhamentoH: 'right', alinhamentoV: 'top' },
  { id: 'meio-esquerda', rotulo: 'Meio à esquerda', alinhamentoH: 'left', alinhamentoV: 'middle' },
  { id: 'centro', rotulo: 'Centro exato', alinhamentoH: 'center', alinhamentoV: 'middle' },
  { id: 'meio-direita', rotulo: 'Meio à direita', alinhamentoH: 'right', alinhamentoV: 'middle' },
  { id: 'base-esquerda', rotulo: 'Base à esquerda', alinhamentoH: 'left', alinhamentoV: 'bottom' },
  { id: 'base-centro', rotulo: 'Base ao centro', alinhamentoH: 'center', alinhamentoV: 'bottom' },
  { id: 'base-direita', rotulo: 'Base à direita', alinhamentoH: 'right', alinhamentoV: 'bottom' }
];

/**
 * Alinha uma camada em relação a um dos 6 eixos da folha A4 (esquerda, centro-h, direita, topo, centro-v, base).
 */
export function alinharCamadaNoEixoFolha(
  camada: CamadaCertificado | null | undefined,
  eixo: EixoAlinhamentoFolha,
  dimensoesFolha: { largura: number; altura: number }
): boolean {
  if (!camada || camada.bloqueada) return false;

  if (eixo === 'esquerda') camada.x = 0;
  else if (eixo === 'centro-h') camada.x = Math.round((dimensoesFolha.largura - camada.largura) / 2);
  else if (eixo === 'direita') camada.x = Math.round(dimensoesFolha.largura - camada.largura);
  else if (eixo === 'topo') camada.y = 0;
  else if (eixo === 'centro-v') camada.y = Math.round((dimensoesFolha.altura - camada.altura) / 2);
  else if (eixo === 'base') camada.y = Math.round(dimensoesFolha.altura - camada.altura);

  return true;
}

/**
 * Posiciona a camada diretamente em um dos 9 pontos da grade 3x3 da folha A4 (estilo quadrado do Figma).
 */
export function alinharCamadaNaGrade3x3Folha(
  camada: CamadaCertificado | null | undefined,
  posicao: PosicaoGrade3x3,
  dimensoesFolha: { largura: number; altura: number },
  margem = 0
): boolean {
  if (!camada || camada.bloqueada) return false;

  const centroX = Math.round((dimensoesFolha.largura - camada.largura) / 2);
  const direitaX = Math.round(dimensoesFolha.largura - camada.largura - margem);
  const centroY = Math.round((dimensoesFolha.altura - camada.altura) / 2);
  const baseY = Math.round(dimensoesFolha.altura - camada.altura - margem);

  if (posicao.endsWith('esquerda')) camada.x = margem;
  else if (posicao.endsWith('centro') || posicao === 'centro') camada.x = centroX;
  else if (posicao.endsWith('direita')) camada.x = direitaX;

  if (posicao.startsWith('topo')) camada.y = margem;
  else if (posicao.startsWith('meio') || posicao === 'centro') camada.y = centroY;
  else if (posicao.startsWith('base')) camada.y = baseY;

  return true;
}

/**
 * Detecta qual ponto da grade 3x3 da folha corresponde à posição atual da camada (com tolerância de 6px).
 */
export function detectarPosicaoGrade3x3Folha(
  camada: CamadaCertificado | null | undefined,
  dimensoesFolha: { largura: number; altura: number },
  tolerancia = 6
): PosicaoGrade3x3 | null {
  if (!camada) return null;

  const centroX = Math.round((dimensoesFolha.largura - camada.largura) / 2);
  const direitaX = Math.round(dimensoesFolha.largura - camada.largura);
  const centroY = Math.round((dimensoesFolha.altura - camada.altura) / 2);
  const baseY = Math.round(dimensoesFolha.altura - camada.altura);

  let col: 'esquerda' | 'centro' | 'direita' | null = null;
  if (Math.abs(camada.x) <= tolerancia) col = 'esquerda';
  else if (Math.abs(camada.x - centroX) <= tolerancia) col = 'centro';
  else if (Math.abs(camada.x - direitaX) <= tolerancia) col = 'direita';

  let lin: 'topo' | 'meio' | 'base' | null = null;
  if (Math.abs(camada.y) <= tolerancia) lin = 'topo';
  else if (Math.abs(camada.y - centroY) <= tolerancia) lin = 'meio';
  else if (Math.abs(camada.y - baseY) <= tolerancia) lin = 'base';

  if (!col || !lin) return null;
  if (lin === 'meio' && col === 'centro') return 'centro';
  return `${lin}-${col}` as PosicaoGrade3x3;
}

/**
 * Define simultaneamente o alinhamento horizontal e vertical do texto na caixa através do quadrado 3x3 do Figma.
 */
export function alinharTextoNaGrade3x3Caixa(
  camada: CamadaCertificado | null | undefined,
  posicao: PosicaoGrade3x3
): boolean {
  if (!camada || camada.bloqueada) return false;
  const item = POSICOES_GRADE_3X3.find((p) => p.id === posicao);
  if (!item) return false;

  camada.alinhamento = item.alinhamentoH;
  camada.alinhamentoVertical = item.alinhamentoV;
  return true;
}

/**
 * Retorna a posição ativa (1 dos 9 pontos) do texto dentro da própria caixa para o quadrado visual do Figma.
 */
export function detectarPosicaoGrade3x3Texto(
  camada: CamadaCertificado | null | undefined
): PosicaoGrade3x3 {
  const h: AlinhamentoTexto = camada?.alinhamento || 'center';
  const v: AlinhamentoVertical = camada?.alinhamentoVertical || 'middle';
  const encontrado = POSICOES_GRADE_3X3.find(
    (p) => p.alinhamentoH === h && p.alinhamentoV === v
  );
  return encontrado ? encontrado.id : 'centro';
}
