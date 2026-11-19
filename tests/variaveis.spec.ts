/*
========
Suíte de testes de variáveis dinâmicas, IDs e sanitização (tests/variaveis.spec.ts).
========
*/
import { describe, it, expect } from 'vitest';
import {
  resolverVariaveisTexto,
  extrairVariaveisTemplate,
  normalizarNomeVariavel,
  sanitizarNomeArquivo,
  gerarId,
  criarTemplateVazio
} from '../src/index';

describe('Escopo: Variáveis Dinâmicas e Utilitários (variaveis.ts)', () => {
  it('Deve substituir todas as variáveis {{chave}} quando aplicarSubstituicao=true', () => {
    const texto = 'Certificamos que {{nome_aluno}} concluiu {{curso}} com {{carga_horaria}}.';
    const resultado = resolverVariaveisTexto(texto, {
      nome_aluno: 'Maria Clara',
      curso: 'Vue 3 Avançado',
      carga_horaria: '60 horas'
    });

    expect(resultado).toBe('Certificamos que Maria Clara concluiu Vue 3 Avançado com 60 horas.');
  });

  it('Deve preservar placeholders quando aplicarSubstituicao=false ou quando valor estiver ausente/vazio', () => {
    const texto = 'Aluno: {{nome_aluno}} - Código: {{codigo_validacao}}';

    expect(resolverVariaveisTexto(texto, { nome_aluno: 'João' }, false)).toBe(texto);
    expect(resolverVariaveisTexto(texto, { nome_aluno: 'João', codigo_validacao: '' }, true)).toBe(
      'Aluno: João - Código: {{codigo_validacao}}'
    );
  });

  it('Deve aceitar valores numéricos inclusive 0 nas variáveis', () => {
    const texto = 'Nota: {{nota}} | Faltas: {{faltas}}';
    expect(resolverVariaveisTexto(texto, { nota: 10, faltas: 0 })).toBe('Nota: 10 | Faltas: 0');
  });

  it('Deve extrair variáveis únicas de todas as camadas do template', () => {
    const tpl = criarTemplateVazio();
    tpl.camadas.push(
      {
        id: 'c1',
        tipo: 'variavel',
        nome: 'Aluno',
        x: 0,
        y: 0,
        largura: 100,
        altura: 40,
        opacidade: 100,
        rotacao: 0,
        visivel: true,
        bloqueada: false,
        texto: '{{nome_aluno}} participou de {{curso}}'
      },
      {
        id: 'c2',
        tipo: 'texto',
        nome: 'Repetida',
        x: 0,
        y: 50,
        largura: 100,
        altura: 40,
        opacidade: 100,
        rotacao: 0,
        visivel: true,
        bloqueada: false,
        texto: 'Aluno: {{nome_aluno}} em {{data_emissao}}'
      },
      {
        id: 'c3',
        tipo: 'forma',
        nome: 'Moldura',
        x: 0,
        y: 0,
        largura: 200,
        altura: 200,
        opacidade: 100,
        rotacao: 0,
        visivel: true,
        bloqueada: false
      }
    );

    expect(extrairVariaveisTemplate(tpl)).toEqual(['nome_aluno', 'curso', 'data_emissao']);
  });

  it('Deve normalizar nomes de variáveis removendo acentos e caracteres inválidos', () => {
    expect(normalizarNomeVariavel('  Nome Completo! ')).toBe('Nome_Completo');
    expect(normalizarNomeVariavel('ção_teste@2026')).toBe('cao_teste_2026');
    expect(normalizarNomeVariavel('   ')).toBe('');
  });

  it('Deve sanitizar nomes de arquivos removendo acentos e mantendo caracteres seguros', () => {
    expect(sanitizarNomeArquivo('Certificado de Conclusão - Maria')).toBe(
      'certificado_de_conclusao_maria'
    );
    expect(sanitizarNomeArquivo('!!!')).toBe('certificado');
  });

  it('Deve gerar IDs únicos com o prefixo informado', () => {
    const id1 = gerarId('cam');
    const id2 = gerarId('cam');
    expect(id1.startsWith('cam_')).toBe(true);
    expect(id1).not.toBe(id2);
  });
});
