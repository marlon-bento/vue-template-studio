/*
========
Suíte de testes do motor de renderização Canvas 2D e exportação PDF/PNG (tests/certificado.spec.ts).
Valida ausência de variáveis hardcoded na biblioteca, montagem de dados de visualização enviados pelo
cliente, criação/clone/importação/exportação JSON de templates, renderização de camadas e exportação PDF.
========
*/
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DIMENSOES_A4,
  VARIAVEIS_PADRAO,
  criarTemplateVazio,
  duplicarTemplate,
  exportarTemplateJson,
  globalCertificadoOptions,
  importarTemplateJson,
  montarDadosVisualizacao,
  renderizarParaCanvas2D,
  useCertificado
} from '../src/index';
import {
  instalarMockCanvas2D,
  instalarMockImage,
  resetarEstadoCertificado
} from './helpers';

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

describe('Escopo: Motor Canvas 2D, Templates, Variáveis do Cliente e Exportação (gerenciadorDeCertificado.ts)', () => {
  beforeEach(() => {
    resetarEstadoCertificado();
    vi.clearAllMocks();
  });

  it('Não deve possuir variáveis de domínio (aluno/professor) nem dados de preview hardcoded na biblioteca', () => {
    expect(VARIAVEIS_PADRAO).toEqual([]);
    expect(globalCertificadoOptions.value.variaveisDisponiveis).toEqual([]);
    expect(globalCertificadoOptions.value.dadosPreview).toEqual({});

    const dadosMontados = montarDadosVisualizacao(
      [
        { chave: 'participante', rotulo: '+ Participante', valorVisualizacao: 'Ana Beatriz' },
        { chave: 'evento', rotulo: '+ Evento', valorPadrao: 'Congresso Vue 3' }
      ],
      { carga: '20h' }
    );

    expect(dadosMontados).toEqual({
      participante: 'Ana Beatriz',
      evento: 'Congresso Vue 3',
      carga: '20h'
    });
  });

  it('Deve criar, duplicar, exportar e importar templates JSON com segurança', () => {
    const original = criarTemplateVazio('Certificado Vue 3', 'portrait');
    expect(original.orientacao).toBe('portrait');
    expect(original.camadas).toEqual([]);

    const copia = duplicarTemplate(original);
    expect(copia.id).not.toBe(original.id);
    expect(copia.nome).toBe('Certificado Vue 3 (Cópia)');

    const json = exportarTemplateJson(original);
    const importado = importarTemplateJson(json);
    expect(importado.nome).toBe('Certificado Vue 3');
    expect(importado.orientacao).toBe('portrait');

    expect(() => importarTemplateJson('{"invalido": true}')).toThrow();
    expect(() => importarTemplateJson('nao-eh-json')).toThrow();
  });

  it('Deve renderizar fundo, moldura, imagem e texto com quebra de palavras longas no Canvas 2D', async () => {
    const ctx = instalarMockCanvas2D();
    instalarMockImage({ width: 1200, height: 800 });

    const tpl = criarTemplateVazio('Conclusão', 'landscape');
    tpl.fundoCor = '#f8fafc';
    tpl.fundoImagem = 'data:image/png;base64,FUNDO';

    tpl.camadas.push(
      {
        id: 'oculta',
        tipo: 'texto',
        nome: 'Oculta',
        x: 0,
        y: 0,
        largura: 200,
        altura: 50,
        opacidade: 100,
        rotacao: 0,
        visivel: false,
        bloqueada: false,
        texto: 'NAO_DEVE_RENDERIZAR'
      },
      {
        id: 'forma-1',
        tipo: 'forma',
        nome: 'Moldura',
        x: 40,
        y: 40,
        largura: 1043,
        altura: 714,
        opacidade: 90,
        rotacao: 0,
        visivel: true,
        bloqueada: false,
        semPreenchimento: false,
        corPreenchimento: '#ffffff',
        corBorda: '#3b82f6',
        espessuraBorda: 4,
        raioBorda: 10
      },
      {
        id: 'img-1',
        tipo: 'imagem',
        nome: 'Logo',
        x: 100,
        y: 80,
        largura: 120,
        altura: 120,
        opacidade: 100,
        rotacao: 15,
        visivel: true,
        bloqueada: false,
        src: 'https://exemplo.com/logo.png',
        ajusteImagem: 'cover',
        raioImagem: 12
      },
      {
        id: 'txt-1',
        tipo: 'variavel',
        nome: 'Aluno',
        x: 100,
        y: 300,
        largura: 120,
        altura: 80,
        opacidade: 100,
        rotacao: 0,
        visivel: true,
        bloqueada: false,
        texto: 'Olá {{nome_aluno}}\nSuperPalavraGiganteSemEspacosParaQuebrar',
        tamanhoFonte: 24,
        negrito: true,
        italico: true,
        sublinhado: true,
        alinhamento: 'center'
      }
    );

    const canvas = await renderizarParaCanvas2D(tpl, { nome_aluno: 'Márlon' }, 2);

    expect(canvas.width).toBe(DIMENSOES_A4.landscape.largura * 2);
    expect(canvas.height).toBe(DIMENSOES_A4.landscape.altura * 2);
    expect(ctx.scale).toHaveBeenCalledWith(2, 2);
    expect(ctx.drawImage).toHaveBeenCalledTimes(2);
    expect(ctx.rotate).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();

    const textosDesenhados = ctx.fillText.mock.calls.map((c) => c[0]);
    expect(textosDesenhados).not.toContain('NAO_DEVE_RENDERIZAR');
    expect(textosDesenhados.some((t: string) => t.includes('Márlon'))).toBe(true);
    expect(textosDesenhados.length).toBeGreaterThan(2);
  });

  it('Deve gerar pacote de exportação PNG + PDF com nome sanitizado e disparar downloads', async () => {
    instalarMockCanvas2D();
    const createObjectURL = vi.fn(() => 'blob:mock-url');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

    const { gerarImagemPreview, gerarPacoteExportacao, baixarPdf, baixarImagem } = useCertificado({
      escalaExportacao: 2
    });

    const tpl = criarTemplateVazio('Certificado Conclusão 2026', 'landscape');
    const previewUrl = await gerarImagemPreview(tpl, {});
    expect(previewUrl).toBe('data:image/png;base64,MOCKPNGDATA==');

    const pacote = await gerarPacoteExportacao(tpl, {});
    expect(pacote.nomeArquivo).toBe('certificado_conclusao_2026.pdf');
    expect(pacote.pdfBlob).toBeInstanceOf(Blob);
    expect(pacote.imagemBlob).toBeInstanceOf(Blob);

    baixarPdf(pacote);
    baixarImagem(pacote);
    expect(createObjectURL).toHaveBeenCalledTimes(2);
  });
});
