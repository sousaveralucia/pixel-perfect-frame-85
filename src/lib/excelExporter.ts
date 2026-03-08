/**
 * Utilitário para exportação de dados em formato Excel
 * Suporta: Trades, Análises e Relatórios Completos
 */
import * as XLSX from 'xlsx';

interface ExcelExportOptions {
  filename: string;
  sheetName: string;
  headers: string[];
  data: (string | number | boolean | null)[][];
  columnWidths?: number[];
}

export function exportToExcel(options: ExcelExportOptions): void {
  const ws = XLSX.utils.aoa_to_sheet([options.headers, ...options.data]);

  if (options.columnWidths) {
    ws['!cols'] = options.columnWidths.map(width => ({ wch: width }));
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, options.sheetName);
  XLSX.writeFile(wb, options.filename);
}

/**
 * Exporta trades para Excel
 */
export function exportTradesToExcel(trades: any[]): void {
  const headers = [
    'Data', 'Ativo', 'Timeframe', 'Preço Entrada', 'Stop Loss',
    'Take Profit', 'Preço Saída', 'Resultado (R$)', 'Resultado (%)',
    'Sessão', 'Status', 'Notas',
  ];

  const data = trades.map(trade => [
    trade.date || '',
    trade.asset || '',
    trade.timeframe || '',
    trade.entryPrice || '',
    trade.stopLoss || '',
    trade.takeProfit || '',
    trade.exitPrice || '',
    trade.resultValue || trade.moneyResult || '',
    trade.resultPercent || '',
    trade.session || '',
    trade.result || trade.status || '',
    trade.notes || '',
  ]);

  exportToExcel({
    filename: `trades_${new Date().toISOString().split('T')[0]}.xlsx`,
    sheetName: 'Trades',
    headers,
    data,
    columnWidths: [12, 12, 10, 12, 12, 12, 12, 12, 12, 12, 12, 20],
  });
}

/**
 * Exporta análises para Excel
 */
export function exportAnalysesToExcel(analyses: any[]): void {
  const headers = [
    'Data', 'Ativo', 'Timeframe', 'Nível Fibonacci',
    'Nível Order Block', 'Zona de Liquidez', 'Notas', 'Status',
  ];

  const data = analyses.map(analysis => [
    analysis.date || '',
    analysis.asset || '',
    analysis.timeframe || '',
    analysis.fibonacciLevel || '',
    analysis.orderBlockLevel || '',
    analysis.liquidityZone || '',
    analysis.notes || '',
    analysis.status || '',
  ]);

  exportToExcel({
    filename: `analises_${new Date().toISOString().split('T')[0]}.xlsx`,
    sheetName: 'Análises',
    headers,
    data,
    columnWidths: [12, 12, 10, 20, 20, 20, 30, 12],
  });
}

/**
 * Exporta relatório completo com múltiplas abas
 */
export function exportCompleteReportToExcel(
  summary: any,
  trades: any[],
  analyses: any[]
): void {
  // ===== ABA 1: RESUMO =====
  const summaryData = [
    ['RESUMO DO RELATÓRIO'],
    [''],
    ['Período', summary.period || ''],
    ['Total de Trades', summary.totalTrades || 0],
    ['Trades Vencedores', summary.winningTrades || 0],
    ['Trades Perdedores', summary.losingTrades || 0],
    ['Taxa de Acerto (%)', summary.winRate || 0],
    ['Ganho Total (R$)', summary.totalGain || 0],
    ['Perda Total (R$)', summary.totalLoss || 0],
    ['Lucro Líquido (R$)', summary.netProfit || 0],
    ['Risco:Retorno', summary.riskReward || 0],
    ['Maior Ganho (R$)', summary.maxGain || 0],
    ['Maior Perda (R$)', summary.maxLoss || 0],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }];

  // ===== ABA 2: TRADES =====
  const tradeHeaders = [
    'Data', 'Ativo', 'Timeframe', 'Entrada', 'SL', 'TP',
    'Saída', 'Resultado (R$)', 'Resultado (%)', 'Sessão', 'Status',
  ];

  const tradesData = trades.map(t => [
    t.date || '',
    t.asset || '',
    t.timeframe || '',
    t.entryPrice || '',
    t.stopLoss || '',
    t.takeProfit || '',
    t.exitPrice || '',
    t.resultValue || t.moneyResult || '',
    t.resultPercent || '',
    t.session || '',
    t.result || t.status || '',
  ]);

  const wsTrades = XLSX.utils.aoa_to_sheet([tradeHeaders, ...tradesData]);
  wsTrades['!cols'] = Array(11).fill(null).map(() => ({ wch: 12 }));

  // ===== ABA 3: ANÁLISES =====
  const analysisHeaders = [
    'Data', 'Ativo', 'Timeframe', 'Fibonacci',
    'Order Block', 'Zona Liquidez', 'Notas', 'Status',
  ];

  const analysesData = analyses.map(a => [
    a.date || '',
    a.asset || '',
    a.timeframe || '',
    a.fibonacciLevel || '',
    a.orderBlockLevel || '',
    a.liquidityZone || '',
    a.notes || '',
    a.status || '',
  ]);

  const wsAnalyses = XLSX.utils.aoa_to_sheet([analysisHeaders, ...analysesData]);
  wsAnalyses['!cols'] = [
    { wch: 12 }, { wch: 12 }, { wch: 10 },
    { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 12 },
  ];

  // Criar workbook com múltiplas abas
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');
  XLSX.utils.book_append_sheet(wb, wsTrades, 'Trades');
  XLSX.utils.book_append_sheet(wb, wsAnalyses, 'Análises');

  XLSX.writeFile(wb, `relatorio_completo_${new Date().toISOString().split('T')[0]}.xlsx`);
}
