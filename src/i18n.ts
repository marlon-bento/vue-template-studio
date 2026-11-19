/*
========
Configuração central de internacionalização (vue-i18n) da biblioteca vue-template-studio (src/i18n.ts).
Carrega os pacotes de idioma nativos em Português Brasileiro (pt_br) e Inglês (en) com caminhos
relativos compatíveis com vue-tsc, expõe a instância global do createI18n e fornece funções
em português e inglês para alterar o idioma ativo e registrar idiomas customizados.
========
*/
import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import pt_br from './locales/pt-br.json';

// Tipo derivado da estrutura completa do arquivo de tradução padrão
export type MensagensIdiomaCertificado = typeof pt_br;
export type TemplateLocaleMessages = MensagensIdiomaCertificado;

// Tipo recursivo parcial para permitir que o usuário envie traduções customizadas completas ou parciais
export type MensagensIdiomaParcial = {
  [K in keyof MensagensIdiomaCertificado]?: Partial<MensagensIdiomaCertificado[K]> | Record<string, string>;
} & Record<string, unknown>;
export type PartialTemplateLocaleMessages = MensagensIdiomaParcial;

/*
 * Recebe: nenhum parâmetro.
 * Devolve: objeto contendo os dicionários de mensagens indexados pela chave de cada idioma inicial (pt_br e en).
 * Por que é usada: inicializa o mapa de mensagens do vue-i18n seguindo o padrão estruturado de locales da documentação.
 */
export function loadLocaleMessages(): Record<string, MensagensIdiomaCertificado> {
  const locales: Array<Record<string, MensagensIdiomaCertificado>> = [
    { pt_br: pt_br },
    { en: en }
  ];
  const messages: Record<string, MensagensIdiomaCertificado> = {};

  locales.forEach((lang) => {
    const key = Object.keys(lang)[0];
    if (key) {
      messages[key] = lang[key];
    }
  });

  return messages;
}

// Instância global do vue-i18n compartilhada por todos os componentes e composables da biblioteca
const i18n = createI18n({
  locale: 'pt_br',
  fallbackLocale: 'pt_br',
  legacy: false,
  globalInjection: true,
  messages: loadLocaleMessages()
});

/*
 * Recebe: o código de um idioma (ex.: 'pt-br', 'pt_br', 'en', 'es').
 * Devolve: o código de idioma normalizado compatível com os locales registrados no i18n.
 * Por que é usada: garante que tanto 'pt-br' quanto 'pt_br' funcionem sem duplicar opções no seletor.
 */
export function normalizarCodigoIdioma(codigoIdioma: string): string {
  const limpo = (codigoIdioma || '').trim();
  if (!limpo) return 'pt_br';

  const disponiveis = i18n.global.availableLocales.map(String);
  if (disponiveis.includes(limpo)) {
    return limpo;
  }

  const minusculo = limpo.toLowerCase();
  const comUnderline = minusculo.replace(/-/g, '_');
  if (disponiveis.includes(comUnderline)) {
    return comUnderline;
  }

  if (minusculo === 'pt' || minusculo === 'pt-br' || minusculo === 'pt_br') {
    return 'pt_br';
  }
  if (minusculo === 'en' || minusculo.startsWith('en-') || minusculo.startsWith('en_')) {
    return 'en';
  }

  return limpo;
}

/*
 * Recebe: objeto base e objeto de sobrescrita.
 * Devolve: novo objeto com todas as chaves aninhadas combinadas sem mutar a referência original.
 * Por que é usada: permite que o usuário registre um idioma próprio completo ou parcial mantendo fallback seguro.
 */
function mesclarObjetosTraducao(
  base: Record<string, unknown>,
  sobrescrita: Record<string, unknown>
): Record<string, unknown> {
  const resultado: Record<string, unknown> = { ...base };

  for (const [chave, valor] of Object.entries(sobrescrita || {})) {
    if (
      valor &&
      typeof valor === 'object' &&
      !Array.isArray(valor) &&
      resultado[chave] &&
      typeof resultado[chave] === 'object' &&
      !Array.isArray(resultado[chave])
    ) {
      resultado[chave] = mesclarObjetosTraducao(
        resultado[chave] as Record<string, unknown>,
        valor as Record<string, unknown>
      );
    } else if (valor !== undefined) {
      resultado[chave] = valor;
    }
  }

  return resultado;
}

