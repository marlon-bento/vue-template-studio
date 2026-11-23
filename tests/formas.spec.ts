/*
========
Suíte de testes das formas geométricas e vetoriais (tests/formas.spec.ts).
Valida criação, renderização no Canvas 2D e edição no TemplateStudioEditor para
Círculo, Linha, Seta (pontas direita, esquerda e ambas) e Moldura com estilos de traço.
========
*/
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import {
  TemplateStudioEditor,
  criarCamadaCirculo,
  criarCamadaLinha,
  criarCamadaMoldura,
  criarCamadaSeta,
  criarTemplateVazio,
  obterSimboloTipoCamada,
  renderizarParaCanvas2D
} from '../src/index';
import { instalarMockCanvas2D, resetarEstadoCertificado } from './helpers';

vi.mock('jspdf', () => {
  class MockJsPDF {
    internal = { pageSize: { getWidth: () => 297, getHeight: () => 210 } };
    addImage = vi.fn();
    output = vi.fn(() => new Blob(['%PDF-MOCK'], { type: 'application/pdf' }));
  }
  return { jsPDF: MockJsPDF };
});

describe('Escopo: Formas Geométricas e Elementos Visuais (Círculo, Linha, Seta, Moldura)', () => {
  beforeEach(() => {
    resetarEstadoCertificado();
    instalarMockCanvas2D();
  });

  it('Deve criar camadas de Círculo, Linha, Seta e Moldura com propriedades e símbolos corretos', () => {
    const circulo = criarCamadaCirculo('landscape');
    const linha = criarCamadaLinha('landscape');
    const seta = criarCamadaSeta('landscape', 'ambas');
    const moldura = criarCamadaMoldura('landscape');

    expect(circulo.tipo).toBe('circulo');
    expect(linha.tipo).toBe('linha');
    expect(seta.tipo).toBe('seta');
    expect(seta.pontaSeta).toBe('ambas');
    expect(moldura.tipo).toBe('forma');

    expect(obterSimboloTipoCamada('circulo')).toBe('◯');
    expect(obterSimboloTipoCamada('linha')).toBe('╱');
    expect(obterSimboloTipoCamada('seta')).toBe('→');
    expect(obterSimboloTipoCamada('forma')).toBe('□');
  });

  it('Deve desenhar Círculo, Linha e Seta (com tracejado e pontas duplas) no Canvas 2D', async () => {
    const ctx = instalarMockCanvas2D();
    const tpl = criarTemplateVazio('Formas Canvas');

    const circulo = criarCamadaCirculo('landscape');
    circulo.semPreenchimento = false;
    circulo.corPreenchimento = '#dbeafe';
    circulo.estiloBorda = 'dashed';

    const linha = criarCamadaLinha('landscape');
    linha.estiloBorda = 'dotted';

    const seta = criarCamadaSeta('landscape', 'ambas');

    tpl.camadas.push(circulo, linha, seta);

    await renderizarParaCanvas2D(tpl, {}, 2);

    expect(ctx.ellipse).toHaveBeenCalled();
    expect(ctx.setLineDash).toHaveBeenCalledWith([9, 6]); // dashed com espessura 3
    expect(ctx.setLineDash).toHaveBeenCalledWith([2, 3]); // dotted com espessura 2
    expect(ctx.stroke).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
  });

  it('Deve permitir inserir Círculo, Linha e Seta pelos botões do editor e alterar ponta da seta no inspetor', async () => {
    const wrapper = mount(TemplateStudioEditor, {
      props: { modelValue: criarTemplateVazio('Editor Formas') }
    });

    await wrapper.find('[data-testid="btn-adicionar-circulo"]').trigger('click');
    await nextTick();
    expect(wrapper.find('.vc-elemento-circulo').exists()).toBe(true);

    await wrapper.find('[data-testid="btn-adicionar-linha"]').trigger('click');
    await nextTick();
    expect(wrapper.findAll('svg.vc-elemento-vetor')).toHaveLength(1);

    await wrapper.find('[data-testid="btn-adicionar-seta"]').trigger('click');
    await nextTick();
    expect(wrapper.findAll('svg.vc-elemento-vetor')).toHaveLength(2);
    expect(wrapper.findAll('svg.vc-elemento-vetor polygon')).toHaveLength(1); // ponta direita

    // Altera para ponta em ambas as extremidades no inspetor estilo Figma
    await wrapper.find('[data-testid="seta-ambas"]').trigger('click');
    await nextTick();
    expect(wrapper.findAll('svg.vc-elemento-vetor polygon')).toHaveLength(2);

    wrapper.unmount();
  });
});
