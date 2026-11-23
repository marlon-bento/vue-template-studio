<div align="center">

# 🎨 vue-template-studio

**100% Domain-Agnostic, Figma/Photoshop-Style Visual Template Studio & High-DPI PDF/PNG Exporter for Vue 3**

[![NPM Version](https://img.shields.io/npm/v/vue-template-studio?color=42b883&label=npm)](https://www.npmjs.com/package/vue-template-studio)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883?logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![i18n](https://img.shields.io/badge/i18n-vue--i18n%20v11-42b883)](#7-internationalization-vue-i18n--custom-locales)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

🌎 **English** | 🇧🇷 **[Leia em Português (Portuguese Version)](./README.pt-BR.md)**

</div>

---

## 📋 Table of Contents

1. [Why `vue-template-studio`?](#1-why-vue-template-studio)
2. [Modular Architecture](#2-modular-architecture)
3. [Installation & Quick Setup](#3-installation--quick-setup)
4. [Visual Editor (`<TemplateStudioEditor>`)](#4-visual-editor-templatestudioeditor)
5. [Viewer & Exporter (`<TemplateStudioViewer>`)](#5-viewer--exporter-templatestudioviewer)
6. [Sheet Formats, `{{` Autocomplete & Custom QR Codes](#6-sheet-formats--autocomplete--custom-qr-codes)
7. [Internationalization (`vue-i18n` & Custom Locales)](#7-internationalization-vue-i18n--custom-locales)
8. [Styling, Dark/Light Mode & CSS Variables](#8-styling-darklight-mode--css-variables)
9. [Headless UI Mode & Scoped Slots](#9-headless-ui-mode--scoped-slots)
10. [Keyboard Shortcuts & Complete API Reference](#10-keyboard-shortcuts--complete-api-reference)

---

## 1. Why `vue-template-studio`?

Building a visual document generator (certificates, event badges, CR80 credentials, social posts, vouchers) in **Vue 3** usually means stitching together brittle DOM-to-image hacks, hardcoded fields, and clunky alignment controls. `vue-template-studio` delivers a **native Canvas 2D + jsPDF rendering engine** paired with a **Figma Auto Layout + Photoshop CS6** workspace—completely decoupled from any specific business domain.

### Core Highlights

* 🧩 **100% Domain-Agnostic Variables:** Zero hardcoded fields. Pass your own `:available-variables` and `:preview-data`; typing `{{` in any text layer opens a floating autocomplete menu and highlights valid variables in blue and unknown variables in red inline.
* 📐 **Figma & Photoshop Studio Ergonomics:** Interactive **3×3 Alignment Matrix** (for both sheet placement and text-box alignment), `Alt` pixel distance guides between elements and sheet edges, magnetic center snap guides, `Space + Drag` canvas panning, `Ctrl + Scroll` zooming, `Shift` aspect-ratio lock & 15° rotation snap, and drag-and-drop layer reordering.
* 📄 **Native Canvas 2D & High-DPI PDF/PNG Export:** Exports crisp high-DPI PNGs and PDFs in exact millimeter dimensions (`A4`, `A5`, `Letter`, `Badge`, `CR80`, `Social 1080×1080`, or `Custom W × H`), preserving **clickable PDF link annotations** (`pdf.link`) for QR Codes, `{{link_qrcode}}` layers, and URLs.
* 📱 **Stylable QR Codes with Center Logo:** Customize module shapes (`square`, `rounded`, `dots`), corner eyes (`square`, `rounded`, `circle`), independent colors, and center logos with automatic quiet-zone cutout and Level H error correction.
* 🌍 **Built-in Internationalization (`vue-i18n` v11):** Ready out of the box in English (`en`) and Brazilian Portuguese (`pt_br`), with `addLocale()` and `:locale-messages` to register any custom language at runtime.
* 🎨 **Themeable & Headless-Ready:** Automatic integration with **Tabler** (`--tblr-*`), built-in `dark` and `light` themes, custom CSS variables (`--vue-template-studio-*`), class injection, and full `:unstyled="true"` headless mode with Scoped Slots.

---

## 2. Modular Architecture

The library is organized into focused, single-responsibility modules inside `src/`:

| Module / Path | Responsibility |
| :--- | :--- |
| `src/components/TemplateStudioEditor.vue` | Root visual editor orchestrating top bar, panels, canvas stage, history, and keyboard shortcuts. |
| `src/components/TemplateStudioViewer.vue` | Standalone live previewer, dynamic variable detector, and PNG/PDF exporter with URL sanitization. |
| `src/components/LocaleSwitcher.vue` | Reactive language selector bound to `vue-i18n`. |
| `src/components/editor/*` | Modular studio subcomponents (`BarraSuperiorEditor`, `PainelInsercaoElementos`, `PalcoCanvasCertificado`, `PainelPropriedadesFigma`, `PainelCamadasLista`, `CampoTextoVariavel`). |
| `src/composables/*` | Reactive managers for templates & export, layers & sheet formats, Undo/Redo history (`shallowRef`), 3×3 alignment, stage interactions, and keyboard shortcuts. |
| `src/utils/renderizador.ts` | Native Canvas 2D rendering engine (backgrounds, shapes, arrows, images, stylized QR codes, and multiline wrapped text). |
| `src/utils/qrcode.ts` | Level-H QR Code matrix & stylized SVG/Canvas path generator with center logo quiet-zone cutout. |
| `src/utils/variaveis.ts` | `{{key}}` variable substitution, template variable extraction, clickable URL resolution, safe cloning, and preview URL sanitization. |
| `src/i18n.ts` & `src/locales/*` | `vue-i18n` v11 setup, built-in `en` / `pt_br` dictionaries, and runtime locale registration helpers. |

---

## 3. Installation & Quick Setup

Install the package and `vue-i18n` via NPM, PNPM, or Yarn:

```bash
npm install vue-template-studio vue-i18n
```

Register `TemplateStudioPlugin`, `i18n`, and import the stylesheet in your `main.ts`:

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { TemplateStudioPlugin, i18n } from 'vue-template-studio'
import 'vue-template-studio/style.css'

const app = createApp(App)

app.use(i18n)
app.use(TemplateStudioPlugin, {
  theme: 'dark',
  locale: 'en',
  showLocaleSwitcher: true,
  allowCustomVariables: false,
  exportScale: 2,
  previewScale: 1.5,
  imageQuality: 0.95,
  initialZoom: 0.66,
  historyLimit: 50,
})

app.mount('#app')
```

---

## 4. Visual Editor (`<TemplateStudioEditor>`)

Bind a `TemplateDocument` via `v-model` and pass your domain's variables to `:available-variables`:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  TemplateStudioEditor,
  createEmptyTemplate,
  type TemplateDocument,
  type TemplateVariable
} from 'vue-template-studio'
import 'vue-template-studio/style.css'

const template = ref<TemplateDocument>(createEmptyTemplate('Event Badge', 'landscape', 'badge'))

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
  },
  {
    key: 'event_date',
    label: '+ Date',
    layerName: 'Event Date',
    previewValue: 'November 23, 2026'
  }
]

function handleSave(savedTemplate: TemplateDocument) {
  console.log('Saved JSON:', savedTemplate)
}

function handleExport(result: { fileName: string; pdfBlob: Blob; imageDataUrl: string }) {
  console.log('Exported file:', result.fileName)
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
      :show-locale-switcher="true"
      @save="handleSave"
      @export="handleExport"
    />
  </div>
</template>
```

---

## 5. Viewer & Exporter (`<TemplateStudioViewer>`)

Use `<TemplateStudioViewer>` to render a saved template with live data, inspect which variables exist in the template via `#fields`, and export high-DPI PNG or PDF files:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { TemplateStudioViewer, type TemplateDocument } from 'vue-template-studio'
import 'vue-template-studio/style.css'

defineProps<{ template: TemplateDocument }>()

const data = ref({
  participant_name: 'Alex Morgan',
  role: 'Keynote Speaker',
  event_date: 'November 23, 2026',
  link_qrcode: 'https://example.com/verify/CERT-2026-001'
})
</script>

<template>
  <TemplateStudioViewer
    :template="template"
    :data="data"
    file-name="event_badge_alex"
    locale="en"
    theme="dark"
    :generate-on-mount="true"
  >
    <template #fields="{ variables, hasVariable }">
      <div class="dynamic-form">
        <p>Detected variables: {{ variables.join(', ') }}</p>
        <input v-if="hasVariable('participant_name')" v-model="data.participant_name" />
        <input v-if="hasVariable('role')" v-model="data.role" />
      </div>
    </template>
  </TemplateStudioViewer>
</template>
```

---

## 6. Sheet Formats, `{{` Autocomplete & Custom QR Codes

### 6.1. Built-in Sheet Presets (96 DPI Base)

Both English and Portuguese format IDs are accepted interchangeably:

| Format ID | Description | Base Dimensions (Landscape) | Orientation Toggle |
| :--- | :--- | :---: | :---: |
| `'a4'` | A4 (297 × 210 mm) | `1123 × 794 px` | Landscape / Portrait |
| `'a5'` | A5 (210 × 148 mm) | `794 × 559 px` | Landscape / Portrait |
| `'letter'` \| `'carta'` | US Letter | `1056 × 816 px` | Landscape / Portrait |
| `'badge'` \| `'cracha'` | Event Badge (130 × 90 mm) | `491 × 340 px` | Landscape / Portrait |
| `'card'` \| `'cartao'` | CR80 Card / Credential | `645 × 408 px` | Landscape / Portrait |
| `'square'` \| `'quadrado'` | Social / Post | `1080 × 1080 px` | Square |
| `'custom'` | Custom (`W × H`) | Any `120–4000 px` | Landscape / Portrait |

### 6.2. Inline `{{` Variable Autocomplete
* Typing `{{` inside any free-text layer (or an unlocked variable layer) opens a keyboard-navigable (`ArrowUp`, `ArrowDown`, `Enter`, `Tab`, `Escape`) autocomplete menu.
* Known variables are highlighted in **blue** inline; unrecognized variables are highlighted in **red** so designers catch typos before publishing.

### 6.3. Custom QR Codes & Clickable PDF Links
* Adding a QR Code layer automatically unlocks the **QR Code Link** section in the Insert panel and registers `{{link_qrcode}}` as a valid variable.
* Customize module styles (`'square' | 'quadrado'`, `'rounded' | 'arredondado'`, `'dots' | 'pontos'`), eye corners (`'square' | 'quadrado'`, `'rounded' | 'arredondado'`, `'circle' | 'circulo'`), colors, transparent background, and a centered logo image with automatic quiet-zone cutout.
* When exporting to PDF, any QR Code, `{{link_qrcode}}` layer, or text layer containing a `linkUrl` / `https://` URL automatically becomes a **clickable PDF annotation**.

---

## 7. Internationalization (`vue-i18n` & Custom Locales)

`vue-template-studio` ships with full **English (`en`)** and **Brazilian Portuguese (`pt_br`)** translations. You can switch languages via the `:locale` prop, `<LocaleSwitcher />`, or `setLocale()`, and register new languages at any time using `addLocale()` or `:locale-messages`:

```ts
import { addLocale, setLocale } from 'vue-template-studio'

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
})

setLocale('es')
```

---

## 8. Styling, Dark/Light Mode & CSS Variables

The studio automatically inherits **Tabler** variables (`--tblr-primary`, `--tblr-bg-surface`, `--tblr-border-color`) when present, and falls back to standalone dark/light palettes (`theme="dark"` or `theme="light"`). Override `--vue-template-studio-*` tokens to match your brand:

```css
.vc-estudio,
.vc-visualizador {
  --vue-template-studio-bg: #141417;
  --vue-template-studio-panel: #1b1b20;
  --vue-template-studio-surface: #232329;
  --vue-template-studio-border: #2e2e37;
  --vue-template-studio-text: #f4f4f5;
  --vue-template-studio-muted: #9ca3af;
  --vue-template-studio-primary: #3b82f6;
  --vue-template-studio-primary-fg: #ffffff;
  --vue-template-studio-success: #10b981;
  --vue-template-studio-danger: #f43f5e;
  --vue-template-studio-warning: #f59e0b;
  --vue-template-studio-radius: 10px;
  --vue-template-studio-font: 'Inter', system-ui, sans-serif;
}
```

---

## 9. Headless UI Mode & Scoped Slots

Set `:unstyled="true"` to strip default styles and inject your own via `:classes`, or customize sections using Scoped Slots:

### `<TemplateStudioEditor>` Scoped Slots
* `#top-actions` — Extra buttons inside the top toolbar (`{ template, previewMode }`).
* `#insert-panel` — Replace the left insert panel (`{ addText, addFrame, addCircle, addLine, addArrow, addQrCode }`).
* `#empty` — Empty inspector state when no layer is selected.
* `#inspector` — Replace the right-hand property inspector (`{ layer, confirm }`).
* `#layers` — Replace the bottom-right layer list (`{ layers, selectedId }`).

### `<TemplateStudioViewer>` Scoped Slots
* `#toolbar` — Replace the action bar (`{ processing, variables, hasVariable, updatePreview, exportPdf, exportImage }`).
* `#fields` — Render dynamic form inputs for detected template variables (`{ variables, hasVariable, data, template }`).
* `#preview` — Customize the preview stage (`{ imageUrl, processing }`).

```vue
<TemplateStudioViewer :template="template" :data="data" :unstyled="true">
  <template #toolbar="{ processing, exportPdf, exportImage }">
    <button :disabled="processing" @click="exportPdf(true)">Download PDF</button>
    <button :disabled="processing" @click="exportImage()">Download PNG</button>
  </template>
</TemplateStudioViewer>
```

---

## 10. Keyboard Shortcuts & Complete API Reference

### Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + Z` | Undo |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Redo |
| `Ctrl + D` | Duplicate selected layer |
| `Delete` / `Backspace` | Delete selected layer |
| `Arrow Keys` | Move selected layer by `1px` |
| `Shift + Arrow Keys` | Move selected layer by `10px` |
| `Alt` *(hold)* | Measure pixel distances to sheet edges or hovered layer |
| `Space + Drag` | Pan across the canvas |
| `Ctrl + Scroll` | Zoom in / out |
| `Shift + Resize` | Lock aspect ratio |
| `Shift + Rotate` | Snap rotation to `15°` increments |

### `<TemplateStudioEditor>` Props

| Prop | Type | Default | Description |
| :--- | :--- | :---: | :--- |
| `modelValue` (`v-model`) | `TemplateDocument` | Empty A4 template | Reactive template document being edited. |
| `availableVariables` | `TemplateVariable[]` | `[]` | Domain variables available in the Insert panel and `{{` autocomplete. |
| `previewData` | `TemplateData` | `{}` | Key-value preview overrides shown when Preview mode is active. |
| `availableFonts` | `string[]` | Built-in 9 fonts | Font families listed in the typography inspector. |
| `allowCustomVariables` | `boolean` | `false` | Allows users to create ad-hoc variables from the Insert panel. |
| `theme` | `'dark' \| 'light'` | `'dark'` | Color theme of the editor workspace. |
| `unstyled` | `boolean` | `false` | Disables default component styling for headless usage. |
| `locale` | `string` | `'pt_br'` | Active interface language (`'en'`, `'pt_br'`, or custom locale). |
| `localeMessages` | `Record<string, PartialTemplateLocaleMessages>` | `undefined` | Custom language dictionaries registered automatically. |
| `showLocaleSwitcher` | `boolean` | `true` | Shows or hides `<LocaleSwitcher>` in the top bar. |
| `labels` | `TemplateStudioLabels` | `undefined` | Direct label overrides (`save`, `exportPdf`, `preview`, `insert`, `layers`, etc.). |
| `classes` | `TemplateStudioClasses` | `undefined` | Custom CSS classes for `root`, `topBar`, `workspace`, `leftDock`, `canvasStage`, `sheet`, `rightDock`, `inspector`, `layersPanel`, `floatingDock`. |
| `maxUploadSizeMb` | `number` | `8` | Maximum allowed file size (MB) for uploaded background/layer images. |

### `<TemplateStudioEditor>` Events & Exposed Methods

* **Events:** `@update:modelValue`, `@save`, `@export`, `@error`, `@select-layer`, `@variables-changed`
* **Exposed (`ref`):** `zoom`, `dimensions`, `usedVariables`, `effectivePreviewData`, `undo()`, `redo()`, `exportNow()`, `duplicateSelectedLayer()`, `deleteSelectedLayer()`, `selectLayer(id)`, `selectSheetFormat(format)`, `setSheetDimensions(w, h)`, `toggleSheetOrientation(orientation)`, `alignOnSheet(axis)`, `alignOnSheetGrid3x3(pos)`, `addText(text, name, isVar)`, `addFrame()`, `addCircle()`, `addLine()`, `addArrow(dir?)`, `addQrCode(content?)`, `addQrCodeLink(mode?, customText?)`

### `<TemplateStudioViewer>` Props, Events & Exposed Methods

| Prop | Type | Default | Description |
| :--- | :--- | :---: | :--- |
| `template` | `TemplateDocument` | **Required** | Template document to render and export. |
| `data` | `TemplateData` | `{}` | Dynamic values replacing `{{key}}` placeholders and QR Code links. |
| `fileName` | `string` | Auto-generated | Base filename used for exported PDF/PNG downloads. |
| `generateOnMount` | `boolean` | `true` | Automatically renders the preview image on mount and when props change. |
| `theme` | `'dark' \| 'light'` | `'dark'` | Color theme of the viewer. |
| `unstyled` | `boolean` | `false` | Disables default styling for headless usage. |
| `locale` | `string` | `'pt_br'` | Active interface language. |
| `localeMessages` | `Record<string, PartialTemplateLocaleMessages>` | `undefined` | Custom language dictionaries. |
| `showLocaleSwitcher` | `boolean` | `false` | Shows or hides `<LocaleSwitcher>` in the viewer toolbar. |
| `labels` | `TemplateStudioLabels` | `undefined` | Direct label overrides (`updatePreview`, `downloadPdf`, `rendering`, `exportingPdf`). |
| `classes` | `TemplateStudioClasses` | `undefined` | Custom CSS class for `viewer`. |

* **Events:** `@image-generated`, `@pdf-generated`, `@variables-detected`, `@error`
* **Exposed (`ref`):** `previewImageUrl`, `safePreviewImageUrl`, `templateVariables`, `hasVariable(key)`, `updatePreviewImage()`, `exportPdf(autoDownload?)`, `exportImage()`

### `useTemplateStudio()` Composable

| Method / Property | Description |
| :--- | :--- |
| `globalOptions` | Reactive ref holding global plugin options. |
| `configureTemplateStudio(options)` | Updates global options and synchronizes `vue-i18n`. |
| `createEmptyTemplate(name?, orientation?, format?, w?, h?)` | Creates a clean `TemplateDocument`. |
| `duplicateTemplate(template, newName?)` | Deep-clones a template with a new unique ID. |
| `exportTemplateJson(template)` / `importTemplateJson(json)` | Serializes or validates/imports template JSON. |
| `extractTemplateVariables(template)` / `hasVariableInTemplate(template, key)` | Inspects `{{key}}` placeholders used in a template. |
| `generatePreviewImage(template, data?, options?)` | Renders a PNG Data URL via Canvas 2D. |
| `generateExportPackage(template, data?, options?)` | Generates `{ imageDataUrl, imageBlob, pdfBlob, fileName }`. |
| `downloadPdf(result)` / `downloadImage(result)` | Triggers browser file download for PDF or PNG. |

---

## 📄 License

Distributed under the **MIT License**. Created by [Márlon Bento Azevedo](https://github.com/marlon-bento).