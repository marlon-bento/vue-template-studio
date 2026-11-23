/*
========
Gerenciador explícito de criação, edição, dimensões de folha e ordenação de camadas (src/composables/gerenciadorDeCamadas.ts).
Centraliza presets de formatos (A4, A5, Carta/Letter, Crachá/Badge, Cartão/Card CR80, Quadrado/Square e Custom),
drag & drop na lista invertida estilo Photoshop/Figma e fábricas de camadas com nomes padrão
internacionalizados via vue-i18n.
========
*/
import type {
  CamadaCertificado,
  DirecaoPontaSeta,
  DirecaoPontaSetaCanonica,
  FormatoFolha,
  FormatoFolhaCanonico,
  ModoExibicaoLink,
  ModoExibicaoLinkCanonico,
  OrientacaoCertificado,
  PresetFormatoFolha,
  TemplateCertificado,
  TipoCamada
} from '../types/certificado';
import { CHAVE_VARIAVEL_LINK_QRCODE, clonarSeguro, gerarId } from '../utils/variaveis';
import i18n from '../i18n';

export interface DimensoesFolha {
  largura: number;
  altura: number;
}

export type AlvoDimensoesFolha =
  | OrientacaoCertificado
  | DimensoesFolha
  | Pick<TemplateCertificado, 'orientacao' | 'formato' | 'largura' | 'altura'>;

// Mapa de equivalência entre IDs de formato de folha em português e inglês
const MAPA_FORMATO_FOLHA: Record<FormatoFolha, FormatoFolhaCanonico> = {
  a4: 'a4',
  a5: 'a5',
  carta: 'carta',
  letter: 'carta',
  cracha: 'cracha',
  badge: 'cracha',
  cartao: 'cartao',
  card: 'cartao',
  quadrado: 'quadrado',
  square: 'quadrado',
  custom: 'custom'
};

// Mapa de equivalência entre direções de ponta de seta em português e inglês
const MAPA_DIRECAO_PONTA_SETA: Record<DirecaoPontaSeta, DirecaoPontaSetaCanonica> = {
  esquerda: 'esquerda',
  left: 'esquerda',
  direita: 'direita',
  right: 'direita',
  ambas: 'ambas',
  both: 'ambas'
};

// Mapa de equivalência entre modos de exibição de link em português e inglês
const MAPA_MODO_EXIBICAO_LINK: Record<ModoExibicaoLink, ModoExibicaoLinkCanonico> = {
  url: 'url',
  texto: 'texto',
  text: 'texto'
};

// Dimensões base em pixels (96 DPI) para folha A4 em paisagem e retrato
export const DIMENSOES_CAMADAS_A4: Record<OrientacaoCertificado, DimensoesFolha> = {
  landscape: { largura: 1123, altura: 794 },
  portrait: { largura: 794, altura: 1123 }
};

// Catálogo de formatos prontos em pixels (base 96 DPI) onde larguraBase >= alturaBase
export const PRESETS_FORMATOS_FOLHA: PresetFormatoFolha[] = [
  { id: 'a4', rotulo: 'A4 (297 × 210 mm)', larguraBase: 1123, alturaBase: 794 },
  { id: 'a5', rotulo: 'A5 (210 × 148 mm)', larguraBase: 794, alturaBase: 559 },
  { id: 'carta', rotulo: 'Carta / Letter', larguraBase: 1056, alturaBase: 816 },
  { id: 'cracha', rotulo: 'Crachá (130 × 90 mm)', larguraBase: 491, alturaBase: 340 },
  { id: 'cartao', rotulo: 'Cartão / Credencial CR80', larguraBase: 645, alturaBase: 408 },
  { id: 'quadrado', rotulo: 'Social / Post (1080 × 1080)', larguraBase: 1080, alturaBase: 1080 },
  { id: 'custom', rotulo: 'Personalizado (L × A)', larguraBase: 1123, alturaBase: 794 }
];

/*
 * Recebe: identificador de formato de folha em português ou inglês.
 * Devolve: formato canônico suportado pelos presets internos e pelo vue-i18n.
 * Por que é usada: padroniza aliases em inglês como 'letter', 'badge', 'card' e 'square'.
 */
export function normalizarFormatoFolha(formato: FormatoFolha = 'a4'): FormatoFolhaCanonico {
  return MAPA_FORMATO_FOLHA[formato] ?? 'a4';
}

/*
 * Recebe: direção da ponta de seta em português ou inglês.
 * Devolve: direção canônica ('esquerda', 'direita' ou 'ambas').
 * Por que é usada: padroniza valores passados em inglês ou português para o renderizador de setas.
 */
