/*
========
Suíte de testes para área de QR Code customizável (tests/qrcode.spec.ts).
Valida geração de matriz/SVG de QR Code (quadrado, arredondado, pontos/dots, olhos circulares),
detecção de QR Code no template via temQrCodeNoTemplate (sem criar variável na tela),
resolução interna do link com logo central na renderização Canvas 2D e edição no VCertificadoEditor.
========
*/
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import {
  VCertificadoEditor,
  criarCamadaLinkQrCode,
  criarCamadaQrCode,
  criarTemplateVazio,
  gerenciadorDeCertificado,
  extrairVariaveisTemplate,
  gerarPathSvgQrCode,
  obterMatrizQrCode,
  renderizarParaCanvas2D,
  temQrCodeNoTemplate
} from '../src/index';
import { instalarMockCanvas2D, instalarMockImage, resetarEstadoCertificado } from './helpers';

const mockPdfLink = vi.fn();

vi.mock('jspdf', () => {
  class MockJsPDF {
    internal = { pageSize: { getWidth: () => 297, getHeight: () => 210 } };
    addImage = vi.fn();
    link = mockPdfLink;
    output = vi.fn(() => new Blob(['%PDF-MOCK'], { type: 'application/pdf' }));
  }
  return { jsPDF: MockJsPDF };
});

