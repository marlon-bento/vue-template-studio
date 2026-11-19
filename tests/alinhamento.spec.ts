/*
========
Suíte de testes do gerenciador de alinhamento, quadrado 3x3 e medição Alt estilo Figma (tests/alinhamento.spec.ts).
Valida posicionamento explícito nos 9 pontos da folha A4, detecção da posição ativa na grade 3x3,
alinhamento por eixo, alinhamento interno do texto nos 9 pontos da caixa e retas/tracejados em L do Alt.
========
*/
import { describe, it, expect } from 'vitest';
import {
  DIMENSOES_A4,
  POSICOES_GRADE_3X3,
  alinharCamadaNaGrade3x3Folha,
  alinharCamadaNoEixoFolha,
  alinharTextoNaGrade3x3Caixa,
  calcularMedidasAltFigma,
  criarCamadaTexto,
  detectarPosicaoGrade3x3Folha,
  detectarPosicaoGrade3x3Texto,
  encontrarCamadaAlvoNoPonto
} from '../src/index';

describe('Escopo: Gerenciador de Alinhamento, Grade 3x3 e Medição Alt Estilo Figma (gerenciadorDeAlinhamento.ts)', () => {
  const dim = DIMENSOES_A4.landscape;

  it('Deve posicionar a camada corretamente em todos os 9 pontos do quadrado 3x3 da folha A4', () => {
    const camada = criarCamadaTexto({
      texto: 'Teste 3x3',
      nome: 'Camada',
      ehVariavel: false,
      orientacao: 'landscape'
    });
    camada.largura = 200;
    camada.altura = 100;

    expect(alinharCamadaNaGrade3x3Folha(camada, 'topo-esquerda', dim)).toBe(true);
    expect(camada.x).toBe(0);
    expect(camada.y).toBe(0);
    expect(detectarPosicaoGrade3x3Folha(camada, dim)).toBe('topo-esquerda');

    expect(alinharCamadaNaGrade3x3Folha(camada, 'centro', dim)).toBe(true);
    expect(camada.x).toBe(Math.round((dim.largura - 200) / 2));
    expect(camada.y).toBe(Math.round((dim.altura - 100) / 2));
    expect(detectarPosicaoGrade3x3Folha(camada, dim)).toBe('centro');

    expect(alinharCamadaNaGrade3x3Folha(camada, 'base-direita', dim)).toBe(true);
    expect(camada.x).toBe(dim.largura - 200);
    expect(camada.y).toBe(dim.altura - 100);
    expect(detectarPosicaoGrade3x3Folha(camada, dim)).toBe('base-direita');

    expect(alinharCamadaNaGrade3x3Folha(camada, 'meio-esquerda', dim)).toBe(true);
    expect(camada.x).toBe(0);
    expect(camada.y).toBe(Math.round((dim.altura - 100) / 2));
    expect(detectarPosicaoGrade3x3Folha(camada, dim)).toBe('meio-esquerda');
  });

  it('Deve alinhar nos 6 eixos rápidos e respeitar camadas bloqueadas', () => {
    const camada = criarCamadaTexto({
      texto: 'Bloqueio',
      nome: 'Camada',
      ehVariavel: false,
      orientacao: 'landscape'
    });
    camada.bloqueada = true;

    expect(alinharCamadaNoEixoFolha(camada, 'esquerda', dim)).toBe(false);
    expect(alinharCamadaNaGrade3x3Folha(camada, 'topo-esquerda', dim)).toBe(false);

    camada.bloqueada = false;
    expect(alinharCamadaNoEixoFolha(camada, 'direita', dim)).toBe(true);
    expect(camada.x).toBe(dim.largura - camada.largura);

    expect(alinharCamadaNoEixoFolha(camada, 'base', dim)).toBe(true);
    expect(camada.y).toBe(dim.altura - camada.altura);
  });

  it('Deve alinhar o texto internamente nos 9 pontos da caixa pelo quadrado 3x3 do Figma', () => {
    const camada = criarCamadaTexto({
      texto: 'Caixa Figma',
      nome: 'Texto',
      ehVariavel: false,
      orientacao: 'landscape'
    });

    expect(POSICOES_GRADE_3X3).toHaveLength(9);
    expect(detectarPosicaoGrade3x3Texto(camada)).toBe('centro');

    expect(alinharTextoNaGrade3x3Caixa(camada, 'topo-esquerda')).toBe(true);
    expect(camada.alinhamento).toBe('left');
    expect(camada.alinhamentoVertical).toBe('top');
    expect(detectarPosicaoGrade3x3Texto(camada)).toBe('topo-esquerda');

    expect(alinharTextoNaGrade3x3Caixa(camada, 'base-direita')).toBe(true);
    expect(camada.alinhamento).toBe('right');
    expect(camada.alinhamentoVertical).toBe('bottom');
    expect(detectarPosicaoGrade3x3Texto(camada)).toBe('base-direita');
  });

  it('Deve calcular retas sólidas e extensões tracejadas em L quando os elementos não estão na mesma linha/coluna (estilo Figma)', () => {
    const camSelecionada = criarCamadaTexto({
      texto: 'Selecionada',
      nome: 'Vermelha',
      ehVariavel: false,
      orientacao: 'landscape'
    });
    camSelecionada.x = 352;
    camSelecionada.y = 318;
    camSelecionada.largura = 152;
    camSelecionada.altura = 89;

    const camAlvo = criarCamadaTexto({
      texto: 'Alvo',
      nome: 'AcimaEsquerda',
      ehVariavel: false,
      orientacao: 'landscape'
    });
    camAlvo.x = 100;
    camAlvo.y = 80;
    camAlvo.largura = 200;
    camAlvo.altura = 120;

    const res = calcularMedidasAltFigma(camSelecionada, dim, camAlvo);
    expect(res.alvoId).toBe(camAlvo.id);
    expect(res.esquerda).toBe(52);
    expect(res.topo).toBe(118);

    const solidas = res.linhas.filter((l) => l.tipo === 'h' || l.tipo === 'v');
    const tracejadas = res.linhas.filter((l) => l.tipo === 'aux');
    expect(solidas).toHaveLength(2);
    expect(tracejadas).toHaveLength(2);

    const auxV = tracejadas.find((l) => l.orientacao === 'v');
    expect(auxV?.x).toBe(300);
    expect(auxV?.y).toBe(200);

    const auxH = tracejadas.find((l) => l.orientacao === 'h');
    expect(auxH?.x).toBe(300);
    expect(auxH?.y).toBe(200);
  });

  it('Deve encontrar corretamente a camada sob o cursor via encontrarCamadaAlvoNoPonto ignorando a selecionada', () => {
    const fundo = criarCamadaTexto({
      texto: 'A',
      nome: 'Fundo',
      ehVariavel: false,
      orientacao: 'landscape'
    });
    fundo.x = 50;
    fundo.y = 50;
    fundo.largura = 500;
    fundo.altura = 500;

    const selecionada = criarCamadaTexto({
      texto: 'B',
      nome: 'Sel',
      ehVariavel: false,
      orientacao: 'landscape'
    });
    selecionada.x = 100;
    selecionada.y = 100;
    selecionada.largura = 200;
    selecionada.altura = 80;

    const achada = encontrarCamadaAlvoNoPonto([fundo, selecionada], 150, 120, selecionada.id);
    expect(achada?.id).toBe(fundo.id);
  });
});