export function normalizarDirecaoPontaSeta(
  pontaSeta: DirecaoPontaSeta = 'direita'
): DirecaoPontaSetaCanonica {
  return MAPA_DIRECAO_PONTA_SETA[pontaSeta] ?? 'direita';
}

/*
 * Recebe: modo de exibição de link em português ou inglês.
 * Devolve: modo canônico ('url' ou 'texto').
 * Por que é usada: permite que chamadas em inglês usando 'text' funcionem igualmente ao valor 'texto'.
 */
export function normalizarModoExibicaoLink(
  modo: ModoExibicaoLink = 'url'
): ModoExibicaoLinkCanonico {
  return MAPA_MODO_EXIBICAO_LINK[modo] ?? 'url';
}

/*
 * Recebe: formato da folha (PT ou EN), orientação e medidas customizadas opcionais.
 * Devolve: objeto DimensoesFolha com largura e altura em pixels.
 * Por que é usada: calcula as dimensões exatas da folha para qualquer formato predefinido ou personalizado.
 */
export function obterDimensoesPorFormato(
  formato: FormatoFolha = 'a4',
  orientacao: OrientacaoCertificado = 'landscape',
  larguraCustom?: number,
  alturaCustom?: number
): DimensoesFolha {
  const formatoCanonico = normalizarFormatoFolha(formato);
  if (formatoCanonico === 'custom') {
    const l = Math.max(120, Math.round(larguraCustom || 1123));
    const a = Math.max(120, Math.round(alturaCustom || 794));
    return { largura: l, altura: a };
  }

  const preset =
    PRESETS_FORMATOS_FOLHA.find((p) => p.id === formatoCanonico) || PRESETS_FORMATOS_FOLHA[0];
  if (preset.id === 'quadrado') {
    return { largura: preset.larguraBase, altura: preset.alturaBase };
  }

  return orientacao === 'portrait'
    ? { largura: preset.alturaBase, altura: preset.larguraBase }
    : { largura: preset.larguraBase, altura: preset.alturaBase };
}

/*
 * Recebe: orientação, objeto de dimensões ou template parcial.
 * Devolve: objeto DimensoesFolha resolvido com largura e altura válidas.
 * Por que é usada: garante retrocompatibilidade com A4 e suporte a dimensões livres de qualquer template.
 */
export function resolverDimensoesTemplate(alvo?: AlvoDimensoesFolha | null): DimensoesFolha {
  if (!alvo) return { ...DIMENSOES_CAMADAS_A4.landscape };

  if (typeof alvo === 'string') {
    return DIMENSOES_CAMADAS_A4[alvo] || DIMENSOES_CAMADAS_A4.landscape;
  }

  if ('largura' in alvo && 'altura' in alvo && !('orientacao' in alvo)) {
    return {
      largura: Math.max(120, Math.round(alvo.largura || 1123)),
      altura: Math.max(120, Math.round(alvo.altura || 794))
    };
  }

  const tpl = alvo as Pick<TemplateCertificado, 'orientacao' | 'formato' | 'largura' | 'altura'>;
  const orientacao = tpl.orientacao === 'portrait' ? 'portrait' : 'landscape';

  if (
    typeof tpl.largura === 'number' &&
    tpl.largura >= 120 &&
    typeof tpl.altura === 'number' &&
    tpl.altura >= 120
  ) {
    return {
      largura: Math.round(tpl.largura),
      altura: Math.round(tpl.altura)
    };
  }

  if (tpl.formato && normalizarFormatoFolha(tpl.formato) !== 'a4') {
    return obterDimensoesPorFormato(tpl.formato, orientacao, tpl.largura, tpl.altura);
  }

  return DIMENSOES_CAMADAS_A4[orientacao] || DIMENSOES_CAMADAS_A4.landscape;
}

/*
 * Recebe: array original de camadas, índice visual de origem e índice visual de destino.
 * Devolve: verdadeiro se a ordem foi alterada ou falso caso os índices sejam inválidos.
 * Por que é usada: converte os índices da lista invertida da UI para os índices reais do array de camadas.
 */
