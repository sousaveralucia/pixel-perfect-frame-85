import { useMemo, useState } from "react";
import { subDays, subMonths, parseISO, isAfter } from "date-fns";
import { exportInsightsPdf } from "@/lib/insightsPdfExporter";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAccountManager } from "@/hooks/useAccountManager";
import { useTradeJournalUnified, TradeWithChecklist } from "@/hooks/useTradeJournalUnified";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ComposedChart, Area,
} from "recharts";
import {
  TrendingUp, TrendingDown, Target, Shield, Brain, Heart, Flame, Calendar,
  CheckCircle2, XCircle, AlertTriangle, Award, Zap, BarChart3, Filter, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const COLORS = {
  win: "#22c55e",
  loss: "#ef4444",
  breakeven: "#94a3b8",
  primary: "#6366f1",
  accent: "#f59e0b",
  info: "#3b82f6",
};

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

type PeriodFilter = "all" | "7d" | "30d" | "90d";

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: "all", label: "Tudo" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "3 meses" },
];

export default function PerformanceDashboard() {
  const { activeAccountId } = useAccountManager();
  const { trades: allTrades } = useTradeJournalUnified(activeAccountId);
  const [period, setPeriod] = useState<PeriodFilter>("all");

  const trades = useMemo(() => {
    if (period === "all") return allTrades;
    const now = new Date();
    const cutoff = period === "7d" ? subDays(now, 7) : period === "30d" ? subMonths(now, 1) : subMonths(now, 3);
    return allTrades.filter(t => {
      if (!t.date) return false;
      try {
        return isAfter(parseISO(t.date), cutoff);
      } catch { return false; }
    });
  }, [allTrades, period]);

  // ============ BASIC STATS ============
  const overallStats = useMemo(() => {
    const total = trades.length;
    const wins = trades.filter(t => t.result === "WIN").length;
    const losses = trades.filter(t => t.result === "LOSS").length;
    const breakeven = trades.filter(t => t.result === "BREAK_EVEN").length;
    const totalMoney = trades.reduce((s, t) => s + (t.moneyResult || 0), 0);
    const avgWin = wins > 0 ? trades.filter(t => t.result === "WIN").reduce((s, t) => s + (t.moneyResult || 0), 0) / wins : 0;
    const avgLoss = losses > 0 ? trades.filter(t => t.result === "LOSS").reduce((s, t) => s + (t.moneyResult || 0), 0) / losses : 0;
    const profitFactor = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;
    return { total, wins, losses, breakeven, winRate: total > 0 ? (wins / total) * 100 : 0, totalMoney, avgWin, avgLoss, profitFactor };
  }, [trades]);

  // ============ 1. DISCIPLINA OPERACIONAL ============
  const disciplineStats = useMemo(() => {
    if (trades.length === 0) return null;

    const checklistItems = [
      { key: "chochValidoHTF", label: "CHoCH HTF" },
      { key: "caixaGannTracada", label: "Gann Box" },
      { key: "regiaoDescontada50", label: "Região 50%" },
      { key: "orderBlockIdentificado", label: "Order Block" },
      { key: "entrada50OB", label: "Entrada 50% OB" },
      { key: "stopRiskManagement", label: "Stop/Risk" },
      { key: "tempoGraficoOperacional", label: "Timeframe Op." },
    ];

    // Score por trade
    const tradesWithScore = trades.map(t => {
      const op = t.operational as any || {};
      const score = checklistItems.reduce((s, item) => s + (op[item.key] ? 1 : 0), 0);
      return { ...t, checklistScore: score };
    });

    // Win rate por faixa de checklist
    const fullChecklist = tradesWithScore.filter(t => t.checklistScore === 7);
    const partialChecklist = tradesWithScore.filter(t => t.checklistScore >= 4 && t.checklistScore < 7);
    const lowChecklist = tradesWithScore.filter(t => t.checklistScore < 4);

    const calcWR = (arr: typeof tradesWithScore) =>
      arr.length > 0 ? (arr.filter(t => t.result === "WIN").length / arr.length) * 100 : 0;

    // Item compliance stats
    const itemStats = checklistItems.map(item => {
      const followed = trades.filter(t => (t.operational as any)?.[item.key]);
      const notFollowed = trades.filter(t => !(t.operational as any)?.[item.key]);
      return {
        label: item.label,
        compliance: trades.length > 0 ? (followed.length / trades.length) * 100 : 0,
        winRateWhenFollowed: followed.length > 0 ? (followed.filter(t => t.result === "WIN").length / followed.length) * 100 : 0,
        winRateWhenNot: notFollowed.length > 0 ? (notFollowed.filter(t => t.result === "WIN").length / notFollowed.length) * 100 : 0,
      };
    });

    // Radar data
    const radarData = itemStats.map(i => ({
      subject: i.label,
      compliance: Math.round(i.compliance),
      winRate: Math.round(i.winRateWhenFollowed),
    }));

    // Average score
    const avgScore = tradesWithScore.reduce((s, t) => s + t.checklistScore, 0) / tradesWithScore.length;

    return {
      fullWR: calcWR(fullChecklist),
      fullCount: fullChecklist.length,
      partialWR: calcWR(partialChecklist),
      partialCount: partialChecklist.length,
      lowWR: calcWR(lowChecklist),
      lowCount: lowChecklist.length,
      avgScore,
      itemStats,
      radarData,
      comparisonData: [
        { name: "7/7 itens", winRate: calcWR(fullChecklist), trades: fullChecklist.length, money: fullChecklist.reduce((s, t) => s + (t.moneyResult || 0), 0) },
        { name: "4-6 itens", winRate: calcWR(partialChecklist), trades: partialChecklist.length, money: partialChecklist.reduce((s, t) => s + (t.moneyResult || 0), 0) },
        { name: "0-3 itens", winRate: calcWR(lowChecklist), trades: lowChecklist.length, money: lowChecklist.reduce((s, t) => s + (t.moneyResult || 0), 0) },
      ],
    };
  }, [trades]);

  // ============ 2. ANÁLISE EMOCIONAL ============
  const emotionalStats = useMemo(() => {
    if (trades.length === 0) return null;

    const emotionalItems = [
      { key: "hydration", label: "Hidratação", icon: "💧" },
      { key: "breathing", label: "Respiração", icon: "🌬️" },
      { key: "mentalClarity", label: "Clareza Mental", icon: "🧠" },
    ];

    const rationalItems = [
      { key: "analysisConfirmed", label: "Análise Confirmada", icon: "📊" },
      { key: "planRespected", label: "Plano Respeitado", icon: "📋" },
      { key: "riskManaged", label: "Risco Gerido", icon: "🛡️" },
    ];

    const routineItems = [
      { key: "nightAnalysis", label: "Análise Noturna", icon: "🌙" },
      { key: "morningReview", label: "Revisão Manhã", icon: "🌅" },
      { key: "regionsValidated", label: "Regiões Validadas", icon: "🎯" },
      { key: "sleep", label: "Sono", icon: "😴" },
    ];

    const analyzeCategory = (items: typeof emotionalItems, category: "emotional" | "rational" | "routine") => {
      return items.map(item => {
        const followed = trades.filter(t => (t[category] as any)?.[item.key]);
        const notFollowed = trades.filter(t => !(t[category] as any)?.[item.key]);
        const wrFollowed = followed.length > 0 ? (followed.filter(t => t.result === "WIN").length / followed.length) * 100 : 0;
        const wrNot = notFollowed.length > 0 ? (notFollowed.filter(t => t.result === "WIN").length / notFollowed.length) * 100 : 0;
        const moneyFollowed = followed.reduce((s, t) => s + (t.moneyResult || 0), 0);
        const moneyNot = notFollowed.reduce((s, t) => s + (t.moneyResult || 0), 0);
        return {
          ...item,
          followed: followed.length,
          total: trades.length,
          compliance: trades.length > 0 ? (followed.length / trades.length) * 100 : 0,
          wrFollowed,
          wrNot,
          impact: wrFollowed - wrNot,
          moneyFollowed,
          moneyNot,
        };
      });
    };

    // Emotional score per trade
    const tradesWithEmotionalScore = trades.map(t => {
      const em = t.emotional as any || {};
      const ra = t.rational as any || {};
      const score = [em.hydration, em.breathing, em.mentalClarity, ra.analysisConfirmed, ra.planRespected, ra.riskManaged]
        .filter(Boolean).length;
      return { ...t, emotionalScore: score };
    });

    const highEmotional = tradesWithEmotionalScore.filter(t => t.emotionalScore >= 5);
    const lowEmotional = tradesWithEmotionalScore.filter(t => t.emotionalScore < 3);

    return {
      emotional: analyzeCategory(emotionalItems, "emotional"),
      rational: analyzeCategory(rationalItems, "rational"),
      routine: analyzeCategory(routineItems, "routine"),
      highEmotionalWR: highEmotional.length > 0 ? (highEmotional.filter(t => t.result === "WIN").length / highEmotional.length) * 100 : 0,
      lowEmotionalWR: lowEmotional.length > 0 ? (lowEmotional.filter(t => t.result === "WIN").length / lowEmotional.length) * 100 : 0,
      highEmotionalCount: highEmotional.length,
      lowEmotionalCount: lowEmotional.length,
      highEmotionalMoney: highEmotional.reduce((s, t) => s + (t.moneyResult || 0), 0),
      lowEmotionalMoney: lowEmotional.reduce((s, t) => s + (t.moneyResult || 0), 0),
    };
  }, [trades]);

  // ============ 3. STREAKS & CONSISTÊNCIA ============
  const streakStats = useMemo(() => {
    if (trades.length === 0) return null;

    const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let currentWinStreak = 0, maxWinStreak = 0, currentLossStreak = 0, maxLossStreak = 0;
    let currentStreak = 0, currentStreakType: string | null = null;

    sorted.forEach(t => {
      if (t.result === "WIN") {
        currentWinStreak++;
        currentLossStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      } else if (t.result === "LOSS") {
        currentLossStreak++;
        currentWinStreak = 0;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
      }
    });

    // Current streak (from end)
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (currentStreakType === null) {
        currentStreakType = sorted[i].result;
        currentStreak = 1;
      } else if (sorted[i].result === currentStreakType) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Days active
    const uniqueDates = [...new Set(sorted.map(t => t.date))];
    const tradesPerDay = uniqueDates.map(d => ({
      date: d,
      count: sorted.filter(t => t.date === d).length,
    }));
    const avgTradesPerDay = tradesPerDay.length > 0 ? tradesPerDay.reduce((s, d) => s + d.count, 0) / tradesPerDay.length : 0;

    // Weekly data
    const weeklyData: Record<string, { wins: number; losses: number; money: number; trades: number }> = {};
    sorted.forEach(t => {
      const d = new Date(t.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().split("T")[0];
      if (!weeklyData[key]) weeklyData[key] = { wins: 0, losses: 0, money: 0, trades: 0 };
      weeklyData[key].trades++;
      if (t.result === "WIN") weeklyData[key].wins++;
      if (t.result === "LOSS") weeklyData[key].losses++;
      weeklyData[key].money += t.moneyResult || 0;
    });

    const weeklyChart = Object.entries(weeklyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([week, data]) => ({
        week: new Date(week).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        winRate: data.trades > 0 ? Math.round((data.wins / data.trades) * 100) : 0,
        money: Math.round(data.money * 100) / 100,
        trades: data.trades,
      }));

    // Consecutive profitable days
    let profitDayStreak = 0, maxProfitDayStreak = 0;
    uniqueDates.forEach(d => {
      const dayMoney = sorted.filter(t => t.date === d).reduce((s, t) => s + (t.moneyResult || 0), 0);
      if (dayMoney > 0) {
        profitDayStreak++;
        maxProfitDayStreak = Math.max(maxProfitDayStreak, profitDayStreak);
      } else {
        profitDayStreak = 0;
      }
    });

    return {
      maxWinStreak,
      maxLossStreak,
      currentStreak,
      currentStreakType,
      daysActive: uniqueDates.length,
      avgTradesPerDay: Math.round(avgTradesPerDay * 10) / 10,
      maxProfitDayStreak,
      weeklyChart,
    };
  }, [trades]);

  // ============ 4. ANÁLISE POR DIA DA SEMANA ============
  const dayOfWeekStats = useMemo(() => {
    if (trades.length === 0) return null;

    const dayStats: Record<number, { wins: number; losses: number; total: number; money: number }> = {};
    for (let i = 0; i < 7; i++) dayStats[i] = { wins: 0, losses: 0, total: 0, money: 0 };

    trades.forEach(t => {
      const day = new Date(t.date).getDay();
      dayStats[day].total++;
      if (t.result === "WIN") dayStats[day].wins++;
      if (t.result === "LOSS") dayStats[day].losses++;
      dayStats[day].money += t.moneyResult || 0;
    });

    const chartData = [1, 2, 3, 4, 5].map(d => ({
      day: DAY_NAMES[d],
      dayShort: DAY_NAMES[d].slice(0, 3),
      winRate: dayStats[d].total > 0 ? Math.round((dayStats[d].wins / dayStats[d].total) * 100) : 0,
      trades: dayStats[d].total,
      money: Math.round(dayStats[d].money * 100) / 100,
      wins: dayStats[d].wins,
      losses: dayStats[d].losses,
    }));

    const bestDay = chartData.reduce((a, b) => (b.money > a.money ? b : a), chartData[0]);
    const worstDay = chartData.filter(d => d.trades > 0).reduce((a, b) => (b.money < a.money ? b : a), chartData[0]);
    const mostActive = chartData.reduce((a, b) => (b.trades > a.trades ? b : a), chartData[0]);

    // Session stats
    const sessionStats: Record<string, { wins: number; losses: number; total: number; money: number }> = {};
    trades.forEach(t => {
      const session = t.session || "N/A";
      if (!sessionStats[session]) sessionStats[session] = { wins: 0, losses: 0, total: 0, money: 0 };
      sessionStats[session].total++;
      if (t.result === "WIN") sessionStats[session].wins++;
      if (t.result === "LOSS") sessionStats[session].losses++;
      sessionStats[session].money += t.moneyResult || 0;
    });

    const sessionChart = Object.entries(sessionStats).map(([session, data]) => ({
      session,
      winRate: data.total > 0 ? Math.round((data.wins / data.total) * 100) : 0,
      trades: data.total,
      money: Math.round(data.money * 100) / 100,
    }));

    // Hour stats
    const hourStats: Record<string, { wins: number; losses: number; total: number; money: number }> = {};
    trades.forEach(t => {
      if (t.entryTime) {
        const hour = t.entryTime.split(':')[0] + 'h';
        if (!hourStats[hour]) hourStats[hour] = { wins: 0, losses: 0, total: 0, money: 0 };
        hourStats[hour].total++;
        if (t.result === "WIN") hourStats[hour].wins++;
        if (t.result === "LOSS") hourStats[hour].losses++;
        hourStats[hour].money += t.moneyResult || 0;
      }
    });

    const hourChart = Object.entries(hourStats)
      .map(([hour, data]) => ({
        hour,
        winRate: data.total > 0 ? Math.round((data.wins / data.total) * 100) : 0,
        trades: data.total,
        money: Math.round(data.money * 100) / 100,
        wins: data.wins,
        losses: data.losses,
      }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

    const bestHour = hourChart.length > 0 ? hourChart.reduce((a, b) => (b.money > a.money ? b : a), hourChart[0]) : null;

    return { chartData, bestDay, worstDay, mostActive, sessionChart, hourChart, bestHour };
  }, [trades]);

  // ============ DAILY STATS for existing charts ============
  const dailyStats = useMemo(() => {
    const grouped: Record<string, TradeWithChecklist[]> = {};
    trades.forEach(t => {
      if (!grouped[t.date]) grouped[t.date] = [];
      grouped[t.date].push(t);
    });
    return Object.entries(grouped)
      .map(([date, dayTrades]) => {
        const wins = dayTrades.filter(t => t.result === "WIN").length;
        const losses = dayTrades.filter(t => t.result === "LOSS").length;
        const money = dayTrades.reduce((s, t) => s + (t.moneyResult || 0), 0);
        return {
          date,
          wins,
          losses,
          total: dayTrades.length,
          winRate: dayTrades.length > 0 ? Math.round((wins / dayTrades.length) * 100) : 0,
          money: Math.round(money * 100) / 100,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);
  }, [trades]);

  if (trades.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          Nenhum trade registrado ainda. Comece a registrar para ver insights poderosos!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filtro de Período */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Período:</span>
          {PERIOD_OPTIONS.map(opt => (
            <Button
              key={opt.value}
              variant={period === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(opt.value)}
              className="h-8"
            >
              {opt.label}
            </Button>
          ))}
          {period !== "all" && (
            <Badge variant="secondary" className="ml-2">
              {trades.length} de {allTrades.length} trades
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => {
            const periodLabel = PERIOD_OPTIONS.find(o => o.value === period)?.label || "Tudo";
            exportInsightsPdf({
              overallStats,
              disciplineStats,
              emotionalStats,
              streakStats,
              dayOfWeekStats,
              periodLabel,
              tradesCount: trades.length,
            });
            toast.success("PDF de Insights exportado com sucesso!");
          }}
        >
          <Download className="w-3.5 h-3.5" />
          Exportar PDF
        </Button>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card><CardContent className="pt-4 pb-3 text-center">
          <p className="text-xs text-muted-foreground">Trades</p>
          <p className="text-2xl font-bold text-primary">{overallStats.total}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 text-center">
          <p className="text-xs text-muted-foreground">Wins</p>
          <p className="text-2xl font-bold text-green-600">{overallStats.wins}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 text-center">
          <p className="text-xs text-muted-foreground">Losses</p>
          <p className="text-2xl font-bold text-red-600">{overallStats.losses}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 text-center">
          <p className="text-xs text-muted-foreground">Win Rate</p>
          <p className="text-2xl font-bold text-blue-600">{overallStats.winRate.toFixed(1)}%</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 text-center">
          <p className="text-xs text-muted-foreground">Resultado</p>
          <p className={`text-2xl font-bold ${overallStats.totalMoney >= 0 ? "text-green-600" : "text-red-600"}`}>${overallStats.totalMoney.toFixed(2)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 text-center">
          <p className="text-xs text-muted-foreground">Ganho Médio</p>
          <p className="text-2xl font-bold text-green-600">${overallStats.avgWin.toFixed(2)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 text-center">
          <p className="text-xs text-muted-foreground">Perda Média</p>
          <p className="text-2xl font-bold text-red-600">${overallStats.avgLoss.toFixed(2)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 text-center">
          <p className="text-xs text-muted-foreground">Fator Lucro</p>
          <p className="text-2xl font-bold text-primary">{overallStats.profitFactor.toFixed(2)}</p>
        </CardContent></Card>
      </div>

      {/* ============ SEÇÃO 1: DISCIPLINA OPERACIONAL ============ */}
      {disciplineStats && (
        <>
          <div className="flex items-center gap-2 pt-4">
            <Shield className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Disciplina Operacional</h2>
            <Badge variant="outline" className="ml-2">Score Médio: {disciplineStats.avgScore.toFixed(1)}/7</Badge>
          </div>

          {/* Impacto do Checklist */}
          <div className="grid md:grid-cols-3 gap-4">
            {disciplineStats.comparisonData.map((item, i) => (
              <Card key={i} className={`border-l-4 ${i === 0 ? "border-l-green-500" : i === 1 ? "border-l-yellow-500" : "border-l-red-500"}`}>
                <CardContent className="pt-4">
                  <p className="text-sm font-semibold text-muted-foreground">{item.name}</p>
                  <p className="text-3xl font-bold mt-1" style={{ color: i === 0 ? COLORS.win : i === 1 ? COLORS.accent : COLORS.loss }}>
                    {item.winRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">{item.trades} trades • ${item.money.toFixed(2)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Radar de Compliance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Radar de Disciplina</CardTitle>
              <CardDescription>Compliance e win rate por item do checklist</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={disciplineStats.radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Compliance %" dataKey="compliance" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.3} />
                  <Radar name="Win Rate %" dataKey="winRate" stroke={COLORS.win} fill={COLORS.win} fillOpacity={0.2} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Item por item */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Impacto de Cada Item</CardTitle>
              <CardDescription>Win rate quando segue vs quando não segue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {disciplineStats.itemStats.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/20">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">Compliance: {item.compliance.toFixed(0)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Com ✓</p>
                      <p className="text-lg font-bold text-green-600">{item.winRateWhenFollowed.toFixed(0)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Sem ✗</p>
                      <p className="text-lg font-bold text-red-600">{item.winRateWhenNot.toFixed(0)}%</p>
                    </div>
                    <div className="text-center min-w-[60px]">
                      <p className="text-xs text-muted-foreground">Impacto</p>
                      <p className={`text-lg font-bold ${(item.winRateWhenFollowed - item.winRateWhenNot) >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {(item.winRateWhenFollowed - item.winRateWhenNot) >= 0 ? "+" : ""}{(item.winRateWhenFollowed - item.winRateWhenNot).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ============ SEÇÃO 2: ANÁLISE EMOCIONAL ============ */}
      {emotionalStats && (
        <>
          <div className="flex items-center gap-2 pt-4">
            <Brain className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-bold text-foreground">Análise Emocional & Racional</h2>
          </div>

          {/* Comparação emocional alta vs baixa */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="font-semibold text-sm">Preparo Alto (5-6 itens ✓)</p>
                </div>
                <p className="text-3xl font-bold text-green-600">{emotionalStats.highEmotionalWR.toFixed(1)}% WR</p>
                <p className="text-xs text-muted-foreground">{emotionalStats.highEmotionalCount} trades • ${emotionalStats.highEmotionalMoney.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <p className="font-semibold text-sm">Preparo Baixo (0-2 itens ✓)</p>
                </div>
                <p className="text-3xl font-bold text-red-600">{emotionalStats.lowEmotionalWR.toFixed(1)}% WR</p>
                <p className="text-xs text-muted-foreground">{emotionalStats.lowEmotionalCount} trades • ${emotionalStats.lowEmotionalMoney.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Impacto emocional detalhado */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: "Emocional", items: emotionalStats.emotional, color: "text-blue-600" },
              { title: "Racional", items: emotionalStats.rational, color: "text-purple-600" },
              { title: "Rotina", items: emotionalStats.routine, color: "text-amber-600" },
            ].map((category) => (
              <Card key={category.title}>
                <CardHeader className="pb-3">
                  <CardTitle className={`text-base ${category.color}`}>{category.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {category.items.map((item, i) => (
                    <div key={i} className="p-2 rounded border border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{item.icon} {item.label}</span>
                        <span className="text-xs text-muted-foreground">{item.compliance.toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${item.compliance}%` }} />
                        </div>
                        <span className={`text-xs font-bold ${item.impact >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {item.impact >= 0 ? "+" : ""}{item.impact.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ============ SEÇÃO 3: STREAKS & CONSISTÊNCIA ============ */}
      {streakStats && (
        <>
          <div className="flex items-center gap-2 pt-4">
            <Flame className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-bold text-foreground">Streaks & Consistência</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
              <CardContent className="pt-4 text-center">
                <Award className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-600">{streakStats.maxWinStreak}</p>
                <p className="text-xs text-muted-foreground">Melhor Win Streak</p>
              </CardContent>
            </Card>
            <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
              <CardContent className="pt-4 text-center">
                <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-red-600">{streakStats.maxLossStreak}</p>
                <p className="text-xs text-muted-foreground">Pior Loss Streak</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4 text-center">
                <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-blue-600">{streakStats.daysActive}</p>
                <p className="text-xs text-muted-foreground">Dias Ativos</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
              <CardContent className="pt-4 text-center">
                <Target className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-purple-600">{streakStats.avgTradesPerDay}</p>
                <p className="text-xs text-muted-foreground">Trades/Dia (média)</p>
              </CardContent>
            </Card>
          </div>

          {/* Streak atual */}
          <Card className={`border-2 ${streakStats.currentStreakType === "WIN" ? "border-green-500 bg-green-50 dark:bg-green-950/20" : streakStats.currentStreakType === "LOSS" ? "border-red-500 bg-red-50 dark:bg-red-950/20" : "border-border"}`}>
            <CardContent className="pt-4 flex items-center gap-4">
              {streakStats.currentStreakType === "WIN" ? (
                <TrendingUp className="w-8 h-8 text-green-600" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-600" />
              )}
              <div>
                <p className="text-sm text-muted-foreground">Sequência Atual</p>
                <p className={`text-2xl font-bold ${streakStats.currentStreakType === "WIN" ? "text-green-600" : "text-red-600"}`}>
                  {streakStats.currentStreak} {streakStats.currentStreakType === "WIN" ? "vitórias" : streakStats.currentStreakType === "LOSS" ? "derrotas" : "empates"} consecutivas
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm text-muted-foreground">Dias Lucrativos Seguidos (recorde)</p>
                <p className="text-2xl font-bold text-primary">{streakStats.maxProfitDayStreak}</p>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico semanal */}
          {streakStats.weeklyChart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evolução Semanal</CardTitle>
                <CardDescription>Win rate e resultado por semana (últimas 12 semanas)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={streakStats.weeklyChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" domain={[0, 100]} />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="right" dataKey="money" fill={COLORS.primary} name="Resultado ($)" opacity={0.7} />
                    <Line yAxisId="left" type="monotone" dataKey="winRate" stroke={COLORS.win} name="Win Rate (%)" strokeWidth={2} dot={{ fill: COLORS.win }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ============ SEÇÃO 4: ANÁLISE POR DIA DA SEMANA ============ */}
      {dayOfWeekStats && (
        <>
          <div className="flex items-center gap-2 pt-4">
            <Calendar className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold text-foreground">Análise por Dia da Semana</h2>
          </div>

          {/* Highlights */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Melhor Dia</p>
                <p className="text-xl font-bold text-green-600">{dayOfWeekStats.bestDay.day}</p>
                <p className="text-sm text-muted-foreground">${dayOfWeekStats.bestDay.money} • {dayOfWeekStats.bestDay.winRate}% WR</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Pior Dia</p>
                <p className="text-xl font-bold text-red-600">{dayOfWeekStats.worstDay.day}</p>
                <p className="text-sm text-muted-foreground">${dayOfWeekStats.worstDay.money} • {dayOfWeekStats.worstDay.winRate}% WR</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Mais Ativo</p>
                <p className="text-xl font-bold text-blue-600">{dayOfWeekStats.mostActive.day}</p>
                <p className="text-sm text-muted-foreground">{dayOfWeekStats.mostActive.trades} trades</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico por dia */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance por Dia</CardTitle>
              <CardDescription>Win rate e resultado financeiro de segunda a sexta</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={dayOfWeekStats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dayShort" />
                  <YAxis yAxisId="left" domain={[0, 100]} />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="right" dataKey="money" name="Resultado ($)" fill={COLORS.primary} opacity={0.7} />
                  <Line yAxisId="left" type="monotone" dataKey="winRate" name="Win Rate (%)" stroke={COLORS.win} strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tabela detalhada */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalhamento por Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dayOfWeekStats.chartData.map((day, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/20">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm w-20">{day.day}</span>
                      <Badge variant="outline">{day.trades} trades</Badge>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">W/L</p>
                        <p className="text-sm font-bold"><span className="text-green-600">{day.wins}</span>/<span className="text-red-600">{day.losses}</span></p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Win Rate</p>
                        <p className={`text-sm font-bold ${day.winRate >= 50 ? "text-green-600" : "text-red-600"}`}>{day.winRate}%</p>
                      </div>
                      <div className="text-center min-w-[70px]">
                        <p className="text-xs text-muted-foreground">Resultado</p>
                        <p className={`text-sm font-bold ${day.money >= 0 ? "text-green-600" : "text-red-600"}`}>${day.money}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sessão */}
          {dayOfWeekStats.sessionChart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance por Sessão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dayOfWeekStats.sessionChart.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/20">
                      <div>
                        <p className="font-semibold text-sm">{s.session}</p>
                        <p className="text-xs text-muted-foreground">{s.trades} trades</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className={`text-lg font-bold ${s.winRate >= 50 ? "text-green-600" : "text-red-600"}`}>{s.winRate}%</p>
                          <p className="text-xs text-muted-foreground">Win Rate</p>
                        </div>
                        <div className="text-center min-w-[70px]">
                          <p className={`text-lg font-bold ${s.money >= 0 ? "text-green-600" : "text-red-600"}`}>${s.money}</p>
                          <p className="text-xs text-muted-foreground">Resultado</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dica personalizada */}
          <Card className="border-2 border-primary/30 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Zap className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-foreground mb-1">💡 Insight Personalizado</p>
                  <p className="text-sm text-foreground/80">
                    Seu melhor dia é <strong>{dayOfWeekStats.bestDay.day}</strong> com {dayOfWeekStats.bestDay.winRate}% de win rate.
                    {dayOfWeekStats.worstDay.money < 0 && (
                      <> Considere reduzir posição ou evitar operar na <strong>{dayOfWeekStats.worstDay.day}</strong> (${dayOfWeekStats.worstDay.money}).</>
                    )}
                    {disciplineStats && disciplineStats.avgScore < 5 && (
                      <> Sua disciplina operacional está em {disciplineStats.avgScore.toFixed(1)}/7 — tente seguir o checklist completo para melhorar seus resultados.</>
                    )}
                    {emotionalStats && emotionalStats.highEmotionalWR > emotionalStats.lowEmotionalWR + 10 && (
                      <> Quando você se prepara emocionalmente, seu win rate sobe {(emotionalStats.highEmotionalWR - emotionalStats.lowEmotionalWR).toFixed(0)}% — mantenha a rotina!</>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Performance Diária (gráfico existente melhorado) */}
      {dailyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução Diária (Últimos 30 dias)</CardTitle>
            <CardDescription>Resultado financeiro e win rate por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="money" fill={COLORS.primary} stroke={COLORS.primary} fillOpacity={0.2} name="Resultado ($)" />
                <Line yAxisId="right" type="monotone" dataKey="winRate" stroke={COLORS.win} name="Win Rate (%)" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
