/*
========
Gerenciador explícito de alinhamento na folha e no quadrado 3x3 estilo Figma (src/composables/gerenciadorDeAlinhamento.ts).
Cuida do alinhamento por eixo (esquerda/left, centro-h/center-h, direita/right, topo/top, centro-v/center-v, base/bottom),
do posicionamento nos 9 pontos do quadrado visual 3x3 da folha e do alinhamento interno de texto na caixa,
normalizando parâmetros recebidos em português ou inglês.
========
*/
import type {
  AlinhamentoTexto,
  AlinhamentoVertical,
  CamadaCertificado,
  EixoAlinhamentoFolha,
  EixoAlinhamentoFolhaCanonico,
  PosicaoGrade3x3,
  PosicaoGrade3x3Canonica
} from '../types/certificado';

// Mapa de equivalência entre eixos de alinhamento em português e inglês
const MAPA_EIXO_ALINHAMENTO: Record<EixoAlinhamentoFolha, EixoAlinhamentoFolhaCanonico> = {
  'esquerda': 'esquerda',
  'left': 'esquerda',
  'centro-h': 'centro-h',
  'center-h': 'centro-h',
  'direita': 'direita',
  'right': 'direita',
  'topo': 'topo',
  'top': 'topo',
  'centro-v': 'centro-v',
  'center-v': 'centro-v',
  'base': 'base',
  'bottom': 'base'
};

// Mapa de equivalência entre posições da grade 3x3 em português e inglês
const MAPA_POSICAO_GRADE_3X3: Record<PosicaoGrade3x3, PosicaoGrade3x3Canonica> = {
  'topo-esquerda': 'topo-esquerda',
  'top-left': 'topo-esquerda',
  'topo-centro': 'topo-centro',
  'top-center': 'topo-centro',
  'topo-direita': 'topo-direita',
  'top-right': 'topo-direita',
  'meio-esquerda': 'meio-esquerda',
  'middle-left': 'meio-esquerda',
  'centro': 'centro',
  'center': 'centro',
  'meio-direita': 'meio-direita',
  'middle-right': 'meio-direita',
  'base-esquerda': 'base-esquerda',
  'bottom-left': 'base-esquerda',
  'base-centro': 'base-centro',
  'bottom-center': 'base-centro',
  'base-direita': 'base-direita',
  'bottom-right': 'base-direita'
};