export function reordenarCamadaListaInvertida(
  camadas: CamadaCertificado[],
  indiceVisualOrigem: number,
  indiceVisualDestino: number
): boolean {
  const total = camadas.length;
  if (
    total < 2 ||
    indiceVisualOrigem === indiceVisualDestino ||
    indiceVisualOrigem < 0 ||
    indiceVisualDestino < 0 ||
    indiceVisualOrigem >= total ||
    indiceVisualDestino >= total
  ) {
    return false;
  }

  const indiceRealOrigem = total - 1 - indiceVisualOrigem;
  const indiceRealDestino = total - 1 - indiceVisualDestino;

  const [item] = camadas.splice(indiceRealOrigem, 1);
  camadas.splice(indiceRealDestino, 0, item);
  return true;
}

/*
 * Recebe: array de camadas, ID da camada alvo e deslocamento (+1, -1, 'frente' ou 'tras').
 * Devolve: verdadeiro se a camada mudou de posição ou falso caso já estivesse no limite.
 * Por que é usada: permite subir, descer ou enviar camadas para frente/trás na pilha de renderização.
 */
export function moverCamadaPorId(
  camadas: CamadaCertificado[],
  id: string,
  deslocamento: number | 'frente' | 'tras'
): boolean {
  const idx = camadas.findIndex((c) => c.id === id);
  if (idx === -1) return false;

  if (deslocamento === 'frente') {
    if (idx === camadas.length - 1) return false;
    const [item] = camadas.splice(idx, 1);
    camadas.push(item);
    return true;
  }

  if (deslocamento === 'tras') {
    if (idx === 0) return false;
    const [item] = camadas.splice(idx, 1);
    camadas.unshift(item);
    return true;
  }

  const novoIdx = Math.max(0, Math.min(camadas.length - 1, idx + deslocamento));
  if (novoIdx === idx) return false;
  const [item] = camadas.splice(idx, 1);
  camadas.splice(novoIdx, 0, item);
  return true;
}

/*
 * Recebe: opções com texto, nome da camada, indicador de variável, orientação/dimensões e fonte opcional.
 * Devolve: objeto CamadaCertificado configurado e centralizado na folha.
 * Por que é usada: cria camadas de texto livre ou de variável fixa do cliente.
 */
export function criarCamadaTexto(opcoes: {
  texto: string;
  nome: string;
  ehVariavel: boolean;
  orientacao: AlvoDimensoesFolha;
  fonte?: string;
}): CamadaCertificado {
  const dim = resolverDimensoesTemplate(opcoes.orientacao);
  const larguraCaixa = Math.min(440, Math.max(120, dim.largura - 40));
  const alturaCaixa = Math.min(60, Math.max(36, Math.round(dim.altura * 0.12)));
  return {
    id: gerarId('cam'),
    tipo: opcoes.ehVariavel ? 'variavel' : 'texto',
    nome: opcoes.nome,
    x: Math.round((dim.largura - larguraCaixa) / 2),
    y: Math.round((dim.altura - alturaCaixa) / 2),
    largura: larguraCaixa,
    altura: alturaCaixa,
    opacidade: 100,
    rotacao: 0,
    visivel: true,
    bloqueada: false,
    texto: opcoes.texto,
    fonte: opcoes.fonte || "'Inter', sans-serif",
    tamanhoFonte: dim.largura < 550 ? 20 : 28,
    corTexto: '#1e293b',
    negrito: false,
    italico: false,
    sublinhado: false,
    alinhamento: 'center',
    alinhamentoVertical: 'middle'
  };
}

/*
 * Recebe: orientação ou dimensões da folha.
 * Devolve: objeto CamadaCertificado do tipo 'forma' proporcional à folha.
 * Por que é usada: cria uma camada de moldura retangular com nome traduzido no idioma ativo.
 */
export function criarCamadaMoldura(orientacao: AlvoDimensoesFolha): CamadaCertificado {
  const dim = resolverDimensoesTemplate(orientacao);
  const margem = dim.largura < 550 ? 20 : 48;
  return {
    id: gerarId('cam'),
    tipo: 'forma',
    nome: String(i18n.global.t('camadasPadrao.moldura')),
    x: margem,
    y: margem,
    largura: Math.max(60, dim.largura - margem * 2),
    altura: Math.max(60, dim.altura - margem * 2),
    opacidade: 100,
    rotacao: 0,
    visivel: true,
    bloqueada: false,
    corPreenchimento: '#ffffff',
    semPreenchimento: true,
    corBorda: '#3b82f6',
    espessuraBorda: 3,
    raioBorda: 8,
    estiloBorda: 'solid'
  };
}

/*
 * Recebe: orientação ou dimensões da folha.
 * Devolve: objeto CamadaCertificado do tipo 'circulo' centralizado.
 * Por que é usada: cria uma camada de círculo ou elipse com nome traduzido no idioma ativo.
 */
