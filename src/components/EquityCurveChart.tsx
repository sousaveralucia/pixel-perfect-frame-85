import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAccountManager } from "@/hooks/useAccountManager";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface EquityCurveChartProps {
  activeAccountId?: string;
}

export function EquityCurveChart({ activeAccountId: propAccountId }: EquityCurveChartProps) {
  const { user } = useAuth();
  const { activeAccountId: hookAccountId, accounts } = useAccountManager();
  const accountId = propAccountId || hookAccountId;

  const activeAccount = accounts.find((a) => a.id === accountId || a.account_key === accountId);
  const initialBalance = activeAccount?.initialBalance ?? 100;

  const { data: trades = [] } = useQuery({
    queryKey: ["equity-trades", user?.id, accountId],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("trades")
        .select("date, money_result")
        .eq("user_id", user.id)
        .eq("account_key", accountId)
        .order("date", { ascending: true });
      return data || [];
    },
    enabled: !!user && !!accountId,
  });

  const chartData = useMemo(() => {
    if (!trades.length) return [];

    let balance = initialBalance;
    const points: { date: string; balance: number; label: string }[] = [
      { date: "Início", balance: initialBalance, label: "Início" },
    ];

    // Group trades by date
    const byDate = new Map<string, number>();
    for (const t of trades) {
      if (!t.date || t.money_result == null) continue;
      byDate.set(t.date, (byDate.get(t.date) || 0) + Number(t.money_result));
    }

    const sortedDates = [...byDate.keys()].sort();
    for (const date of sortedDates) {
      balance += byDate.get(date)!;
      const d = new Date(date + "T12:00:00");
      const label = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      points.push({ date, balance: Math.round(balance * 100) / 100, label });
    }

    return points;
  }, [trades, initialBalance]);

  const currentBalance = chartData.length > 0 ? chartData[chartData.length - 1].balance : initialBalance;
  const pnl = currentBalance - initialBalance;
  const pnlPct = initialBalance > 0 ? ((pnl / initialBalance) * 100).toFixed(2) : "0.00";
  const isPositive = pnl >= 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Curva de Capital
            </CardTitle>
            <CardDescription>Evolução do saldo ao longo do tempo</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">
              ${currentBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className={`text-sm font-semibold ${isPositive ? "text-emerald-500" : "text-destructive"}`}>
              {isPositive ? "+" : ""}${pnl.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ({isPositive ? "+" : ""}{pnlPct}%)
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length <= 1 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Registre trades para ver a curva de capital</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
                formatter={(value: number) => [`$${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Saldo"]}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="hsl(160, 84%, 39%)"
                strokeWidth={2.5}
                fill="url(#equityGradient)"
                dot={{ r: 3, fill: "hsl(160, 84%, 39%)" }}
                activeDot={{ r: 5, fill: "hsl(160, 84%, 39%)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