describe('Escopo: Área de QR Code Customizável e Logo Central', () => {
  beforeEach(() => {
    resetarEstadoCertificado();
    instalarMockCanvas2D();
    instalarMockImage({ width: 120, height: 120 });
  });

  it('Deve gerar matriz e SVG válidos com estilos de módulos (pontos/arredondado) e olhos (circular)', () => {
    const matriz = obterMatrizQrCode('https://validar.exemplo.edu.br/CERT-2026-001');
    expect(matriz.tamanho).toBeGreaterThan(15);
    expect(matriz.modulos.some(Boolean)).toBe(true);

    const svgPadrao = gerarPathSvgQrCode('https://validar.exemplo.edu.br/CERT-2026-001');
    expect(svgPadrao.viewBox).toBe(`0 0 ${matriz.tamanho} ${matriz.tamanho}`);
    expect(svgPadrao.path).toContain('M');
    expect(svgPadrao.pathOlhos).toContain('M');

    const svgCustom = gerarPathSvgQrCode('https://validar.exemplo.edu.br/CERT-2026-001', {
      estiloModulos: 'pontos',
      estiloOlhos: 'circulo',
      temLogo: true,
      tamanhoLogoPct: 24
    });
    expect(svgCustom.path).toContain('a0.42,0.42');
    expect(svgCustom.pathOlhos).toContain('a3.5,3.5');
    // Quando temLogo=true, remove módulos sob a logo central
    expect(svgCustom.path.length).toBeLessThan(
      gerarPathSvgQrCode('https://validar.exemplo.edu.br/CERT-2026-001', {
        estiloModulos: 'pontos',
        temLogo: false
      }).path.length
    );
  });

  it('Deve detectar presença de QR Code via temQrCodeNoTemplate sem poluir extrairVariaveisTemplate', () => {
    const tpl = criarTemplateVazio('Com QR Code');
    expect(temQrCodeNoTemplate(tpl)).toBe(false);

    const qr = criarCamadaQrCode('landscape');
    tpl.camadas.push(qr);

    expect(temQrCodeNoTemplate(tpl)).toBe(true);
    expect(extrairVariaveisTemplate(tpl)).toEqual([]);
  });

  it('Deve renderizar o QR Code customizado com logo central no Canvas 2D', async () => {
    const ctx = instalarMockCanvas2D();
    const tpl = criarTemplateVazio('Render QR Custom');
    const qr = criarCamadaQrCode('landscape');
    qr.estiloModulosQr = 'pontos';
    qr.estiloOlhosQr = 'circulo';
    qr.corOlhosQr = '#2563eb';
    qr.raioFundoQr = 12;
    qr.logoQr = 'data:image/png;base64,LOGO_MOCK';
    qr.tamanhoLogoQr = 24;
    tpl.camadas.push(qr);

    await renderizarParaCanvas2D(tpl, {
      link_validacao: 'https://pucminas.br/cert/12345'
    });

    expect(ctx.ellipse).toHaveBeenCalled();
    expect(ctx.drawImage).toHaveBeenCalled();
  });

  it('Deve permitir adicionar e customizar o QR Code no VCertificadoEditor sem exibir input de link', async () => {
    const wrapper = mount(VCertificadoEditor, {
      props: { modelValue: criarTemplateVazio('Editor QR') }
    });

    await wrapper.find('[data-testid="btn-adicionar-qrcode"]').trigger('click');
    await nextTick();

    expect(wrapper.find('.vc-qrcode-box svg path').exists()).toBe(true);
    expect(wrapper.find('.vc-secao-propriedades textarea').exists()).toBe(false);

    const selectModulos = wrapper.find('[data-testid="select-estilo-modulos-qr"]');
    const selectOlhos = wrapper.find('[data-testid="select-estilo-olhos-qr"]');
    expect(selectModulos.exists()).toBe(true);
    expect(selectOlhos.exists()).toBe(true);

    await selectModulos.setValue('arredondado');
    await selectOlhos.setValue('circulo');
    await nextTick();

    expect(wrapper.find('[data-testid="input-upload-logo-qr"]').exists()).toBe(true);

    wrapper.unmount();
  });

  it('Deve exibir secao separada de Link do QR Code ao inserir QR Code, aceitar {{link_qrcode}} e {{link_validacao}} sem badge vermelho e suportar texto personalizado', async () => {
    const wrapper = mount(VCertificadoEditor, {
      props: { modelValue: criarTemplateVazio('Editor Link QR') }
    });

    // Antes de inserir QR Code, o bloco de Link do QR Code nao aparece
    expect(wrapper.find('[data-testid="bloco-link-qrcode"]').exists()).toBe(false);

    await wrapper.find('[data-testid="btn-adicionar-qrcode"]').trigger('click');
    await nextTick();

    // Apos inserir QR Code, o bloco dedicado aparece
    expect(wrapper.find('[data-testid="bloco-link-qrcode"]').exists()).toBe(true);

    // Seleciona modo texto personalizado e insere a camada de link
    await wrapper.find('[data-testid="select-modo-link-qrcode"]').setValue('texto');
    await nextTick();
    await wrapper.find('[data-testid="input-texto-link-qrcode"]').setValue('Clique para validar');
    await wrapper.find('[data-testid="btn-inserir-link-qrcode"]').trigger('click');
    await nextTick();

    expect(wrapper.find('.vc-conteudo-texto').text()).toBe('Clique para validar');
    const inputDestino = wrapper.find('[data-testid="input-destino-link-pdf"]');
    expect(inputDestino.exists()).toBe(true);
    expect((inputDestino.element as HTMLInputElement).value).toBe('{{link_qrcode}}');

    // Testa tambem que {{link_qrcode}} e {{link_validacao}} ficam azuis (validos) no CampoTextoVariavel
    const textarea = wrapper.find('[data-testid="textarea-texto-livre"]');
    const el = textarea.element as HTMLTextAreaElement;
    el.value = 'Acesse {{link_qrcode}} ou {{link_validacao}}';
    el.selectionStart = el.value.length;
    el.selectionEnd = el.value.length;
    await textarea.trigger('input');
    await nextTick();

    expect(wrapper.findAll('[data-testid="badge-variavel-valida"]')).toHaveLength(2);
    expect(wrapper.findAll('[data-testid="badge-variavel-invalida"]')).toHaveLength(0);

    wrapper.unmount();
  });

  it('Deve criar anotacoes clicaveis (pdf.link) ao exportar PDF para camadas com linkUrl, URL no texto e QR Code', async () => {
    mockPdfLink.mockClear();
    const tpl = criarTemplateVazio('PDF Com Links', 'landscape');
    const qr = criarCamadaQrCode('landscape', 'https://validar.pucminas.br/CERT-999');
    const linkPersonalizado = criarCamadaLinkQrCode({
      orientacao: 'landscape',
      modoExibicao: 'texto',
      textoPersonalizado: 'Validar certificado online'
    });
    tpl.camadas.push(qr, linkPersonalizado);

    const { gerarPacoteExportacao } = gerenciadorDeCertificado();
    await gerarPacoteExportacao(tpl, {
      link_validacao: 'https://validar.pucminas.br/PUC-2026-ICEI-8841'
    });

    expect(mockPdfLink).toHaveBeenCalledTimes(2);
    expect(mockPdfLink).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      { url: 'https://validar.pucminas.br/PUC-2026-ICEI-8841' }
    );
  });
});