export function criarCamadaCirculo(orientacao: AlvoDimensoesFolha): CamadaCertificado {
  const dim = resolverDimensoesTemplate(orientacao);
  const diametro = Math.min(140, Math.max(60, Math.round(Math.min(dim.largura, dim.altura) * 0.25)));
  return {
    id: gerarId('cam'),
    tipo: 'circulo',
    nome: String(i18n.global.t('camadasPadrao.circulo')),
    x: Math.round((dim.largura - diametro) / 2),
    y: Math.round((dim.altura - diametro) / 2),
    largura: diametro,
    altura: diametro,
    opacidade: 100,
    rotacao: 0,
    visivel: true,
    bloqueada: false,
    corPreenchimento: '#dbeafe',
    semPreenchimento: true,
    corBorda: '#3b82f6',
    espessuraBorda: 3,
    raioBorda: 999,
    estiloBorda: 'solid'
  };
}

/*
 * Recebe: orientação ou dimensões da folha.
 * Devolve: objeto CamadaCertificado do tipo 'linha' centralizado.
 * Por que é usada: cria uma camada de linha reta com nome traduzido no idioma ativo.
 */
export function criarCamadaLinha(orientacao: AlvoDimensoesFolha): CamadaCertificado {
  const dim = resolverDimensoesTemplate(orientacao);
  const larguraLinha = Math.min(320, Math.max(80, dim.largura - 60));
  return {
    id: gerarId('cam'),
    tipo: 'linha',
    nome: String(i18n.global.t('camadasPadrao.linha')),
    x: Math.round((dim.largura - larguraLinha) / 2),
    y: Math.round(dim.altura / 2 - 12),
    largura: larguraLinha,
    altura: 24,
    opacidade: 100,
    rotacao: 0,
    visivel: true,
    bloqueada: false,
    corPreenchimento: '#475569',
    semPreenchimento: false,
    corBorda: '#475569',
    espessuraBorda: 2,
    estiloBorda: 'solid'
  };
}

/*
 * Recebe: orientação ou dimensões da folha e direção da ponta da seta (PT ou EN).
 * Devolve: objeto CamadaCertificado do tipo 'seta' centralizado.
 * Por que é usada: cria uma camada de seta direcional com nome traduzido no idioma ativo.
 */
export function criarCamadaSeta(
  orientacao: AlvoDimensoesFolha,
  pontaSeta: DirecaoPontaSeta = 'direita'
): CamadaCertificado {
  const dim = resolverDimensoesTemplate(orientacao);
  const larguraSeta = Math.min(260, Math.max(80, dim.largura - 60));
  return {
    id: gerarId('cam'),
    tipo: 'seta',
    nome: String(i18n.global.t('camadasPadrao.seta')),
    x: Math.round((dim.largura - larguraSeta) / 2),
    y: Math.round(dim.altura / 2 - 18),
    largura: larguraSeta,
    altura: 36,
    opacidade: 100,
    rotacao: 0,
    visivel: true,
    bloqueada: false,
    corPreenchimento: '#3b82f6',
    semPreenchimento: false,
    corBorda: '#3b82f6',
    espessuraBorda: 3,
    estiloBorda: 'solid',
    pontaSeta: normalizarDirecaoPontaSeta(pontaSeta)
  };
}

/*
 * Recebe: URL/Data URL da imagem, nome sugerido e orientação/dimensões da folha.
 * Devolve: objeto CamadaCertificado do tipo 'imagem' centralizado.
 * Por que é usada: cria uma camada de imagem com fallback para o nome padrão no idioma ativo.
 */
export function criarCamadaImagem(
  src: string,
  nome: string,
  orientacao: AlvoDimensoesFolha
): CamadaCertificado {
  const dim = resolverDimensoesTemplate(orientacao);
  const lado = Math.min(200, Math.max(80, Math.round(Math.min(dim.largura, dim.altura) * 0.35)));
  return {
    id: gerarId('cam'),
    tipo: 'imagem',
    nome: nome || String(i18n.global.t('camadasPadrao.imagem')),
    x: Math.round((dim.largura - lado) / 2),
    y: Math.round((dim.altura - lado) / 2),
    largura: lado,
    altura: lado,
    opacidade: 100,
    rotacao: 0,
    visivel: true,
    bloqueada: false,
    src,
    ajusteImagem: 'contain',
    raioImagem: 0
  };
}

