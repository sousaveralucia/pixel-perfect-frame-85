import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, Zap } from "lucide-react";
import { useAccountManager } from "@/hooks/useAccountManager";


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

interface TradingDashboardProps {
  activeAccountId?: string;
}

export function TradingDashboard({ activeAccountId: propAccountId }: TradingDashboardProps = {}) {
  const { activeAccountId: hookAccountId } = useAccountManager();
  const activeAccountId = propAccountId || hookAccountId;

  // Carregar trades do localStorage
  const trades = useMemo(() => {
    const saved = localStorage.getItem(`trades_enhanced_${activeAccountId}`);
    return saved ? JSON.parse(saved) : [];
  }, [activeAccountId]);

  // Calcular KPIs
  const kpis = useMemo(() => {
    if (trades.length === 0) {
      return {
        totalResult: 0,
        winRate: 0,
        totalOperations: 0,
        totalRR: 0,
        grossProfit: 0,
        grossLoss: 0,
        netResult: 0,
      };
    }

    const wins = trades.filter((t: Trade) => t.result === "WIN").length;
    const losses = trades.filter((t: Trade) => t.result === "LOSS").length;
    const breakEven = trades.filter((t: Trade) => t.result === "BREAK_EVEN").length;

    // Calcular resultado em dinheiro
    let totalResult = 0;
    let grossProfit = 0;
    let grossLoss = 0;

    trades.forEach((trade: Trade) => {
      const moneyResult = (trade as any).moneyResult || 0;

      if (trade.result === "WIN") {
        totalResult += moneyResult;
        grossProfit += moneyResult;
      } else if (trade.result === "LOSS") {
        totalResult += moneyResult;
        grossLoss += moneyResult;
      }
    });

    const totalRR = trades.reduce((sum: number, trade: Trade) => sum + (trade.riskReward || 0), 0);
    const winRate = (wins / trades.length) * 100;

    return {
      totalResult,
      winRate: winRate.toFixed(1),
      totalOperations: trades.length,
      totalRR,
      grossProfit,
      grossLoss,
      netResult: totalResult,
    };
  }, [trades]);

  return (
    <div className="space-y-6">
      {/* KPIs Grid - Compacto */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {/* Resultado Total */}
        <Card className={kpis.netResult > 0 ? "border-l-2 border-l-green-500" : kpis.netResult < 0 ? "border-l-2 border-l-red-500" : "border-l-2 border-l-gray-500"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className={`text-lg font-bold ${kpis.netResult > 0 ? "text-green-600" : kpis.netResult < 0 ? "text-red-600" : "text-gray-600"}`}>
              {kpis.netResult > 0 ? "+" : ""}
              {kpis.netResult.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">dólares</p>
          </CardContent>
        </Card>

        {/* Taxa de Acerto */}
        <Card className="border-l-2 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Target className="w-3 h-3" />
              Acerto
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg font-bold text-blue-600">{kpis.winRate}%</div>
            <p className="text-xs text-muted-foreground mt-0.5">vitórias</p>
          </CardContent>
        </Card>

        {/* Total de Operações */}
        <Card className="border-l-2 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Ops
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg font-bold text-purple-600">{kpis.totalOperations}</div>
            <p className="text-xs text-muted-foreground mt-0.5">trades</p>
          </CardContent>
        </Card>

        {/* R:R Total */}
        <Card className={kpis.totalRR > 0 ? "border-l-2 border-l-green-500" : "border-l-2 border-l-red-500"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Zap className="w-3 h-3" />
              R:R
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className={`text-lg font-bold ${kpis.totalRR > 0 ? "text-green-600" : "text-red-600"}`}>
              {kpis.totalRR > 0 ? "+" : ""}
              {kpis.totalRR}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">risco:ret</p>
          </CardContent>
        </Card>

        {/* Lucro Bruto */}
        <Card className="border-l-2 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Ganho
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg font-bold text-green-600">+{kpis.grossProfit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-0.5">ganhos</p>
          </CardContent>
        </Card>

        {/* Prejuízo Bruto */}
        <Card className="border-l-2 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              Perda
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-lg font-bold text-red-600">{kpis.grossLoss.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-0.5">perdas</p>
          </CardContent>
        </Card>
      </div>

      {/* Desempenho por Dia da Semana */}
      <Card>
        <CardHeader>
          <CardTitle>Desempenho por Dia da Semana</CardTitle>
          <CardDescription>Análise de resultados por dia operado</CardDescription>
        </CardHeader>
        <CardContent>
          <DayOfWeekSummary trades={trades} />
        </CardContent>
      </Card>

      {/* Resumo Semanal */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Semanal</CardTitle>
          <CardDescription>Análise de trades por semana</CardDescription>
        </CardHeader>
        <CardContent>
          <WeeklySummary trades={trades} />
        </CardContent>
      </Card>
    </div>
  );
}

function DayOfWeekSummary({ trades }: { trades: Trade[] }) {
  const daysOfWeek = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

  const dayStats = useMemo(() => {
    const stats: { [key: number]: { trades: number; wins: number; losses: number; result: number } } = {};

    for (let i = 0; i < 7; i++) {
      stats[i] = { trades: 0, wins: 0, losses: 0, result: 0 };
    }

    trades.forEach((trade: Trade) => {
      const date = new Date(trade.date);
      const dayOfWeek = date.getDay();

      stats[dayOfWeek].trades++;
      const moneyResult = (trade as any).moneyResult || 0;
      stats[dayOfWeek].result += moneyResult;

      if (trade.result === "WIN") {
        stats[dayOfWeek].wins++;
      } else if (trade.result === "LOSS") {
        stats[dayOfWeek].losses++;
      }
    });

    return stats;
  }, [trades]);

  return (
    <div className="space-y-3">
      {daysOfWeek.map((day, idx) => {
        const stat = dayStats[idx];
        if (stat.trades === 0) {
          return (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">{day}</span>
              <span className="text-sm text-muted-foreground">Sem operações</span>
            </div>
          );
        }

        const winRate = ((stat.wins / stat.trades) * 100).toFixed(0);
        return (
          <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <span className="font-medium">{day}</span>
              <p className="text-xs text-muted-foreground">
                {stat.trades} trade(s) | {winRate}% acerto
              </p>
            </div>
            <div className={`font-bold ${stat.result > 0 ? "text-green-600" : stat.result < 0 ? "text-red-600" : "text-gray-600"}`}>
              {stat.result > 0 ? "+" : ""}
              {stat.result.toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeeklySummary({ trades }: { trades: Trade[] }) {
  const weeklySummary = useMemo(() => {
    const weeks: { [key: string]: { trades: number; wins: number; losses: number; result: number; days: number } } = {};

    trades.forEach((trade: Trade) => {
      const date = new Date(trade.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];

      if (!weeks[weekKey]) {
        weeks[weekKey] = { trades: 0, wins: 0, losses: 0, result: 0, days: 0 };
      }

      weeks[weekKey].trades++;
      const moneyResult = (trade as any).moneyResult || 0;
      weeks[weekKey].result += moneyResult;

      if (trade.result === "WIN") {
        weeks[weekKey].wins++;
      } else if (trade.result === "LOSS") {
        weeks[weekKey].losses++;
      }
    });

    // Contar dias operados por semana
    Object.keys(weeks).forEach((weekKey) => {
      const daysInWeek = new Set<string>();
      trades.forEach((trade: Trade) => {
        const date = new Date(trade.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const key = weekStart.toISOString().split("T")[0];
        if (key === weekKey) {
          daysInWeek.add(trade.date);
        }
      });
      weeks[weekKey].days = daysInWeek.size;
    });

    return Object.entries(weeks)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 10);
  }, [trades]);

  return (
    <div className="space-y-3">
      {weeklySummary.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">Nenhum trade registrado</p>
      ) : (
        weeklySummary.map(([weekKey, stat]) => {
          const winRate = ((stat.wins / stat.trades) * 100).toFixed(0);
          const weekDate = new Date(weekKey);
          const weekEnd = new Date(weekDate);
          weekEnd.setDate(weekDate.getDate() + 6);
          const weekLabel = `${weekDate.toLocaleDateString("pt-BR")} - ${weekEnd.toLocaleDateString("pt-BR")}`;

          return (
            <div key={weekKey} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200" style={{backgroundColor: '#000000'}}>
              <div>
                <span className="font-medium">{weekLabel}</span>
                <p className="text-xs text-muted-foreground">
                  {stat.trades} trade(s) | {stat.days} dia(s) | {winRate}% acerto
                </p>
              </div>
              <div className={`font-bold ${stat.result > 0 ? "text-green-600" : stat.result < 0 ? "text-red-600" : "text-gray-600"}`}>
                {stat.result > 0 ? "+" : ""}
                {stat.result.toFixed(2)}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
