/*
========
Suíte de testes da fábrica de componentes SVG (tests/svg-factory.spec.ts).
Valida a conversão de strings SVG em componentes funcionais Vue via buildIcons,
preservação e mesclagem de classes/atributos dinâmicos, fallback para SVG inválido
e integridade da árvore centralizada de ícones (svgs).
========
*/
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { buildIcons, svgs } from '../src/index';

describe('Escopo: Fábrica de Ícones SVG (svgFactory.ts e svgs.ts)', () => {
  it('Deve converter a árvore de strings svgs em componentes funcionais renderizáveis', () => {
    const icons = buildIcons(svgs);

    expect(typeof icons.topBar.undo).toBe('function');
    expect(typeof icons.topBar.exportPdf).toBe('function');
    expect(typeof icons.panel.chevronRight).toBe('function');
    expect(typeof icons.insert.qrCode).toBe('function');
    expect(typeof icons.actions.trash).toBe('function');
    expect(typeof icons.align.sheetCenterH).toBe('function');
    expect(typeof icons.stage.grid).toBe('function');
    expect(typeof icons.viewer.refresh).toBe('function');

    const Host = defineComponent({
      setup() {
        return { IconeFoto: icons.insert.image };
      },
      template: '<div class="host"><component :is="IconeFoto" class="classe-extra" width="18" height="18" /></div>'
    });

    const wrapper = mount(Host);

    const svgEl = wrapper.find('svg');
    expect(svgEl.exists()).toBe(true);
    expect(svgEl.classes()).toContain('icon-tabler-photo');
    expect(svgEl.classes()).toContain('classe-extra');
    expect(svgEl.attributes('width')).toBe('18');
    expect(svgEl.attributes('height')).toBe('18');
    expect(svgEl.findAll('path').length).toBeGreaterThan(0);
  });

  it('Deve renderizar fallback visual de erro quando receber uma string SVG inválida', () => {
    const iconsInvalidos = buildIcons({
      quebrado: '<div>nao-eh-svg</div>'
    });

    const Host = defineComponent({
      setup() {
        return { IconeQuebrado: iconsInvalidos.quebrado };
      },
      template: '<div class="host"><component :is="IconeQuebrado" /></div>'
    });

    const wrapper = mount(Host);
    expect(wrapper.find('svg').exists()).toBe(false);
    expect(wrapper.find('span').text()).toBe('Icon Error');
  });
});