/*
 * Recebe: orientação/dimensões da folha e conteúdo padrão do QR Code.
 * Devolve: objeto CamadaCertificado do tipo 'qrcode'.
 * Por que é usada: cria uma camada de QR Code de validação com nome traduzido no idioma ativo.
 */
export function criarCamadaQrCode(
  orientacao: AlvoDimensoesFolha,
  conteudoQr = 'https://vue-template-studio.dev'
): CamadaCertificado {
  const dim = resolverDimensoesTemplate(orientacao);
  const lado = dim.largura < 550 ? 90 : 120;
  const recuo = dim.largura < 550 ? lado + 24 : 180;
  return {
    id: gerarId('cam'),
    tipo: 'qrcode',
    nome: String(i18n.global.t('camadasPadrao.qrCodeValidacao')),
    x: Math.max(12, dim.largura - recuo),
    y: Math.max(12, dim.altura - recuo),
    largura: lado,
    altura: lado,
    opacidade: 100,
    rotacao: 0,
    visivel: true,
    bloqueada: false,
    conteudoQr,
    corQr: '#0f172a',
    corFundoQr: '#ffffff',
    margemQr: 2
  };
}

/*
 * Recebe: opções com orientação/dimensões, modo de exibição ('url', 'texto' ou 'text'), texto personalizado e fonte.
 * Devolve: objeto CamadaCertificado configurado com linkUrl apontando para {{link_qrcode}}.
 * Por que é usada: cria a camada especial de link vinculada ao QR Code, exibindo a URL completa ou texto clicável no PDF.
 */
export function criarCamadaLinkQrCode(opcoes: {
  orientacao: AlvoDimensoesFolha;
  modoExibicao?: ModoExibicaoLink;
  textoPersonalizado?: string;
  fonte?: string;
}): CamadaCertificado {
  const dim = resolverDimensoesTemplate(opcoes.orientacao);
  const modo = normalizarModoExibicaoLink(opcoes.modoExibicao);
  const tokenLink = `{{${CHAVE_VARIAVEL_LINK_QRCODE}}}`;
  const textoPadrao = String(i18n.global.t('painelInserir.textoPadraoLinkQr'));
  const textoFinal =
    modo === 'texto'
      ? (opcoes.textoPersonalizado || '').trim() || textoPadrao
      : tokenLink;
  const larguraCaixa = Math.min(460, Math.max(180, dim.largura - 60));
  const alturaCaixa = 34;

  return {
    id: gerarId('cam'),
    tipo: modo === 'url' ? 'variavel' : 'texto',
    nome: String(i18n.global.t('camadasPadrao.linkQrCode')),
    x: Math.round((dim.largura - larguraCaixa) / 2),
    y: Math.max(20, dim.altura - 76),
    largura: larguraCaixa,
    altura: alturaCaixa,
    opacidade: 100,
    rotacao: 0,
    visivel: true,
    bloqueada: false,
    texto: textoFinal,
    fonte: opcoes.fonte || "'Inter', sans-serif",
    tamanhoFonte: dim.largura < 550 ? 12 : 14,
    corTexto: '#1e293b',
    negrito: false,
    italico: false,
    sublinhado: true,
    alinhamento: 'center',
    alinhamentoVertical: 'middle',
    permitirEdicaoTexto: true,
    linkUrl: tokenLink,
    modoExibicaoLink: modo
  };
}

/*
 * Recebe: camada original a ser duplicada.
 * Devolve: nova CamadaCertificado clonada com ID único e sufixo traduzido.
 * Por que é usada: duplica camadas mantendo isolamento de referência e aplicando o sufixo (Cópia)/(Copy).
 */
export function duplicarCamada(camada: CamadaCertificado): CamadaCertificado {
  const copia: CamadaCertificado = clonarSeguro(camada);
  copia.id = gerarId('cam');
  copia.nome = `${copia.nome} ${String(i18n.global.t('camadasPadrao.sufixoCopia'))}`;
  copia.x += 20;
  copia.y += 20;
  return copia;
}

/*
 * Recebe: tipo da camada.
 * Devolve: símbolo curto representativo para exibição na lista de camadas.
 * Por que é usada: identifica visualmente cada tipo de camada no painel lateral direito.
 */
export function obterSimboloTipoCamada(tipo: TipoCamada): string {
  if (tipo === 'texto') return 'T';
  if (tipo === 'variavel') return '{}';
  if (tipo === 'imagem') return 'IMG';
  if (tipo === 'qrcode') return 'QR';
  if (tipo === 'circulo') return '◯';
  if (tipo === 'linha') return '╱';
  if (tipo === 'seta') return '→';
  return '□';
}