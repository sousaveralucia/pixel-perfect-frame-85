/**
 * Utilitário para exportação de dados em formato Excel (estilizado)
 * Usa xlsx-js-style que preserva estilos de células (fonte, cor, borda, fill).
 * Suporta: Trades, Análises (relatório rico multi-aba) e Relatórios Completos.
 */
import * as XLSX from 'xlsx-js-style';

// ===== Helpers de estilo =====

type CellValue = string | number | boolean | null;

function applyHeaderStyle(ws: XLSX.WorkSheet, headerRow: number, colCount: number) {
  for (let c = 0; c < colCount; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: headerRow, c });
    if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
    ws[cellRef].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11, name: 'Calibri' },
      fill: { patternType: 'solid', fgColor: { rgb: '10B981' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: '0F766E' } },
        bottom: { style: 'thin', color: { rgb: '0F766E' } },
        left: { style: 'thin', color: { rgb: '0F766E' } },
        right: { style: 'thin', color: { rgb: '0F766E' } },
      },
    };
  }
}

function applyDataStyles(ws: XLSX.WorkSheet, startRow: number, endRow: number, colCount: number) {
  for (let r = startRow; r <= endRow; r++) {
    const isAlt = (r - startRow) % 2 === 1;
    for (let c = 0; c < colCount; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
      ws[cellRef].s = {
        font: { sz: 10, color: { rgb: '0F172A' }, name: 'Calibri' },
        fill: isAlt
          ? { patternType: 'solid', fgColor: { rgb: 'F1F5F9' } }
          : { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
        alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
        border: {
          bottom: { style: 'hair', color: { rgb: 'CBD5E1' } },
        },
      };
    }
  }
}

function applyTitleRow(ws: XLSX.WorkSheet, row: number, title: string, colCount: number) {
  const cellRef = XLSX.utils.encode_cell({ r: row, c: 0 });
  ws[cellRef] = { v: title, t: 's' };
  ws[cellRef].s = {
    font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
    fill: { patternType: 'solid', fgColor: { rgb: '0F172A' } },
    alignment: { horizontal: 'left', vertical: 'center' },
  };
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: row, c: 0 }, e: { r: row, c: colCount - 1 } });
  if (!ws['!rows']) ws['!rows'] = [];
  ws['!rows'][row] = { hpt: 26 };
}

function applySectionRow(ws: XLSX.WorkSheet, row: number, title: string, colCount: number) {
  const cellRef = XLSX.utils.encode_cell({ r: row, c: 0 });
  ws[cellRef] = { v: title, t: 's' };
  ws[cellRef].s = {
    font: { bold: true, sz: 12, color: { rgb: '10B981' }, name: 'Calibri' },
    fill: { patternType: 'solid', fgColor: { rgb: 'ECFDF5' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: { bottom: { style: 'medium', color: { rgb: '10B981' } } },
  };
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: row, c: 0 }, e: { r: row, c: colCount - 1 } });
  if (!ws['!rows']) ws['!rows'] = [];
  ws['!rows'][row] = { hpt: 22 };
}

function applyKpiPair(ws: XLSX.WorkSheet, row: number, col: number) {
  const labelRef = XLSX.utils.encode_cell({ r: row, c: col });
  const valueRef = XLSX.utils.encode_cell({ r: row, c: col + 1 });
  if (ws[labelRef]) {
    ws[labelRef].s = {
      font: { bold: true, sz: 10, color: { rgb: '334155' }, name: 'Calibri' },
      fill: { patternType: 'solid', fgColor: { rgb: 'F8FAFC' } },
      alignment: { horizontal: 'left', vertical: 'center' },
      border: { bottom: { style: 'hair', color: { rgb: 'CBD5E1' } } },
    };
  }
  if (ws[valueRef]) {
    ws[valueRef].s = {
      font: { bold: true, sz: 11, color: { rgb: '0F172A' }, name: 'Calibri' },
      fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'right', vertical: 'center' },
      border: { bottom: { style: 'hair', color: { rgb: 'CBD5E1' } } },
    };
  }
}

