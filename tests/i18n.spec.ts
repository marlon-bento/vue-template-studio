/*
========
Suíte de testes automatizados de internacionalização e camada de API em inglês (tests/i18n.spec.ts).
Valida paridade estrutural entre pt-br.json e en.json, alternância entre Português e Inglês
via prop locale, LocaleSwitcher e setLocale/definirIdioma em todos os componentes da tela,
adição de versões de idioma customizadas pelo próprio usuário e uso completo dos componentes
e props em inglês (TemplateStudioEditor, TemplateStudioViewer, availableVariables, previewData, etc.).
========
*/
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import {
  TemplateStudioEditor,
  TemplateStudioEditor,
  TemplateStudioViewer,
  TemplateStudioViewer,
  TemplateStudioEditor,
  TemplateStudioViewer,
  LocaleSwitcher,
  createEmptyTemplate,
  criarTemplateVazio,
  i18n,
  pt_br,
  en,
  addLocale,
  adicionarIdioma,
  setLocale,
  definirIdioma,
  getAvailableLocales,
  obterIdiomasDisponiveis
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

describe('Escopo: Internacionalização (pt_br, en, custom locales) e Camada de Componentes/Props em Inglês', () => {
  beforeEach(() => {
    resetarEstadoCertificado();
    instalarMockCanvas2D();
  });

  it('Deve manter exatamente as mesmas categorias e chaves em pt-br.json e en.json', () => {
    const categoriasPt = Object.keys(pt_br).sort();
    const categoriasEn = Object.keys(en).sort();
    expect(categoriasPt).toEqual(categoriasEn);

    for (const categoria of categoriasPt) {
      const chavesPt = Object.keys((pt_br as Record<string, Record<string, string>>)[categoria]).sort();
      const chavesEn = Object.keys((en as Record<string, Record<string, string>>)[categoria]).sort();
      expect(chavesPt).toEqual(chavesEn);
    }
  });

  it('Deve renderizar todos os painéis em Português (pt_br) por padrão e alternar para Inglês (en) via prop locale', async () => {
    const wrapper = mount(TemplateStudioEditor, {
      props: {
        modelValue: criarTemplateVazio('Template Bilingue'),
        locale: 'pt_br'
      }
    });

    expect(wrapper.text()).toContain('Inserir');
    expect(wrapper.text()).toContain('Salvar');
    expect(wrapper.text()).toContain('Exportar PDF');
    expect(wrapper.text()).toContain('Pré-visualizar');
    expect(wrapper.text()).toContain('Propriedades');
    expect(wrapper.text()).toContain('Camadas');
    expect(wrapper.text()).toContain('Campos do Template');

    await wrapper.setProps({ locale: 'en' });
    await nextTick();

    expect(wrapper.text()).toContain('Insert');
    expect(wrapper.text()).toContain('Save');
    expect(wrapper.text()).toContain('Export PDF');
    expect(wrapper.text()).toContain('Preview');
    expect(wrapper.text()).toContain('Properties');
    expect(wrapper.text()).toContain('Layers');
    expect(wrapper.text()).toContain('Template Fields');
    expect(wrapper.text()).toContain('+ Free Text');
    expect(wrapper.text()).toContain('+ Frame / Box');

    // Ao adicionar uma camada em inglês, o inspetor e o nome padrão também ficam em inglês
    await wrapper.find('[data-testid="btn-adicionar-texto"]').trigger('click');
    await nextTick();

    expect(wrapper.text()).toContain('Dimensions & Appearance');
    expect(wrapper.text()).toContain('Text Content');
    expect(wrapper.text()).toContain('Alignment');

    wrapper.unmount();
  });

  it('Deve permitir trocar o idioma da aplicação usando o componente LocaleSwitcher', async () => {
    const wrapper = mount(TemplateStudioEditor, {
      props: {
        modelValue: createEmptyTemplate('Teste Switcher')
      }
    });

    const switcher = wrapper.findComponent(LocaleSwitcher);
    expect(switcher.exists()).toBe(true);

    const select = switcher.find('[data-testid="select-locale-switcher"]');
    await select.setValue('en');
    await nextTick();

    expect(i18n.global.locale.value).toBe('en');
    expect(wrapper.text()).toContain('Save');
    expect(wrapper.text()).toContain('Export PDF');

    await select.setValue('pt_br');
    await nextTick();

    expect(i18n.global.locale.value).toBe('pt_br');
    expect(wrapper.text()).toContain('Salvar');

    wrapper.unmount();
  });

  it('Deve permitir que o usuário adicione sua própria versão de idioma via addLocale/adicionarIdioma ou prop localeMessages/mensagensIdioma', async () => {
    adicionarIdioma('es', {
      barraSuperior: {
        salvar: 'Guardar Plantilla',
        exportarPdf: 'Exportar a PDF',
        preVisualizar: 'Vista Previa'
      },
      painelInserir: {
        inserir: 'Insertar',
        fundo: 'Fondo de Hoja'
      }
    });

    expect(obterIdiomasDisponiveis()).toContain('es');
    expect(getAvailableLocales()).toContain('es');

    const wrapper = mount(TemplateStudioEditor, {
      props: {
        modelValue: createEmptyTemplate('Plantilla'),
        locale: 'es',
        localeMessages: {
          jp: {
            barraSuperior: {
              salvar: '保存する',
              exportarPdf: 'PDF出力'
            }
          }
        }
      }
    });

    await nextTick();
    expect(wrapper.text()).toContain('Guardar Plantilla');
    expect(wrapper.text()).toContain('Exportar a PDF');
    expect(wrapper.text()).toContain('Insertar');

    // Alterna para o idioma 'jp' enviado via prop localeMessages
    setLocale('jp');
    await nextTick();

    expect(wrapper.text()).toContain('保存する');
    expect(wrapper.text()).toContain('PDF出力');

    // Testa também addLocale em inglês
    addLocale('fr', {
      barraSuperior: {
        salvar: 'Enregistrer'
      }
    });
    definirIdioma('fr');
    await nextTick();
    expect(wrapper.text()).toContain('Enregistrer');

    wrapper.unmount();
  });

  it('Deve funcionar com os componentes e props 100% em inglês (TemplateStudioEditor e TemplateStudioViewer)', async () => {
    const tpl = createEmptyTemplate('English API Test');
    const editor = mount(TemplateStudioEditor, {
      props: {
        modelValue: tpl,
        locale: 'en',
        theme: 'light',
        allowCustomVariables: true,
        showLocaleSwitcher: false,
        availableVariables: [
          {
            key: 'recipient_name',
            label: '+ Recipient',
            layerName: 'Recipient Name',
            previewValue: 'Jane Doe'
          }
        ],
        labels: {
          save: 'Save Template'
        }
      }
    });

    expect(editor.find('.vc-estudio').classes()).toContain('is-light');
    expect(editor.findComponent(LocaleSwitcher).exists()).toBe(false);
    expect(editor.text()).toContain('Save Template');
    expect(editor.text()).toContain('+ Recipient');
    expect(editor.find('[data-testid="input-nova-variavel"]').exists()).toBe(true);

    // Clica na variável definida com chaves em inglês (key, label, previewValue)
    const chip = editor.find('.vc-dock-esq .vc-grid-2 .vc-chip');
    await chip.trigger('click');
    await nextTick();

    expect(editor.emitted('variables-changed')?.slice(-1)[0]?.[0]).toEqual(['recipient_name']);
    expect(editor.find('.vc-conteudo-texto').text()).toBe('{{recipient_name}}');

    // Ativa o modo Preview e verifica se previewValue ('Jane Doe') foi aplicado
    await editor.find('[data-testid="btn-preview"]').trigger('click');
    await nextTick();
    expect(editor.find('.vc-conteudo-texto').text()).toBe('Jane Doe');

    // Testa evento @save em inglês
    await editor.find('[data-testid="btn-salvar"]').trigger('click');
    expect(editor.emitted('save')).toBeTruthy();

    editor.unmount();

    // Testa TemplateStudioViewer / TemplateStudioViewer com props em inglês
    const viewer = mount(TemplateStudioViewer, {
      props: {
        template: tpl,
        data: { recipient_name: 'Jane Doe' },
        fileName: 'custom_output',
        generateOnMount: false,
        theme: 'light',
        locale: 'en',
        labels: {
          downloadPdf: 'Get PDF Now'
        }
      }
    });

    await nextTick();
    expect(viewer.find('.vc-visualizador').classes()).toContain('is-light');
    expect(viewer.text()).toContain('Update Preview');
    expect(viewer.text()).toContain('Get PDF Now');
    expect(viewer.text()).toContain('Generating template preview...');
    expect(viewer.emitted('variables-detected')).toBeTruthy();

    viewer.unmount();

    // Verifica que o alias antigo TemplateStudioViewer continua funcionando
    const legacyViewer = mount(TemplateStudioViewer, {
      props: {
        template: tpl,
        dados: {},
        gerarImagemAoMontar: false,
        locale: 'pt-br'
      }
    });
    await nextTick();
    expect(legacyViewer.text()).toContain('Atualizar Visualização');
    expect(legacyViewer.text()).toContain('Baixar PDF');
    legacyViewer.unmount();
  });
});
