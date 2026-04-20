import { useMemo, memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Zap, Activity } from "lucide-react";
import { useAccountManager } from "@/hooks/useAccountManager";
import { useTradeJournalUnified } from "@/hooks/useTradeJournalUnified";

interface Trade {
  id: string;
  date: string;
  asset: string;
  result: "WIN" | "LOSS" | "BREAK_EVEN" | "ONGOING";
  riskReward?: number;
  account: string;
  moneyResult?: number;
  operational?: Record<string, unknown>;
  emotional?: Record<string, unknown>;
  routine?: Record<string, unknown>;
  rational?: Record<string, unknown>;
}

interface TradingDashboardProps {
  activeAccountId?: string;
}

function getCurrentSession(): string {
  const h = new Date().getHours();
  if (h >= 3 && h < 8) return "🇬🇧 Londres";
  if (h >= 8 && h < 12) return "🔄 Sobreposição Londres-NY";
  if (h >= 12 && h < 17) return "🗽 Nova York";
  if (h >= 17 || h < 3) return "🌏 Ásia";
  return "Fechado";
}

function calculateDisciplineScore(trade: Trade): number {
  const groups = [trade.operational, trade.emotional, trade.routine, trade.rational];
  let total = 0, marked = 0;
  groups.forEach((g) => {
    if (!g) return;
    Object.values(g).forEach((v) => {
      total++;
      if (v === true) marked++;
    });
  });
  return total > 0 ? Math.round((marked / total) * 100) : 0;
}

function TradingDashboardBase({ activeAccountId: propAccountId }: TradingDashboardProps = {}) {
  const { activeAccountId: hookAccountId } = useAccountManager();
  const activeAccountId = propAccountId || hookAccountId;
  const { trades } = useTradeJournalUnified(activeAccountId);

  const data = useMemo(() => {
    const wins = trades.filter((t: Trade) => t.result === "WIN").length;
    const totalResult = trades.reduce(
      (sum: number, t: Trade) => sum + (t.moneyResult || 0),
      0,
    );
    const winRate = trades.length > 0 ? ((wins / trades.length) * 100).toFixed(1) : "0";
    const todayKey = new Date().toISOString().split("T")[0];
    const todayTrades = trades.filter((t: Trade) => t.date === todayKey);
    const todayResult = todayTrades.reduce(
      (sum: number, t: Trade) => sum + (t.moneyResult || 0),
      0,
    );
    const recentTrades = [...trades]
      .sort((a, b) => (a.date > b.date ? -1 : 1))
      .slice(0, 5);
    const avgDiscipline =
      trades.length > 0
        ? Math.round(
            trades.reduce((s, t) => s + calculateDisciplineScore(t as Trade), 0) /
              trades.length,
          )
        : 0;
    return {
      totalResult,
      winRate,
      totalOperations: trades.length,
      todayTrades: todayTrades.length,
      todayResult,
      recentTrades,
      avgDiscipline,
    };
  }, [trades]);

  const session = useMemo(() => getCurrentSession(), []);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Sessão atual */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sessão Atual</p>
              <p className="font-semibold text-foreground">{session}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Hoje</p>
            <p
              className={`font-bold ${data.todayResult > 0 ? "text-success" : data.todayResult < 0 ? "text-destructive" : "text-foreground"}`}
            >
              {data.todayTrades} {data.todayTrades === 1 ? "trade" : "trades"} •{" "}
              {data.todayResult > 0 ? "+" : ""}
              {data.todayResult.toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* KPIs essenciais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Resultado
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div
              className={`text-lg font-bold ${data.totalResult > 0 ? "text-success" : data.totalResult < 0 ? "text-destructive" : "text-muted-foreground"}`}
            >
              {data.totalResult > 0 ? "+" : ""}
              {data.totalResult.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Target className="w-3 h-3" />
              Acerto
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-lg font-bold text-primary">{data.winRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Trades
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-lg font-bold text-foreground">{data.totalOperations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Disciplina
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div
              className={`text-lg font-bold ${data.avgDiscipline >= 75 ? "text-success" : data.avgDiscipline >= 50 ? "text-primary" : "text-destructive"}`}
            >
              {data.avgDiscipline}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Últimos trades */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos Trades</CardTitle>
          <CardDescription>Operações mais recentes</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentTrades.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">
              Nenhum trade registrado ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {data.recentTrades.map((t: Trade) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge
                      variant={
                        t.result === "WIN"
                          ? "default"
                          : t.result === "LOSS"
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {t.result === "WIN" ? "✓" : t.result === "LOSS" ? "✗" : "="}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.asset}</p>
                      <p className="text-xs text-muted-foreground">{t.date}</p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold ${(t.moneyResult || 0) > 0 ? "text-success" : (t.moneyResult || 0) < 0 ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {(t.moneyResult || 0) > 0 ? "+" : ""}
                    {(t.moneyResult || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export const TradingDashboard = memo(TradingDashboardBase);
