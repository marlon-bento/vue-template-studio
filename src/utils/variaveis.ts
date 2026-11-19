/*
========
Utilitários de variáveis dinâmicas, detecção de QR Code, IDs e sanitização (src/utils/variaveis.ts).
Isola a substituição de placeholders {{chave}}, extração de chaves de texto do template
(sem expor link interno de QR Code como variável de tela), sanitização de URLs de imagem
e formatação segura de arquivos.
========
*/
import type { CamadaCertificado, DadosCertificado, TemplateCertificado } from '../types/certificado';

// Chave da variável especial disponibilizada automaticamente quando o template contém QR Code
export const CHAVE_VARIAVEL_LINK_QRCODE = 'link_qrcode';
export const QR_CODE_LINK_VARIABLE_KEY = CHAVE_VARIAVEL_LINK_QRCODE;

// Chaves reconhecidas como link do QR Code para resolução automática e validação sem erro
export const CHAVES_LINK_QRCODE = [
  'link_qrcode',
  'link_validacao',
  'url_validacao',
  'qrcode'
] as const;

/**
 * Gera um identificador único com prefixo legível.
 */
export function gerarId(prefixo = 'cam'): string {
  return `${prefixo}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Normaliza o nome de uma variável personalizada removendo espaços e caracteres especiais.
 */
export function normalizarNomeVariavel(nome: string): string {
  return nome
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Sanitiza o nome de um arquivo preservando legibilidade sem acentos ou caracteres inválidos.
 */
export function sanitizarNomeArquivo(nome: string, fallback = 'certificado'): string {
  const limpo = (nome || fallback)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return limpo || fallback;
}

/**
 * Valida se uma URL de preview de imagem gerada é estritamente um Data URL (`data:image/...`)
 * ou Blob URL (`blob:...`), bloqueando `javascript:`, `data:text/html` ou origens não confiáveis.
 */
export function ehUrlImagemPreviewSegura(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const limpa = url.trim();
  return /^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=\s]+$/i.test(limpa) ||
    /^blob:/i.test(limpa);
}

/**
 * Retorna a URL de preview apenas se passar pela validação de segurança (`data:image/` ou `blob:`),
 * caso contrário retorna string vazia.
 */
export function sanitizarUrlImagemPreview(url: string | null | undefined): string {
  if (!ehUrlImagemPreviewSegura(url)) return '';
  return String(url).trim();
}

/**
 * Substitui placeholders {{chave}} pelos valores informados em dados.
 */
export function resolverVariaveisTexto(
  texto: string,
  dados: DadosCertificado = {},
  aplicarSubstituicao = true
): string {
  if (!texto || !aplicarSubstituicao) return texto || '';
  return texto.replace(/\{\{(\w+)\}\}/g, (match, chave) => {
    const valor = dados[chave];
    if (valor !== undefined && valor !== null && String(valor) !== '') {
      return String(valor);
    }
    return match;
  });
}

/**
 * Resolve internamente o link/conteúdo que será codificado no QR Code, sem precisar de variável na tela.
 */
export function resolverConteudoInternoQrCode(
  camada: CamadaCertificado,
  dados: DadosCertificado = {},
  aplicarSubstituicao = true
): string {
  if (aplicarSubstituicao) {
    const linkDireto =
      dados.link_validacao ??
      dados.link_qrcode ??
      dados.url_validacao ??
      dados.qrcode;
    if (linkDireto !== undefined && linkDireto !== null && String(linkDireto).trim() !== '') {
      return String(linkDireto).trim();
    }
  }
  const base = (camada.conteudoQr || '').trim() || 'https://vue-template-studio.dev';
  return resolverVariaveisTexto(base, dados, aplicarSubstituicao);
}

/**
 * Extrai todas as chaves de variáveis {{...}} usadas nas camadas de texto/variável do template.
 * O QR Code funciona internamente e não polui a lista de variáveis de texto da tela.
 */
export function extrairVariaveisTemplate(template: TemplateCertificado): string[] {
  const conjunto = new Set<string>();
  for (const camada of template?.camadas || []) {
    if (camada.tipo === 'qrcode') continue;
    if (camada.texto) {
      const matches = camada.texto.matchAll(/\{\{(\w+)\}\}/g);
      for (const m of matches) {
        conjunto.add(m[1]);
      }
    }
  }
  return Array.from(conjunto);
}

/**
 * Verifica se uma chave específica {{chave}} existe em alguma camada de texto/variável do template.
 */
export function temVariavelNoTemplate(
  template: TemplateCertificado | null | undefined,
  chave: string
): boolean {
  if (!template || !chave) return false;
  return extrairVariaveisTemplate(template).includes(chave);
}

/**
 * Verifica se o template possui ao menos uma camada de QR Code ativa.
 */
export function temQrCodeNoTemplate(
  template: TemplateCertificado | null | undefined
): boolean {
  if (!template || !Array.isArray(template.camadas)) return false;
  return template.camadas.some((c) => c.tipo === 'qrcode' && c.visivel !== false);
}

/*
 * Recebe: template completo e dicionário opcional de dados.
 * Devolve: URL ou conteúdo resolvido do primeiro QR Code visível no template, ou string vazia.
 * Por que é usada: obtém o endereço padrão do QR Code para alimentar a variável especial {{link_qrcode}}.
 */
export function obterLinkPadraoQrCodeTemplate(
  template: TemplateCertificado | null | undefined,
  dados: DadosCertificado = {}
): string {
  const camadaQr = (template?.camadas || []).find(
    (c) => c.tipo === 'qrcode' && c.visivel !== false
  );
  if (!camadaQr) return '';
  return resolverConteudoInternoQrCode(camadaQr, dados, true);
}

/*
 * Recebe: template completo e dicionário de dados do cliente.
 * Devolve: novo dicionário de dados enriquecido com link_qrcode e link_validacao quando houver QR Code ou link informado.
 * Por que é usada: garante que {{link_qrcode}} e {{link_validacao}} sempre sejam substituídos corretamente no preview e no PDF.
 */
export function enriquecerDadosComLinkQrCode(
  template: TemplateCertificado | null | undefined,
  dados: DadosCertificado = {}
): DadosCertificado {
  const resultado: DadosCertificado = { ...dados };
  const linkExistente =
    resultado.link_qrcode ??
    resultado.link_validacao ??
    resultado.url_validacao ??
    resultado.qrcode;

  const linkResolvido =
    linkExistente !== undefined && linkExistente !== null && String(linkExistente).trim() !== ''
      ? String(linkExistente).trim()
      : obterLinkPadraoQrCodeTemplate(template, resultado);

  if (linkResolvido) {
    if (!resultado.link_qrcode) {
      resultado.link_qrcode = linkResolvido;
    }
    if (!resultado.link_validacao) {
      resultado.link_validacao = linkResolvido;
    }
  }

  return resultado;
}

/*
 * Recebe: string de texto já resolvido.
 * Devolve: a primeira URL http:// ou https:// encontrada no texto, ou null se não houver.
 * Por que é usada: detecta links presentes em textos livres para torná-los clicáveis na exportação PDF.
 */
export function extrairUrlDoTexto(texto: string | null | undefined): string | null {
  if (!texto || typeof texto !== 'string') return null;
  const match = texto.match(/https?:\/\/[^\s<>"'\]]+/i);
  if (!match) return null;
  return match[0].replace(/[.,;!?)]+$/, '');
}

/*
 * Recebe: uma camada, dicionário de dados e o template completo.
 * Devolve: URL segura (http:// ou https://) para anotação clicável no PDF, ou null se a camada não possuir link.
 * Por que é usada: unifica a resolução de links clicáveis para camadas de texto/variável (com linkUrl ou URL no texto) e QR Code.
 */
export function resolverUrlClicavelCamada(
  camada: CamadaCertificado,
  dados: DadosCertificado = {},
  template?: TemplateCertificado | null
): string | null {
  if (!camada || camada.visivel === false) return null;

  if (camada.tipo === 'qrcode') {
    const conteudo = resolverConteudoInternoQrCode(camada, dados, true).trim();
    return /^https?:\/\//i.test(conteudo) ? conteudo : null;
  }

  if (camada.tipo === 'texto' || camada.tipo === 'variavel') {
    const dadosCompletos = enriquecerDadosComLinkQrCode(template, dados);

    if (camada.linkUrl && camada.linkUrl.trim()) {
      const urlResolvida = resolverVariaveisTexto(
        camada.linkUrl.trim(),
        dadosCompletos,
        true
      ).trim();
      if (/^https?:\/\//i.test(urlResolvida)) {
        return urlResolvida;
      }
    }

    if (camada.texto && camada.texto.trim()) {
      const textoResolvido = resolverVariaveisTexto(camada.texto, dadosCompletos, true);
      return extrairUrlDoTexto(textoResolvido);
    }
  }

  return null;
}
