<!--
========
Palco central interativo do editor (src/components/editor/PalcoCanvasCertificado.vue).
Renderiza a folha na proporção ativa, grade de pontos, guias de alinhamento central,
overlay vetorial SVG de medição estilo Figma (Alt), camadas visuais, alças de redimensionamento
e rotação e barra flutuante de zoom, com textos e dicas internacionalizados via vue-i18n.
========
-->
<script setup lang="ts">
import { ref } from 'vue';
import type {
  CamadaCertificado,
  DadosCertificado,
  TemplateCertificado
} from '../../types/certificado';
import type {
  LinhaMedidaAlt,
  MedidasAltResultado
} from '../../composables/gerenciadorDePalco';
import { gerarPathSvgQrCode, type SvgQrCodeEstilizado } from '../../utils/qrcode';
import { resolverConteudoInternoQrCode, resolverVariaveisTexto } from '../../utils/variaveis';
import { usarI18nCertificado } from '../../i18n';
import { buildIcons } from '../../utils/svgFactory';
import { svgs } from '../../styles/svgs';

const icons = buildIcons(svgs);

export interface Props {
  template: TemplateCertificado;
  dimensoes: { largura: number; altura: number };
  camadaSelecionadaId: string | null;
  camadaSelecionada: CamadaCertificado | null;
  dadosPreviewEfetivos: DadosCertificado;
  modoPreview: boolean;
  mostrarGrade: boolean;
  zoom: number;
  panX: number;
  panY: number;
  espacoPressionado: boolean;
  arrastandoPalco: boolean;
  guiaXVisivel: boolean;
  guiaYVisivel: boolean;
  medidasAlt: MedidasAltResultado | null;
  isUnstyled: boolean;
  classeCanvasPalco?: string;
  classeFolha?: string;
  classeDockFlutuante?: string;
  labelGrade: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'clicar-palco': [ev: MouseEvent];
  'iniciar-arraste': [ev: MouseEvent, camada: CamadaCertificado];
  'iniciar-redimensionar': [ev: MouseEvent, camada: CamadaCertificado, direcao: string];
  'iniciar-rotacao': [ev: MouseEvent, camada: CamadaCertificado];
  'hover-camada': [camada: CamadaCertificado | null];
  'mover-mouse-folha': [xFolha: number, yFolha: number, altKey: boolean];
  'alternar-grade': [];
  'alterar-zoom': [novoZoom: number];
}>();

// Função de tradução reativa conectada à instância global do vue-i18n
const { t } = usarI18nCertificado();

// Referência ao elemento DOM principal do palco para captura de eventos de zoom e pan
const elementoPalcoRef = ref<HTMLElement | null>(null);

// Referência ao elemento DOM da folha para cálculo de coordenadas relativas do mouse
const elementoFolhaRef = ref<HTMLElement | null>(null);

/*
 * Recebe: evento MouseEvent disparado ao mover o cursor sobre a folha.
 * Devolve: nada (void).
 * Por que é usada: converte a posição do mouse na tela para coordenadas na escala da folha e atualiza a medição Alt.
 */
function aoMoverMouseNaFolha(ev: MouseEvent): void {
  const folha = elementoFolhaRef.value;
  if (!folha) return;
  const rect = folha.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;

  const escalaX = props.dimensoes.largura / rect.width;
  const escalaY = props.dimensoes.altura / rect.height;
  const xFolha = (ev.clientX - rect.left) * escalaX;
  const yFolha = (ev.clientY - rect.top) * escalaY;
  emit('mover-mouse-folha', xFolha, yFolha, ev.altKey);
}

/*
 * Recebe: objeto LinhaMedidaAlt contendo posição, tamanho e orientação da reta de medição.
 * Devolve: objeto de estilo CSS com coordenadas left e top do badge numérico.
 * Por que é usada: posiciona o marcador de distância em pixels ao lado da linha vermelha estilo Figma.
 */
