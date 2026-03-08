import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import { useAccountManager } from '@/hooks/useAccountManager';
import { useTradeJournalUnified } from '@/hooks/useTradeJournalUnified';
import { Badge } from '@/components/ui/badge';

interface DirectionalStats {
  trades: number;
  wins: number;
  pips: number;
}

interface TimeStats {
  trades: number;
  wins: number;
  pips: number;
}

interface AssetStats {
  asset: string;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPips: number;
  avgPips: number;
  totalMoney: number;
  totalRR: number;
  rrTrades: number;
  avgRR: number;
  longs: DirectionalStats;
  shorts: DirectionalStats;
  sessions: Record<string, TimeStats>;
  days: Record<number, TimeStats>;
  grade: string;
}

const getDayName = (dayIndex: number) => {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return days[dayIndex] || 'N/A';
};

const calculateGrade = (winRate: number, avgRR: number) => {
  if (winRate >= 55 && avgRR >= 1.5) return 'A';
  if (winRate >= 65 && avgRR >= 1.0) return 'A';
  if (winRate >= 50 && avgRR >= 1.2) return 'B';
  if (winRate >= 60) return 'B';
  if (winRate >= 40) return 'C';
  return 'D';
};

const getGradeColor = (grade: string) => {
  switch (grade) {
    case 'A': return 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20';
    case 'B': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20';
    case 'C': return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20';
    case 'D': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20';
    default: return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 border-gray-500/20';
  }
};