// Definição ordenada dos 9 pontos da matriz 3x3 com seus respectivos alinhamentos de texto
export const POSICOES_GRADE_3X3: {
  id: PosicaoGrade3x3Canonica;
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

/*
 * Recebe: eixo de alinhamento em português ou inglês.
 * Devolve: eixo canônico em português ou null caso o valor seja inválido.
 * Por que é usada: permite que a API pública de alinhamento aceite literais nos dois idiomas.
 */
export function normalizarEixoAlinhamentoFolha(
  eixo: EixoAlinhamentoFolha
): EixoAlinhamentoFolhaCanonico | null {
  return MAPA_EIXO_ALINHAMENTO[eixo] ?? null;
}

/*
 * Recebe: posição da matriz 3x3 em português ou inglês.
 * Devolve: posição canônica em português ou null caso o valor seja inválido.
 * Por que é usada: permite que os métodos da grade 3x3 aceitem literais nos dois idiomas.
 */
export function normalizarPosicaoGrade3x3(
  posicao: PosicaoGrade3x3
): PosicaoGrade3x3Canonica | null {
  return MAPA_POSICAO_GRADE_3X3[posicao] ?? null;
}

/*
 * Recebe: camada alvo, eixo de alinhamento (PT ou EN) e dimensões da folha.
 * Devolve: verdadeiro se a camada foi reposicionada ou falso se estiver nula, bloqueada ou com eixo inválido.
 * Por que é usada: alinha uma camada em relação a um dos 6 eixos da folha.
 */
export function alinharCamadaNoEixoFolha(
  camada: CamadaCertificado | null | undefined,
  eixo: EixoAlinhamentoFolha,
  dimensoesFolha: { largura: number; altura: number }
): boolean {
  if (!camada || camada.bloqueada) return false;
  const eixoCanonico = normalizarEixoAlinhamentoFolha(eixo);
  if (!eixoCanonico) return false;

  if (eixoCanonico === 'esquerda') camada.x = 0;
  else if (eixoCanonico === 'centro-h') camada.x = Math.round((dimensoesFolha.largura - camada.largura) / 2);
  else if (eixoCanonico === 'direita') camada.x = Math.round(dimensoesFolha.largura - camada.largura);
  else if (eixoCanonico === 'topo') camada.y = 0;
  else if (eixoCanonico === 'centro-v') camada.y = Math.round((dimensoesFolha.altura - camada.altura) / 2);
  else if (eixoCanonico === 'base') camada.y = Math.round(dimensoesFolha.altura - camada.altura);

  return true;
}

/*
 * Recebe: camada alvo, posição 3x3 (PT ou EN), dimensões da folha e margem opcional.
 * Devolve: verdadeiro se a camada foi posicionada ou falso se estiver nula, bloqueada ou com posição inválida.
 * Por que é usada: posiciona a camada diretamente em um dos 9 pontos da grade 3x3 da folha.
 */
export function alinharCamadaNaGrade3x3Folha(
  camada: CamadaCertificado | null | undefined,
  posicao: PosicaoGrade3x3,
  dimensoesFolha: { largura: number; altura: number },
  margem = 0
): boolean {
  if (!camada || camada.bloqueada) return false;
  const posicaoCanonica = normalizarPosicaoGrade3x3(posicao);
  if (!posicaoCanonica) return false;

  const centroX = Math.round((dimensoesFolha.largura - camada.largura) / 2);
  const direitaX = Math.round(dimensoesFolha.largura - camada.largura - margem);
  const centroY = Math.round((dimensoesFolha.altura - camada.altura) / 2);
  const baseY = Math.round(dimensoesFolha.altura - camada.altura - margem);

  if (posicaoCanonica.endsWith('esquerda')) camada.x = margem;
  else if (posicaoCanonica.endsWith('centro') || posicaoCanonica === 'centro') camada.x = centroX;
  else if (posicaoCanonica.endsWith('direita')) camada.x = direitaX;

  if (posicaoCanonica.startsWith('topo')) camada.y = margem;
  else if (posicaoCanonica.startsWith('meio') || posicaoCanonica === 'centro') camada.y = centroY;
  else if (posicaoCanonica.startsWith('base')) camada.y = baseY;

  return true;
}

/*
 * Recebe: camada alvo, dimensões da folha e tolerância em pixels.
 * Devolve: identificador canônico do ponto 3x3 correspondente ou null se não coincidir.
 * Por que é usada: destaca no inspetor qual ponto da matriz 3x3 corresponde à posição atual da camada.
 */
export function detectarPosicaoGrade3x3Folha(
  camada: CamadaCertificado | null | undefined,
  dimensoesFolha: { largura: number; altura: number },
  tolerancia = 6
): PosicaoGrade3x3Canonica | null {
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
  return `${lin}-${col}` as PosicaoGrade3x3Canonica;
}

/*
 * Recebe: camada alvo e posição da grade 3x3 (PT ou EN).
 * Devolve: verdadeiro se o alinhamento foi aplicado ou falso caso contrário.
 * Por que é usada: define simultaneamente o alinhamento horizontal e vertical do texto na caixa.
 */
export function alinharTextoNaGrade3x3Caixa(
  camada: CamadaCertificado | null | undefined,
  posicao: PosicaoGrade3x3
): boolean {
  if (!camada || camada.bloqueada) return false;
  const posicaoCanonica = normalizarPosicaoGrade3x3(posicao);
  if (!posicaoCanonica) return false;

  const item = POSICOES_GRADE_3X3.find((p) => p.id === posicaoCanonica);
  if (!item) return false;

  camada.alinhamento = item.alinhamentoH;
  camada.alinhamentoVertical = item.alinhamentoV;
  return true;
}

/*
 * Recebe: camada alvo.
 * Devolve: posição canônica ativa na matriz 3x3 do texto dentro da caixa.
 * Por que é usada: indica o ponto selecionado no quadrado de alinhamento de texto do inspetor.
 */
export function detectarPosicaoGrade3x3Texto(
  camada: CamadaCertificado | null | undefined
): PosicaoGrade3x3Canonica {
  const h: AlinhamentoTexto = camada?.alinhamento || 'center';
  const v: AlinhamentoVertical = camada?.alinhamentoVertical || 'middle';
  const encontrado = POSICOES_GRADE_3X3.find(
    (p) => p.alinhamentoH === h && p.alinhamentoV === v
  );
  return encontrado ? encontrado.id : 'centro';
}