function obterEstiloBadgeMedida(linha: LinhaMedidaAlt): Record<string, string> {
  const pos = linha.posicaoBadge || (linha.tipo === 'h' ? 'abaixo' : 'direita');
  if (linha.tipo === 'h') {
    const meioX = linha.x + linha.tamanho / 2;
    const offsetY = pos === 'acima' ? -15 : pos === 'abaixo' ? 15 : 0;
    return {
      left: `${meioX}px`,
      top: `${linha.y + offsetY}px`
    };
  }
  const meioY = linha.y + linha.tamanho / 2;
  const offsetX = pos === 'esquerda' ? -22 : pos === 'direita' ? 22 : 0;
  return {
    left: `${linha.x + offsetX}px`,
    top: `${meioY}px`
  };
}

/*
 * Recebe: objeto CamadaCertificado do tipo forma ou circulo.
 * Devolve: objeto de propriedades CSS para renderizar borda, raio e preenchimento.
 * Por que é usada: estiliza visualmente retângulos, molduras e círculos no DOM do palco.
 */
function obterEstiloCaixaForma(camada: CamadaCertificado): Record<string, string> {
  const espessura = camada.espessuraBorda ?? 0;
  const estilo = camada.estiloBorda || 'solid';
  const ehCirculo = camada.tipo === 'circulo';
  return {
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    backgroundColor: camada.semPreenchimento
      ? 'transparent'
      : camada.corPreenchimento || '#ffffff',
    borderWidth: espessura > 0 ? `${espessura}px` : '0px',
    borderStyle: espessura > 0 ? estilo : 'none',
    borderColor: camada.corBorda || '#000000',
    borderRadius: ehCirculo ? '50%' : `${camada.raioBorda || 0}px`
  };
}

/*
 * Recebe: camada vetorial (linha ou seta).
 * Devolve: string de stroke-dasharray compatível com SVG ou undefined para traço contínuo.
 * Por que é usada: aplica tracejado ou pontilhado proporcional à espessura da linha no SVG.
 */
function obterDashArraySvg(camada: CamadaCertificado): string | undefined {
  const esp = Math.max(1, camada.espessuraBorda ?? 3);
  if (camada.estiloBorda === 'dashed') return `${esp * 3},${esp * 2}`;
  if (camada.estiloBorda === 'dotted') return `${esp},${esp * 1.5}`;
  return undefined;
}

/*
 * Recebe: camada do tipo linha ou seta.
 * Devolve: parâmetros geométricos do SVG (viewBox, coordenadas da reta e polígonos das pontas).
 * Por que é usada: calcula o desenho vetorial das linhas e setas direcionais no palco.
 */
function obterGeometriaSeta(camada: CamadaCertificado) {
  const w = Math.max(20, camada.largura);
  const h = Math.max(12, camada.altura);
  const cy = h / 2;
  const esp = Math.max(1, camada.espessuraBorda ?? 3);
  const tamanhoPonta = Math.min(Math.max(10, esp * 3.2), w * 0.4, Math.max(12, h * 0.8));
  const ehSeta = camada.tipo === 'seta';
  const direcao = camada.pontaSeta || 'direita';
  const temEsq = ehSeta && (direcao === 'esquerda' || direcao === 'ambas');
  const temDir = ehSeta && (direcao === 'direita' || direcao === 'ambas');

  const x1 = temEsq ? tamanhoPonta * 0.7 : 0;
  const x2 = w - (temDir ? tamanhoPonta * 0.7 : 0);

  const pontosDireita = `${w},${cy} ${w - tamanhoPonta},${cy - tamanhoPonta * 0.55} ${w - tamanhoPonta},${cy + tamanhoPonta * 0.55}`;
  const pontosEsquerda = `0,${cy} ${tamanhoPonta},${cy - tamanhoPonta * 0.55} ${tamanhoPonta},${cy + tamanhoPonta * 0.55}`;

  return {
    viewBox: `0 0 ${w} ${h}`,
    cy,
    x1,
    x2,
    esp,
    cor: camada.corBorda || camada.corPreenchimento || '#0f172a',
    temEsq,
    temDir,
    pontosDireita,
    pontosEsquerda,
    dashArray: obterDashArraySvg(camada)
  };
}

/*
 * Recebe: camada do tipo qrcode.
 * Devolve: objeto SvgQrCodeEstilizado contendo os paths de módulos e olhos do QR Code.
 * Por que é usada: gera a representação vetorial customizada do QR Code com recorte central para logo.
 */
