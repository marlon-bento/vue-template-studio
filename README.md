# vue-template-studio

> **Language / Idioma:** **English** | [Português (Brasil)](./README.pt-BR.md)

A **100% domain-agnostic**, headless-ready Vue 3 + TypeScript library for creating, previewing, and exporting layer-based templates (A4, A5, Letter, Badge, CR80 Card, Social, and Custom W × H) in PNG & PDF with a **Photoshop CS6 + Figma Auto Layout** studio experience and built-in **internationalization (`vue-i18n`)** in English (`en`), Brazilian Portuguese (`pt_br`), and custom user-provided locales.

## Key Features

- **English & Portuguese Component / Prop API**:
  - Primary English components `<TemplateStudioEditor>` (or `<VTemplateStudioEditor>`) and `<TemplateStudioViewer>` (or `<VTemplateStudioViewer>`) with English props (`:available-variables`, `:preview-data`, `:allow-custom-variables`, `:theme`, `:locale`, `:locale-messages`, `:show-locale-switcher`, `:data`, `:file-name`, `:generate-on-mount`) and events (`@save`, `@export`, `@error`, `@select-layer`, `@variables-changed`, `@variables-detected`, `@image-generated`, `@pdf-generated`).
  - Full backward compatibility with Portuguese aliases (`<VCertificadoEditor>`, `<VCertificadoVisualizador>`, `:variaveis-disponiveis`, `:dados-preview`, etc.).
- **Full Internationalization (`vue-i18n` v11)**:
  - Built-in translations for **English (`en`)** and **Brazilian Portuguese (`pt_br` / `pt-br`)** across every component, inspector section, tooltip, placeholder, and accessibility attribute.
  - Includes `<LocaleSwitcher />` (embedded in the top bar by default or usable standalone anywhere in your app).
  - Supports adding custom languages or overriding existing translations via `addLocale('es', { ... })` (`adicionarIdioma`) or the `:locale-messages` (`:mensagens-idioma`) prop.
- **100% Domain-Agnostic Variables & Autocomplete (`{{`)**:
  - Typing `{{` in a Free Text layer opens a floating variable autocomplete menu and highlights valid variables with blue badges and unknown variables with red badges.
- **Figma-Style Auto Layout Inspector & Smart Guides**:
  - Interactive **3x3 Alignment Matrix** to position any layer on the sheet or align text inside its bounding box, plus `Alt` pixel distance guides.

## Installation

```bash
npm install vue-template-studio vue-i18n
```

Register the plugin in your `main.ts`:

```ts
import { createApp } from 'vue';
import { TemplateStudioPlugin, i18n } from 'vue-template-studio';
import 'vue-template-studio/style.css';
import App from './App.vue';

const app = createApp(App);

app.use(i18n);
app.use(TemplateStudioPlugin, {
  theme: 'dark',
  locale: 'en',
  exportScale: 2
});

app.mount('#app');
```

## Quick Start (English API)

```vue
<script setup lang="ts">
import { ref } from 'vue';
import {
  TemplateStudioEditor,
  createEmptyTemplate,
  type TemplateDocument,
  type TemplateVariable
} from 'vue-template-studio';
import 'vue-template-studio/style.css';

const template = ref<TemplateDocument>(createEmptyTemplate('Event Badge'));

const variables: TemplateVariable[] = [
  {
    key: 'participant_name',
    label: '+ Participant',
    layerName: 'Participant Name',
    previewValue: 'Alex Morgan'
  },
  {
    key: 'role',
    label: '+ Role',
    layerName: 'Role',
    previewValue: 'Keynote Speaker'
  }
];

function onSave(saved: TemplateDocument) {
  console.log('Saved template:', saved);
}
</script>

<template>
  <div style="height: 100vh;">
    <TemplateStudioEditor
      v-model="template"
      locale="en"
      theme="dark"
      :available-variables="variables"
      :allow-custom-variables="false"
      @save="onSave"
    />
  </div>
</template>
```

## Adding a Custom Language

Use `addLocale(localeCode, messages)` (or `adicionarIdioma`) or pass `:locale-messages` to register any new language:

```ts
import { addLocale, setLocale } from 'vue-template-studio';

addLocale('es', {
  barraSuperior: {
    salvar: 'Guardar',
    exportarPdf: 'Exportar PDF',
    preVisualizar: 'Vista Previa'
  },
  painelInserir: {
    inserir: 'Insertar',
    fundo: 'Fondo'
  }
});

setLocale('es');
```

## License

MIT © [Márlon Bento Azevedo](https://github.com/marlon-bento)
