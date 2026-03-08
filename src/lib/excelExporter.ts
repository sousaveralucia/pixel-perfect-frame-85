/**
 * Utilitário para exportação de dados em formato Excel (estilizado)
 * Suporta: Trades, Análises e Relatórios Completos
 */
import * as XLSX from 'xlsx';

// ===== Helpers de estilo =====

function applyHeaderStyle(ws: XLSX.WorkSheet, headerRow: number, colCount: number) {
  for (let c = 0; c < colCount; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: headerRow, c });
    if (!ws[cellRef]) continue;
    ws[cellRef].s = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
      fill: { fgColor: { rgb: "10B981" } }, // emerald
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "0F766E" } },
        bottom: { style: "thin", color: { rgb: "0F766E" } },
        left: { style: "thin", color: { rgb: "0F766E" } },
        right: { style: "thin", color: { rgb: "0F766E" } },
      },
    };
  }
}

function applyDataStyles(ws: XLSX.WorkSheet, startRow: number, endRow: number, colCount: number) {
  for (let r = startRow; r <= endRow; r++) {
    const isAlt = (r - startRow) % 2 === 1;
    for (let c = 0; c < colCount; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellRef]) ws[cellRef] = { v: "", t: "s" };
      ws[cellRef].s = {
        font: { sz: 10 },
        fill: isAlt ? { fgColor: { rgb: "F1F5F9" } } : {},
        alignment: { horizontal: "left", vertical: "center", wrapText: true },
        border: {
          bottom: { style: "hair", color: { rgb: "CBD5E1" } },
        },
      };
    }
  }
}

function applyTitleRow(ws: XLSX.WorkSheet, row: number, title: string, colCount: number) {
  const cellRef = XLSX.utils.encode_cell({ r: row, c: 0 });
  ws[cellRef] = { v: title, t: "s" };
  ws[cellRef].s = {
    font: { bold: true, sz: 14, color: { rgb: "10B981" } },
    alignment: { horizontal: "left" },
  };
  // Merge title across columns
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: row, c: 0 }, e: { r: row, c: colCount - 1 } });
}

function applySummaryLabelStyle(ws: XLSX.WorkSheet, row: number, col: number) {
  const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
  if (!ws[cellRef]) return;
  ws[cellRef].s = {
    font: { bold: true, sz: 10, color: { rgb: "334155" } },
    fill: { fgColor: { rgb: "F1F5F9" } },
    alignment: { horizontal: "left" },
    border: { bottom: { style: "hair", color: { rgb: "CBD5E1" } } },
  };
}

function applySummaryValueStyle(ws: XLSX.WorkSheet, row: number, col: number) {
  const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
  if (!ws[cellRef]) return;
  ws[cellRef].s = {
    font: { sz: 10, color: { rgb: "0F172A" } },
    fill: { fgColor: { rgb: "F1F5F9" } },
    alignment: { horizontal: "right" },
    border: { bottom: { style: "hair", color: { rgb: "CBD5E1" } } },
  };
}

// ===== Exporters =====

interface ExcelExportOptions {
  filename: string;
  sheetName: string;
  headers: string[];
  data: (string | number | boolean | null)[][];
  columnWidths?: number[];
  title?: string;
}

export function exportToExcel(options: ExcelExportOptions): void {
  const titleOffset = options.title ? 2 : 0;
  const allRows: (string | number | boolean | null)[][] = [];
  
  if (options.title) {
    allRows.push([options.title]);
    allRows.push([]); // empty row
  }
  allRows.push(options.headers as any[]);
  allRows.push(...options.data);

  const ws = XLSX.utils.aoa_to_sheet(allRows);

  if (options.columnWidths) {
    ws['!cols'] = options.columnWidths.map(width => ({ wch: width }));
  }

  // Apply styles
  if (options.title) {
    applyTitleRow(ws, 0, options.title, options.headers.length);
  }
  applyHeaderStyle(ws, titleOffset, options.headers.length);
  if (options.data.length > 0) {
    applyDataStyles(ws, titleOffset + 1, titleOffset + options.data.length, options.headers.length);
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, options.sheetName);
  XLSX.writeFile(wb, options.filename);
}