// ===== Exporters =====

interface ExcelExportOptions {
  filename: string;
  sheetName: string;
  headers: string[];
  data: CellValue[][];
  columnWidths?: number[];
  title?: string;
}

export function exportToExcel(options: ExcelExportOptions): void {
  const titleOffset = options.title ? 2 : 0;
  const allRows: CellValue[][] = [];

  if (options.title) {
    allRows.push([options.title]);
    allRows.push([]);
  }
  allRows.push(options.headers as CellValue[]);
  allRows.push(...options.data);

  const ws = XLSX.utils.aoa_to_sheet(allRows);

  if (options.columnWidths) {
    ws['!cols'] = options.columnWidths.map((width) => ({ wch: width }));
  }

  if (options.title) applyTitleRow(ws, 0, options.title, options.headers.length);
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

  const data = trades.map((trade) => [
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

  const totalResult = data.reduce((sum, row) => sum + (Number(row[6]) || 0), 0);
  const wins = data.filter((r) => String(r[8]).toUpperCase().includes('WIN') || String(r[8]).includes('Vitória')).length;
  const losses = data.filter((r) => String(r[8]).toUpperCase().includes('LOSS') || String(r[8]).includes('Derrota')).length;

  data.push([]);
  data.push(['RESUMO', '', '', '', '', '', '', '', '', '']);
  data.push(['Total Trades', trades.length, '', '', '', '', `$${totalResult.toFixed(2)}`, '', '', '']);
  data.push(['Vitórias', wins, '', 'Derrotas', losses, '', 'Win Rate', trades.length > 0 ? `${((wins / trades.length) * 100).toFixed(1)}%` : '0%', '', '']);

  exportToExcel({
    filename: `trades_${new Date().toISOString().split('T')[0]}.xlsx`,
    sheetName: 'Trades',
    title: '📊 Relatório de Trades',
    headers,
    data,
    columnWidths: [12, 12, 12, 12, 12, 12, 14, 12, 12, 30],
  });
}

/**
 * Exporta análises para Excel — RELATÓRIO RICO MULTI-ABA
 * Estrutura espelha o PDF: Resumo + KPIs + Detalhamento + Por Ativo + Por Status.
 */
export function exportAnalysesToExcel(analyses: any[]): void {
  const wb = XLSX.utils.book_new();
  const today = new Date().toLocaleDateString('pt-BR');

  const total = analyses.length;
  const active = analyses.filter((a) => a.status === 'ATIVO').length;
  const tested = analyses.filter((a) => a.status === 'TESTADO').length;
  const discarded = analyses.filter((a) => a.status === 'DESCARTADO').length;
  const successRate = tested + discarded > 0 ? (tested / (tested + discarded)) * 100 : 0;

  // ===== ABA 1: RESUMO =====
  const summaryRows: CellValue[][] = [
    ['📈 Relatório de Análises de Mercado'],
    [`Gerado em ${today}`],
    [],
    ['VISÃO GERAL'],
    ['Métrica', 'Valor'],
    ['Total de Análises', total],
    ['Análises Ativas', active],
    ['Análises Testadas', tested],
    ['Análises Descartadas', discarded],
    ['Taxa de Acerto (Testadas/Resolvidas)', `${successRate.toFixed(1)}%`],
    [],
    ['DISTRIBUIÇÃO POR ATIVO'],
    ['Ativo', 'Quantidade', 'Ativas', 'Testadas', 'Descartadas'],
  ];

  const byAsset = new Map<string, { total: number; active: number; tested: number; discarded: number }>();
  for (const a of analyses) {
    const key = a.asset || '—';
    const cur = byAsset.get(key) || { total: 0, active: 0, tested: 0, discarded: 0 };
    cur.total++;
    if (a.status === 'ATIVO') cur.active++;
    if (a.status === 'TESTADO') cur.tested++;
    if (a.status === 'DESCARTADO') cur.discarded++;
    byAsset.set(key, cur);
  }
  for (const [asset, s] of byAsset) {
    summaryRows.push([asset, s.total, s.active, s.tested, s.discarded]);
  }
  summaryRows.push([]);
  summaryRows.push(['DISTRIBUIÇÃO POR TIMEFRAME']);
  summaryRows.push(['Timeframe', 'Quantidade']);

  const byTf = new Map<string, number>();
  for (const a of analyses) byTf.set(a.timeframe || '—', (byTf.get(a.timeframe || '—') || 0) + 1);
  for (const [tf, n] of byTf) summaryRows.push([tf, n]);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 32 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];

  // Estilos do resumo
  applyTitleRow(wsSummary, 0, summaryRows[0][0] as string, 5);
  // subtítulo
  const subRef = XLSX.utils.encode_cell({ r: 1, c: 0 });
  if (wsSummary[subRef]) {
    wsSummary[subRef].s = {
      font: { italic: true, sz: 10, color: { rgb: '64748B' }, name: 'Calibri' },
      alignment: { horizontal: 'left' },
    };
    if (!wsSummary['!merges']) wsSummary['!merges'] = [];
    wsSummary['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 4 } });
  }

  // Seção VISÃO GERAL (linha 3)
  applySectionRow(wsSummary, 3, 'VISÃO GERAL', 5);
  applyHeaderStyle(wsSummary, 4, 2);
  for (let r = 5; r <= 9; r++) applyKpiPair(wsSummary, r, 0);

  // Seção POR ATIVO (linha 11)
  applySectionRow(wsSummary, 11, 'DISTRIBUIÇÃO POR ATIVO', 5);
  applyHeaderStyle(wsSummary, 12, 5);
  const assetEnd = 12 + byAsset.size;
  if (byAsset.size > 0) applyDataStyles(wsSummary, 13, assetEnd, 5);

  // Seção POR TIMEFRAME
  const tfTitleRow = assetEnd + 2;
  applySectionRow(wsSummary, tfTitleRow, 'DISTRIBUIÇÃO POR TIMEFRAME', 5);
  applyHeaderStyle(wsSummary, tfTitleRow + 1, 2);
  if (byTf.size > 0) applyDataStyles(wsSummary, tfTitleRow + 2, tfTitleRow + 1 + byTf.size, 2);

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');

  // ===== ABA 2: ANÁLISES DETALHADAS =====
  const detailHeaders = [
    'Data', 'Ativo', 'Timeframe', 'Status', 'Nível Fibonacci',
    'Nível Order Block', 'Zona de Liquidez', 'Notas',
  ];
  const detailTitle: CellValue[] = ['📋 Análises Detalhadas'];
  const detailData = analyses.map((a) => [
    a.date || '',
    a.asset || '',
    a.timeframe || '',
    a.status || '',
    a.fibonacciLevel || '',
    a.orderBlockLevel || '',
    a.liquidityZone || '',
    a.notes || '',
  ]);

  const detailRows: CellValue[][] = [detailTitle, [], detailHeaders, ...detailData];
  const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);
  wsDetail['!cols'] = [
    { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 14 },
    { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 40 },
  ];
  applyTitleRow(wsDetail, 0, detailTitle[0] as string, detailHeaders.length);
  applyHeaderStyle(wsDetail, 2, detailHeaders.length);
  if (detailData.length > 0) {
    applyDataStyles(wsDetail, 3, 2 + detailData.length, detailHeaders.length);
    // Pinta a coluna Status
    for (let r = 3; r <= 2 + detailData.length; r++) {
      const ref = XLSX.utils.encode_cell({ r, c: 3 });
      const status = String(wsDetail[ref]?.v || '');
      const color = status === 'ATIVO' ? '16A34A' : status === 'TESTADO' ? 'D97706' : status === 'DESCARTADO' ? 'DC2626' : '334155';
      if (wsDetail[ref]) {
        wsDetail[ref].s = {
          ...(wsDetail[ref].s || {}),
          font: { bold: true, sz: 10, color: { rgb: color }, name: 'Calibri' },
          alignment: { horizontal: 'center', vertical: 'center' },
        };
      }
    }
  }
  // Freeze header
  wsDetail['!freeze'] = { xSplit: 0, ySplit: 3 };
  wsDetail['!autofilter'] = { ref: `A3:${XLSX.utils.encode_cell({ r: 2 + detailData.length, c: detailHeaders.length - 1 })}` };

  XLSX.utils.book_append_sheet(wb, wsDetail, 'Análises');

  XLSX.writeFile(wb, `relatorio_analises_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Exporta relatório completo com múltiplas abas (estilizado)
 */
export function exportCompleteReportToExcel(summary: any, trades: any[], analyses: any[]): void {
  const summaryRows: CellValue[][] = [
    ['📊 RESUMO DO RELATÓRIO'],
    [],
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
  wsSummary['!cols'] = [{ wch: 28 }, { wch: 22 }];
  applyTitleRow(wsSummary, 0, summaryRows[0][0] as string, 2);
  applyHeaderStyle(wsSummary, 2, 2);
  for (let r = 3; r < summaryRows.length; r++) applyKpiPair(wsSummary, r, 0);

  const tradeHeaders = ['Data', 'Ativo', 'Entrada', 'SL', 'TP', 'Saída', 'Resultado ($)', 'Sessão', 'Status'];
  const tradesData = trades.map((t) => [
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
  const tradeRows: CellValue[][] = [['📊 Trades'], [], tradeHeaders, ...tradesData];
  const wsTrades = XLSX.utils.aoa_to_sheet(tradeRows);
  wsTrades['!cols'] = Array(9).fill(null).map(() => ({ wch: 14 }));
  applyTitleRow(wsTrades, 0, '📊 Trades', 9);
  applyHeaderStyle(wsTrades, 2, 9);
  if (tradesData.length > 0) applyDataStyles(wsTrades, 3, 2 + tradesData.length, 9);

  const analysisHeaders = ['Data', 'Ativo', 'Timeframe', 'Fibonacci', 'Order Block', 'Zona Liquidez', 'Status', 'Notas'];
  const analysesData = analyses.map((a) => [
    a.date || '', a.asset || '', a.timeframe || '', a.fibonacciLevel || '',
    a.orderBlockLevel || '', a.liquidityZone || '', a.status || '', a.notes || '',
  ]);
  const analysisRows: CellValue[][] = [['📈 Análises'], [], analysisHeaders, ...analysesData];
  const wsAnalyses = XLSX.utils.aoa_to_sheet(analysisRows);
  wsAnalyses['!cols'] = [
    { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 20 },
    { wch: 20 }, { wch: 20 }, { wch: 14 }, { wch: 30 },
  ];
  applyTitleRow(wsAnalyses, 0, '📈 Análises', 8);
  applyHeaderStyle(wsAnalyses, 2, 8);
  if (analysesData.length > 0) applyDataStyles(wsAnalyses, 3, 2 + analysesData.length, 8);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');
  XLSX.utils.book_append_sheet(wb, wsTrades, 'Trades');
  XLSX.utils.book_append_sheet(wb, wsAnalyses, 'Análises');

  XLSX.writeFile(wb, `relatorio_completo_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Exporta dados genéricos para CSV (com BOM UTF-8 para Excel reconhecer acentos)
 */
export function exportToCSV(
  filename: string,
  headers: string[],
  data: (string | number)[][],
  summaryLines?: string[][],
): void {
  const BOM = '\uFEFF';
  const separator = ',';
  const lines: string[] = [];
  lines.push(headers.map((h) => `"${h}"`).join(separator));
  for (const row of data) {
    lines.push(row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(separator));
  }
  if (summaryLines && summaryLines.length > 0) {
    lines.push('');
    for (const line of summaryLines) {
      lines.push(line.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(separator));
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
