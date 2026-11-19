<!--
========
Painel esquerdo minimizável do editor (src/components/editor/PainelInsercaoElementos.vue).
Permite configurar o fundo da folha, inserir variáveis enviadas pelo cliente (aceitando formato
em inglês ou português) e adicionar elementos livres e formas geométricas (Texto, Imagem, Moldura,
Círculo, Linha, Seta e QR Code) com suporte completo a múltiplos idiomas via vue-i18n.
========
-->
<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ModoExibicaoLink, TemplateCertificado, VariavelCertificado } from '../../types/certificado';
import { normalizarListaVariaveis } from '../../composables/gerenciadorDeCertificado';
import { normalizarNomeVariavel } from '../../utils/variaveis';
import { usarI18nCertificado } from '../../i18n';
import { buildIcons } from '../../utils/svgFactory';
import { svgs } from '../../styles/svgs';

const icons = buildIcons(svgs);

export interface Props {
  template: TemplateCertificado;
  minimizado: boolean;
  isUnstyled: boolean;
  classeDockEsquerdo?: string;
  listaVariaveis: VariavelCertificado[];
  podeCriarVariavel: boolean;
  temQrCode?: boolean;
  labels: {
    inserir: string;
    fundo: string;
    enviarFundo: string;
    corFolha: string;
    removerFundo: string;
    camposCertificado: string;
    semVariaveisCliente: string;
    camadasLivres: string;
    textoLivre: string;
    adicionarImagem: string;
    adicionarMoldura: string;
    adicionarCirculo: string;
    adicionarLinha: string;
    adicionarSeta: string;
    adicionarQrCode: string;
  };
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'alternar-minimizado': [];
  'confirmar-alteracao': [];
  'upload-imagem': [evento: Event, destino: 'fundo' | 'camada'];
  'adicionar-texto': [texto: string, nome: string, ehVariavel: boolean];
  'adicionar-moldura': [];
  'adicionar-circulo': [];
  'adicionar-linha': [];
  'adicionar-seta': [];
  'adicionar-qrcode': [];
  'adicionar-link-qrcode': [modoExibicao: ModoExibicaoLink, textoPersonalizado: string];
}>();

// Função de tradução reativa conectada à instância global do vue-i18n
const { t } = usarI18nCertificado();

// Lista de variáveis normalizada aceitando propriedades tanto em inglês quanto em português
const variaveisNormalizadas = computed(() => normalizarListaVariaveis(props.listaVariaveis));

// Armazena o nome digitado pelo usuário ao criar uma variável extra manualmente
const novaVariavel = ref('');

// Define como o link especial do QR Code será exibido ao ser inserido (URL completa ou texto personalizado)
const modoExibicaoLinkQr = ref<ModoExibicaoLink>('url');

// Texto personalizado clicável quando o usuário escolhe exibir um rótulo no lugar da URL do QR Code
const textoPersonalizadoLinkQr = ref('');

/*
 * Recebe: nenhum parâmetro.
 * Devolve: nada (void).
 * Por que é usada: normaliza o identificador digitado e cria uma camada de variável personalizada no palco.
 */
function criarVariavelPersonalizada(): void {
  if (!props.podeCriarVariavel) return;
  const limpa = normalizarNomeVariavel(novaVariavel.value);
  if (!limpa) return;
  emit('adicionar-texto', `{{${limpa}}}`, `${t('painelInserir.prefixoCampo')} ${limpa}`, true);
  novaVariavel.value = '';
}
</script>

