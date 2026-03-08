import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useAccountManager } from "@/hooks/useAccountManager";
import { useTradeJournalUnified } from "@/hooks/useTradeJournalUnified";

interface Trade {
  id: string;
  date: string;
  asset: string;
  entryPrice: string;
  exitPrice: string;
  result: "WIN" | "LOSS" | "BREAK_EVEN" | "ONGOING";
  riskReward?: number;
  account: string;
}

export function EquityAndPerformanceCharts() {
  const { activeAccountId } = useAccountManager();

  // Carregar trades do localStorage
  const trades = useMemo(() => {
    const saved = localStorage.getItem(`trades_enhanced_${activeAccountId}`);
    return saved ? JSON.parse(saved) : [];
  }, [activeAccountId]);

  // Calcular dados de patrimônio (equity curve)
  const equityData = useMemo(() => {
    if (trades.length === 0) return [];

    const sortedTrades = [...trades].sort((a: Trade, b: Trade) => a.date.localeCompare(b.date));
    let cumulativeResult = 0;
    const data: { date: string; equity: number }[] = [];

    sortedTrades.forEach((trade: Trade) => {
      const entryPrice = parseFloat(trade.entryPrice);
      const exitPrice = parseFloat(trade.exitPrice);
      const pips = Math.abs(exitPrice - entryPrice);

      if (trade.result === "WIN") {
        cumulativeResult += pips;
      } else if (trade.result === "LOSS") {
        cumulativeResult -= pips;
      }

      data.push({
        date: trade.date,
        equity: cumulativeResult,
      });
    });

    return data;
  }, [trades]);

  // Calcular dados de desempenho diário
  const dailyPerformanceData = useMemo(() => {
    if (trades.length === 0) return [];

    const dailyResults: { [key: string]: { result: number; trades: number } } = {};

    trades.forEach((trade: Trade) => {
      if (!dailyResults[trade.date]) {
        dailyResults[trade.date] = { result: 0, trades: 0 };
      }

      const entryPrice = parseFloat(trade.entryPrice);
      const exitPrice = parseFloat(trade.exitPrice);
      const pips = Math.abs(exitPrice - entryPrice);

      if (trade.result === "WIN") {
        dailyResults[trade.date].result += pips;
      } else if (trade.result === "LOSS") {
        dailyResults[trade.date].result -= pips;
      }

      dailyResults[trade.date].trades++;
    });

    return Object.entries(dailyResults)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        result: data.result,
        trades: data.trades,
      }));
  }, [trades]);

  return (
    <div className="space-y-6">
      {/* Equity Curve */}
      <Card>
        <CardHeader>
          <CardTitle>Gráfico de Patrimônio (Equity Curve)</CardTitle>
          <CardDescription>Evolução do saldo acumulado ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          {equityData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum dado de trades para exibir
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={equityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  interval={Math.floor(equityData.length / 10)}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => (typeof value === 'number' ? value.toFixed(2) : value)}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="equity"
                  stroke="#0066cc"
                  dot={false}
                  strokeWidth={2}
                  name="Saldo Acumulado (pips)"
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Daily Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Desempenho Diário</CardTitle>
          <CardDescription>Resultado de cada dia de operação</CardDescription>
        </CardHeader>
        <CardContent>
          {dailyPerformanceData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum dado de trades para exibir
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  interval={Math.floor(dailyPerformanceData.length / 10)}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => (typeof value === 'number' ? value.toFixed(2) : value)}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Legend />
                <Bar
                  dataKey="result"
                  fill="#0066cc"
                  name="Resultado Diário (pips)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
