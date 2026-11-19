/*
========
Suíte de testes de manipulação e drag-and-drop de camadas (tests/camadas.spec.ts).
Valida o mapeamento entre a lista visual invertida (estilo Photoshop) e o array real,
movimentação relativa, criação de camadas (texto, moldura, círculo, linha, seta, imagem),
duplicação e casos de borda.
========
*/
import { describe, it, expect } from 'vitest';
import {
  criarCamadaTexto,
  criarCamadaMoldura,
  criarCamadaCirculo,
  criarCamadaLinha,
  criarCamadaSeta,
  criarCamadaImagem,
  duplicarCamada,
  moverCamadaPorId,
  reordenarCamadaListaInvertida
} from '../src/index';

describe('Escopo: Manipulação e Drag-and-Drop de Camadas (gerenciadorDeCamadas.ts)', () => {
  it('Deve reordenar camadas corretamente a partir dos índices invertidos da UI (estilo Photoshop)', () => {
    const c1 = criarCamadaTexto({ texto: 'Fundo', nome: 'Camada 1', ehVariavel: false, orientacao: 'landscape' });
    const c2 = criarCamadaTexto({ texto: 'Meio', nome: 'Camada 2', ehVariavel: false, orientacao: 'landscape' });
    const c3 = criarCamadaTexto({ texto: 'Topo', nome: 'Camada 3', ehVariavel: false, orientacao: 'landscape' });

    const camadas = [c1, c2, c3];

    // Arrasta Camada 1 (índice visual 2) para o topo (índice visual 0)
    const alterou = reordenarCamadaListaInvertida(camadas, 2, 0);
    expect(alterou).toBe(true);
    expect(camadas.map((c) => c.nome)).toEqual(['Camada 2', 'Camada 3', 'Camada 1']);

    // Arrasta Camada 1 (agora no topo, índice visual 0) para o meio (índice visual 1)
    const alterou2 = reordenarCamadaListaInvertida(camadas, 0, 1);
    expect(alterou2).toBe(true);
    expect(camadas.map((c) => c.nome)).toEqual(['Camada 2', 'Camada 1', 'Camada 3']);
  });

  it('Deve ignorar reordenação quando índices são iguais ou fora dos limites', () => {
    const c1 = criarCamadaMoldura('landscape');
    const c2 = criarCamadaImagem('data:image/png;base64,abc', 'Logo', 'landscape');
    const camadas = [c1, c2];

    expect(reordenarCamadaListaInvertida(camadas, 0, 0)).toBe(false);
    expect(reordenarCamadaListaInvertida(camadas, -1, 1)).toBe(false);
    expect(reordenarCamadaListaInvertida(camadas, 0, 5)).toBe(false);
    expect(reordenarCamadaListaInvertida([c1], 0, 0)).toBe(false);
  });

  it('Deve mover camadas por ID (+1, -1, frente, tras) e respeitar limites', () => {
    const c1 = criarCamadaTexto({ texto: 'A', nome: 'A', ehVariavel: false, orientacao: 'landscape' });
    const c2 = criarCamadaTexto({ texto: 'B', nome: 'B', ehVariavel: false, orientacao: 'landscape' });
    const c3 = criarCamadaTexto({ texto: 'C', nome: 'C', ehVariavel: false, orientacao: 'landscape' });
    const camadas = [c1, c2, c3];

    expect(moverCamadaPorId(camadas, c1.id, 'frente')).toBe(true);
    expect(camadas.map((c) => c.nome)).toEqual(['B', 'C', 'A']);

    expect(moverCamadaPorId(camadas, c1.id, 'frente')).toBe(false);
    expect(moverCamadaPorId(camadas, c1.id, 'tras')).toBe(true);
    expect(camadas.map((c) => c.nome)).toEqual(['A', 'B', 'C']);

    expect(moverCamadaPorId(camadas, c2.id, 1)).toBe(true);
    expect(camadas.map((c) => c.nome)).toEqual(['A', 'C', 'B']);

    expect(moverCamadaPorId(camadas, 'id-inexistente', 1)).toBe(false);
  });

  it('Deve criar camadas de círculo, linha e seta centralizadas na folha A4 e duplicar corretamente', () => {
    const circulo = criarCamadaCirculo('portrait');
    const linha = criarCamadaLinha('portrait');
    const seta = criarCamadaSeta('portrait', 'esquerda');

    expect(circulo.tipo).toBe('circulo');
    expect(linha.tipo).toBe('linha');
    expect(seta.tipo).toBe('seta');
    expect(seta.pontaSeta).toBe('esquerda');

    const copia = duplicarCamada(circulo);
    expect(copia.id).not.toBe(circulo.id);
    expect(copia.nome).toBe('Círculo (Cópia)');
    expect(copia.x).toBe(circulo.x + 20);
    expect(copia.y).toBe(circulo.y + 20);
  });
});
