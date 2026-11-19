# vue-template-studio

> **Idioma / Language:** [English](./README.md) | **Português (Brasil)**

Biblioteca Vue 3 + TypeScript **100% agnóstica de domínio** e headless-ready para criação em camadas, pré-visualização e exportação de templates (A4, A5, Carta, Crachá, Cartão CR80, Social e Personalizado L × A) em PNG e PDF, com experiência visual inspirada no **Photoshop CS6 + Figma Auto Layout**, **API dupla (Inglês e Português)** para adoção no npm e **internacionalização nativa (`vue-i18n`)**.

## Principais Funcionalidades

- **Componentes e Props em Inglês e Português**:
  - Componentes principais `<TemplateStudioEditor>` / `<VTemplateStudioEditor>` (ou `<VCertificadoEditor>`) e `<TemplateStudioViewer>` / `<VTemplateStudioViewer>` (ou `<VCertificadoVisualizador>`).
  - Aceita todas as props e variáveis tanto em inglês (`:available-variables="[{ key, label, layerName, previewValue }]"`, `:preview-data`, `:allow-custom-variables`, `:theme`, `:locale`, `:locale-messages`, `:show-locale-switcher`, `@save`, `@export`) quanto em português (`:variaveis-disponiveis="[{ chave, rotulo, nomeCamada, valorVisualizacao }]"`, `:dados-preview`, `:permitir-criar-variavel`, `:tema`, `:mensagens-idioma`, `@salvar`, `@exportar`).
- **Internacionalização Completa (`vue-i18n` v11)**:
  - Traduções nativas em **Português Brasileiro (`pt_br` / `pt-br`)** e **Inglês (`en`)** para todos os componentes, painéis, dicas de ferramentas, placeholders e atributos de acessibilidade.
  - Componente `<LocaleSwitcher />` integrado na barra superior por padrão (ou utilizável de forma avulsa em qualquer view).
  - Permite adicionar sua própria versão de idioma usando `adicionarIdioma('es', { ... })` (`addLocale`) ou a prop `:mensagens-idioma` (`:locale-messages`).

## Instalação

```bash
npm install vue-template-studio vue-i18n
```

Registre o plugin no seu `main.ts`:

```ts
import { createApp } from 'vue';
import { TemplateStudioPlugin, i18n } from 'vue-template-studio';
import 'vue-template-studio/style.css';
import App from './App.vue';

const app = createApp(App);

app.use(i18n);
app.use(TemplateStudioPlugin, {
  tema: 'dark',
  locale: 'pt_br',
  escalaExportacao: 2
});

app.mount('#app');
```

## Licença

MIT © [Márlon Bento Azevedo](https://github.com/marlon-bento)
