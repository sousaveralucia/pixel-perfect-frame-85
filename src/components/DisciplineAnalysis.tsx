import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTradeJournalUnified, TradeWithChecklist } from "@/hooks/useTradeJournalUnified";
import { useAccountManager } from "@/hooks/useAccountManager";
import { useCustomChecklists } from "@/hooks/useCustomChecklists";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ScatterChart, Scatter, ZAxis } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, XCircle, Lightbulb, Shield, Target, BarChart3 } from "lucide-react";

interface ChecklistStat {
  key: string;
  label: string;
  emoji: string;
  group: string;
  totalMarked: number;
  totalNotMarked: number;
  winsWhenMarked: number;
  lossesWhenMarked: number;
  winsWhenNotMarked: number;
  lossesWhenNotMarked: number;
  winrateWhenMarked: number;
  winrateWhenNotMarked: number;
  winrateImpact: number;
}

type TimeFilter = "7d" | "30d" | "90d" | "all";

function filterByTime(trades: TradeWithChecklist[], filter: TimeFilter): TradeWithChecklist[] {
  if (filter === "all") return trades;
  const now = Date.now();
  const ms = filter === "7d" ? 7 * 86400000 : filter === "30d" ? 30 * 86400000 : 90 * 86400000;
  return trades.filter(t => {
    const d = new Date(t.date).getTime();
    return now - d <= ms;
  });
}

function computeStats(
  trades: TradeWithChecklist[],
  checklists: { group: string; items: { key: string; label: string; emoji: string }[] }[]
): ChecklistStat[] {
  const completedTrades = trades.filter(t => t.result === "WIN" || t.result === "LOSS" || t.result === "BREAK_EVEN");
  if (completedTrades.length === 0) return [];

  const stats: ChecklistStat[] = [];

  for (const cl of checklists) {
    const groupKey = cl.group === "operational" ? "operational" : cl.group === "emotional" ? "emotional" : cl.group === "routine" ? "routine" : "rational";

    for (const item of cl.items) {
      let totalMarked = 0, totalNotMarked = 0;
      let winsMarked = 0, lossesMarked = 0, winsNotMarked = 0, lossesNotMarked = 0;

      for (const trade of completedTrades) {
        const checklistData = (trade as any)[groupKey] as Record<string, boolean> | undefined;
        const isMarked = checklistData?.[item.key] === true;
        const isWin = trade.result === "WIN";
        const isLoss = trade.result === "LOSS";

        if (isMarked) {
          totalMarked++;
          if (isWin) winsMarked++;
          if (isLoss) lossesMarked++;
        } else {
          totalNotMarked++;
          if (isWin) winsNotMarked++;
          if (isLoss) lossesNotMarked++;
        }
      }

      const wrMarked = totalMarked > 0 ? (winsMarked / totalMarked) * 100 : 0;
      const wrNotMarked = totalNotMarked > 0 ? (winsNotMarked / totalNotMarked) * 100 : 0;
      const baseWinrate = completedTrades.length > 0
        ? (completedTrades.filter(t => t.result === "WIN").length / completedTrades.length) * 100
        : 0;

      stats.push({
        key: item.key,
        label: item.label,
        emoji: item.emoji,
        group: cl.group,
        totalMarked,
        totalNotMarked,
        winsWhenMarked: winsMarked,
        lossesWhenMarked: lossesMarked,
        winsWhenNotMarked: winsNotMarked,
        lossesWhenNotMarked: lossesNotMarked,
        winrateWhenMarked: wrMarked,
        winrateWhenNotMarked: wrNotMarked,
        winrateImpact: wrMarked - baseWinrate,
      });
    }
  }

  return stats;
}

