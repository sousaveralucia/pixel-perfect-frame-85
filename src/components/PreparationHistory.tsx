import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAccountManager } from "@/hooks/useAccountManager";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Row {
  date: string;
  emotional_state: string | null;
  mental_clarity: number | null;
  physical_state: string | null;
  sleep_hours: number | null;
  hydration: string | null;
  daily_intention: string | null;
  readiness_score: number | null;
  day_result: number | null;
  trades_count: number | null;
  performance_score: number | null;
}

export default function PreparationHistory() {
  const { user } = useAuth();
  const { activeAccountId } = useAccountManager();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("daily_validations")
      .select("date,emotional_state,mental_clarity,physical_state,sleep_hours,hydration,daily_intention,readiness_score,day_result,trades_count,performance_score")
      .eq("user_id", user.id)
      .eq("account_key", activeAccountId)
      .not("checkin_completed_at", "is", null)
      .order("date", { ascending: true })
      .then(({ data }) => setRows((data as any) ?? []));
  }, [user, activeAccountId]);

  // Estatísticas por estado emocional
  const byEmotion = useMemo(() => {
    const map = new Map<string, { state: string; trades: number; wins: number; profit: number; days: number }>();
    rows.forEach((r) => {
      if (!r.emotional_state) return;
      const e = map.get(r.emotional_state) ?? { state: r.emotional_state, trades: 0, wins: 0, profit: 0, days: 0 };
      e.trades += r.trades_count ?? 0;
      e.profit += r.day_result ?? 0;
      e.days += 1;
      // wins não temos por dia — aproximar com day_result > 0 ?
      if ((r.day_result ?? 0) > 0) e.wins += 1;
      map.set(r.emotional_state, e);
    });
    return Array.from(map.values()).map((e) => ({
      ...e,
      winrate: e.days ? Math.round((e.wins / e.days) * 100) : 0,
      avgProfit: e.days ? e.profit / e.days : 0,
    }));
  }, [rows]);

  const best = byEmotion.slice().sort((a, b) => b.avgProfit - a.avgProfit)[0];
  const worst = byEmotion.slice().sort((a, b) => a.avgProfit - b.avgProfit)[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Histórico de Preparação</h2>
        <p className="text-sm text-muted-foreground">Cruzamento Check-In × Performance</p>
      </div>

      {/* Insights rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Dias com Check-In</p>
          <p className="text-2xl font-bold">{rows.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Melhor estado emocional</p>
          <p className="text-2xl font-bold capitalize text-success">{best?.state ?? "—"}</p>
          {best && <p className="text-xs text-muted-foreground">+${best.avgProfit.toFixed(2)}/dia</p>}
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Pior estado emocional</p>
          <p className="text-2xl font-bold capitalize text-destructive">{worst?.state ?? "—"}</p>
          {worst && <p className="text-xs text-muted-foreground">${worst.avgProfit.toFixed(2)}/dia</p>}
        </CardContent></Card>
      </div>

      {/* Gráfico */}
      {byEmotion.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Lucro médio por estado emocional</CardTitle>
            <CardDescription className="text-xs">Cruzamento dos check-ins com resultado do dia</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byEmotion}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="state" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="avgProfit" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Histórico completo</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Emocional</TableHead>
                <TableHead>Clareza</TableHead>
                <TableHead>Físico</TableHead>
                <TableHead>Sono</TableHead>
                <TableHead>Hidratação</TableHead>
                <TableHead>Readiness</TableHead>
                <TableHead>Trades</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Perf.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-6">Sem registros ainda.</TableCell></TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.date}>
                  <TableCell className="font-mono text-xs">{r.date}</TableCell>
                  <TableCell className="capitalize">{r.emotional_state ?? "—"}</TableCell>
                  <TableCell>{r.mental_clarity ?? "—"}</TableCell>
                  <TableCell className="capitalize">{r.physical_state ?? "—"}</TableCell>
                  <TableCell>{r.sleep_hours != null ? `${r.sleep_hours}h` : "—"}</TableCell>
                  <TableCell className="capitalize">{r.hydration ?? "—"}</TableCell>
                  <TableCell className="font-semibold">{r.readiness_score ?? "—"}</TableCell>
                  <TableCell>{r.trades_count ?? 0}</TableCell>
                  <TableCell className={r.day_result == null ? "" : r.day_result >= 0 ? "text-success" : "text-destructive"}>
                    {r.day_result != null ? `${r.day_result >= 0 ? "+" : ""}$${r.day_result.toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell>{r.performance_score ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
