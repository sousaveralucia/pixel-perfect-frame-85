import { useCallback } from 'react';

interface Trade {
  id: string;
  date: string;
  asset: string;
  entry: number;
  exit: number;
  result: 'Vitória' | 'Derrota' | 'Empate';
  notes: string;
  operationalChecks?: Record<string, boolean>;
  emotionalChecks?: Record<string, boolean>;
  rationalChecks?: Record<string, boolean>;
}

export function useExportTrades() {
  const exportToCSV = useCallback((trades: Trade[], filters?: { startDate?: string; endDate?: string; asset?: string }) => {
    // Filtrar trades
    let filteredTrades = [...trades];

    if (filters?.startDate) {
      filteredTrades = filteredTrades.filter((t) => new Date(t.date) >= new Date(filters.startDate!));
    }
    if (filters?.endDate) {
      filteredTrades = filteredTrades.filter((t) => new Date(t.date) <= new Date(filters.endDate!));
    }
    if (filters?.asset) {
      filteredTrades = filteredTrades.filter((t) => t.asset === filters.asset);
    }

    // Calcular pips
    const tradesWithPips = filteredTrades.map((trade) => ({
      ...trade,
      pips: Math.round((trade.exit - trade.entry) * 10000),
    }));

    // Criar CSV
    const headers = ['Data', 'Ativo', 'Entrada', 'Saída', 'Pips', 'Resultado', 'Notas'];
    const rows = tradesWithPips.map((trade) => [
      new Date(trade.date).toLocaleDateString('pt-BR'),
      trade.asset,
      trade.entry.toFixed(4),
      trade.exit.toFixed(4),
      trade.pips,
      trade.result,
      trade.notes.replace(/"/g, '""'), // Escapar aspas duplas
    ]);

    // Construir CSV
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `trades_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  return { exportToCSV };
}