/**
 * Exporta trades para Excel (estilizado)
 */
export function exportTradesToExcel(trades: any[]): void {
  const headers = [
    'Data', 'Ativo', 'Entrada', 'Stop Loss', 'Take Profit',
    'Saída', 'Resultado ($)', 'Sessão', 'Status', 'Notas',
  ];

  const data = trades.map(trade => [
    trade.date || '',
    trade.asset || '',
    trade.entryPrice || trade.entry || '',
    trade.stopLoss || '',
    trade.takeProfit || '',
    trade.exitPrice || trade.exit || '',
    trade.resultValue || trade.moneyResult || 0,
    trade.session || '',
    trade.result || trade.status || '',
    trade.notes || '',
  ]);

  // Summary row
  const totalResult = data.reduce((sum, row) => sum + (Number(row[6]) || 0), 0);
  const wins = data.filter(r => String(r[8]).toUpperCase().includes('WIN') || String(r[8]).includes('Vitória')).length;
  const losses = data.filter(r => String(r[8]).toUpperCase().includes('LOSS') || String(r[8]).includes('Derrota')).length;

  data.push([]); // empty separator
  data.push(['RESUMO', '', '', '', '', '', '', '', '', '']);
  data.push(['Total Trades', trades.length, '', '', '', '', `$${totalResult.toFixed(2)}`, '', '', '']);
  data.push(['Vitórias', wins, '', 'Derrotas', losses, '', 'Win Rate', trades.length > 0 ? `${((wins / trades.length) * 100).toFixed(1)}%` : '0%', '', '']);

  exportToExcel({
    filename: `trades_${new Date().toISOString().split('T')[0]}.xlsx`,
    sheetName: 'Trades',
    title: '📊 Relatório de Trades',
    headers,
    data,
    columnWidths: [12, 12, 12, 12, 12, 12, 14, 12, 12, 25],
  });
}

/**
 * Exporta análises para Excel (estilizado)
 */
export function exportAnalysesToExcel(analyses: any[]): void {
  const headers = [
    'Data', 'Ativo', 'Timeframe', 'Nível Fibonacci',
    'Nível Order Block', 'Zona de Liquidez', 'Status', 'Notas',
  ];

  const data = analyses.map(analysis => [
    analysis.date || '',
    analysis.asset || '',
    analysis.timeframe || '',
    analysis.fibonacciLevel || '',
    analysis.orderBlockLevel || '',
    analysis.liquidityZone || '',
    analysis.status || '',
    analysis.notes || '',
  ]);

  const active = analyses.filter(a => a.status === 'ATIVO').length;
  const tested = analyses.filter(a => a.status === 'TESTADO').length;
  const discarded = analyses.filter(a => a.status === 'DESCARTADO').length;

  data.push([]);
  data.push(['RESUMO', '', '', '', '', '', '', '']);
  data.push(['Total', analyses.length, 'Ativas', active, 'Testadas', tested, 'Descartadas', discarded]);

  exportToExcel({
    filename: `analises_${new Date().toISOString().split('T')[0]}.xlsx`,
    sheetName: 'Análises',
    title: '📈 Relatório de Análises',
    headers,
    data,
    columnWidths: [12, 12, 10, 22, 22, 22, 14, 30],
  });
}

/**
 * Exporta relatório completo com múltiplas abas (estilizado)
 */
