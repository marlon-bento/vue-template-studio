/*
========
Suíte de testes do sistema de histórico Desfazer/Refazer (tests/historico.spec.ts).
Valida Ctrl+Z / Ctrl+Y, descarte de ramo futuro, limite de memória e isolamento de objetos.
========
*/
import { describe, it, expect } from 'vitest';
import { useHistorico } from '../src/index';

describe('Escopo: Histórico Desfazer/Refazer (useHistorico.ts)', () => {
  it('Deve iniciar com estado base sem permitir desfazer ou refazer', () => {
    const hist = useHistorico<{ valor: number }>(10);
    hist.iniciar({ valor: 1 });

    expect(hist.podeDesfazer.value).toBe(false);
    expect(hist.podeRefazer.value).toBe(false);
    expect(hist.tamanho.value).toBe(1);
    expect(hist.desfazer()).toBeNull();
    expect(hist.refazer()).toBeNull();
  });

  it('Deve registrar alterações, desfazer e refazer corretamente', () => {
    const hist = useHistorico<{ nome: string }>(10);
    hist.iniciar({ nome: 'v1' });
    hist.registrar({ nome: 'v2' });
    hist.registrar({ nome: 'v3' });

    expect(hist.podeDesfazer.value).toBe(true);
    expect(hist.podeRefazer.value).toBe(false);

    expect(hist.desfazer()).toEqual({ nome: 'v2' });
    expect(hist.podeRefazer.value).toBe(true);

    expect(hist.desfazer()).toEqual({ nome: 'v1' });
    expect(hist.podeDesfazer.value).toBe(false);

    expect(hist.refazer()).toEqual({ nome: 'v2' });
    expect(hist.refazer()).toEqual({ nome: 'v3' });
    expect(hist.podeRefazer.value).toBe(false);
  });

  it('Deve ignorar estados consecutivos idênticos e descartar ramo futuro ao registrar após desfazer', () => {
    const hist = useHistorico<{ passo: number }>(10);
    hist.iniciar({ passo: 1 });
    hist.registrar({ passo: 1 }); // idêntico -> ignorado
    expect(hist.tamanho.value).toBe(1);

    hist.registrar({ passo: 2 });
    hist.registrar({ passo: 3 });
    hist.desfazer(); // volta para 2

    hist.registrar({ passo: 4 }); // descarta o 3
    expect(hist.podeRefazer.value).toBe(false);
    expect(hist.tamanho.value).toBe(3);
    expect(hist.desfazer()).toEqual({ passo: 2 });
  });

  it('Deve respeitar o limiteMaximo descartando estados mais antigos sem quebrar o índice', () => {
    const hist = useHistorico<{ n: number }>(3);
    hist.iniciar({ n: 1 });
    hist.registrar({ n: 2 });
    hist.registrar({ n: 3 });
    hist.registrar({ n: 4 });

    expect(hist.tamanho.value).toBe(3);
    expect(hist.desfazer()).toEqual({ n: 3 });
    expect(hist.desfazer()).toEqual({ n: 2 });
    expect(hist.podeDesfazer.value).toBe(false);
  });

  it('Deve isolar referências e permitir limpar o histórico', () => {
    const hist = useHistorico<{ lista: string[] }>(10);
    const obj = { lista: ['a'] };
    hist.iniciar(obj);
    obj.lista.push('b');
    hist.registrar(obj);

    const restaurado = hist.desfazer();
    expect(restaurado).toEqual({ lista: ['a'] });
    restaurado?.lista.push('mutacao-externa');
    expect(hist.refazer()).toEqual({ lista: ['a', 'b'] });

    hist.limpar();
    expect(hist.tamanho.value).toBe(0);
    expect(hist.podeDesfazer.value).toBe(false);
    expect(hist.podeRefazer.value).toBe(false);
  });
});