/*
 * Recebe: o código do idioma (ex.: 'es', 'jp', 'fr', 'en', 'pt_br') e o dicionário de mensagens desse idioma.
 * Devolve: o código do idioma registrado no sistema.
 * Por que é usada: permite que o desenvolvedor adicione sua própria versão de idioma ou customize textos de um idioma existente.
 */
export function adicionarIdioma(
  codigoIdioma: string,
  mensagens: MensagensIdiomaParcial
): string {
  const codigoLimpo = (codigoIdioma || '').trim();
  if (!codigoLimpo) return 'pt_br';

  const disponiveis = i18n.global.availableLocales.map(String);
  const codigoAlvo =
    codigoLimpo.toLowerCase() === 'pt-br' && !disponiveis.includes('pt-br')
      ? 'pt_br'
      : codigoLimpo;

  const existente = disponiveis.includes(codigoAlvo)
    ? (i18n.global.getLocaleMessage(codigoAlvo) as Record<string, unknown>)
    : (JSON.parse(JSON.stringify(pt_br)) as Record<string, unknown>);

  const mesclado = mesclarObjetosTraducao(
    existente,
    mensagens as Record<string, unknown>
  );

  i18n.global.setLocaleMessage(
    codigoAlvo,
    mesclado as unknown as MensagensIdiomaCertificado
  );
  return codigoAlvo;
}

/*
 * Recebe: um mapa com vários idiomas e seus respectivos objetos de tradução (ex.: { es: {...}, jp: {...} }).
 * Devolve: lista com os códigos de idiomas registrados.
 * Por que é usada: facilita o registro em lote de múltiplos idiomas customizados via prop ou configuração global do plugin.
 */
export function registrarIdiomasCustomizados(
  mapaIdiomas?: Record<string, MensagensIdiomaParcial>
): string[] {
  if (!mapaIdiomas || typeof mapaIdiomas !== 'object') return [];
  const registrados: string[] = [];

  for (const [codigo, mensagens] of Object.entries(mapaIdiomas)) {
    if (mensagens && typeof mensagens === 'object') {
      registrados.push(adicionarIdioma(codigo, mensagens));
    }
  }

  return registrados;
}

/*
 * Recebe: o código do idioma desejado (ex.: 'pt_br', 'pt-br', 'en' ou qualquer idioma customizado adicionado).
 * Devolve: o código efetivo do idioma que passou a ficar ativo.
 * Por que é usada: altera reativamente o idioma de todos os componentes na tela em tempo real.
 */
export function definirIdioma(novoIdioma: string): string {
  const normalizado = normalizarCodigoIdioma(novoIdioma);
  i18n.global.locale.value = normalizado as 'pt_br' | 'en';
  return normalizado;
}

/*
 * Recebe: nenhum parâmetro.
 * Devolve: lista de códigos de todos os idiomas disponíveis atualmente na instância do i18n.
 * Por que é usada: abastece o componente LocaleSwitcher e inspeções externas de idiomas suportados.
 */
export function obterIdiomasDisponiveis(): string[] {
  return i18n.global.availableLocales.map(String);
}

/*
 * Recebe: nenhum parâmetro.
 * Devolve: os métodos de tradução (t), referência reativa do idioma (locale) e funções de gerenciamento em português e inglês.
 * Por que é usada: permite usar o vue-i18n dentro de <script setup> ou composables mesmo quando o usuário não chamou app.use(i18n) manualmente.
 */
export function usarI18nCertificado() {
  const { t } = i18n.global;
  return {
    t,
    locale: i18n.global.locale,
    availableLocales: i18n.global.availableLocales,
    definirIdioma,
    adicionarIdioma,
    registrarIdiomasCustomizados,
    setLocale: definirIdioma,
    addLocale: adicionarIdioma,
    registerCustomLocales: registrarIdiomasCustomizados
  };
}

// Aliases em inglês para facilitar adoção internacional via npm
export const normalizeLocaleCode = normalizarCodigoIdioma;
export const addLocale = adicionarIdioma;
export const registerCustomLocales = registrarIdiomasCustomizados;
export const setLocale = definirIdioma;
export const getAvailableLocales = obterIdiomasDisponiveis;
export const useTemplateI18n = usarI18nCertificado;

export { i18n };
export default i18n;