function getWeeklyDiscipline(trades: TradeWithChecklist[]): { week: string; discipline: number; resultR: number }[] {
  const completed = trades.filter(t => t.result === "WIN" || t.result === "LOSS" || t.result === "BREAK_EVEN");
  if (completed.length === 0) return [];

  const weeks = new Map<string, { total: number; checked: number; rr: number }>();

  for (const trade of completed) {
    const d = new Date(trade.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().split("T")[0];

    if (!weeks.has(key)) weeks.set(key, { total: 0, checked: 0, rr: 0 });
    const w = weeks.get(key)!;

    const allChecks = { ...trade.operational, ...trade.emotional, ...trade.rational, ...trade.routine };
    const entries = Object.values(allChecks);
    w.total += entries.length;
    w.checked += entries.filter(v => v === true).length;
    w.rr += trade.riskReward || 0;
  }

  return Array.from(weeks.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => ({
      week: key.slice(5),
      discipline: val.total > 0 ? Math.round((val.checked / val.total) * 100) : 0,
      resultR: val.rr,
    }));
}

function getDisciplineVsResult(trades: TradeWithChecklist[]): { discipline: number; result: number }[] {
  const completed = trades.filter(t => t.result === "WIN" || t.result === "LOSS" || t.result === "BREAK_EVEN");
  return completed.map(trade => {
    const allChecks = { ...trade.operational, ...trade.emotional, ...trade.rational, ...trade.routine };
    const entries = Object.values(allChecks);
    const discipline = entries.length > 0 ? Math.round((entries.filter(v => v === true).length / entries.length) * 100) : 0;
    return { discipline, result: trade.riskReward || 0 };
  });
}

function TradeBreakdown({ trade, stats }: { trade: TradeWithChecklist; stats: ChecklistStat[] }) {
  const isWin = trade.result === "WIN";
  const allChecks = { ...trade.operational, ...trade.emotional, ...trade.rational, ...trade.routine };

  const ignoredRules = stats.filter(s => allChecks[s.key] !== true);
  const followedRules = stats.filter(s => allChecks[s.key] === true);

  if (isWin) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold text-success flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" /> Regras respeitadas neste trade:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {followedRules.map(r => (
            <Badge key={r.key} variant="outline" className="text-xs bg-success/10 border-success/30 text-success">
              {r.emoji} {r.label}
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-destructive flex items-center gap-1.5">
        <XCircle className="w-4 h-4" /> Regras ignoradas neste trade ({ignoredRules.length}):
      </p>
      <div className="flex flex-wrap gap-1.5">
        {ignoredRules.map(r => (
          <Badge key={r.key} variant="outline" className="text-xs bg-destructive/10 border-destructive/30 text-destructive">
            {r.emoji} {r.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default function DisciplineAnalysis() {
  const { activeAccountId } = useAccountManager();
  const { trades } = useTradeJournalUnified(activeAccountId);
  const opChecklist = useCustomChecklists("operational");
  const emChecklist = useCustomChecklists("emotional");
  const rtChecklist = useCustomChecklists("routine");
  const raChecklist = useCustomChecklists("rational");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [subTab, setSubTab] = useState("overview");

  const checklists = useMemo(() => [
    { group: "operational", items: opChecklist.items },
    { group: "emotional", items: emChecklist.items },
    { group: "routine", items: rtChecklist.items },
    { group: "rational", items: raChecklist.items },
  ], [opChecklist.items, emChecklist.items, rtChecklist.items, raChecklist.items]);

  const filtered = useMemo(() => filterByTime(trades, timeFilter), [trades, timeFilter]);
  const stats = useMemo(() => computeStats(filtered, checklists), [filtered, checklists]);

  const topRules = useMemo(() => [...stats].filter(s => s.totalMarked >= 2).sort((a, b) => b.winrateImpact - a.winrateImpact).slice(0, 5), [stats]);
  const worstIgnored = useMemo(() => [...stats].filter(s => s.totalNotMarked >= 2).sort((a, b) => {
    const lrA = a.totalNotMarked > 0 ? (a.lossesWhenNotMarked / a.totalNotMarked) * 100 : 0;
    const lrB = b.totalNotMarked > 0 ? (b.lossesWhenNotMarked / b.totalNotMarked) * 100 : 0;
    return lrB - lrA;
  }).slice(0, 5), [stats]);
  const mostFollowed = useMemo(() => [...stats].sort((a, b) => b.totalMarked - a.totalMarked).slice(0, 5), [stats]);
  const mostIgnored = useMemo(() => [...stats].sort((a, b) => b.totalNotMarked - a.totalNotMarked).slice(0, 5), [stats]);

  const weeklyData = useMemo(() => getWeeklyDiscipline(filtered), [filtered]);
  const scatterData = useMemo(() => getDisciplineVsResult(filtered), [filtered]);

  const completed = filtered.filter(t => t.result === "WIN" || t.result === "LOSS" || t.result === "BREAK_EVEN");
  const overallDiscipline = useMemo(() => {
    if (completed.length === 0) return 0;
    let total = 0, checked = 0;
    for (const t of completed) {
      const all = { ...t.operational, ...t.emotional, ...t.rational, ...t.routine };
      const vals = Object.values(all);
      total += vals.length;
      checked += vals.filter(v => v === true).length;
    }
    return total > 0 ? Math.round((checked / total) * 100) : 0;
  }, [completed]);

  const insights = useMemo(() => {
    const msgs: string[] = [];
    for (const s of stats) {
      if (s.totalMarked >= 3 && s.winrateImpact > 10) {
        msgs.push(`Sua taxa de acerto aumenta ${Math.round(s.winrateImpact)}% quando você respeita "${s.label}".`);
      }
      if (s.totalNotMarked >= 3) {
        const lossRate = s.totalNotMarked > 0 ? (s.lossesWhenNotMarked / s.totalNotMarked) * 100 : 0;
        if (lossRate > 60) {
          msgs.push(`${Math.round(lossRate)}% dos trades sem "${s.label}" resultaram em loss.`);
        }
      }
    }
    return msgs.slice(0, 5);
  }, [stats]);

  const recentLosses = useMemo(() =>
    filtered.filter(t => t.result === "LOSS").slice(-3).reverse(),
    [filtered]
  );
  const recentWins = useMemo(() =>
    filtered.filter(t => t.result === "WIN").slice(-3).reverse(),
    [filtered]
  );

  if (completed.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-semibold text-lg mb-2">Sem dados para análise</p>
          <p className="text-sm">Registre trades no Diário para ver a análise de disciplina operacional.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Análise de Disciplina Operacional
          </h2>
          <p className="text-sm text-muted-foreground">Motor de análise comportamental e operacional</p>
        </div>
        <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
          <SelectTrigger className="w-[140px] h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 dias</SelectItem>
            <SelectItem value="30d">30 dias</SelectItem>
            <SelectItem value="90d">3 meses</SelectItem>
            <SelectItem value="all">Tudo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-muted-foreground">Disciplina Geral</p>
            <p className={`text-2xl font-bold ${overallDiscipline >= 80 ? "text-success" : overallDiscipline >= 60 ? "text-warning" : "text-destructive"}`}>
              {overallDiscipline}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-muted-foreground">Trades Analisados</p>
            <p className="text-2xl font-bold text-primary">{completed.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-muted-foreground">Regras Rastreadas</p>
            <p className="text-2xl font-bold text-foreground">{stats.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-muted-foreground">Winrate Geral</p>
            <p className="text-2xl font-bold text-chart-3">
              {completed.length > 0 ? Math.round((completed.filter(t => t.result === "WIN").length / completed.length) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              Insights Automáticos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.map((msg, i) => (
              <p key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                <span className="text-primary mt-0.5 shrink-0">▸</span>
                {msg}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="w-full overflow-x-auto flex gap-1 bg-secondary/30 p-1 rounded-lg border border-border">
          <TabsTrigger value="overview" className="text-xs whitespace-nowrap flex-1">Relatório</TabsTrigger>
          <TabsTrigger value="heatmap" className="text-xs whitespace-nowrap flex-1">Heatmap</TabsTrigger>
          <TabsTrigger value="evolution" className="text-xs whitespace-nowrap flex-1">Evolução</TabsTrigger>
          <TabsTrigger value="trades" className="text-xs whitespace-nowrap flex-1">Trades</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Top Rules */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  Top Regras que Geram Lucro
                </CardTitle>
                <CardDescription className="text-xs">Maior impacto positivo no winrate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {topRules.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Dados insuficientes</p>
                ) : topRules.map((r, i) => (
                  <div key={r.key} className="flex items-center justify-between p-2 rounded-lg bg-success/5 border border-success/20">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-success w-5">#{i + 1}</span>
                      <span className="text-xs text-foreground truncate">{r.emoji} {r.label}</span>
                    </div>
                    <Badge className="bg-success/20 text-success border-success/30 shrink-0 text-xs">
                      +{Math.round(r.winrateImpact)}%
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Worst Errors */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-destructive" />
                  Erros Mais Caros
                </CardTitle>
                <CardDescription className="text-xs">Regras ignoradas com maior taxa de loss</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {worstIgnored.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Dados insuficientes</p>
                ) : worstIgnored.map((r, i) => {
                  const lossRate = r.totalNotMarked > 0 ? Math.round((r.lossesWhenNotMarked / r.totalNotMarked) * 100) : 0;
                  return (
                    <div key={r.key} className="flex items-center justify-between p-2 rounded-lg bg-destructive/5 border border-destructive/20">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-destructive w-5">#{i + 1}</span>
                        <span className="text-xs text-foreground truncate">{r.emoji} {r.label}</span>
                      </div>
                      <Badge className="bg-destructive/20 text-destructive border-destructive/30 shrink-0 text-xs">
                        {lossRate}% Loss
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Most Followed */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Regras Mais Respeitadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {mostFollowed.map((r, i) => (
                  <div key={r.key} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span className="text-xs text-foreground truncate">{r.emoji} {r.label}</span>
                    <span className="text-xs font-semibold text-primary shrink-0">{r.totalMarked}x</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Most Ignored */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  Regras Mais Ignoradas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {mostIgnored.map((r, i) => (
                  <div key={r.key} className="flex items-center justify-between p-2 rounded-lg bg-warning/5 border border-warning/20">
                    <span className="text-xs text-foreground truncate">{r.emoji} {r.label}</span>
                    <span className="text-xs font-semibold text-warning shrink-0">{r.totalNotMarked}x ignorada</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Per-item Stats Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Estatísticas por Regra
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-2">Regra</th>
                      <th className="text-center py-2 px-1">Marcado</th>
                      <th className="text-center py-2 px-1">WR Marcado</th>
                      <th className="text-center py-2 px-1">Não Marcado</th>
                      <th className="text-center py-2 px-1">WR S/ Marcar</th>
                      <th className="text-center py-2 px-1">Impacto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map(s => (
                      <tr key={s.key} className="border-b border-border/50">
                        <td className="py-2 pr-2 max-w-[200px] truncate">{s.emoji} {s.label}</td>
                        <td className="text-center py-2 px-1">{s.totalMarked}</td>
                        <td className="text-center py-2 px-1">
                          <span className={s.winrateWhenMarked >= 60 ? "text-success font-semibold" : ""}>{Math.round(s.winrateWhenMarked)}%</span>
                        </td>
                        <td className="text-center py-2 px-1">{s.totalNotMarked}</td>
                        <td className="text-center py-2 px-1">
                          <span className={s.winrateWhenNotMarked < 40 ? "text-destructive font-semibold" : ""}>{Math.round(s.winrateWhenNotMarked)}%</span>
                        </td>
                        <td className="text-center py-2 px-1">
                          <span className={`font-bold ${s.winrateImpact > 0 ? "text-success" : s.winrateImpact < 0 ? "text-destructive" : ""}`}>
                            {s.winrateImpact > 0 ? "+" : ""}{Math.round(s.winrateImpact)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HEATMAP TAB */}
        <TabsContent value="heatmap" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Heatmap de Disciplina Operacional</CardTitle>
              <CardDescription className="text-xs">
                🟢 Seguidas + lucro &nbsp; 🟡 Seguidas sem impacto &nbsp; 🔴 Ignoradas + prejuízo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {stats.map(s => {
                  let color: string;
                  let borderColor: string;
                  let textColor: string;

                  if (s.totalMarked > s.totalNotMarked && s.winrateWhenMarked >= 55) {
                    color = "bg-success/15";
                    borderColor = "border-success/40";
                    textColor = "text-success";
                  } else if (s.totalNotMarked > s.totalMarked) {
                    const lossRate = s.totalNotMarked > 0 ? (s.lossesWhenNotMarked / s.totalNotMarked) * 100 : 0;
                    if (lossRate >= 50) {
                      color = "bg-destructive/15";
                      borderColor = "border-destructive/40";
                      textColor = "text-destructive";
                    } else {
                      color = "bg-warning/15";
                      borderColor = "border-warning/40";
                      textColor = "text-warning";
                    }
                  } else {
                    color = "bg-warning/10";
                    borderColor = "border-warning/30";
                    textColor = "text-warning";
                  }

                  return (
                    <div key={s.key} className={`p-3 rounded-lg border ${color} ${borderColor}`}>
                      <p className="text-xs font-semibold text-foreground truncate">{s.emoji} {s.label}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-muted-foreground">
                          ✓{s.totalMarked} ✗{s.totalNotMarked}
                        </span>
                        <span className={`text-xs font-bold ${textColor}`}>
                          {Math.round(s.winrateWhenMarked)}% WR
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Discipline vs Result Scatter */}
          {scatterData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Disciplina (%) vs Resultado (R)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" dataKey="discipline" name="Disciplina" unit="%" domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <YAxis type="number" dataKey="result" name="Resultado" unit="R" tick={{ fontSize: 10 }} />
                    <ZAxis range={[40, 40]} />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        name === "Disciplina" ? `${value}%` : `${value}R`,
                        name === "discipline" ? "Disciplina" : "Resultado"
                      ]}
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }}
                    />
                    <Scatter data={scatterData} fill="hsl(var(--primary))" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* EVOLUTION TAB */}
        <TabsContent value="evolution" className="space-y-4 mt-4">
          {weeklyData.length > 0 && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Disciplina ao Longo do Tempo</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }}
                      />
                      <Line type="monotone" dataKey="discipline" name="Disciplina %" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Resultado (R) por Semana</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }}
                      />
                      <Bar dataKey="resultR" name="Resultado R">
                        {weeklyData.map((entry, i) => (
                          <Cell key={i} fill={entry.resultR >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* TRADES TAB */}
        <TabsContent value="trades" className="space-y-4 mt-4">
          {recentLosses.length > 0 && (
            <Card className="border-destructive/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-destructive" />
                  Últimos Trades Perdedores — Análise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentLosses.map(trade => (
                  <div key={trade.id} className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-destructive text-destructive-foreground text-xs">LOSS</Badge>
                      <span className="text-xs font-semibold text-foreground">{trade.asset}</span>
                      <span className="text-xs text-muted-foreground">{trade.date}</span>
                      {trade.riskReward != null && <span className="text-xs text-muted-foreground">R:R {trade.riskReward}</span>}
                    </div>
                    <TradeBreakdown trade={trade} stats={stats} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {recentWins.length > 0 && (
            <Card className="border-success/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  Últimos Trades Vencedores — Análise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentWins.map(trade => (
                  <div key={trade.id} className="p-3 rounded-lg bg-success/5 border border-success/20 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-success text-success-foreground text-xs">WIN</Badge>
                      <span className="text-xs font-semibold text-foreground">{trade.asset}</span>
                      <span className="text-xs text-muted-foreground">{trade.date}</span>
                      {trade.riskReward != null && <span className="text-xs text-muted-foreground">R:R {trade.riskReward}</span>}
                    </div>
                    <TradeBreakdown trade={trade} stats={stats} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
