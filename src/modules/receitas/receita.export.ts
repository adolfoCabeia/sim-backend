import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

type ResumoFinanceiro = Awaited<ReturnType<typeof import("./receita.service.js").obterResumoFinanceiro>>;
type RankingDias = Awaited<ReturnType<typeof import("./receita.service.js").obterRankingDias>>;
type Comparacao = Awaited<ReturnType<typeof import("./receita.service.js").obterComparacaoPeriodos>>;
type RegistoReceita = {
  data: string;
  orgaoArrecadador: string;
  servicoNome: string;
  numeroDli: string | null;
  valorCobradoDli: number;
  numeroDar: string | null;
  valorPagoDar: number;
  numeroRupe: string | null;
};

function formatarKz(valor: number): string {
  return `${valor.toLocaleString("pt-AO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kz`;
}

export async function exportarReceitasExcel(params: {
  resumo: ResumoFinanceiro;
  ranking: RankingDias;
  comparacao: Comparacao;
  registos: RegistoReceita[];
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Dashboard Financeiro";
  workbook.created = new Date();

  // --- Folha de Resumo ---
  const resumoSheet = workbook.addWorksheet("Resumo");
  resumoSheet.columns = [
    { header: "Indicador", key: "indicador", width: 40 },
    { header: "Valor", key: "valor", width: 25 },
  ];
  resumoSheet.addRows([
    { indicador: "Período", valor: `${params.resumo.periodo.inicio} a ${params.resumo.periodo.fim}` },
    { indicador: "Total arrecadado", valor: formatarKz(params.resumo.totalArrecadado) },
    { indicador: "Número de operações", valor: params.resumo.numeroOperacoes },
    { indicador: "Serviço que mais arrecadou", valor: params.resumo.servicoQueMaisArrecadou?.servicoNome ?? "—" },
    { indicador: "Serviço que menos arrecadou", valor: params.resumo.servicoQueMenosArrecadou?.servicoNome ?? "—" },
    { indicador: "Dia com mais arrecadação", valor: params.resumo.diaComMaisArrecadacao ? `${params.resumo.diaComMaisArrecadacao.data} (${formatarKz(params.resumo.diaComMaisArrecadacao.totalArrecadado)})` : "—" },
    { indicador: "Dia com menos arrecadação", valor: params.resumo.diaComMenosArrecadacao ? `${params.resumo.diaComMenosArrecadacao.data} (${formatarKz(params.resumo.diaComMenosArrecadacao.totalArrecadado)})` : "—" },
    { indicador: "Comparação com período anterior", valor: `${formatarKz(params.comparacao.periodoAnterior.totalArrecadado)} → ${formatarKz(params.comparacao.periodoAtual.totalArrecadado)} (${params.comparacao.variacaoPercentual.toFixed(2)}%)` },
  ]);
  resumoSheet.getRow(1).font = { bold: true };

  // --- Folha por Serviço ---
  const servicosSheet = workbook.addWorksheet("Por Serviço");
  servicosSheet.columns = [
    { header: "Serviço", key: "servicoNome", width: 35 },
    { header: "Total Arrecadado (Kz)", key: "total", width: 22 },
    { header: "Nº Operações", key: "operacoes", width: 15 },
    { header: "Valor Médio (Kz)", key: "media", width: 20 },
    { header: "% do Total", key: "percentual", width: 15 },
  ];
  for (const s of params.resumo.porServico) {
    servicosSheet.addRow({
      servicoNome: s.servicoNome,
      total: s.totalArrecadado,
      operacoes: s.numeroOperacoes,
      media: s.valorMedioPorOperacao,
      percentual: `${s.percentualDoTotal.toFixed(2)}%`,
    });
  }
  servicosSheet.getRow(1).font = { bold: true };

  // --- Folha por Órgão Arrecadador ---
  const orgaosSheet = workbook.addWorksheet("Por Órgão Arrecadador");
  orgaosSheet.columns = [
    { header: "Órgão Arrecadador", key: "orgao", width: 35 },
    { header: "Total Arrecadado (Kz)", key: "total", width: 22 },
    { header: "Nº Operações", key: "operacoes", width: 15 },
    { header: "% do Total", key: "percentual", width: 15 },
  ];
  for (const o of params.resumo.porOrgaoArrecadador) {
    orgaosSheet.addRow({ orgao: o.orgaoArrecadador, total: o.totalArrecadado, operacoes: o.numeroOperacoes, percentual: `${o.percentualDoTotal.toFixed(2)}%` });
  }
  orgaosSheet.getRow(1).font = { bold: true };

  // --- Folha Ranking de Dias ---
  const rankingSheet = workbook.addWorksheet("Ranking de Dias");
  rankingSheet.columns = [
    { header: "Posição", key: "posicao", width: 10 },
    { header: "Data", key: "data", width: 15 },
    { header: "Total Arrecadado (Kz)", key: "total", width: 22 },
    { header: "Nº Operações", key: "operacoes", width: 15 },
  ];
  for (const r of params.ranking) {
    rankingSheet.addRow({ posicao: r.posicao, data: r.data, total: r.totalArrecadado, operacoes: r.numeroOperacoes });
  }
  rankingSheet.getRow(1).font = { bold: true };

  // --- Folha de Lançamentos (dados detalhados, tal como a tabela de introdução manual) ---
  const registosSheet = workbook.addWorksheet("Lançamentos");
  registosSheet.columns = [
    { header: "N.º", key: "numero", width: 8 },
    { header: "Órgão Arrecadador", key: "orgao", width: 30 },
    { header: "Serviço", key: "servico", width: 30 },
    { header: "Data", key: "data", width: 14 },
    { header: "N.º DLI", key: "dli", width: 18 },
    { header: "Valor Cobrado (DLI)", key: "valorDli", width: 20 },
    { header: "N.º DAR", key: "dar", width: 18 },
    { header: "Valor Pago (DAR)", key: "valorDar", width: 20 },
    { header: "N.º RUPE Paga", key: "rupe", width: 18 },
  ];
  params.registos.forEach((registo, indice) => {
    registosSheet.addRow({
      numero: indice + 1,
      orgao: registo.orgaoArrecadador,
      servico: registo.servicoNome,
      data: registo.data,
      dli: registo.numeroDli ?? "",
      valorDli: registo.valorCobradoDli,
      dar: registo.numeroDar ?? "",
      valorDar: registo.valorPagoDar,
      rupe: registo.numeroRupe ?? "",
    });
  });
  registosSheet.getRow(1).font = { bold: true };
  const totalRow = registosSheet.addRow({
    servico: "TOTAL GERAL",
    valorDli: params.registos.reduce((soma, r) => soma + r.valorCobradoDli, 0),
    valorDar: params.registos.reduce((soma, r) => soma + r.valorPagoDar, 0),
  });
  totalRow.font = { bold: true };

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export async function exportarReceitasPdf(params: {
  resumo: ResumoFinanceiro;
  ranking: RankingDias;
  comparacao: Comparacao;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("Relatório Financeiro", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor("#555").text(`Período analisado: ${params.resumo.periodo.inicio} a ${params.resumo.periodo.fim}`, { align: "center" });
    doc.fillColor("#000");
    doc.moveDown(1);

    doc.fontSize(14).text("Resumo Geral", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(11);
    doc.text(`Total arrecadado: ${formatarKz(params.resumo.totalArrecadado)}`);
    doc.text(`Número de operações: ${params.resumo.numeroOperacoes}`);
    doc.text(`Serviço que mais arrecadou: ${params.resumo.servicoQueMaisArrecadou?.servicoNome ?? "—"}`);
    doc.text(`Serviço que menos arrecadou: ${params.resumo.servicoQueMenosArrecadou?.servicoNome ?? "—"}`);
    if (params.resumo.diaComMaisArrecadacao) {
      doc.text(`Melhor dia: ${params.resumo.diaComMaisArrecadacao.data} (${formatarKz(params.resumo.diaComMaisArrecadacao.totalArrecadado)})`);
    }
    doc.moveDown(1);

    doc.fontSize(14).text("Comparação com o Período Anterior", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(11);
    doc.text(`Período anterior: ${formatarKz(params.comparacao.periodoAnterior.totalArrecadado)}`);
    doc.text(`Período actual: ${formatarKz(params.comparacao.periodoAtual.totalArrecadado)}`);
    doc.text(`Variação: ${params.comparacao.diferencaAbsoluta >= 0 ? "+" : ""}${formatarKz(params.comparacao.diferencaAbsoluta)} (${params.comparacao.variacaoPercentual.toFixed(2)}%)`);
    doc.moveDown(1);

    doc.fontSize(14).text("Resumo por Serviço", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10);
    for (const s of params.resumo.porServico) {
      doc.text(
        `${s.servicoNome} — ${formatarKz(s.totalArrecadado)} (${s.numeroOperacoes} operações, ${s.percentualDoTotal.toFixed(1)}% do total)`
      );
    }
    doc.moveDown(1);

    doc.fontSize(14).text("Ranking dos Melhores Dias", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10);
    for (const r of params.ranking.slice(0, 10)) {
      doc.text(`${r.posicao}º — ${r.data}: ${formatarKz(r.totalArrecadado)}`);
    }

    doc.end();
  });
}