<template>
  <aside
    :class="[
      !isUnstyled && 'vc-dock-esq',
      minimizado && 'minimizado',
      classeDockEsquerdo
    ]"
  >
    <div class="vc-painel-cabecalho">
      <span v-if="!minimizado">{{ labels.inserir }}</span>
      <button
        type="button"
        class="vc-collapse-btn"
        @click="emit('alternar-minimizado')"
        :title="minimizado ? t('painelInserir.expandirPainel') : t('painelInserir.minimizarPainel')"
        :aria-label="t('painelInserir.alternarPainelAria')"
      >
        <component :is="minimizado ? icons.panel.chevronRight : icons.panel.chevronLeft" />
      </button>
    </div>

    <div
      v-if="minimizado"
      class="vc-dock-vertical-label"
      @click="emit('alternar-minimizado')"
    >
      {{ labels.inserir }}
    </div>

    <div v-else class="vc-painel-scroll">
      <slot
        name="painel-inserir"
        :adicionar-texto="(txt: string, n: string, v: boolean) => emit('adicionar-texto', txt, n, v)"
        :adicionar-moldura="() => emit('adicionar-moldura')"
        :adicionar-circulo="() => emit('adicionar-circulo')"
        :adicionar-linha="() => emit('adicionar-linha')"
        :adicionar-seta="() => emit('adicionar-seta')"
        :adicionar-qr-code="() => emit('adicionar-qrcode')"
        :add-text="(txt: string, n: string, v: boolean) => emit('adicionar-texto', txt, n, v)"
        :add-frame="() => emit('adicionar-moldura')"
        :add-circle="() => emit('adicionar-circulo')"
        :add-line="() => emit('adicionar-linha')"
        :add-arrow="() => emit('adicionar-seta')"
        :add-qr-code="() => emit('adicionar-qrcode')"
      >
        <div class="vc-bloco">
          <span class="vc-bloco-titulo">{{ labels.fundo }}</span>
          <label class="vc-upload-box">
            <component :is="icons.insert.upload" />
            <span>{{ labels.enviarFundo }}</span>
            <input
              type="file"
              accept="image/*"
              class="vc-oculto"
              @change="(e) => emit('upload-imagem', e, 'fundo')"
            />
          </label>
          <div class="vc-row-between">
            <span class="vc-txt-sm">{{ labels.corFolha }}</span>
            <input
              type="color"
              v-model="template.fundoCor"
              @change="emit('confirmar-alteracao')"
              class="vc-color-dot"
            />
          </div>
          <select
            v-if="template.fundoImagem"
            v-model="template.fundoAjuste"
            @change="emit('confirmar-alteracao')"
            class="vc-field"
          >
            <option value="cover">{{ t('painelInserir.ajusteCover') }}</option>
            <option value="contain">{{ t('painelInserir.ajusteContain') }}</option>
            <option value="100% 100%">{{ t('painelInserir.ajusteEsticar') }}</option>
          </select>
          <button
            v-if="template.fundoImagem"
            type="button"
            @click="template.fundoImagem = ''; emit('confirmar-alteracao')"
            class="vc-btn-sutil perigo vc-btn-icone-centro"
          >
            <component :is="icons.actions.trash" />
            <span>{{ labels.removerFundo }}</span>
          </button>
        </div>

        <div class="vc-bloco vc-bloco-sep">
          <span class="vc-bloco-titulo">{{ labels.camposCertificado }}</span>
          <div v-if="variaveisNormalizadas.length > 0" class="vc-grid-2">
            <button
              v-for="v in variaveisNormalizadas"
              :key="v.chave"
              type="button"
              class="vc-chip"
              :title="
                v.valorVisualizacao || v.valorPadrao
                  ? t('painelInserir.exemploVisualizacao', { valor: v.valorVisualizacao || v.valorPadrao })
                  : t('painelInserir.inserirVariavel', { chave: `{{${v.chave}}}` })
              "
              @click="emit('adicionar-texto', `{{${v.chave}}}`, v.nomeCamada || v.chave, true)"
            >
              {{ v.rotulo }}
            </button>
          </div>
          <div v-else class="vc-txt-muted-sm" data-testid="aviso-sem-variaveis">
            {{ labels.semVariaveisCliente }}
          </div>

          <div v-if="podeCriarVariavel" class="vc-row-gap">
            <input
              v-model="novaVariavel"
              :placeholder="t('painelInserir.placeholderNovaVariavel')"
              class="vc-field"
              data-testid="input-nova-variavel"
              @keydown.enter="criarVariavelPersonalizada"
            />
            <button
              type="button"
              @click="criarVariavelPersonalizada"
              class="vc-btn-mini"
              :aria-label="t('painelInserir.criarVariavelAria')"
              data-testid="btn-criar-variavel"
            >
              <component :is="icons.panel.plus" />
            </button>
          </div>
        </div>

        <div class="vc-bloco vc-bloco-sep">
          <span class="vc-bloco-titulo">{{ labels.camadasLivres }}</span>

          <div class="vc-insercao-lista">
            <button
              type="button"
              @click="emit('adicionar-texto', t('camadasPadrao.textoInicial'), t('camadasPadrao.nomeTextoFixo'), false)"
              class="vc-btn-sutil vc-btn-icone-item"
              data-testid="btn-adicionar-texto"
            >
              <span class="vc-item-ico"><component :is="icons.insert.text" /></span>
              <span>{{ labels.textoLivre }}</span>
            </button>

            <button
              type="button"
              @click="emit('adicionar-moldura')"
              class="vc-btn-sutil vc-btn-icone-item"
              data-testid="btn-adicionar-moldura"
            >
              <span class="vc-item-ico"><component :is="icons.insert.frame" /></span>
              <span>{{ labels.adicionarMoldura }}</span>
            </button>

            <div class="vc-grid-formas-figma">
              <button
                type="button"
                @click="emit('adicionar-circulo')"
                class="vc-btn-sutil vc-btn-forma-card"
                data-testid="btn-adicionar-circulo"
                :title="labels.adicionarCirculo"
              >
                <component :is="icons.insert.circle" />
                <span>{{ labels.adicionarCirculo }}</span>
              </button>

              <button
                type="button"
                @click="emit('adicionar-linha')"
                class="vc-btn-sutil vc-btn-forma-card"
                data-testid="btn-adicionar-linha"
                :title="labels.adicionarLinha"
              >
                <component :is="icons.insert.line" />
                <span>{{ labels.adicionarLinha }}</span>
              </button>

              <button
                type="button"
                @click="emit('adicionar-seta')"
                class="vc-btn-sutil vc-btn-forma-card"
                data-testid="btn-adicionar-seta"
                :title="labels.adicionarSeta"
              >
                <component :is="icons.insert.arrow" />
                <span>{{ labels.adicionarSeta }}</span>
              </button>
            </div>

            <label class="vc-btn-sutil vc-btn-icone-item">
              <span class="vc-item-ico"><component :is="icons.insert.image" /></span>
              <span>{{ labels.adicionarImagem }}</span>
              <input
                type="file"
                accept="image/*"
                class="vc-oculto"
                @change="(e) => emit('upload-imagem', e, 'camada')"
              />
            </label>

            <button
              type="button"
              @click="emit('adicionar-qrcode')"
              class="vc-btn-sutil vc-btn-icone-item"
              data-testid="btn-adicionar-qrcode"
            >
              <span class="vc-item-ico"><component :is="icons.insert.qrCode" /></span>
              <span>{{ labels.adicionarQrCode }}</span>
            </button>
          </div>
        </div>

        <div
          v-if="temQrCode"
          class="vc-bloco vc-bloco-sep vc-bloco-link-qr"
          data-testid="bloco-link-qrcode"
        >
          <span class="vc-bloco-titulo">{{ t('painelInserir.linkQrCodeTitulo') }}</span>
          <div class="vc-txt-muted-sm">
            {{ t('painelInserir.linkQrCodeDescricao') }}
          </div>

          <select
            v-model="modoExibicaoLinkQr"
            class="vc-field"
            data-testid="select-modo-link-qrcode"
            :aria-label="t('inspetor.modoExibicaoLinkLabel')"
          >
            <option value="url">{{ t('painelInserir.modoLinkUrl') }}</option>
            <option value="texto">{{ t('painelInserir.modoLinkTexto') }}</option>
          </select>

          <input
            v-if="modoExibicaoLinkQr === 'texto'"
            v-model="textoPersonalizadoLinkQr"
            type="text"
            class="vc-field"
            data-testid="input-texto-link-qrcode"
            :placeholder="t('painelInserir.placeholderTextoLinkQr')"
          />

          <button
            type="button"
            class="vc-btn-sutil vc-btn-icone-item vc-btn-link-qr"
            data-testid="btn-inserir-link-qrcode"
            @click="emit('adicionar-link-qrcode', modoExibicaoLinkQr, textoPersonalizadoLinkQr)"
          >
            <span class="vc-item-ico"><component :is="icons.insert.link" /></span>
            <span>{{ t('painelInserir.inserirLinkQrCode') }}</span>
          </button>
        </div>
      </slot>
    </div>
  </aside>
</template>
