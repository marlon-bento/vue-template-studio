/*
========
Suíte de testes do componente <TemplateStudioEditor> e seus subcomponentes (tests/editor.spec.ts).
Valida layout modular, quadrado interativo 3x3 estilo Figma (folha e caixa de texto),
variáveis e valores de pré-visualização informados pelo cliente (sem hardcode na biblioteca),
pan com Espaço+Arrastar, zoom com Ctrl+Scroll, medidas com Alt, drag-and-drop e atalhos.
========
*/
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, nextTick, ref } from 'vue';
import { DIMENSOES_A4, TemplateStudioEditor, criarTemplateVazio } from '../src/index';
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

describe('Escopo: Componente <TemplateStudioEditor> e Subcomponentes Modulares', () => {
  beforeEach(() => {
    resetarEstadoCertificado();
    instalarMockCanvas2D();
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn()
    });
  });

  it('Não deve trazer variáveis hardcoded por padrão e deve usar as variáveis e valores de visualização informados pelo cliente ao clicar em Pré-visualizar', async () => {
    const wrapperSemVariaveis = mount(TemplateStudioEditor, {
      props: {
        modelValue: criarTemplateVazio('Sem Hardcode')
      }
    });

    expect(wrapperSemVariaveis.find('[data-testid="aviso-sem-variaveis"]').exists()).toBe(true);
    expect(wrapperSemVariaveis.text()).not.toContain('+ Aluno');
    expect(wrapperSemVariaveis.text()).not.toContain('+ Professor');
    wrapperSemVariaveis.unmount();

    const wrapperComCliente = mount(TemplateStudioEditor, {
      props: {
        modelValue: criarTemplateVazio('Cliente Custom'),
        variaveisDisponiveis: [
          {
            chave: 'nome_participante',
            rotulo: '+ Participante',
            nomeCamada: 'Participante',
            valorVisualizacao: 'Dr. Roberto Almeida'
          },
          {
            chave: 'trilha',
            rotulo: '+ Trilha',
            nomeCamada: 'Trilha',
            valorVisualizacao: 'Arquitetura Frontend'
          }
        ]
      }
    });

    const botoesVar = wrapperComCliente.findAll('.vc-dock-esq .vc-grid-2 .vc-chip');
    expect(botoesVar).toHaveLength(2);
    await botoesVar[0].trigger('click');
    await nextTick();

    expect(wrapperComCliente.find('[data-testid="badge-variavel-fixa"]').exists()).toBe(true);
    expect(wrapperComCliente.find('[data-testid="textarea-texto-livre"]').exists()).toBe(false);

    expect(wrapperComCliente.find('.vc-conteudo-texto').text()).toBe('{{nome_participante}}');

    await wrapperComCliente.find('[data-testid="btn-preview"]').trigger('click');
    await nextTick();
    expect(wrapperComCliente.find('.vc-conteudo-texto').text()).toBe('Dr. Roberto Almeida');

    wrapperComCliente.unmount();
  });

  it('Deve posicionar na folha e alinhar texto na caixa clicando no quadrado visual 3x3 estilo Figma', async () => {
    const tpl = criarTemplateVazio('Quadrado 3x3 Figma', 'landscape');
    const wrapper = mount(TemplateStudioEditor, {
      props: { modelValue: tpl },
      attachTo: document.body
    });

    await wrapper.find('[data-testid="btn-adicionar-texto"]').trigger('click');
    await nextTick();

    // Alinhamento começa recolhido por padrão para facilitar navegação
    expect(wrapper.find('[data-testid="quadrado-alinhamento-folha"]').exists()).toBe(false);
    await wrapper.find('[data-testid="accordion-alinhamento"]').trigger('click');
    await nextTick();
    expect(wrapper.find('[data-testid="quadrado-alinhamento-folha"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="quadrado-alinhamento-texto"]').exists()).toBe(true);

    await wrapper.find('[data-testid="folha-3x3-base-direita"]').trigger('click');
    await nextTick();

    const inputsNum = wrapper.findAll('.vc-secao-propriedades input[type="number"]');
    const xInput = inputsNum[0].element as HTMLInputElement;
    const yInput = inputsNum[1].element as HTMLInputElement;
    expect(Number(xInput.value)).toBe(DIMENSOES_A4.landscape.largura - 440);
    expect(Number(yInput.value)).toBe(DIMENSOES_A4.landscape.altura - 60);

    await wrapper.find('[data-testid="texto-3x3-topo-esquerda"]').trigger('click');
    await nextTick();
    const estiloTexto = (wrapper.find('.vc-conteudo-texto').element as HTMLElement).style;
    expect(estiloTexto.textAlign).toBe('left');
    expect(estiloTexto.justifyContent).toBe('flex-start');

    wrapper.unmount();
  });

  it('Deve renderizar layout estilo Photoshop CS6 com camadas em baixo e sem opções de ordem ao selecionar elemento', async () => {
    const wrapper = mount(TemplateStudioEditor, {
      props: {
        modelValue: criarTemplateVazio('Meu Certificado')
      }
    });

    expect(wrapper.find('.vc-dock-dir .vc-secao-propriedades').exists()).toBe(true);
    expect(wrapper.find('.vc-dock-dir .vc-secao-camadas').exists()).toBe(true);

    await wrapper.findAll('button.vc-btn-sutil')[0].trigger('click');
    await nextTick();

    const textoInspetor = wrapper.find('.vc-secao-propriedades').text();
    expect(textoInspetor).not.toContain('Ordem da Camada');
    expect(textoInspetor).not.toContain('Frente');
    expect(textoInspetor).not.toContain('Trás');

    expect(wrapper.findAll('.vc-secao-camadas .vc-camada-row')).toHaveLength(1);
    expect(wrapper.find('.vc-secao-camadas .vc-camada-row').attributes('draggable')).toBe('true');

    wrapper.unmount();
  });

  it('Deve alinhar camada na folha e alinhar texto verticalmente dentro da caixa estilo Figma', async () => {
    const tpl = criarTemplateVazio('Alinhamento', 'landscape');
    const wrapper = mount(TemplateStudioEditor, {
      props: { modelValue: tpl },
      attachTo: document.body
    });

    await wrapper.findAll('button.vc-btn-sutil')[0].trigger('click');
    await nextTick();

    await wrapper.find('[data-testid="accordion-alinhamento"]').trigger('click');
    await nextTick();
    await wrapper.find('button[aria-label="Alinhar à esquerda"]').trigger('click');
    await wrapper.find('button[aria-label="Alinhar ao topo"]').trigger('click');
    await nextTick();

    const xInput = wrapper.findAll('.vc-secao-propriedades input[type="number"]')[0].element as HTMLInputElement;
    const yInput = wrapper.findAll('.vc-secao-propriedades input[type="number"]')[1].element as HTMLInputElement;
    expect(Number(xInput.value)).toBe(0);
    expect(Number(yInput.value)).toBe(0);

    await wrapper.find('button[aria-label="Centralizar horizontalmente"]').trigger('click');
    await nextTick();
    expect(Number(xInput.value)).toBe(Math.round((DIMENSOES_A4.landscape.largura - 440) / 2));

    await wrapper.find('button[aria-label="Texto embaixo"]').trigger('click');
    await nextTick();
    expect((wrapper.find('.vc-conteudo-texto').element as HTMLElement).style.justifyContent).toBe('flex-end');

    wrapper.unmount();
  });

  it('Deve suportar pan com Espaço+Arrastar, zoom com Ctrl+Scroll e medidas em px com Alt', async () => {
    const wrapper = mount(TemplateStudioEditor, {
      props: { modelValue: criarTemplateVazio('Figma Nav') },
      attachTo: document.body
    });

    await wrapper.findAll('button.vc-btn-sutil')[0].trigger('click');
    await nextTick();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Alt' }));
    await nextTick();
    expect(wrapper.findAll('.vc-medida-badge').length).toBeGreaterThanOrEqual(4);

    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Alt' }));
    await nextTick();
    expect(wrapper.findAll('.vc-medida-badge')).toHaveLength(0);

    expect(wrapper.find('.vc-zoom-label').text()).toBe('66%');
    const palco = wrapper.find('.vc-canvas-palco').element as HTMLElement;
    const wheelIn = new Event('wheel', { cancelable: true });
    Object.defineProperties(wheelIn, { ctrlKey: { value: true }, deltaY: { value: -100 } });
    palco.dispatchEvent(wheelIn);
    await nextTick();
    expect(wrapper.find('.vc-zoom-label').text()).toBe('74%');
    expect(wheelIn.defaultPrevented).toBe(true);

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ' }));
    await nextTick();
    expect(wrapper.find('.vc-canvas-palco').classes()).toContain('modo-pan');

    await wrapper.find('.vc-canvas-palco').trigger('mousedown', { clientX: 200, clientY: 200 });
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 260, clientY: 140 }));
    window.dispatchEvent(new MouseEvent('mouseup'));
    await nextTick();
    expect(wrapper.find('.vc-envoltorio').attributes('style')).toContain('translate(60px, -60px)');

    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', key: ' ' }));
    await nextTick();
    expect(wrapper.find('.vc-canvas-palco').classes()).not.toContain('modo-pan');

    wrapper.unmount();
    const wheelDepoisUnmount = new Event('wheel', { cancelable: true });
    Object.defineProperties(wheelDepoisUnmount, { ctrlKey: { value: true }, deltaY: { value: -100 } });
    palco.dispatchEvent(wheelDepoisUnmount);
    expect(wheelDepoisUnmount.defaultPrevented).toBe(false);
  });

  it('Deve medir a distância estilo Figma até outro elemento quando o mouse estiver sobre ele segurando Alt', async () => {
    const tpl = criarTemplateVazio('Alt Entre Elementos', 'landscape');
    const wrapper = mount(TemplateStudioEditor, {
      props: { modelValue: tpl },
      attachTo: document.body
    });

    await wrapper.find('[data-testid="btn-adicionar-texto"]').trigger('click');
    await wrapper.find('[data-testid="btn-adicionar-texto"]').trigger('click');
    await nextTick();

    const camadasDom = wrapper.findAll('.vc-camada');
    expect(camadasDom).toHaveLength(2);

    const inputsNum = wrapper.findAll('.vc-secao-propriedades input[type="number"]');
    await inputsNum[1].setValue(500);
    await inputsNum[1].trigger('change');
    await nextTick();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Alt' }));
    await camadasDom[0].trigger('mouseenter');
    await nextTick();

    expect(camadasDom[0].classes()).toContain('vc-alvo-medida');
    const badges = wrapper.findAll('.vc-medida-badge').map((b) => Number(b.text()));
    expect(badges).toContain(73);

    await camadasDom[0].trigger('mouseleave');
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Alt' }));
    wrapper.unmount();
  });

  it('Deve permitir girar a camada pela alça de rotação (com snap de 15° no Shift) e redimensionar mantendo a proporção com Shift', async () => {
    const tpl = criarTemplateVazio('Rotação e Proporção', 'landscape');
    const wrapper = mount(TemplateStudioEditor, {
      props: { modelValue: tpl },
      attachTo: document.body
    });

    await wrapper.find('[data-testid="btn-adicionar-qrcode"]').trigger('click');
    await nextTick();

    const alcaSe = wrapper.find('.vc-alca-se');
    expect(alcaSe.exists()).toBe(true);
    await alcaSe.trigger('mousedown', { clientX: 500, clientY: 500 });
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 566, clientY: 510, shiftKey: true }));
    window.dispatchEvent(new MouseEvent('mouseup'));
    await nextTick();

    const inputsNum = wrapper.findAll('.vc-secao-propriedades input[type="number"]');
    const wVal = Number((inputsNum[2].element as HTMLInputElement).value);
    const hVal = Number((inputsNum[3].element as HTMLInputElement).value);
    expect(wVal).toBeGreaterThan(120);
    expect(wVal).toBe(hVal);

    const alcaRot = wrapper.find('[data-testid="alca-rotacao"]');
    expect(alcaRot.exists()).toBe(true);
    await alcaRot.trigger('mousedown', { clientX: 600, clientY: 400 });
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 720, clientY: 520, shiftKey: true }));
    window.dispatchEvent(new MouseEvent('mouseup'));
    await nextTick();

    const rotVal = Number((inputsNum[4].element as HTMLInputElement).value);
    expect(Math.abs(rotVal % 15)).toBe(0);

    wrapper.unmount();
  });

  it('Deve bloquear criação de novas variáveis por padrão e liberar somente quando permitirCriarVariavel=true', async () => {
    const wrapperBloqueado = mount(TemplateStudioEditor, {
      props: {
        variaveisDisponiveis: [
          { chave: 'nome_aluno', rotulo: '+ Aluno' }
        ]
      }
    });

    expect(wrapperBloqueado.find('input[placeholder="campo_extra"]').exists()).toBe(false);
    expect(wrapperBloqueado.findAll('.vc-dock-esq .vc-grid-2 .vc-chip')).toHaveLength(1);

    const wrapperLiberado = mount(TemplateStudioEditor, {
      props: {
        permitirCriarVariavel: true
      }
    });

    const inputExtra = wrapperLiberado.find('input[placeholder="campo_extra"]');
    expect(inputExtra.exists()).toBe(true);
    await inputExtra.setValue('cpf_aluno');
    await wrapperLiberado.find('button[aria-label="Criar variável personalizada"]').trigger('click');
    await nextTick();

    const eventosVariaveis = wrapperLiberado.emitted('variaveis-alteradas') as string[][][];
    expect(eventosVariaveis[eventosVariaveis.length - 1][0]).toContain('cpf_aluno');

    wrapperBloqueado.unmount();
    wrapperLiberado.unmount();
  });

  it('Deve permitir minimizar e expandir o painel esquerdo, painel direito e a seção de camadas', async () => {
    const wrapper = mount(TemplateStudioEditor);

    await wrapper.find('button[aria-label="Alternar painel Inserir"]').trigger('click');
    expect(wrapper.find('.vc-dock-esq').classes()).toContain('minimizado');

    await wrapper.find('.vc-secao-camadas .vc-painel-cabecalho').trigger('click');
    expect(wrapper.find('.vc-secao-camadas').classes()).toContain('minimizado');

    await wrapper.find('button[aria-label="Alternar painel direito"]').trigger('click');
    expect(wrapper.find('.vc-dock-dir').classes()).toContain('minimizado');

    wrapper.unmount();
  });

  it('Deve reordenar camadas via drag-and-drop na aba de camadas e preservar histórico de Ctrl+Z com v-model', async () => {
    const HostComVModel = defineComponent({
      components: { TemplateStudioEditor },
      setup() {
        const tpl = ref(criarTemplateVazio('Teste v-model'));
        return { tpl };
      },
      template: `<TemplateStudioEditor v-model="tpl" />`
    });

    const wrapper = mount(HostComVModel, { attachTo: document.body });
    const editor = wrapper.findComponent(TemplateStudioEditor);

    await editor.findAll('button.vc-btn-sutil')[0].trigger('click');
    await editor.findAll('button.vc-btn-sutil')[1].trigger('click');
    await nextTick();

    expect(wrapper.vm.tpl.camadas.map((c) => c.nome)).toEqual(['Texto Fixo', 'Moldura']);

    const linhas = editor.findAll('.vc-camada-row');
    expect(linhas).toHaveLength(2);

    await linhas[1].trigger('dragstart');
    await linhas[0].trigger('dragover');
    await linhas[0].trigger('drop');
    await linhas[1].trigger('dragend');
    await nextTick();

    expect(wrapper.vm.tpl.camadas.map((c) => c.nome)).toEqual(['Moldura', 'Texto Fixo']);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
    await nextTick();
    expect(wrapper.vm.tpl.camadas.map((c) => c.nome)).toEqual(['Texto Fixo', 'Moldura']);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true }));
    await nextTick();
    expect(wrapper.vm.tpl.camadas.map((c) => c.nome)).toEqual(['Moldura', 'Texto Fixo']);

    wrapper.unmount();
  });

  it('Deve suportar atalhos Ctrl+D, setas do teclado, Delete e respeitar bloqueio de camada', async () => {
    const wrapper = mount(TemplateStudioEditor, { attachTo: document.body });
    const vm = wrapper.vm as unknown as {
      adicionarTexto: (t: string, n: string, v: boolean) => void;
    };

    vm.adicionarTexto('Teste', 'Camada Teste', false);
    await nextTick();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', ctrlKey: true }));
    await nextTick();
    expect(wrapper.findAll('.vc-camada-row')).toHaveLength(2);

    const xAntes = Number((wrapper.findAll('.vc-secao-propriedades input[type="number"]')[0].element as HTMLInputElement).value);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true }));
    await nextTick();
    const xDepois = Number((wrapper.findAll('.vc-secao-propriedades input[type="number"]')[0].element as HTMLInputElement).value);
    expect(xDepois).toBe(xAntes + 10);

    await wrapper.find('button[aria-label="Alternar bloqueio"]').trigger('click');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
    await nextTick();
    expect(wrapper.findAll('.vc-camada-row')).toHaveLength(2);

    await wrapper.find('button[aria-label="Alternar bloqueio"]').trigger('click');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
    await nextTick();
    expect(wrapper.findAll('.vc-camada-row')).toHaveLength(1);

    wrapper.unmount();
  });

  it('Deve emitir salvar, exportar e suportar customização de tema, labels e modo unstyled', async () => {
    const wrapper = mount(TemplateStudioEditor, {
      props: {
        tema: 'light',
        unstyled: false,
        labels: { salvar: 'Gravar Modelo' }
      }
    });

    expect(wrapper.find('.vc-estudio').classes()).toContain('is-light');
    expect(wrapper.text()).toContain('Gravar Modelo');

    await wrapper.find('.vc-pill-btn.sucesso').trigger('click');
    expect(wrapper.emitted('salvar')).toBeTruthy();

    await wrapper.find('.vc-pill-btn.primario').trigger('click');
    await flushPromises();
    expect(wrapper.emitted('exportar')).toBeTruthy();

    const wrapperUnstyled = mount(TemplateStudioEditor, {
      props: { unstyled: true }
    });
    expect(wrapperUnstyled.find('.vc-estudio').exists()).toBe(false);

    wrapper.unmount();
    wrapperUnstyled.unmount();
  });
});