const getGradeDescription = (grade: string) => {
  switch (grade) {
    case 'A': return 'Excelente (Foque neste ativo)';
    case 'B': return 'Bom (Operável)';
    case 'C': return 'Médio (Cuidado)';
    case 'D': return 'Ruim (Evite operar)';
    default: return 'N/A';
  }
};

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
          totalMoney: 0,
          totalRR: 0,
          rrTrades: 0,
          avgRR: 0,
          longs: { trades: 0, wins: 0, pips: 0 },
          shorts: { trades: 0, wins: 0, pips: 0 },
          sessions: {},
          days: {},
          grade: 'D'
        };
      }

      const stat = stats[trade.asset];
      const entry = parseFloat(trade.entryPrice);
      const exit = parseFloat(trade.exitPrice);
      const pips = !isNaN(entry) && !isNaN(exit) ? Math.abs(exit - entry) * 10000 : 0;
      const actualPips = trade.result === 'LOSS' ? -pips : (trade.result === 'WIN' ? pips : 0);

      stat.totalTrades += 1;
      stat.totalPips += actualPips;
      
      if (trade.moneyResult) {
        stat.totalMoney += trade.moneyResult;
      }
      
      if (trade.riskReward) {
        stat.totalRR += trade.riskReward;
        stat.rrTrades += 1;
      }

      const isWin = trade.result === 'WIN';
      const isLoss = trade.result === 'LOSS';

      if (isWin) stat.wins += 1;
      else if (isLoss) stat.losses += 1;

      // Direcional (Long vs Short)
      let direction = 'NONE';
      if (!isNaN(entry) && !isNaN(exit)) {
        if (isWin) direction = exit > entry ? 'LONG' : 'SHORT';
        else if (isLoss) direction = exit < entry ? 'LONG' : 'SHORT';
      }

      if (direction === 'LONG') {
        stat.longs.trades += 1;
        stat.longs.pips += actualPips;
        if (isWin) stat.longs.wins += 1;
      } else if (direction === 'SHORT') {
        stat.shorts.trades += 1;
        stat.shorts.pips += actualPips;
        if (isWin) stat.shorts.wins += 1;
      }

      // Sessão
      const session = trade.marketSession || trade.session || 'Outra';
      if (!stat.sessions[session]) stat.sessions[session] = { trades: 0, wins: 0, pips: 0 };
      stat.sessions[session].trades += 1;
      stat.sessions[session].pips += actualPips;
      if (isWin) stat.sessions[session].wins += 1;

      // Dia da semana
      if (trade.date) {
        const dateObj = new Date(trade.date);
        const day = dateObj.getDay(); // 0 = Domingo, 1 = Segunda...
        if (!isNaN(day)) {
          if (!stat.days[day]) stat.days[day] = { trades: 0, wins: 0, pips: 0 };
          stat.days[day].trades += 1;
          stat.days[day].pips += actualPips;
          if (isWin) stat.days[day].wins += 1;
        }
      }
    });

    Object.keys(stats).forEach((asset) => {
      const stat = stats[asset];
      stat.winRate = stat.totalTrades > 0 ? (stat.wins / stat.totalTrades) * 100 : 0;
      stat.avgPips = stat.totalTrades > 0 ? stat.totalPips / stat.totalTrades : 0;
      stat.avgRR = stat.rrTrades > 0 ? stat.totalRR / stat.rrTrades : 0;
      stat.grade = calculateGrade(stat.winRate, stat.avgRR);
    });

    return Object.values(stats).sort((a, b) => b.totalTrades - a.totalTrades);
  }, [trades]);

  const chartData = useMemo(() => {
    return assetStats.map((stat) => ({
      asset: stat.asset,
      'Taxa de Acerto (%)': parseFloat(stat.winRate.toFixed(1)),
      'P/L ($)': parseFloat(stat.totalMoney.toFixed(2)),
      'R/R Médio': parseFloat(stat.avgRR.toFixed(2)),
    }));
  }, [assetStats]);

  const getBestMetric = (record: Record<string, TimeStats>) => {
    let bestKey = '-';
    let maxPips = -Infinity;
    Object.entries(record).forEach(([key, stats]) => {
      if (stats.pips > maxPips && stats.trades >= 1) { // Mínimo 1 trade para considerar "melhor"
        maxPips = stats.pips;
        bestKey = key;
      }
    });
    return { key: bestKey, pips: maxPips === -Infinity ? 0 : maxPips };
  };

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
      {/* Resumo Direto */}
      <div className="grid md:grid-cols-4 gap-4">
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
            <p className="text-sm text-muted-foreground">P/L Total Mapeado</p>
            <p className="text-3xl font-bold text-emerald-600">
              ${assetStats.reduce((sum, s) => sum + s.totalMoney, 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">R/R Médio Global</p>
            <p className="text-3xl font-bold text-purple-600">
              1:{(assetStats.length > 0
                ? (assetStats.reduce((sum, s) => sum + s.avgRR, 0) / assetStats.filter(s => s.avgRR > 0).length || 1)
                : 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance por Ativo</CardTitle>
          <CardDescription>Taxa de Acerto e R/R Médio</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="asset" />
              <YAxis yAxisId="left" label={{ value: 'Taxa de Acerto (%)', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'R/R Médio', angle: 90, position: 'insideRight' }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="Taxa de Acerto (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="R/R Médio" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Diagnóstico Profundo por Ativo</CardTitle>
          <CardDescription>Análise direcional, melhores dias, sessões e recomendação automática.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">Ativo</th>
                  <th className="text-center py-3 px-2 font-medium">Classificação</th>
                  <th className="text-center py-3 px-2 font-medium">Total / WR</th>
                  <th className="text-center py-3 px-2 font-medium">R/R Médio</th>
                  <th className="text-center py-3 px-2 font-medium">P/L Total</th>
                  <th className="text-center py-3 px-2 font-medium">Longs (WR)</th>
                  <th className="text-center py-3 px-2 font-medium">Shorts (WR)</th>
                  <th className="text-center py-3 px-2 font-medium">Melhor Dia</th>
                  <th className="text-center py-3 px-2 font-medium">Melhor Sessão</th>
                </tr>
              </thead>
              <tbody>
                {assetStats.map((stat) => {
                  const bestDay = getBestMetric(stat.days);
                  const bestSession = getBestMetric(stat.sessions);
                  
                  const longWr = stat.longs.trades > 0 ? (stat.longs.wins / stat.longs.trades * 100).toFixed(0) : '0';
                  const shortWr = stat.shorts.trades > 0 ? (stat.shorts.wins / stat.shorts.trades * 100).toFixed(0) : '0';

                  return (
                    <tr key={stat.asset} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-2 font-bold">{stat.asset}</td>
                      <td className="text-center py-3 px-2">
                        <Badge variant="outline" className={getGradeColor(stat.grade)} title={getGradeDescription(stat.grade)}>
                          Classe {stat.grade}
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-2">
                        {stat.totalTrades} <span className="text-muted-foreground text-xs">({stat.winRate.toFixed(1)}%)</span>
                      </td>
                      <td className="text-center py-3 px-2 font-medium">
                        1:{stat.avgRR.toFixed(2)}
                      </td>
                      <td className={`text-center py-3 px-2 font-semibold ${stat.totalMoney >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        ${stat.totalMoney.toFixed(2)}
                      </td>
                      <td className="text-center py-3 px-2">
                        {stat.longs.trades} <span className="text-muted-foreground text-xs">({longWr}%)</span>
                      </td>
                      <td className="text-center py-3 px-2">
                        {stat.shorts.trades} <span className="text-muted-foreground text-xs">({shortWr}%)</span>
                      </td>
                      <td className="text-center py-3 px-2">
                        {bestDay.key !== '-' ? getDayName(parseInt(bestDay.key)) : '-'}
                      </td>
                      <td className="text-center py-3 px-2">
                        {bestSession.key}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
