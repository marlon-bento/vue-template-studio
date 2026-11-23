/*
========
Suíte de testes automatizados para o autocompletar de variáveis em texto livre ({{)
e validação visual de badges azuis (variáveis existentes) e vermelhos (variáveis inexistentes).
========
*/
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import CampoTextoVariavel from '../src/components/editor/CampoTextoVariavel.vue';
import TemplateStudioEditor from '../src/components/TemplateStudioEditor.vue';
import { criarTemplateVazio } from '../src/composables/gerenciadorDeCertificado';
import type { VariavelCertificado } from '../src/types/certificado';

const variaveisMock: VariavelCertificado[] = [
  {
    chave: 'nome_aluno',
    rotulo: '+ Aluno',
    nomeCamada: 'Nome do Aluno',
    valorVisualizacao: 'Márlon Bento'
  },
  {
    chave: 'curso',
    rotulo: '+ Curso',
    nomeCamada: 'Curso',
    valorVisualizacao: 'Engenharia de Computação'
  },
  {
    chave: 'carga_horaria',
    rotulo: '+ Horas',
    nomeCamada: 'Carga Horária',
    valorVisualizacao: '60 horas'
  }
];

describe('CampoTextoVariavel - Autocompletar {{ e Badges Azul/Vermelho', () => {
  it('abre o menu de variáveis disponíveis ao digitar duas chaves {{', async () => {
    const wrapper = mount(CampoTextoVariavel, {
      props: {
        modelValue: '',
        variaveisDisponiveis: variaveisMock
      }
    });

    expect(wrapper.find('[data-testid="menu-sugestoes-variaveis"]').exists()).toBe(false);

    const textarea = wrapper.find('[data-testid="textarea-texto-livre"]');
    const el = textarea.element as HTMLTextAreaElement;

    el.value = 'Certificamos que {{';
    el.selectionStart = el.value.length;
    el.selectionEnd = el.value.length;
    await textarea.trigger('input');

    const menu = wrapper.find('[data-testid="menu-sugestoes-variaveis"]');
    expect(menu.exists()).toBe(true);
    expect(wrapper.find('[data-testid="opcao-variavel-nome_aluno"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="opcao-variavel-curso"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="opcao-variavel-carga_horaria"]').exists()).toBe(true);
  });

  it('filtra as opções do menu conforme o usuário digita após {{ e insere ao clicar', async () => {
    const wrapper = mount(CampoTextoVariavel, {
      props: {
        modelValue: 'Aluno: ',
        variaveisDisponiveis: variaveisMock,
        'onUpdate:modelValue': (novoValor: string) => {
          wrapper.setProps({ modelValue: novoValor });
        }
      }
    });

    const textarea = wrapper.find('[data-testid="textarea-texto-livre"]');
    const el = textarea.element as HTMLTextAreaElement;

    el.value = 'Aluno: {{cur';
    el.selectionStart = el.value.length;
    el.selectionEnd = el.value.length;
    await textarea.trigger('input');
    await nextTick();

    // Deve exibir apenas a variável 'curso' filtrada
    expect(wrapper.find('[data-testid="opcao-variavel-curso"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="opcao-variavel-nome_aluno"]').exists()).toBe(false);

    // Clica na opção 'curso' para inserir automaticamente
    await wrapper.find('[data-testid="opcao-variavel-curso"]').trigger('mousedown');
    await nextTick();

    expect(wrapper.props('modelValue')).toBe('Aluno: {{curso}}');
    expect(wrapper.find('[data-testid="menu-sugestoes-variaveis"]').exists()).toBe(false);
  });

  it('destaca de azul variáveis existentes e de vermelho variáveis que não existem', async () => {
    const wrapper = mount(CampoTextoVariavel, {
      props: {
        modelValue: 'O aluno {{nome_aluno}} concluiu {{variavel_fantasma}} no curso {{curso}}.',
        variaveisDisponiveis: variaveisMock
      }
    });

    const previewBadges = wrapper.find('[data-testid="preview-badges-variaveis"]');
    expect(previewBadges.exists()).toBe(true);

    const badgesAzuis = wrapper.findAll('[data-testid="badge-variavel-valida"]');
    const badgesVermelhos = wrapper.findAll('[data-testid="badge-variavel-invalida"]');

    expect(badgesAzuis).toHaveLength(2);
    expect(badgesAzuis[0].text()).toBe('{{nome_aluno}}');
    expect(badgesAzuis[0].classes()).toContain('vc-badge-variavel--valida');
    expect(badgesAzuis[1].text()).toBe('{{curso}}');

    expect(badgesVermelhos).toHaveLength(1);
    expect(badgesVermelhos[0].text()).toBe('{{variavel_fantasma}}');
    expect(badgesVermelhos[0].classes()).toContain('vc-badge-variavel--invalida');
  });

  it('funciona integrado dentro do TemplateStudioEditor em camadas do tipo texto', async () => {
    const templateInicial = criarTemplateVazio('Teste Editor Variaveis');
    const wrapper = mount(TemplateStudioEditor, {
      props: {
        modelValue: templateInicial,
        variaveisDisponiveis: variaveisMock
      }
    });

    // Adiciona uma camada de texto livre
    await wrapper.find('[data-testid="btn-adicionar-texto"]').trigger('click');
    await nextTick();

    const textarea = wrapper.find('[data-testid="textarea-texto-livre"]');
    expect(textarea.exists()).toBe(true);

    const el = textarea.element as HTMLTextAreaElement;
    el.value = 'Certificado para {{';
    el.selectionStart = el.value.length;
    el.selectionEnd = el.value.length;
    await textarea.trigger('input');
    await nextTick();

    // Clica na sugestão de variável dentro do inspetor do editor
    const opcaoAluno = wrapper.find('[data-testid="opcao-variavel-nome_aluno"]');
    expect(opcaoAluno.exists()).toBe(true);
    await opcaoAluno.trigger('mousedown');
    await nextTick();

    // Verifica se inseriu a variável e gerou o badge azul
    expect((textarea.element as HTMLTextAreaElement).value).toBe('Certificado para {{nome_aluno}}');
    expect(wrapper.find('[data-testid="badge-variavel-valida"]').exists()).toBe(true);
  });

  it('permite liberar edicao de texto e autocompletar {{ em camada do tipo variavel via checkbox', async () => {
    const templateInicial = criarTemplateVazio('Teste Editar Variavel');
    const wrapper = mount(TemplateStudioEditor, {
      props: {
        modelValue: templateInicial,
        variaveisDisponiveis: variaveisMock
      }
    });

    // Insere uma variavel fixa do cliente
    const chipAluno = wrapper.find('.vc-dock-esq .vc-grid-2 .vc-chip');
    await chipAluno.trigger('click');
    await nextTick();

    // Por padrao, a variavel vem travada exibindo o badge fixo
    expect(wrapper.find('[data-testid="badge-variavel-fixa"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="textarea-texto-livre"]').exists()).toBe(false);

    // Marca o checkbox para liberar digitacao na camada de variavel
    const checkbox = wrapper.find('[data-testid="checkbox-permitir-edicao-variavel"]');
    expect(checkbox.exists()).toBe(true);
    await checkbox.setValue(true);
    await nextTick();

    const textarea = wrapper.find('[data-testid="textarea-texto-livre"]');
    expect(textarea.exists()).toBe(true);
    expect((textarea.element as HTMLTextAreaElement).value).toBe('{{nome_aluno}}');

    const el = textarea.element as HTMLTextAreaElement;
    el.value = 'Aluno: {{nome_aluno}} - {{curso}}';
    el.selectionStart = el.value.length;
    el.selectionEnd = el.value.length;
    await textarea.trigger('input');
    await nextTick();

    expect(wrapper.findAll('[data-testid="badge-variavel-valida"]')).toHaveLength(2);
    expect(wrapper.findAll('[data-testid="badge-variavel-invalida"]')).toHaveLength(0);
    wrapper.unmount();
  });
});
