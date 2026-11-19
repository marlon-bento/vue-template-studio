/*
========
Suíte de testes do componente <VCertificadoVisualizador> (tests/visualizador.spec.ts).
Valida geração automática de preview ao montar, reatividade de dados/template,
detecção e exposição de variáveis do template (slot #campos), exportação PDF/PNG e erros.
========
*/
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, ref } from 'vue';
import {
  VCertificadoVisualizador,
  criarTemplateVazio,
  ehUrlImagemPreviewSegura,
  sanitizarUrlImagemPreview,
  temVariavelNoTemplate
} from '../src/index';
import { instalarMockCanvas2D, resetarEstadoCertificado } from './helpers';

vi.mock('jspdf', () => {
  class MockJsPDF {
    internal = {
      pageSize: {
        getWidth: () => 297,
        getHeight: () => 210
      }
    };
    addImage = vi.fn();
    output = vi.fn(() => new Blob(['%PDF-MOCK'], { type: 'application/pdf' }));
  }
  return { jsPDF: MockJsPDF };
});

describe('Escopo: Componente <VCertificadoVisualizador>', () => {
  beforeEach(() => {
    resetarEstadoCertificado();
    instalarMockCanvas2D();
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn()
    });
  });

  it('Deve detectar e exportar as variáveis existentes no template via evento, expose e slot #campos', () => {
    const tpl = criarTemplateVazio('Com Variáveis');
    tpl.camadas.push({
      id: 'c1',
      tipo: 'variavel',
      nome: 'Aluno',
      x: 10,
      y: 10,
      largura: 200,
      altura: 40,
      opacidade: 100,
      rotacao: 0,
      visivel: true,
      bloqueada: false,
      texto: '{{nome_aluno}} - {{curso}}'
    });

    expect(temVariavelNoTemplate(tpl, 'nome_aluno')).toBe(true);
    expect(temVariavelNoTemplate(tpl, 'nome_professor')).toBe(false);

    const HostComSlot = defineComponent({
      components: { VCertificadoVisualizador },
      setup() {
        const dados = ref({ nome_aluno: 'Maria', curso: 'Vue 3' });
        return { tpl, dados };
      },
      template: `
        <VCertificadoVisualizador :template="tpl" :dados="dados" :gerar-imagem-ao-montar="false">
          <template #campos="{ variaveis, temVariavel }">
            <div id="campos-dinamicos">
              <span id="lista-vars">{{ variaveis.join(',') }}</span>
              <input v-if="temVariavel('nome_aluno')" id="input-aluno" />
              <select v-if="temVariavel('nome_professor')" id="select-professor"></select>
            </div>
          </template>
        </VCertificadoVisualizador>
      `
    });

    const wrapper = mount(HostComSlot);
    const vis = wrapper.findComponent(VCertificadoVisualizador);

    expect(vis.emitted('variaveis-detectadas')?.[0]?.[0]).toEqual(['nome_aluno', 'curso']);
    expect(wrapper.find('#lista-vars').text()).toBe('nome_aluno,curso');
    expect(wrapper.find('#input-aluno').exists()).toBe(true);
    expect(wrapper.find('#select-professor').exists()).toBe(false);

    wrapper.unmount();
  });

  it('Deve gerar imagem de pré-visualização automaticamente ao montar e emitir imagem-gerada', async () => {
    const tpl = criarTemplateVazio('Curso Vue');
    const wrapper = mount(VCertificadoVisualizador, {
      props: {
        template: tpl,
        dados: { nome_aluno: 'Maria' }
      }
    });

    await new Promise((r) => setTimeout(r, 20));
    await nextTick();

    const img = wrapper.find('.vc-vis-img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('data:image/png;base64,MOCKPNGDATA==');
    expect(wrapper.emitted('imagem-gerada')).toBeTruthy();

    wrapper.unmount();
  });

  it('Não deve gerar preview ao montar quando gerarImagemAoMontar=false', async () => {
    const tpl = criarTemplateVazio('Manual');
    const wrapper = mount(VCertificadoVisualizador, {
      props: {
        template: tpl,
        dados: { nome_aluno: 'Pedro' },
        gerarImagemAoMontar: false
      }
    });

    await nextTick();
    expect(wrapper.find('.vc-vis-img').exists()).toBe(false);
    expect(wrapper.find('.vc-vis-carregando').exists()).toBe(true);

    wrapper.unmount();
  });

  it('Deve exportar PDF via método exposto e emitir pdf-gerado', async () => {
    const tpl = criarTemplateVazio('Exportação');
    const wrapper = mount(VCertificadoVisualizador, {
      props: {
        template: tpl,
        dados: { nome_aluno: 'Ana' },
        gerarImagemAoMontar: false
      }
    });

    const vm = wrapper.vm as unknown as {
      exportarPdf: (baixar?: boolean) => Promise<{ nomeArquivo: string; pdfBlob: Blob } | null>;
    };

    const pacote = await vm.exportarPdf(false);
    expect(pacote).not.toBeNull();
    expect(pacote?.nomeArquivo).toBe('exportacao_ana.pdf');
    expect(wrapper.emitted('pdf-gerado')).toBeTruthy();

    wrapper.unmount();
  });

  it('Deve emitir evento erro quando a renderização do Canvas falhar', async () => {
    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => {
      throw new Error('Canvas tainted');
    });

    const wrapper = mount(VCertificadoVisualizador, {
      props: {
        template: criarTemplateVazio('Erro'),
        dados: {}
      }
    });

    await new Promise((r) => setTimeout(r, 20));
    await nextTick();

    expect(wrapper.emitted('erro')).toBeTruthy();
    wrapper.unmount();
  });

  it('Deve sanitizar imagemPreviewUrl bloqueando URLs maliciosas (javascript:, data:text/html, http:) e permitindo apenas data:image/ ou blob:', async () => {
    expect(ehUrlImagemPreviewSegura('data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==')).toBe(true);
    expect(ehUrlImagemPreviewSegura('blob:https://exemplo.edu.br/1234-5678')).toBe(true);
    expect(ehUrlImagemPreviewSegura('javascript:alert(1)')).toBe(false);
    expect(ehUrlImagemPreviewSegura('data:text/html;base64,PHNjcmlwdD4=')).toBe(false);
    expect(ehUrlImagemPreviewSegura('https://malicioso.com/x.png')).toBe(false);
    expect(sanitizarUrlImagemPreview('javascript:alert(1)')).toBe('');

    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'javascript:alert(1)');

    const wrapper = mount(VCertificadoVisualizador, {
      props: {
        template: criarTemplateVazio('Segurança'),
        dados: {}
      }
    });

    await new Promise((r) => setTimeout(r, 20));
    await nextTick();

    expect(wrapper.find('.vc-vis-img').exists()).toBe(false);
    expect(wrapper.emitted('erro')).toBeTruthy();
    wrapper.unmount();
  });

  it('Deve suportar tema claro, labels customizados e modo unstyled', () => {
    const wrapper = mount(VCertificadoVisualizador, {
      props: {
        template: criarTemplateVazio('Tema'),
        dados: {},
        gerarImagemAoMontar: false,
        tema: 'light',
        labels: { baixarPdf: 'Gerar Documento' }
      }
    });

    expect(wrapper.find('.vc-visualizador').classes()).toContain('is-light');
    expect(wrapper.text()).toContain('Gerar Documento');

    const wrapperUnstyled = mount(VCertificadoVisualizador, {
      props: {
        template: criarTemplateVazio('Headless'),
        dados: {},
        gerarImagemAoMontar: false,
        unstyled: true
      }
    });
    expect(wrapperUnstyled.find('.vc-visualizador').exists()).toBe(false);

    wrapper.unmount();
    wrapperUnstyled.unmount();
  });
});
