/*
========
Reexportação compatível da instância e utilitários de internacionalização (src/locales/i18n.ts).
Permite importar o i18n tanto de '@/i18n' quanto de '@/locales/i18n' conforme a documentação do projeto.
========
*/
export {
  default,
  i18n,
  loadLocaleMessages,
  normalizarCodigoIdioma,
  normalizeLocaleCode,
  adicionarIdioma,
  addLocale,
  registrarIdiomasCustomizados,
  registerCustomLocales,
  definirIdioma,
  setLocale,
  obterIdiomasDisponiveis,
  getAvailableLocales,
  usarI18nCertificado,
  useTemplateI18n,
  type MensagensIdiomaCertificado,
  type TemplateLocaleMessages,
  type MensagensIdiomaParcial,
  type PartialTemplateLocaleMessages
} from '../i18n';