function obterSvgQrCamada(camada: CamadaCertificado): SvgQrCodeEstilizado {
  const texto = resolverConteudoInternoQrCode(
    camada,
    props.dadosPreviewEfetivos,
    props.modoPreview
  );
  return gerarPathSvgQrCode(texto, {
    estiloModulos: camada.estiloModulosQr || 'quadrado',
    estiloOlhos: camada.estiloOlhosQr || 'quadrado',
    temLogo: Boolean(camada.logoQr),
    tamanhoLogoPct: camada.tamanhoLogoQr ?? 22
  });
}

defineExpose({
  elementoPalcoRef
});
</script>

<template>
  <main
    ref="elementoPalcoRef"
    :class="[
      !isUnstyled && 'vc-canvas-palco',
      espacoPressionado && 'modo-pan',
      arrastandoPalco && 'modo-pan-ativo',
      classeCanvasPalco
    ]"
    :style="{ backgroundPosition: `${panX}px ${panY}px` }"
    @mousedown="emit('clicar-palco', $event)"
  >
    <div
      class="vc-envoltorio"
      :style="{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})` }"
    >
      <div
        ref="elementoFolhaRef"
        :class="[
          !isUnstyled && 'vc-folha',
          mostrarGrade && !modoPreview ? 'vc-grade' : '',
          classeFolha
        ]"
        :style="{
          width: dimensoes.largura + 'px',
          height: dimensoes.altura + 'px',
          backgroundColor: template.fundoCor,
          backgroundImage: template.fundoImagem ? `url(${template.fundoImagem})` : 'none',
          backgroundSize: template.fundoAjuste,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }"
        @mousedown.self="emit('clicar-palco', $event)"
        @mousemove="aoMoverMouseNaFolha"
        @mouseleave="emit('hover-camada', null)"
      >
        <div v-if="guiaXVisivel" class="vc-guia-x"></div>
        <div v-if="guiaYVisivel" class="vc-guia-y"></div>

        <template v-if="medidasAlt && camadaSelecionada">
          <svg
            class="vc-medida-svg-overlay"
            :viewBox="`0 0 ${dimensoes.largura} ${dimensoes.altura}`"
            width="100%"
            height="100%"
          >
            <template
              v-for="linha in medidasAlt.linhas"
              :key="`svg-${linha.tipo}-${linha.orientacao || ''}-${linha.x}-${linha.y}-${linha.tamanho}`"
            >
              <g v-if="linha.tipo === 'h'">
                <line
                  :x1="linha.x"
                  :y1="linha.y"
                  :x2="linha.x + linha.tamanho"
                  :y2="linha.y"
                  class="vc-medida-stroke-solida"
                />
                <line
                  :x1="linha.x"
                  :y1="linha.y - 3.5"
                  :x2="linha.x"
                  :y2="linha.y + 3.5"
                  class="vc-medida-stroke-solida"
                />
                <line
                  :x1="linha.x + linha.tamanho"
                  :y1="linha.y - 3.5"
                  :x2="linha.x + linha.tamanho"
                  :y2="linha.y + 3.5"
                  class="vc-medida-stroke-solida"
                />
              </g>

              <g v-else-if="linha.tipo === 'v'">
                <line
                  :x1="linha.x"
                  :y1="linha.y"
                  :x2="linha.x"
                  :y2="linha.y + linha.tamanho"
                  class="vc-medida-stroke-solida"
                />
                <line
                  :x1="linha.x - 3.5"
                  :y1="linha.y"
                  :x2="linha.x + 3.5"
                  :y2="linha.y"
                  class="vc-medida-stroke-solida"
                />
                <line
                  :x1="linha.x - 3.5"
                  :y1="linha.y + linha.tamanho"
                  :x2="linha.x + 3.5"
                  :y2="linha.y + linha.tamanho"
                  class="vc-medida-stroke-solida"
                />
              </g>

              <line
                v-else-if="linha.tipo === 'aux'"
                :x1="linha.x"
                :y1="linha.y"
                :x2="linha.orientacao === 'h' ? linha.x + linha.tamanho : linha.x"
                :y2="linha.orientacao === 'v' ? linha.y + linha.tamanho : linha.y"
                class="vc-medida-stroke-tracejada"
              />
            </template>
          </svg>

          <template
            v-for="linha in medidasAlt.linhas"
            :key="`bdg-${linha.tipo}-${linha.x}-${linha.y}-${linha.tamanho}`"
          >
            <div
              v-if="linha.tipo !== 'aux' && linha.valor !== undefined"
              class="vc-medida-linha"
              :style="obterEstiloBadgeMedida(linha)"
            >
              <span class="vc-medida-badge">{{ linha.valor }}</span>
            </div>
          </template>
        </template>

        <template v-for="(camada, idx) in template.camadas" :key="camada.id">
          <div
            v-if="camada.visivel"
            @mousedown="emit('iniciar-arraste', $event, camada)"
            @mouseenter="emit('hover-camada', camada)"
            :class="[
              'vc-camada',
              `vc-camada-tipo-${camada.tipo}`,
              camada.bloqueada && 'bloqueada',
              !modoPreview && camada.id === camadaSelecionadaId ? 'vc-selecionada' : '',
              !modoPreview && medidasAlt?.alvoId === camada.id ? 'vc-alvo-medida' : ''
            ]"
            :style="{
              left: camada.x + 'px',
              top: camada.y + 'px',
              width: camada.largura + 'px',
              height: camada.altura + 'px',
              opacity: camada.opacidade / 100,
              transform: `rotate(${camada.rotacao}deg)`,
              zIndex: idx + 1
            }"
          >
            <div
              v-if="camada.tipo === 'texto' || camada.tipo === 'variavel'"
              class="vc-conteudo-texto"
              :style="{
                fontFamily: camada.fonte,
                fontSize: camada.tamanhoFonte + 'px',
                color: camada.corTexto,
                fontWeight: camada.negrito ? '700' : '400',
                fontStyle: camada.italico ? 'italic' : 'normal',
                textDecoration: camada.sublinhado ? 'underline' : 'none',
                textAlign: camada.alinhamento,
                justifyContent:
                  camada.alinhamentoVertical === 'top'
                    ? 'flex-start'
                    : camada.alinhamentoVertical === 'bottom'
                    ? 'flex-end'
                    : 'center'
              }"
            >
              {{ resolverVariaveisTexto(camada.texto || '', dadosPreviewEfetivos, modoPreview) }}
            </div>

            <img
              v-else-if="camada.tipo === 'imagem'"
              :src="camada.src"
              :alt="camada.nome"
              draggable="false"
              :style="{
                width: '100%',
                height: '100%',
                objectFit: camada.ajusteImagem || 'contain',
                borderRadius: (camada.raioImagem || 0) + 'px'
              }"
            />

            <div
              v-else-if="camada.tipo === 'forma' || camada.tipo === 'circulo'"
              :class="['vc-elemento-forma', camada.tipo === 'circulo' ? 'vc-elemento-circulo' : '']"
              :style="obterEstiloCaixaForma(camada)"
            ></div>

            <svg
              v-else-if="camada.tipo === 'linha' || camada.tipo === 'seta'"
              class="vc-elemento-vetor"
              :viewBox="obterGeometriaSeta(camada).viewBox"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
            >
              <line
                :x1="obterGeometriaSeta(camada).x1"
                :y1="obterGeometriaSeta(camada).cy"
                :x2="obterGeometriaSeta(camada).x2"
                :y2="obterGeometriaSeta(camada).cy"
                :stroke="obterGeometriaSeta(camada).cor"
                :stroke-width="obterGeometriaSeta(camada).esp"
                :stroke-dasharray="obterGeometriaSeta(camada).dashArray"
                stroke-linecap="round"
              />
              <polygon
                v-if="obterGeometriaSeta(camada).temDir"
                :points="obterGeometriaSeta(camada).pontosDireita"
                :fill="obterGeometriaSeta(camada).cor"
              />
              <polygon
                v-if="obterGeometriaSeta(camada).temEsq"
                :points="obterGeometriaSeta(camada).pontosEsquerda"
                :fill="obterGeometriaSeta(camada).cor"
              />
            </svg>

            <div
              v-else-if="camada.tipo === 'qrcode'"
              class="vc-qrcode-box"
              :style="{
                width: '100%',
                height: '100%',
                position: 'relative',
                backgroundColor: camada.fundoTransparenteQr
                  ? 'transparent'
                  : camada.corFundoQr || '#ffffff',
                borderRadius: (camada.raioFundoQr || 0) + 'px',
                padding: (camada.margemQr ?? 6) + 'px',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }"
            >
              <svg
                :viewBox="obterSvgQrCamada(camada).viewBox"
                width="100%"
                height="100%"
                preserveAspectRatio="xMidYMid meet"
                :shape-rendering="
                  !camada.estiloModulosQr || camada.estiloModulosQr === 'quadrado'
                    ? 'crispEdges'
                    : 'geometricPrecision'
                "
              >
                <path
                  :d="obterSvgQrCamada(camada).path"
                  :fill="camada.corQr || '#0f172a'"
                />
                <path
                  :d="obterSvgQrCamada(camada).pathOlhos"
                  :fill="camada.corOlhosQr || camada.corQr || '#0f172a'"
                  fill-rule="evenodd"
                />
              </svg>

              <div
                v-if="camada.logoQr"
                class="vc-qrcode-logo-wrap"
                :style="{
                  position: 'absolute',
                  width: (camada.tamanhoLogoQr ?? 22) + '%',
                  height: (camada.tamanhoLogoQr ?? 22) + '%',
                  backgroundColor:
                    camada.fundoLogoQr !== false
                      ? camada.corFundoQr || '#ffffff'
                      : 'transparent',
                  borderRadius: (camada.raioLogoQr ?? 6) + 'px',
                  padding: '3px',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }"
              >
                <img
                  :src="camada.logoQr"
                  :alt="t('palco.altLogoQr')"
                  draggable="false"
                  :style="{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    borderRadius: Math.max(0, (camada.raioLogoQr ?? 6) - 2) + 'px'
                  }"
                />
              </div>
            </div>

            <template v-if="!modoPreview && camada.id === camadaSelecionadaId && !camada.bloqueada">
              <div
                class="vc-alca-rotacao"
                :title="t('palco.girarTitulo')"
                :aria-label="t('palco.girarAria')"
                data-testid="alca-rotacao"
                @mousedown="emit('iniciar-rotacao', $event, camada)"
              >
                <span class="vc-alca-rotacao-haste"></span>
                <span class="vc-alca-rotacao-knob">
                  <component :is="icons.stage.rotate" />
                </span>
              </div>

              <div
                v-for="dir in ['no', 'ne', 'so', 'se']"
                :key="dir"
                :class="['vc-alca', `vc-alca-${dir}`]"
                :title="t('palco.redimensionarTitulo')"
                @mousedown="emit('iniciar-redimensionar', $event, camada, dir)"
              ></div>

              <div class="vc-dimensao-pill" data-testid="pill-dimensao-camada">
                {{ Math.round(camada.largura) }} × {{ Math.round(camada.altura) }}
                <template v-if="camada.rotacao"> · {{ camada.rotacao }}°</template>
              </div>
            </template>
          </div>
        </template>
      </div>
    </div>

    <div :class="[!isUnstyled && 'vc-dock-flutuante', classeDockFlutuante]">
      <button
        type="button"
        @click="emit('alternar-grade')"
        :class="['vc-dock-btn', mostrarGrade ? 'ativo' : '']"
        :title="labelGrade"
      >
        <component :is="icons.stage.grid" />
        <span>{{ labelGrade }}</span>
      </button>
      <div class="vc-divisor-sm"></div>
      <button
        type="button"
        @click="emit('alterar-zoom', Math.max(0.25, +(zoom - 0.1).toFixed(2)))"
        class="vc-dock-btn"
        :aria-label="t('palco.diminuirZoomAria')"
      >
        <component :is="icons.stage.zoomOut" />
      </button>
      <span class="vc-zoom-label">{{ Math.round(zoom * 100) }}%</span>
      <button
        type="button"
        @click="emit('alterar-zoom', Math.min(2, +(zoom + 0.1).toFixed(2)))"
        class="vc-dock-btn"
        :aria-label="t('palco.aumentarZoomAria')"
      >
        <component :is="icons.stage.zoomIn" />
      </button>
    </div>
  </main>
</template>
