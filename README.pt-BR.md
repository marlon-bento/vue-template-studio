<div align="center">

# 🎨 vue-template-studio

**Estúdio Visual de Templates em Camadas (Estilo Figma/Photoshop) 100% Agnóstico de Domínio e Exportador PNG/PDF de Alta Resolução para Vue 3**

[![NPM Version](https://img.shields.io/npm/v/vue-template-studio?color=42b883&label=npm)](https://www.npmjs.com/package/vue-template-studio)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883?logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![i18n](https://img.shields.io/badge/i18n-vue--i18n%20v11-42b883)](#7-internacionalização-vue-i18n-e-idiomas-customizados)
[![License: MIT](https://img.shields.io/badge/Licença-MIT-blue.svg)](https://opensource.org/licenses/MIT)

🇧🇷 **Português** | 🌎 **[Read in English (English Version)](./README.md)**

</div>

---

## 📋 Sumário

1. [Por que usar o `vue-template-studio`?](#1-por-que-usar-o-vue-template-studio)
2. [Arquitetura Modular](#2-arquitetura-modular)
3. [Instalação e Configuração Rápida](#3-instalação-e-configuração-rápida)
4. [Editor Visual (`<TemplateStudioEditor>`)](#4-editor-visual-templatestudioeditor)
5. [Visualizador e Emissor (`<TemplateStudioViewer>`)](#5-visualizador-e-emissor-templatestudioviewer)
6. [Formatos de Folha, Autocompletar `{{` e QR Codes Customizáveis](#6-formatos-de-folha-autocompletar--e-qr-codes-customizáveis)
7. [Internacionalização (`vue-i18n` e Idiomas Customizados)](#7-internacionalização-vue-i18n-e-idiomas-customizados)
8. [Customização Visual, Dark/Light Mode e Variáveis CSS](#8-customização-visual-darklight-mode-e-variáveis-css)
9. [Modo Headless UI e Scoped Slots](#9-modo-headless-ui-e-scoped-slots)
10. [Atalhos de Teclado e Referência Completa da API](#10-atalhos-de-teclado-e-referência-completa-da-api)

---

## 1. Por que usar o `vue-template-studio`?

Construir um editor visual de documentos (certificados, crachás, credenciais CR80, posts sociais, vouchers) em **Vue 3** normalmente exige gambiarras frágeis de DOM-para-imagem, variáveis fixas no código e controles limitados de alinhamento. O `vue-template-studio` entrega um **motor nativo de renderização Canvas 2D + jsPDF** combinado a uma experiência de estúdio inspirada no **Figma Auto Layout + Photoshop CS6** — totalmente desacoplado de qualquer regra de negócio.

### Principais Diferenciais

* 🧩 **Variáveis 100% Agnósticas de Domínio:** Zero campos hardcoded. Informe suas próprias `:variaveis-disponiveis` e `:dados-preview`; digitar `{{` em qualquer camada de texto abre o menu flutuante de autocompletar e destaca inline variáveis válidas em azul e inexistentes em vermelho.
* 📐 **Ergonomia Estilo Figma & Photoshop:** **Matriz de Alinhamento 3×3** interativa (tanto para posicionar na folha quanto para alinhar texto dentro da caixa), guias de distância em pixels com `Alt` entre elementos e bordas da folha, snap magnético central, pan com `Espaço + Arrastar`, zoom com `Ctrl + Scroll`, trava de proporção e snap de 15° com `Shift`, além de reordenação de camadas por drag-and-drop.
* 📄 **Motor Canvas 2D Nativo e Exportação PNG/PDF em Alta Resolução:** Exporta imagens PNG e documentos PDF em alta resolução nas dimensões exatas em milímetros (`A4`, `A5`, `Carta`, `Crachá`, `CR80`, `Social 1080×1080` ou `Personalizado L × A`), preservando **links clicáveis no PDF** (`pdf.link`) para QR Codes, camadas `{{link_qrcode}}` e URLs.
* 📱 **QR Codes Estilizáveis com Logo Central:** Personalize o estilo dos módulos (`quadrado`, `arredondado`, `pontos`), dos cantos/olhos (`quadrado`, `arredondado`, `circulo`), cores independentes e logo central com recorte automático da zona de leitura e correção de erro nível H.
* 🌍 **Internacionalização Nativa (`vue-i18n` v11):** Traduções completas em Português Brasileiro (`pt_br`) e Inglês (`en`), com `adicionarIdioma()` e `:mensagens-idioma` para registrar novos idiomas em tempo real.
* 🎨 **Temas e Modo Headless:** Integração automática com **Tabler** (`--tblr-*`), temas `dark` e `light` nativos, variáveis CSS (`--vue-template-studio-*`), injeção de classes customizadas e modo `:unstyled="true"` com Scoped Slots.

---

## 2. Arquitetura Modular

A biblioteca é dividida em módulos focados e independentes dentro de `src/`:

| Módulo / Caminho | Responsabilidade |
| :--- | :--- |
| `src/components/TemplateStudioEditor.vue` | Editor visual principal que orquestra barra superior, painéis, palco, histórico e atalhos. |
| `src/components/TemplateStudioViewer.vue` | Visualizador e emissor standalone com detecção dinâmica de variáveis, sanitização de URL e exportação PNG/PDF. |
| `src/components/LocaleSwitcher.vue` | Seletor reativo de idiomas conectado ao `vue-i18n`. |
| `src/components/editor/*` | Subcomponentes modulares do estúdio (`BarraSuperiorEditor`, `PainelInsercaoElementos`, `PalcoCanvasCertificado`, `PainelPropriedadesFigma`, `PainelCamadasLista`, `CampoTextoVariavel`). |
| `src/composables/*` | Gerenciadores reativos para templates e exportação, camadas e formatos de folha, histórico Desfazer/Refazer (`shallowRef`), alinhamento 3×3, interações do palco e atalhos de teclado. |
| `src/utils/renderizador.ts` | Motor nativo de renderização Canvas 2D (fundos, formas, setas, imagens, QR Codes estilizados e texto multilinha com quebra automática). |
| `src/utils/qrcode.ts` | Gerador de matriz nível H e paths SVG/Canvas de QR Code com recorte central para logo. |
| `src/utils/variaveis.ts` | Substituição de placeholders `{{chave}}`, extração de variáveis do template, resolução de links clicáveis, clonagem segura e sanitização de URLs de preview. |
| `src/i18n.ts` e `src/locales/*` | Configuração do `vue-i18n` v11, dicionários `pt_br` / `en` e utilitários para registro de idiomas customizados. |

---

## 3. Instalação e Configuração Rápida

Instale o pacote e o `vue-i18n` via NPM, PNPM ou Yarn:

```bash
npm install vue-template-studio vue-i18n
```

No arquivo `main.ts`, registre o `TemplateStudioPlugin`, o `i18n` e importe a folha de estilos da biblioteca:

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { TemplateStudioPlugin, i18n } from 'vue-template-studio'
import 'vue-template-studio/style.css'

const app = createApp(App)

app.use(i18n)
app.use(TemplateStudioPlugin, {
  tema: 'dark',
  locale: 'pt_br',
  exibirSeletorIdioma: true,
  permitirCriarVariavel: false,
  escalaExportacao: 2,
  escalaPreview: 1.5,
  qualidadeImagem: 0.95,
  zoomInicial: 0.66,
  limiteHistorico: 50,
})

app.mount('#app')
```

---

## 4. Editor Visual (`<TemplateStudioEditor>`)

Conecte um `TemplateCertificado` via `v-model` e informe as variáveis do seu domínio em `:variaveis-disponiveis`:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  TemplateStudioEditor,
  criarTemplateVazio,
  type TemplateCertificado,
  type VariavelCertificado
} from 'vue-template-studio'
import 'vue-template-studio/style.css'

const template = ref<TemplateCertificado>(criarTemplateVazio('Crachá de Evento', 'landscape', 'cracha'))

const variaveis: VariavelCertificado[] = [
  {
    chave: 'nome_participante',
    rotulo: '+ Participante',
    nomeCamada: 'Nome do Participante',
    valorVisualizacao: 'Ana Clara Silva'
  },
  {
    chave: 'funcao',
    rotulo: '+ Função',
    nomeCamada: 'Função',
    valorVisualizacao: 'Palestrante'
  },
  {
    chave: 'data_evento',
    rotulo: '+ Data',
    nomeCamada: 'Data do Evento',
    valorVisualizacao: '23 de novembro de 2026'
  }
]

function aoSalvar(templateSalvo: TemplateCertificado) {
  console.log('JSON salvo:', templateSalvo)
}

function aoExportar(resultado: { nomeArquivo: string; pdfBlob: Blob; imagemDataUrl: string }) {
  console.log('Arquivo exportado:', resultado.nomeArquivo)
}
</script>

<template>
  <div style="height: 100vh;">
    <TemplateStudioEditor
      v-model="template"
      locale="pt_br"
      tema="dark"
      :variaveis-disponiveis="variaveis"
      :permitir-criar-variavel="false"
      :exibir-seletor-idioma="true"
      @salvar="aoSalvar"
      @exportar="aoExportar"
    />
  </div>
</template>
```

---

## 5. Visualizador e Emissor (`<TemplateStudioViewer>`)

Use `<TemplateStudioViewer>` para renderizar um template pronto com dados reais, descobrir dinamicamente quais variáveis existem no template via slot `#campos` e exportar PNG ou PDF em alta resolução:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { TemplateStudioViewer, type TemplateCertificado } from 'vue-template-studio'
import 'vue-template-studio/style.css'

defineProps<{ template: TemplateCertificado }>()

const dados = ref({
  nome_participante: 'Ana Clara Silva',
  funcao: 'Palestrante',
  data_evento: '23 de novembro de 2026',
  link_qrcode: 'https://exemplo.com/validar/CERT-2026-001'
})
</script>

<template>
  <TemplateStudioViewer
    :template="template"
    :dados="dados"
    nome-arquivo="cracha_ana_clara"
    locale="pt_br"
    tema="dark"
    :gerar-imagem-ao-montar="true"
  >
    <template #campos="{ variaveis, temVariavel }">
      <div class="formulario-dinamico">
        <p>Variáveis detectadas: {{ variaveis.join(', ') }}</p>
        <input v-if="temVariavel('nome_participante')" v-model="dados.nome_participante" />
        <input v-if="temVariavel('funcao')" v-model="dados.funcao" />
      </div>
    </template>
  </TemplateStudioViewer>
</template>
```

---

## 6. Formatos de Folha, Autocompletar `{{` e QR Codes Customizáveis

### 6.1. Presets de Folha Integrados (Base 96 DPI)

Tanto os IDs em português quanto os equivalentes em inglês são aceitos:

| ID do Formato | Descrição | Dimensões Base (Paisagem) | Orientação |
| :--- | :--- | :---: | :---: |
| `'a4'` | A4 (297 × 210 mm) | `1123 × 794 px` | Paisagem / Retrato |
| `'a5'` | A5 (210 × 148 mm) | `794 × 559 px` | Paisagem / Retrato |
| `'carta'` \| `'letter'` | Carta / Letter | `1056 × 816 px` | Paisagem / Retrato |
| `'cracha'` \| `'badge'` | Crachá (130 × 90 mm) | `491 × 340 px` | Paisagem / Retrato |
| `'cartao'` \| `'card'` | Cartão / Credencial CR80 | `645 × 408 px` | Paisagem / Retrato |
| `'quadrado'` \| `'square'` | Social / Post | `1080 × 1080 px` | Quadrado |
| `'custom'` | Personalizado (`L × A`) | Qualquer `120–4000 px` | Paisagem / Retrato |

### 6.2. Autocompletar Inline de Variáveis (`{{`)
* Digitar `{{` dentro de qualquer camada de texto livre (ou camada de variável com edição liberada) abre o menu de sugestões navegável pelo teclado (`Seta para cima`, `Seta para baixo`, `Enter`, `Tab`, `Escape`).
* Variáveis cadastradas ficam destacadas inline em **azul**; variáveis inexistentes ficam em **vermelho**, evitando erros de digitação antes da emissão.

### 6.3. QR Codes Customizáveis e Links Clicáveis no PDF
* Inserir uma camada de QR Code libera automaticamente o bloco **Link do QR Code** no painel esquerdo e registra `{{link_qrcode}}` como variável válida.
* Customize o formato dos módulos (`'quadrado' | 'square'`, `'arredondado' | 'rounded'`, `'pontos' | 'dots'`), cantos/olhos (`'quadrado' | 'square'`, `'arredondado' | 'rounded'`, `'circulo' | 'circle'`), cores, fundo transparente e logo central com recorte automático da área de leitura.
* Ao exportar em PDF, camadas de QR Code, camadas `{{link_qrcode}}` ou textos com `linkUrl` / URL `https://` viram automaticamente **anotações clicáveis no PDF**.

---

## 7. Internacionalização (`vue-i18n` e Idiomas Customizados)

O `vue-template-studio` já vem traduzido em **Português Brasileiro (`pt_br`)** e **Inglês (`en`)**. É possível alternar o idioma pela prop `:locale`, pelo `<LocaleSwitcher />` ou por `definirIdioma()`, além de adicionar novos idiomas com `adicionarIdioma()` ou `:mensagens-idioma`:

```ts
import { adicionarIdioma, definirIdioma } from 'vue-template-studio'

adicionarIdioma('es', {
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

definirIdioma('es')
```

---

## 8. Customização Visual, Dark/Light Mode e Variáveis CSS

O estúdio herda automaticamente variáveis do **Tabler** (`--tblr-primary`, `--tblr-bg-surface`, `--tblr-border-color`) quando presentes, e oferece fallback completo para os temas `dark` e `light` (`tema="dark"` ou `tema="light"`). Sobrescreva `--vue-template-studio-*` para personalizar:

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

## 9. Modo Headless UI e Scoped Slots

Ative `:unstyled="true"` para remover os estilos padrão e injetar classes próprias via `:classes`, ou substitua qualquer seção por Scoped Slots:

### Scoped Slots de `<TemplateStudioEditor>`
* `#topo-acoes` — Ações extras na barra superior (`{ template, modoPreview }`).
* `#painel-inserir` — Substitui o painel esquerdo de inserção (`{ adicionarTexto, adicionarMoldura, adicionarCirculo, adicionarLinha, adicionarSeta, adicionarQrCode }`).
* `#vazio` — Estado vazio do inspetor quando nenhuma camada está selecionada.
* `#inspetor` — Substitui o inspetor de propriedades à direita (`{ camada, confirmar }`).
* `#camadas` — Substitui a lista inferior de camadas (`{ camadas, selecionadaId }`).

### Scoped Slots de `<TemplateStudioViewer>`
* `#barra` — Substitui a barra de ações (`{ processando, variaveis, temVariavel, atualizarPreview, exportarPdf, exportarImagem }`).
* `#campos` — Renderiza campos dinâmicos para as variáveis detectadas no template (`{ variaveis, temVariavel, dados, template }`).
* `#preview` — Customiza a área de exibição da imagem (`{ imagemUrl, processando }`).

```vue
<TemplateStudioViewer :template="template" :dados="dados" :unstyled="true">
  <template #barra="{ processando, exportarPdf, exportarImagem }">
    <button :disabled="processando" @click="exportarPdf(true)">Baixar PDF</button>
    <button :disabled="processing" @click="exportarImagem()">Baixar PNG</button>
  </template>
</TemplateStudioViewer>
```

---

## 10. Atalhos de Teclado e Referência Completa da API

### Atalhos de Teclado

| Atalho | Ação |
| :--- | :--- |
| `Ctrl + Z` | Desfazer |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Refazer |
| `Ctrl + D` | Duplicar camada selecionada |
| `Delete` / `Backspace` | Excluir camada selecionada |
| `Setas` | Mover camada selecionada em `1px` |
| `Shift + Setas` | Mover camada selecionada em `10px` |
| `Alt` *(segurar)* | Medir distâncias em pixels até a folha ou outra camada |
| `Espaço + Arrastar` | Navegar (pan) pelo palco |
| `Ctrl + Scroll` | Aumentar / diminuir zoom |
| `Shift + Redimensionar` | Manter proporção da camada |
| `Shift + Girar` | Encaixar rotação em ângulos de `15°` |

### Props de `<TemplateStudioEditor>`

| Prop | Tipo | Padrão | Descrição |
| :--- | :--- | :---: | :--- |
| `modelValue` (`v-model`) | `TemplateCertificado` | Template A4 vazio | Documento de template reativo em edição. |
| `variaveisDisponiveis` | `VariavelCertificado[]` | `[]` | Variáveis de domínio exibidas no painel Inserir e no autocompletar `{{`. |
| `dadosPreview` | `DadosCertificado` | `{}` | Valores de exemplo exibidos ao ativar o modo Pré-visualizar. |
| `fontesDisponiveis` | `string[]` | 9 fontes padrão | Famílias de fontes listadas no inspetor de tipografia. |
| `permitirCriarVariavel` | `boolean` | `false` | Libera a criação manual de novas variáveis pelo painel esquerdo. |
| `tema` | `'dark' \| 'light'` | `'dark'` | Tema visual do estúdio. |
| `unstyled` | `boolean` | `false` | Remove classes visuais padrão para uso headless. |
| `locale` | `string` | `'pt_br'` | Idioma ativo da interface (`'pt_br'`, `'en'` ou idioma customizado). |
| `mensagensIdioma` | `Record<string, MensagensIdiomaParcial>` | `undefined` | Dicionários de idiomas customizados registrados automaticamente. |
| `exibirSeletorIdioma` | `boolean` | `true` | Exibe ou oculta o `<LocaleSwitcher>` na barra superior. |
| `labels` | `CertificadoLabels` | `undefined` | Sobrescrita direta de textos (`salvar`, `exportarPdf`, `preVisualizar`, `inserir`, `camadas`, etc.). |
| `classes` | `CertificadoClasses` | `undefined` | Classes CSS extras para `root`, `topo`, `workspace`, `dockEsquerdo`, `canvasPalco`, `folha`, `dockDireito`, `inspetor`, `painelCamadas`, `dockFlutuante`. |
| `tamanhoMaximoUploadMb` | `number` | `8` | Tamanho máximo permitido (em MB) para upload de imagens de fundo ou camada. |

### Eventos e Métodos Expostos de `<TemplateStudioEditor>`

* **Eventos:** `@update:modelValue`, `@salvar`, `@exportar`, `@erro`, `@selecionar-camada`, `@variaveis-alteradas`
* **Expostos (`ref`):** `zoom`, `dimensoes`, `variaveisUsadas`, `dadosPreviewEfetivos`, `acaoDesfazer()`, `acaoRefazer()`, `exportarAgora()`, `duplicarCamadaSelecionada()`, `excluirCamadaSelecionada()`, `selecionarCamada(id)`, `selecionarFormatoFolha(formato)`, `alterarDimensoesFolha(l, a)`, `alternarOrientacaoFolha(nova)`, `alinharNaFolha(eixo)`, `alinharNaGrade3x3Folha(pos)`, `adicionarTexto(texto, nome, ehVariavel)`, `adicionarMoldura()`, `adicionarCirculo()`, `adicionarLinha()`, `adicionarSeta(dir?)`, `adicionarQrCode(conteudo?)`, `adicionarLinkQrCode(modo?, textoPersonalizado?)`

### Props, Eventos e Métodos Expostos de `<TemplateStudioViewer>`

| Prop | Tipo | Padrão | Descrição |
| :--- | :--- | :---: | :--- |
| `template` | `TemplateCertificado` | **Obrigatório** | Template a ser renderizado e exportado. |
| `dados` | `DadosCertificado` | `{}` | Valores dinâmicos que substituem `{{chave}}` e links de QR Code. |
| `nomeArquivo` | `string` | Auto-gerado | Nome base usado nos downloads de PDF e PNG. |
| `gerarImagemAoMontar` | `boolean` | `true` | Gera automaticamente a imagem de preview ao montar e ao alterar props. |
| `tema` | `'dark' \| 'light'` | `'dark'` | Tema visual do visualizador. |
| `unstyled` | `boolean` | `false` | Remove classes visuais padrão para uso headless. |
| `locale` | `string` | `'pt_br'` | Idioma ativo da interface. |
| `mensagensIdioma` | `Record<string, MensagensIdiomaParcial>` | `undefined` | Dicionários de idiomas customizados. |
| `exibirSeletorIdioma` | `boolean` | `false` | Exibe ou oculta o `<LocaleSwitcher>` na barra do visualizador. |
| `labels` | `CertificadoLabels` | `undefined` | Sobrescrita direta de textos (`atualizarPreview`, `baixarPdf`, `renderizando`, `exportandoPdf`). |
| `classes` | `CertificadoClasses` | `undefined` | Classe CSS extra para `visualizador`. |

* **Eventos:** `@imagem-gerada`, `@pdf-gerado`, `@variaveis-detectadas`, `@erro`
* **Expostos (`ref`):** `imagemPreviewUrl`, `imagemPreviewSeguraUrl`, `variaveisTemplate`, `temVariavel(chave)`, `atualizarPreviewImagem()`, `exportarPdf(baixarAutomaticamente?)`, `exportarImagem()`

### Composable `useCertificado()`

| Método / Propriedade | Descrição |
| :--- | :--- |
| `globalOptions` | `Ref` reativa com as opções globais configuradas no plugin. |
| `configureCertificado(options)` | Atualiza as opções globais e sincroniza o `vue-i18n`. |
| `criarTemplateVazio(nome?, orientacao?, formato?, l?, a?)` | Cria um `TemplateCertificado` limpo pronto para edição. |
| `duplicarTemplate(template, novoNome?)` | Clona profundamente um template com novo ID único. |
| `exportarTemplateJson(template)` / `importarTemplateJson(json)` | Serializa ou valida e importa templates em JSON. |
| `extrairVariaveisTemplate(template)` / `temVariavelNoTemplate(template, chave)` | Inspeciona os placeholders `{{chave}}` usados no template. |
| `gerarImagemPreview(template, dados?, opcoes?)` | Renders a pré-visualização PNG em Data URL via Canvas 2D. |
| `gerarPacoteExportacao(template, dados?, opcoes?)` | Gera `{ imagemDataUrl, imagemBlob, pdfBlob, nomeArquivo }`. |
| `baixarPdf(resultado)` / `baixarImagem(resultado)` | Dispara o download do arquivo PDF ou PNG no navegador. |

---

## 📄 Licença

Distribuído sob a **Licença MIT**. Desenvolvido por [Márlon Bento Azevedo](https://github.com/marlon-bento).