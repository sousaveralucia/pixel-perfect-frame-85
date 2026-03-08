import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { useAccountManager } from '@/hooks/useAccountManager';
import { useTradeJournalUnified } from '@/hooks/useTradeJournalUnified';

interface TradeWithChecklist {
  id: string;
  date: string;
  asset: string;
  entryPrice: string;
  exitPrice: string;
  result: 'WIN' | 'LOSS' | 'BREAK_EVEN';
  notes: string;
  createdAt: number;
}

interface AssetStats {
  asset: string;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPips: number;
  avgPips: number;
}

export default function AssetPerformanceAnalysis() {
  const { activeAccountId } = useAccountManager();
  const { trades } = useTradeJournalUnified(activeAccountId);

  const assetStats = useMemo(() => {
    const stats: Record<string, AssetStats> = {};

    trades.forEach((trade) => {
      if (!stats[trade.asset]) {
        stats[trade.asset] = {
          asset: trade.asset,
          totalTrades: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          totalPips: 0,
          avgPips: 0,
        };
      }

      const pips = (parseFloat(trade.exitPrice) - parseFloat(trade.entryPrice)) * 10000;
      stats[trade.asset].totalTrades += 1;
      stats[trade.asset].totalPips += pips;

      if (trade.result === 'WIN') {
        stats[trade.asset].wins += 1;
      } else if (trade.result === 'LOSS') {
        stats[trade.asset].losses += 1;
      }
    });

    // Calcular taxa de acerto e pips médios
    Object.keys(stats).forEach((asset) => {
      const stat = stats[asset];
      stat.winRate = stat.totalTrades > 0 ? (stat.wins / stat.totalTrades) * 100 : 0;
      stat.avgPips = stat.totalTrades > 0 ? stat.totalPips / stat.totalTrades : 0;
    });

    return Object.values(stats).sort((a, b) => b.totalTrades - a.totalTrades);
  }, [trades]);

  const chartData = useMemo(() => {
    return assetStats.map((stat) => ({
      asset: stat.asset,
      'Taxa de Acerto (%)': parseFloat(stat.winRate.toFixed(1)),
      'Pips Totais': Math.round(stat.totalPips),
      'Pips Médios': parseFloat(stat.avgPips.toFixed(2)),
    }));
  }, [assetStats]);

  if (trades.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Nenhum trade registrado ainda. Comece a registrar seus trades para ver a análise de performance!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Ativos Operados</p>
            <p className="text-3xl font-bold text-blue-600">{assetStats.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Taxa de Acerto Média</p>
            <p className="text-3xl font-bold text-green-600">
              {assetStats.length > 0
                ? (assetStats.reduce((sum, s) => sum + s.winRate, 0) / assetStats.length).toFixed(1)
                : '0'}
              %
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total de Pips</p>
            <p className="text-3xl font-bold text-purple-600">
              {Math.round(assetStats.reduce((sum, s) => sum + s.totalPips, 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Combined Chart - Win Rate + Pips */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Ativo (Taxa de Acerto + Pips)</CardTitle>
          <CardDescription>Comparação de taxa de acerto (%) e pips totais por ativo</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="asset" />
              <YAxis yAxisId="left" label={{ value: 'Taxa de Acerto (%)', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Pips', angle: 90, position: 'insideRight' }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="Taxa de Acerto (%)" fill="#3b82f6" />
              <Line yAxisId="right" type="monotone" dataKey="Pips Totais" stroke="#8b5cf6" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas Detalhadas por Ativo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Ativo</th>
                  <th className="text-center py-2 px-2">Total</th>
                  <th className="text-center py-2 px-2">Vitórias</th>
                  <th className="text-center py-2 px-2">Derrotas</th>
                  <th className="text-center py-2 px-2">Taxa (%)</th>
                  <th className="text-center py-2 px-2">Pips Total</th>
                  <th className="text-center py-2 px-2">Pips Médios</th>
                </tr>
              </thead>
              <tbody>
                {assetStats.map((stat) => (
                  <tr key={stat.asset} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2 font-semibold">{stat.asset}</td>
                    <td className="text-center py-2 px-2">{stat.totalTrades}</td>
                    <td className="text-center py-2 px-2 text-green-600">{stat.wins}</td>
                    <td className="text-center py-2 px-2 text-red-600">{stat.losses}</td>
                    <td className="text-center py-2 px-2 font-semibold">{stat.winRate.toFixed(1)}%</td>
                    <td className={`text-center py-2 px-2 font-semibold ${stat.totalPips >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.round(stat.totalPips)}
                    </td>
                    <td className={`text-center py-2 px-2 ${stat.avgPips >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.avgPips.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