export function exportCompleteReportToExcel(
  summary: any,
  trades: any[],
  analyses: any[]
): void {
  // ===== ABA 1: RESUMO =====
  const summaryRows = [
    ['📊 RESUMO DO RELATÓRIO'],
    [''],
    ['Métrica', 'Valor'],
    ['Período', summary.period || ''],
    ['Total de Trades', summary.totalTrades || 0],
    ['Trades Vencedores', summary.winningTrades || 0],
    ['Trades Perdedores', summary.losingTrades || 0],
    ['Taxa de Acerto (%)', summary.winRate || 0],
    ['Ganho Total ($)', summary.totalGain || 0],
    ['Perda Total ($)', summary.totalLoss || 0],
    ['Lucro Líquido ($)', summary.netProfit || 0],
    ['Risco:Retorno', summary.riskReward || 0],
    ['Maior Ganho ($)', summary.maxGain || 0],
    ['Maior Perda ($)', summary.maxLoss || 0],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }];
  applyTitleRow(wsSummary, 0, summaryRows[0][0] as string, 2);
  applyHeaderStyle(wsSummary, 2, 2);
  for (let r = 3; r < summaryRows.length; r++) {
    applySummaryLabelStyle(wsSummary, r, 0);
    applySummaryValueStyle(wsSummary, r, 1);
  }

  // ===== ABA 2: TRADES =====
  const tradeHeaders = [
    'Data', 'Ativo', 'Entrada', 'SL', 'TP',
    'Saída', 'Resultado ($)', 'Sessão', 'Status',
  ];
  const tradeTitle = ['📊 Trades'];
  const tradesData = trades.map(t => [
    t.date || '',
    t.asset || '',
    t.entryPrice || '',
    t.stopLoss || '',
    t.takeProfit || '',
    t.exitPrice || '',
    t.resultValue || t.moneyResult || '',
    t.session || '',
    t.result || t.status || '',
  ]);
  const tradeRows = [tradeTitle, [], tradeHeaders, ...tradesData];
  const wsTrades = XLSX.utils.aoa_to_sheet(tradeRows);
  wsTrades['!cols'] = Array(9).fill(null).map(() => ({ wch: 14 }));
  applyTitleRow(wsTrades, 0, tradeTitle[0], 9);
  applyHeaderStyle(wsTrades, 2, 9);
  if (tradesData.length > 0) {
    applyDataStyles(wsTrades, 3, 2 + tradesData.length, 9);
  }

  // ===== ABA 3: ANÁLISES =====
  const analysisHeaders = [
    'Data', 'Ativo', 'Timeframe', 'Fibonacci',
    'Order Block', 'Zona Liquidez', 'Status', 'Notas',
  ];
  const analysisTitle = ['📈 Análises'];
  const analysesData = analyses.map(a => [
    a.date || '',
    a.asset || '',
    a.timeframe || '',
    a.fibonacciLevel || '',
    a.orderBlockLevel || '',
    a.liquidityZone || '',
    a.status || '',
    a.notes || '',
  ]);
  const analysisRows = [analysisTitle, [], analysisHeaders, ...analysesData];
  const wsAnalyses = XLSX.utils.aoa_to_sheet(analysisRows);
  wsAnalyses['!cols'] = [
    { wch: 12 }, { wch: 12 }, { wch: 10 },
    { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 14 }, { wch: 30 },
  ];
  applyTitleRow(wsAnalyses, 0, analysisTitle[0], 8);
  applyHeaderStyle(wsAnalyses, 2, 8);
  if (analysesData.length > 0) {
    applyDataStyles(wsAnalyses, 3, 2 + analysesData.length, 8);
  }

  // Criar workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');
  XLSX.utils.book_append_sheet(wb, wsTrades, 'Trades');
  XLSX.utils.book_append_sheet(wb, wsAnalyses, 'Análises');

  XLSX.writeFile(wb, `relatorio_completo_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Exporta dados genéricos para CSV (estilizado com BOM UTF-8 e separadores)
 */
export function exportToCSV(
  filename: string,
  headers: string[],
  data: (string | number)[][],
  summaryLines?: string[][]
): void {
  const BOM = '\uFEFF'; // UTF-8 BOM para Excel reconhecer acentos
  const separator = ',';

  const lines: string[] = [];
  
  // Header
  lines.push(headers.map(h => `"${h}"`).join(separator));
  
  // Data
  for (const row of data) {
    lines.push(row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(separator));
  }

  // Summary section
  if (summaryLines && summaryLines.length > 0) {
    lines.push(''); // empty separator
    for (const line of summaryLines) {
      lines.push(line.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(separator));
    }
  }

  const csvContent = BOM + lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.setAttribute('href', URL.createObjectURL(blob));
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
