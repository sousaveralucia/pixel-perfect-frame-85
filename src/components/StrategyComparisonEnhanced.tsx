import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart, Line,
} from "recharts";
import {
  TrendingUp, TrendingDown, AlertCircle, Filter, Target, Shield,
  DollarSign, BarChart3, ArrowRightLeft, Zap, Award, Clock,
} from "lucide-react";
import { subDays, subMonths, parseISO, isAfter } from "date-fns";
import { TradeWithChecklist } from "@/hooks/useTradeJournalUnified";

interface StrategyComparisonEnhancedProps {
  trades: TradeWithChecklist[];
}

const COLORS = ["#6366f1", "#22c55e", "#ef4444", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6", "#14b8a6"];

type PeriodFilter = "all" | "7d" | "30d" | "90d";
const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: "all", label: "Tudo" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "3 meses" },
];

type CompareMode = "assets" | "sessions" | "weekdays" | "checklist";

function calcStats(trades: TradeWithChecklist[]) {
  const wins = trades.filter(t => t.result === "WIN").length;
  const losses = trades.filter(t => t.result === "LOSS").length;
  const be = trades.filter(t => t.result === "BREAK_EVEN").length;
  const money = trades.reduce((s, t) => s + (t.moneyResult || 0), 0);
  const avgMoney = trades.length > 0 ? money / trades.length : 0;
  const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;

  const checklistItems = ["chochValidoHTF", "caixaGannTracada", "regiaoDescontada50", "orderBlockIdentificado", "entrada50OB", "stopRiskManagement", "tempoGraficoOperacional"];
  const avgChecklist = trades.length > 0
    ? trades.reduce((s, t) => {
        const op = t.operational as any || {};
        return s + checklistItems.reduce((cs, k) => cs + (op[k] ? 1 : 0), 0);
      }, 0) / trades.length
    : 0;

  const emotionalItems = ["hydration", "breathing", "mentalClarity"];
  const rationalItems = ["analysisConfirmed", "planRespected", "riskManaged"];
  const avgPrepare = trades.length > 0
    ? trades.reduce((s, t) => {
        const em = t.emotional as any || {};
        const ra = t.rational as any || {};
        return s + [...emotionalItems, ...rationalItems].reduce((cs, k) => cs + ((em[k] || ra[k]) ? 1 : 0), 0);
      }, 0) / trades.length
    : 0;

  const bestTrade = trades.reduce((best, t) => (t.moneyResult || 0) > (best?.moneyResult || -Infinity) ? t : best, trades[0]);
  const worstTrade = trades.reduce((worst, t) => (t.moneyResult || 0) < (worst?.moneyResult || Infinity) ? t : worst, trades[0]);

  return { total: trades.length, wins, losses, be, money, avgMoney, winRate, avgChecklist, avgPrepare, bestTrade, worstTrade };
}

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function StrategyComparisonEnhanced({ trades: allTradesRaw }: StrategyComparisonEnhancedProps) {
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [mode, setMode] = useState<CompareMode>("assets");

  const trades = useMemo(() => {
    if (period === "all") return allTradesRaw;
    const now = new Date();
    const cutoff = period === "7d" ? subDays(now, 7) : period === "30d" ? subMonths(now, 1) : subMonths(now, 3);
    return allTradesRaw.filter(t => {
      if (!t.date) return false;
      try { return isAfter(parseISO(t.date), cutoff); } catch { return false; }
    });
  }, [allTradesRaw, period]);

  // Dynamic unique values
  const uniqueAssets = useMemo(() => [...new Set(trades.map(t => t.asset).filter(Boolean))], [trades]);
  const uniqueSessions = useMemo(() => [...new Set(trades.map(t => t.session).filter(Boolean))], [trades]);

  // ====== COMPARISON BY ASSET ======
  const assetComparison = useMemo(() => {
    return uniqueAssets.map(asset => {
      const assetTrades = trades.filter(t => t.asset === asset);
      return { name: asset, ...calcStats(assetTrades) };
    }).sort((a, b) => b.money - a.money);
  }, [trades, uniqueAssets]);

  // ====== COMPARISON BY SESSION ======
  const sessionComparison = useMemo(() => {
    return uniqueSessions.map(session => {
      const sessionTrades = trades.filter(t => t.session === session);
      return { name: session, ...calcStats(sessionTrades) };
    }).sort((a, b) => b.money - a.money);
  }, [trades, uniqueSessions]);

  // ====== COMPARISON BY WEEKDAY ======
  const weekdayComparison = useMemo(() => {
    return [1, 2, 3, 4, 5].map(d => {
      const dayTrades = trades.filter(t => new Date(t.date).getDay() === d);
      return { name: DAY_NAMES[d], ...calcStats(dayTrades) };
    });
  }, [trades]);

  // ====== CHECKLIST IMPACT COMPARISON ======
  const checklistComparison = useMemo(() => {
    const items = [
      { key: "chochValidoHTF", label: "CHoCH HTF" },
      { key: "caixaGannTracada", label: "Gann Box" },
      { key: "regiaoDescontada50", label: "Região 50%" },
      { key: "orderBlockIdentificado", label: "Order Block" },
      { key: "entrada50OB", label: "Entrada 50% OB" },
      { key: "stopRiskManagement", label: "Stop/Risk" },
      { key: "tempoGraficoOperacional", label: "Timeframe Op." },
    ];
    return items.map(item => {
      const followed = trades.filter(t => (t.operational as any)?.[item.key]);
      const notFollowed = trades.filter(t => !(t.operational as any)?.[item.key]);
      const wrFollowed = followed.length > 0 ? (followed.filter(t => t.result === "WIN").length / followed.length) * 100 : 0;
      const wrNot = notFollowed.length > 0 ? (notFollowed.filter(t => t.result === "WIN").length / notFollowed.length) * 100 : 0;
      const moneyFollowed = followed.reduce((s, t) => s + (t.moneyResult || 0), 0);
      const moneyNot = notFollowed.reduce((s, t) => s + (t.moneyResult || 0), 0);
      return {
        name: item.label,
        followedCount: followed.length,
        notCount: notFollowed.length,
        wrFollowed: Math.round(wrFollowed),
        wrNot: Math.round(wrNot),
        impact: Math.round(wrFollowed - wrNot),
        moneyFollowed: Math.round(moneyFollowed * 100) / 100,
        moneyNot: Math.round(moneyNot * 100) / 100,
      };
    });
  }, [trades]);

  // Pick data based on mode
  const currentData = mode === "assets" ? assetComparison : mode === "sessions" ? sessionComparison : mode === "weekdays" ? weekdayComparison : [];
  const modeLabels: Record<CompareMode, string> = { assets: "Ativos", sessions: "Sessões", weekdays: "Dias da Semana", checklist: "Checklist Operacional" };

  // Overall stats
  const overall = useMemo(() => calcStats(trades), [trades]);

  // Radar data for current comparison
  const radarData = useMemo(() => {
    if (mode === "checklist") return [];
    return currentData.map(d => ({
      subject: d.name,
      winRate: Math.round(d.winRate),
      checklist: Math.round((d.avgChecklist / 7) * 100),
      preparo: Math.round((d.avgPrepare / 6) * 100),
    }));
  }, [currentData, mode]);

  if (trades.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          Nenhum trade registrado ainda. Comece a registrar para ver comparações!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros de Período + Modo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Período:</span>
          {PERIOD_OPTIONS.map(opt => (
            <Button key={opt.value} variant={period === opt.value ? "default" : "outline"} size="sm" onClick={() => setPeriod(opt.value)} className="h-8">
              {opt.label}
            </Button>
          ))}
          {period !== "all" && (
            <Badge variant="secondary" className="ml-1">{trades.length} trades</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Comparar:</span>
          {([
            { value: "assets" as CompareMode, label: "Ativos", icon: Target },
            { value: "sessions" as CompareMode, label: "Sessões", icon: Clock },
            { value: "weekdays" as CompareMode, label: "Dias", icon: BarChart3 },
            { value: "checklist" as CompareMode, label: "Checklist", icon: Shield },
          ]).map(opt => (
            <Button key={opt.value} variant={mode === opt.value ? "default" : "outline"} size="sm" onClick={() => setMode(opt.value)} className="h-8 gap-1">
              <opt.icon className="w-3.5 h-3.5" />
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* KPIs Gerais */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Trades", value: `${overall.total}`, color: "text-primary" },
          { label: "Win Rate", value: `${overall.winRate.toFixed(1)}%`, color: "text-primary" },
          { label: "Resultado", value: `$${overall.money.toFixed(2)}`, color: overall.money >= 0 ? "text-green-600" : "text-red-600" },
          { label: "Checklist Médio", value: `${overall.avgChecklist.toFixed(1)}/7`, color: "text-primary" },
          { label: "Preparo Médio", value: `${overall.avgPrepare.toFixed(1)}/6`, color: "text-primary" },
        ].map((kpi, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ====== MODO CHECKLIST ====== */}
      {mode === "checklist" && (
        <>
          {/* Bar chart: WR com vs sem */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Win Rate: Seguiu vs Não Seguiu
              </CardTitle>
              <CardDescription>Comparação do impacto de cada item do checklist no win rate</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={checklistComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Legend />
                  <Bar dataKey="wrFollowed" name="Com ✓" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="wrNot" name="Sem ✗" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Money impact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Resultado Financeiro: Seguiu vs Não Seguiu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={checklistComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={v => `$${v}`} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `$${v}`} />
                  <Legend />
                  <Bar dataKey="moneyFollowed" name="Com ✓" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="moneyNot" name="Sem ✗" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Impact ranking */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ranking de Impacto no Win Rate</CardTitle>
              <CardDescription>Itens ordenados pelo impacto no win rate (diferença seguir vs não seguir)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...checklistComparison].sort((a, b) => b.impact - a.impact).map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/20">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.followedCount} seguido • {item.notCount} não seguido</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Com ✓</p>
                        <p className="text-sm font-bold text-green-600">{item.wrFollowed}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Sem ✗</p>
                        <p className="text-sm font-bold text-red-600">{item.wrNot}%</p>
                      </div>
                      <div className="text-center min-w-[55px]">
                        <p className="text-xs text-muted-foreground">Impacto</p>
                        <p className={`text-lg font-bold ${item.impact >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {item.impact >= 0 ? "+" : ""}{item.impact}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ====== MODOS: ASSETS, SESSIONS, WEEKDAYS ====== */}
      {mode !== "checklist" && currentData.length > 0 && (
        <>
          {/* Ranking cards */}
          <div className="grid md:grid-cols-3 gap-4">
            {currentData.slice(0, 3).map((item, i) => {
              const borderColors = ["border-l-green-500", "border-l-blue-500", "border-l-yellow-500"];
              const icons = [<Award key="a" className="w-5 h-5 text-green-600" />, <Target key="t" className="w-5 h-5 text-blue-600" />, <AlertCircle key="al" className="w-5 h-5 text-yellow-600" />];
              return (
                <Card key={i} className={`border-l-4 ${borderColors[i] || "border-l-muted"}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {icons[i]}
                        <p className="font-bold text-foreground">{item.name}</p>
                      </div>
                      <Badge variant="outline">#{i + 1}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Win Rate</p>
                        <p className={`text-lg font-bold ${item.winRate >= 50 ? "text-green-600" : "text-red-600"}`}>{item.winRate.toFixed(1)}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Resultado</p>
                        <p className={`text-lg font-bold ${item.money >= 0 ? "text-green-600" : "text-red-600"}`}>${item.money.toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Trades</p>
                        <p className="text-lg font-bold text-primary">{item.total}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${item.winRate}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">CL: {item.avgChecklist.toFixed(1)}/7</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Bar Chart: Win Rate + Money */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Win Rate & Resultado por {modeLabels[mode]}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={currentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={v => `$${v}`} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="right" dataKey="money" name="Resultado ($)" fill="#6366f1" opacity={0.7} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="left" type="monotone" dataKey="winRate" name="Win Rate (%)" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e" }} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie: distribuição de trades */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribuição de Trades</CardTitle>
                <CardDescription>Quantidade de trades por {modeLabels[mode].toLowerCase()}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={currentData.map((d, i) => ({ name: d.name, value: d.total, fill: COLORS[i % COLORS.length] }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, value }) => `${name}: ${value}`}
                      dataKey="value"
                    >
                      {currentData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Radar: WR, Checklist, Preparo */}
            {radarData.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Radar Multidimensional</CardTitle>
                  <CardDescription>Win Rate, Checklist e Preparo Emocional</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar name="Win Rate %" dataKey="winRate" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
                      <Radar name="Checklist %" dataKey="checklist" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                      <Radar name="Preparo %" dataKey="preparo" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Tabela detalhada */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalhamento Completo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">{modeLabels[mode].slice(0, -1)}</th>
                      <th className="text-center py-2 px-2 text-muted-foreground font-medium">Trades</th>
                      <th className="text-center py-2 px-2 text-muted-foreground font-medium">W/L/BE</th>
                      <th className="text-center py-2 px-2 text-muted-foreground font-medium">Win Rate</th>
                      <th className="text-center py-2 px-2 text-muted-foreground font-medium">Resultado</th>
                      <th className="text-center py-2 px-2 text-muted-foreground font-medium">$/Trade</th>
                      <th className="text-center py-2 px-2 text-muted-foreground font-medium">CL Médio</th>
                      <th className="text-center py-2 px-2 text-muted-foreground font-medium">Preparo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.map((row, i) => (
                      <tr key={i} className={`border-b border-border/50 ${i % 2 === 0 ? "bg-secondary/20" : ""}`}>
                        <td className="py-2.5 px-3 font-semibold text-foreground">{row.name}</td>
                        <td className="text-center py-2.5 px-2">{row.total}</td>
                        <td className="text-center py-2.5 px-2">
                          <span className="text-green-600">{row.wins}</span>/<span className="text-red-600">{row.losses}</span>/<span className="text-muted-foreground">{row.be}</span>
                        </td>
                        <td className="text-center py-2.5 px-2">
                          <span className={`font-bold ${row.winRate >= 50 ? "text-green-600" : "text-red-600"}`}>{row.winRate.toFixed(1)}%</span>
                        </td>
                        <td className="text-center py-2.5 px-2">
                          <span className={`font-bold ${row.money >= 0 ? "text-green-600" : "text-red-600"}`}>${row.money.toFixed(2)}</span>
                        </td>
                        <td className="text-center py-2.5 px-2">
                          <span className={`${row.avgMoney >= 0 ? "text-green-600" : "text-red-600"}`}>${row.avgMoney.toFixed(2)}</span>
                        </td>
                        <td className="text-center py-2.5 px-2">
                          <Badge variant={row.avgChecklist >= 5 ? "default" : row.avgChecklist >= 3 ? "secondary" : "destructive"} className="text-xs">
                            {row.avgChecklist.toFixed(1)}/7
                          </Badge>
                        </td>
                        <td className="text-center py-2.5 px-2">
                          <Badge variant={row.avgPrepare >= 4 ? "default" : row.avgPrepare >= 2 ? "secondary" : "destructive"} className="text-xs">
                            {row.avgPrepare.toFixed(1)}/6
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Insight Personalizado */}
          {currentData.length >= 2 && (
            <Card className="border-2 border-primary/30 bg-primary/5">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Zap className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-foreground mb-1">💡 Insight de Comparação</p>
                    <p className="text-sm text-foreground/80">
                      {(() => {
                        const best = currentData[0];
                        const worst = [...currentData].sort((a, b) => a.money - b.money)[0];
                        const insights: string[] = [];

                        insights.push(`Seu melhor ${modeLabels[mode].toLowerCase().slice(0, -1)} é "${best.name}" com ${best.winRate.toFixed(1)}% WR e $${best.money.toFixed(2)} de resultado.`);

                        if (worst.name !== best.name && worst.money < 0) {
                          insights.push(`"${worst.name}" está negativo ($${worst.money.toFixed(2)}) — considere reduzir a exposição.`);
                        }

                        const highChecklist = currentData.filter(d => d.avgChecklist >= 5);
                        const lowChecklist = currentData.filter(d => d.avgChecklist < 4);
                        if (lowChecklist.length > 0) {
                          insights.push(`Disciplina mais baixa em: ${lowChecklist.map(d => d.name).join(", ")} (CL < 4/7).`);
                        }

                        const bestPrepare = [...currentData].sort((a, b) => b.avgPrepare - a.avgPrepare)[0];
                        if (bestPrepare.avgPrepare > 4) {
                          insights.push(`Melhor preparo emocional em "${bestPrepare.name}" (${bestPrepare.avgPrepare.toFixed(1)}/6).`);
                        }

                        return insights.join(" ");
                      })()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
