import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { useAccountManager } from '@/hooks/useAccountManager';
import { useTradeJournalUnified } from '@/hooks/useTradeJournalUnified';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Target, Shield, AlertTriangle, ChevronDown, ChevronUp, Zap, BarChart3, Eye, EyeOff, DollarSign, Clock, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface DirectionalStats {
  trades: number;
  wins: number;
  pips: number;
  money: number;
}

interface TimeStats {
  trades: number;
  wins: number;
  pips: number;
  money: number;
}

interface AssetStats {
  asset: string;
  totalTrades: number;
  wins: number;
  losses: number;
  breakeven: number;
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
  smartScore: number;
  bestStreak: number;
  worstStreak: number;
  avgMoneyPerTrade: number;
  consistency: number;
  lastResult: string;
  recentTrend: number; // last 5 trades WR
}

const getDayName = (dayIndex: number) => {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return days[dayIndex] || 'N/A';
};

const calculateSmartScore = (winRate: number, avgRR: number, totalTrades: number, consistency: number, totalMoney: number): number => {
  let score = 0;
  // Win rate contribution (max 3)
  score += Math.min(3, (winRate / 100) * 3.5);
  // R:R contribution (max 2)
  score += Math.min(2, avgRR * 0.8);
  // Sample size contribution (max 1.5)
  score += Math.min(1.5, totalTrades * 0.1);
  // Consistency (max 1.5)
  score += Math.min(1.5, consistency * 1.5);
  // Profitability bonus (max 2)
  if (totalMoney > 0) score += Math.min(2, 1 + Math.log10(Math.max(totalMoney, 1)) * 0.3);
  return Math.min(10, Math.max(0, score));
};

const calculateGrade = (smartScore: number) => {
  if (smartScore >= 7.5) return 'A';
  if (smartScore >= 5.5) return 'B';
  if (smartScore >= 3.5) return 'C';
  return 'D';
};

const getGradeColor = (grade: string) => {
  switch (grade) {
    case 'A': return 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20';
    case 'B': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20';
    case 'C': return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20';
    case 'D': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getGradeEmoji = (grade: string) => {
  switch (grade) {
    case 'A': return '🏆';
    case 'B': return '✅';
    case 'C': return '⚠️';
    case 'D': return '🚫';
    default: return '❓';
  }
};

const getRecommendation = (stat: AssetStats): { text: string; type: 'success' | 'warning' | 'danger'; actions: string[] } => {
  const actions: string[] = [];

  if (stat.totalTrades < 5) {
    return { text: 'Dados insuficientes para avaliação. Opere mais vezes para gerar recomendações.', type: 'warning', actions: ['Acumule pelo menos 10 trades neste ativo'] };
  }

  if (stat.grade === 'A') {
    actions.push('✅ Continue operando este ativo');
    if (stat.longs.trades > 0 && stat.shorts.trades > 0) {
      const longWr = stat.longs.wins / stat.longs.trades * 100;
      const shortWr = stat.shorts.wins / stat.shorts.trades * 100;
      if (longWr > shortWr + 15) actions.push(`📈 Priorize posições Long (${longWr.toFixed(0)}% WR vs ${shortWr.toFixed(0)}%)`);
      else if (shortWr > longWr + 15) actions.push(`📉 Priorize posições Short (${shortWr.toFixed(0)}% WR vs ${longWr.toFixed(0)}%)`);
    }
    const bestSession = Object.entries(stat.sessions).sort((a, b) => b[1].money - a[1].money)[0];
    if (bestSession) actions.push(`🕐 Melhor sessão: ${bestSession[0]}`);
    return { text: 'Excelente performance! Este é um dos seus melhores ativos.', type: 'success', actions };
  }

  if (stat.grade === 'B') {
    actions.push('✅ Ativo operável, mantenha a disciplina');
    if (stat.avgRR < 1.5) actions.push('📊 Tente melhorar o R:R (alvo ≥ 1.5)');
    if (stat.winRate < 55) actions.push('🎯 Melhore a taxa de acerto (alvo ≥ 55%)');
    return { text: 'Bom desempenho, mas há espaço para otimização.', type: 'success', actions };
  }

  if (stat.grade === 'C') {
    actions.push('⚠️ Reduza o tamanho da posição');
    if (stat.winRate < 45) actions.push('🎯 Revise seus critérios de entrada');
    if (stat.avgRR < 1) actions.push('📊 R:R muito baixo — ajuste stops e alvos');
    if (stat.worstStreak >= 3) actions.push(`🛑 Já teve ${stat.worstStreak} losses seguidos — cuidado!`);
    return { text: 'Performance mediana. Considere operar com cautela.', type: 'warning', actions };
  }

  actions.push('🚫 Considere parar de operar este ativo');
  actions.push('📖 Estude o comportamento do ativo antes de voltar');
  if (stat.totalMoney < 0) actions.push(`💰 Prejuízo acumulado: $${Math.abs(stat.totalMoney).toFixed(2)}`);
  return { text: 'Performance ruim. Recomendado evitar este ativo.', type: 'danger', actions };
};

const PIE_COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444'];

export default function AssetPerformanceAnalysis() {
  const { activeAccountId } = useAccountManager();
  const { trades } = useTradeJournalUnified(activeAccountId);
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('smartScore');
  const [showHidden, setShowHidden] = useState(false);
  const [hiddenAssets, setHiddenAssets] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('hiddenAssets') || '[]'); } catch { return []; }
  });

  const assetStats = useMemo(() => {
    const stats: Record<string, AssetStats> = {};

    // Sort trades by date for streak calc
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedTrades.forEach((trade) => {
      if (!stats[trade.asset]) {
        stats[trade.asset] = {
          asset: trade.asset, totalTrades: 0, wins: 0, losses: 0, breakeven: 0,
          winRate: 0, totalPips: 0, avgPips: 0, totalMoney: 0, totalRR: 0, rrTrades: 0, avgRR: 0,
          longs: { trades: 0, wins: 0, pips: 0, money: 0 },
          shorts: { trades: 0, wins: 0, pips: 0, money: 0 },
          sessions: {}, days: {}, grade: 'D', smartScore: 0,
          bestStreak: 0, worstStreak: 0, avgMoneyPerTrade: 0,
          consistency: 0, lastResult: '', recentTrend: 0,
        };
      }

      const stat = stats[trade.asset];
      const entry = parseFloat(trade.entryPrice);
      const exit = parseFloat(trade.exitPrice);
      const pips = !isNaN(entry) && !isNaN(exit) ? Math.abs(exit - entry) * 10000 : 0;
      const actualPips = trade.result === 'LOSS' ? -pips : (trade.result === 'WIN' ? pips : 0);
      const money = trade.moneyResult || 0;

      stat.totalTrades += 1;
      stat.totalPips += actualPips;
      stat.totalMoney += money;
      stat.lastResult = trade.result || '';

      if (trade.riskReward) { stat.totalRR += trade.riskReward; stat.rrTrades += 1; }

      const isWin = trade.result === 'WIN';
      const isLoss = trade.result === 'LOSS';
      if (isWin) stat.wins += 1;
      else if (isLoss) stat.losses += 1;
      else stat.breakeven += 1;

      // Directional
      let direction = 'NONE';
      if (!isNaN(entry) && !isNaN(exit)) {
        if (isWin) direction = exit > entry ? 'LONG' : 'SHORT';
        else if (isLoss) direction = exit < entry ? 'LONG' : 'SHORT';
      }
      if (direction === 'LONG') {
        stat.longs.trades += 1; stat.longs.pips += actualPips; stat.longs.money += money;
        if (isWin) stat.longs.wins += 1;
      } else if (direction === 'SHORT') {
        stat.shorts.trades += 1; stat.shorts.pips += actualPips; stat.shorts.money += money;
        if (isWin) stat.shorts.wins += 1;
      }

      // Session
      const session = trade.marketSession || trade.session || 'Outra';
      if (!stat.sessions[session]) stat.sessions[session] = { trades: 0, wins: 0, pips: 0, money: 0 };
      stat.sessions[session].trades += 1;
      stat.sessions[session].pips += actualPips;
      stat.sessions[session].money += money;
      if (isWin) stat.sessions[session].wins += 1;

      // Day
      if (trade.date) {
        const day = new Date(trade.date).getDay();
        if (!isNaN(day)) {
          if (!stat.days[day]) stat.days[day] = { trades: 0, wins: 0, pips: 0, money: 0 };
          stat.days[day].trades += 1;
          stat.days[day].pips += actualPips;
          stat.days[day].money += money;
          if (isWin) stat.days[day].wins += 1;
        }
      }
    });

    // Calculate derived stats
    Object.values(stats).forEach((stat) => {
      stat.winRate = stat.totalTrades > 0 ? (stat.wins / stat.totalTrades) * 100 : 0;
      stat.avgPips = stat.totalTrades > 0 ? stat.totalPips / stat.totalTrades : 0;
      stat.avgRR = stat.rrTrades > 0 ? stat.totalRR / stat.rrTrades : 0;
      stat.avgMoneyPerTrade = stat.totalTrades > 0 ? stat.totalMoney / stat.totalTrades : 0;

      // Streaks
      const assetTrades = sortedTrades.filter(t => t.asset === stat.asset);
      let cW = 0, cL = 0, maxW = 0, maxL = 0;
      assetTrades.forEach(t => {
        if (t.result === 'WIN') { cW++; cL = 0; maxW = Math.max(maxW, cW); }
        else if (t.result === 'LOSS') { cL++; cW = 0; maxL = Math.max(maxL, cL); }
        else { cW = 0; cL = 0; }
      });
      stat.bestStreak = maxW;
      stat.worstStreak = maxL;

      // Consistency (% of profitable days)
      const dayResults: Record<string, number> = {};
      assetTrades.forEach(t => {
        const dateKey = t.date?.split('T')[0] || '';
        if (!dayResults[dateKey]) dayResults[dateKey] = 0;
        dayResults[dateKey] += (t.moneyResult || 0);
      });
      const profitDays = Object.values(dayResults).filter(v => v > 0).length;
      const totalDays = Object.keys(dayResults).length;
      stat.consistency = totalDays > 0 ? profitDays / totalDays : 0;

      // Recent trend (last 5)
      const last5 = assetTrades.slice(-5);
      stat.recentTrend = last5.length > 0 ? (last5.filter(t => t.result === 'WIN').length / last5.length) * 100 : 0;

      // Smart Score & Grade
      stat.smartScore = calculateSmartScore(stat.winRate, stat.avgRR, stat.totalTrades, stat.consistency, stat.totalMoney);
      stat.grade = calculateGrade(stat.smartScore);
    });

    return Object.values(stats);
  }, [trades]);

  const sortedStats = useMemo(() => {
    const filtered = showHidden ? assetStats : assetStats.filter(s => !hiddenAssets.includes(s.asset));
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'smartScore': return b.smartScore - a.smartScore;
        case 'winRate': return b.winRate - a.winRate;
        case 'money': return b.totalMoney - a.totalMoney;
        case 'trades': return b.totalTrades - a.totalTrades;
        case 'rr': return b.avgRR - a.avgRR;
        default: return b.smartScore - a.smartScore;
      }
    });
  }, [assetStats, sortBy, showHidden, hiddenAssets]);

  const gradeDistribution = useMemo(() => {
    const dist = { A: 0, B: 0, C: 0, D: 0 };
    assetStats.forEach(s => { dist[s.grade as keyof typeof dist] += 1; });
    return [
      { name: 'Classe A', value: dist.A },
      { name: 'Classe B', value: dist.B },
      { name: 'Classe C', value: dist.C },
      { name: 'Classe D', value: dist.D },
    ].filter(d => d.value > 0);
  }, [assetStats]);

  const radarData = useMemo(() => {
    return sortedStats.slice(0, 6).map(s => ({
      asset: s.asset,
      'Win Rate': Math.round(s.winRate),
      'Smart Score': Math.round(s.smartScore * 10),
      'R:R': Math.round(Math.min(s.avgRR * 33, 100)),
      'Consistência': Math.round(s.consistency * 100),
      'Tendência': Math.round(s.recentTrend),
    }));
  }, [sortedStats]);

  const toggleHideAsset = (asset: string) => {
    const updated = hiddenAssets.includes(asset) ? hiddenAssets.filter(a => a !== asset) : [...hiddenAssets, asset];
    setHiddenAssets(updated);
    localStorage.setItem('hiddenAssets', JSON.stringify(updated));
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

  const topAsset = sortedStats[0];
  const worstAsset = [...assetStats].filter(s => s.totalTrades >= 3).sort((a, b) => a.smartScore - b.smartScore)[0];

  return (
    <div className="space-y-4">
      {/* Quick Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Ativos Operados</p>
            <p className="text-2xl font-bold">{assetStats.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Melhor Ativo</p>
            <p className="text-lg font-bold text-green-600">{topAsset?.asset || '-'}</p>
            <p className="text-xs text-muted-foreground">{topAsset ? `${topAsset.smartScore.toFixed(1)}/10` : ''}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Pior Ativo</p>
            <p className="text-lg font-bold text-red-600">{worstAsset?.asset || '-'}</p>
            <p className="text-xs text-muted-foreground">{worstAsset ? `${worstAsset.smartScore.toFixed(1)}/10` : ''}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">WR Média</p>
            <p className="text-2xl font-bold">
              {assetStats.length > 0
                ? (assetStats.reduce((s, a) => s + a.winRate, 0) / assetStats.length).toFixed(1)
                : '0'}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">P/L Total</p>
            <p className={`text-2xl font-bold ${assetStats.reduce((s, a) => s + a.totalMoney, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${assetStats.reduce((s, a) => s + a.totalMoney, 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ranking" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1">
          <TabsTrigger value="ranking" className="text-xs">🏅 Ranking</TabsTrigger>
          <TabsTrigger value="charts" className="text-xs">📊 Gráficos</TabsTrigger>
          <TabsTrigger value="radar" className="text-xs">🎯 Radar</TabsTrigger>
          <TabsTrigger value="recommendations" className="text-xs">💡 Recomendações</TabsTrigger>
        </TabsList>

        {/* RANKING TAB */}
        <TabsContent value="ranking" className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="smartScore">Smart Score</SelectItem>
                  <SelectItem value="winRate">Win Rate</SelectItem>
                  <SelectItem value="money">P/L Total</SelectItem>
                  <SelectItem value="trades">Nº Trades</SelectItem>
                  <SelectItem value="rr">R:R Médio</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => setShowHidden(!showHidden)}>
                {showHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showHidden ? 'Ocultar inativos' : `Mostrar ocultos (${hiddenAssets.length})`}
              </Button>
            </div>
          </div>

          {sortedStats.map((stat, idx) => {
            const isExpanded = expandedAsset === stat.asset;
            const rec = getRecommendation(stat);
            const isHidden = hiddenAssets.includes(stat.asset);
            const longWr = stat.longs.trades > 0 ? (stat.longs.wins / stat.longs.trades * 100) : 0;
            const shortWr = stat.shorts.trades > 0 ? (stat.shorts.wins / stat.shorts.trades * 100) : 0;
            const bestSession = Object.entries(stat.sessions).sort((a, b) => b[1].money - a[1].money)[0];
            const bestDay = Object.entries(stat.days).sort((a, b) => b[1].money - a[1].money)[0];
            const trendIcon = stat.recentTrend >= 60 ? <TrendingUp className="w-3.5 h-3.5 text-green-500" /> : stat.recentTrend <= 40 ? <TrendingDown className="w-3.5 h-3.5 text-red-500" /> : <Target className="w-3.5 h-3.5 text-yellow-500" />;

            return (
              <Card key={stat.asset} className={`transition-all ${isHidden ? 'opacity-50' : ''}`}>
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedAsset(isExpanded ? null : stat.asset)}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>

                  {/* Asset name + badge */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{stat.asset}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getGradeColor(stat.grade)}`}>
                        {getGradeEmoji(stat.grade)} {stat.grade}
                      </Badge>
                      {trendIcon}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>{stat.totalTrades} trades</span>
                      <span>{stat.winRate.toFixed(1)}% WR</span>
                      <span className={stat.totalMoney >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ${stat.totalMoney.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Smart Score */}
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-yellow-500" />
                      <span className="font-bold text-lg">{stat.smartScore.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">/10</span>
                    </div>
                    <Progress value={stat.smartScore * 10} className="w-16 h-1.5 mt-1" />
                  </div>

                  {/* Expand icon */}
                  <div className="flex-shrink-0 flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); toggleHideAsset(stat.asset); }}>
                      {isHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-muted-foreground" />}
                    </Button>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <CardContent className="pt-0 pb-4 space-y-4 border-t">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      <div className="bg-muted/30 rounded-lg p-2.5">
                        <p className="text-[10px] text-muted-foreground uppercase">Win Rate</p>
                        <p className="font-bold text-lg">{stat.winRate.toFixed(1)}%</p>
                        <p className="text-[10px] text-muted-foreground">{stat.wins}W / {stat.losses}L / {stat.breakeven}BE</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2.5">
                        <p className="text-[10px] text-muted-foreground uppercase">R:R Médio</p>
                        <p className="font-bold text-lg">1:{stat.avgRR.toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">em {stat.rrTrades} trades</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2.5">
                        <p className="text-[10px] text-muted-foreground uppercase">$/Trade Médio</p>
                        <p className={`font-bold text-lg ${stat.avgMoneyPerTrade >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${stat.avgMoneyPerTrade.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2.5">
                        <p className="text-[10px] text-muted-foreground uppercase">Consistência</p>
                        <p className="font-bold text-lg">{(stat.consistency * 100).toFixed(0)}%</p>
                        <p className="text-[10px] text-muted-foreground">dias lucrativos</p>
                      </div>
                    </div>

                    {/* Direction + Streaks */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-muted/30 rounded-lg p-2.5">
                        <p className="text-[10px] text-muted-foreground uppercase mb-2 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> Direcional
                        </p>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span>📈 Long</span>
                            <span className="font-medium">{stat.longs.trades} trades • {longWr.toFixed(0)}% WR • ${stat.longs.money.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>📉 Short</span>
                            <span className="font-medium">{stat.shorts.trades} trades • {shortWr.toFixed(0)}% WR • ${stat.shorts.money.toFixed(2)}</span>
                          </div>
                          {stat.longs.trades > 0 && stat.shorts.trades > 0 && (
                            <p className="text-[10px] mt-1 font-medium">
                              {longWr > shortWr ? '✅ Melhor em Long' : shortWr > longWr ? '✅ Melhor em Short' : '⚖️ Equilibrado'}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="bg-muted/30 rounded-lg p-2.5">
                        <p className="text-[10px] text-muted-foreground uppercase mb-2 flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Streaks
                        </p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>🔥 Melhor sequência</span>
                            <span className="font-bold text-green-600">{stat.bestStreak} wins</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>❄️ Pior sequência</span>
                            <span className="font-bold text-red-600">{stat.worstStreak} losses</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>📈 Últimos 5</span>
                            <span className={`font-bold ${stat.recentTrend >= 60 ? 'text-green-600' : stat.recentTrend <= 40 ? 'text-red-600' : 'text-yellow-600'}`}>
                              {stat.recentTrend.toFixed(0)}% WR
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-muted/30 rounded-lg p-2.5">
                        <p className="text-[10px] text-muted-foreground uppercase mb-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Melhor Horário/Dia
                        </p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>🕐 Sessão</span>
                            <span className="font-medium">{bestSession ? `${bestSession[0]} ($${bestSession[1].money.toFixed(2)})` : '-'}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>📅 Dia</span>
                            <span className="font-medium">{bestDay ? `${getDayName(parseInt(bestDay[0]))} ($${bestDay[1].money.toFixed(2)})` : '-'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className={`rounded-lg p-3 border ${rec.type === 'success' ? 'bg-green-500/5 border-green-500/20' : rec.type === 'warning' ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                      <div className="flex items-start gap-2">
                        {rec.type === 'success' ? <Shield className="w-4 h-4 text-green-500 mt-0.5" /> :
                          rec.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" /> :
                          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />}
                        <div>
                          <p className="text-sm font-medium">{rec.text}</p>
                          <ul className="mt-1.5 space-y-0.5">
                            {rec.actions.map((a, i) => (
                              <li key={i} className="text-xs text-muted-foreground">{a}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </TabsContent>

        {/* CHARTS TAB */}
        <TabsContent value="charts" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Performance por Ativo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={sortedStats.map(s => ({ asset: s.asset, 'Win Rate': parseFloat(s.winRate.toFixed(1)), 'P/L': parseFloat(s.totalMoney.toFixed(2)), 'R:R': parseFloat(s.avgRR.toFixed(2)) }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="asset" fontSize={11} />
                  <YAxis yAxisId="left" fontSize={10} />
                  <YAxis yAxisId="right" orientation="right" fontSize={10} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="Win Rate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="R:R" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Distribuição por Classe</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={gradeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                      {gradeDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">P/L por Ativo ($)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={sortedStats.map(s => ({ asset: s.asset, money: parseFloat(s.totalMoney.toFixed(2)) }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" fontSize={10} />
                    <YAxis type="category" dataKey="asset" fontSize={10} width={60} />
                    <Tooltip />
                    <Bar dataKey="money" fill="#22c55e" radius={[0, 4, 4, 0]}>
                      {sortedStats.map((s, i) => <Cell key={i} fill={s.totalMoney >= 0 ? '#22c55e' : '#ef4444'} />)}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* RADAR TAB */}
        <TabsContent value="radar">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Comparação Radar (Top 6)</CardTitle>
              <CardDescription className="text-xs">Win Rate, Smart Score, R:R, Consistência e Tendência Recente</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={[
                  { metric: 'Win Rate', ...Object.fromEntries(radarData.map(r => [r.asset, r['Win Rate']])) },
                  { metric: 'Smart Score', ...Object.fromEntries(radarData.map(r => [r.asset, r['Smart Score']])) },
                  { metric: 'R:R', ...Object.fromEntries(radarData.map(r => [r.asset, r['R:R']])) },
                  { metric: 'Consistência', ...Object.fromEntries(radarData.map(r => [r.asset, r['Consistência']])) },
                  { metric: 'Tendência', ...Object.fromEntries(radarData.map(r => [r.asset, r['Tendência']])) },
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" fontSize={11} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={9} />
                  {radarData.map((r, i) => (
                    <Radar key={r.asset} name={r.asset} dataKey={r.asset} stroke={PIE_COLORS[i % PIE_COLORS.length]} fill={PIE_COLORS[i % PIE_COLORS.length]} fillOpacity={0.15} strokeWidth={2} />
                  ))}
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RECOMMENDATIONS TAB */}
        <TabsContent value="recommendations" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4" /> Resumo de Recomendações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Focus on */}
              {assetStats.filter(s => s.grade === 'A').length > 0 && (
                <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                  <p className="text-sm font-bold text-green-600 mb-1">🏆 Foque nestes ativos</p>
                  <div className="flex flex-wrap gap-2">
                    {assetStats.filter(s => s.grade === 'A').map(s => (
                      <Badge key={s.asset} className="bg-green-500/10 text-green-600 border-green-500/20">
                        {s.asset} — {s.smartScore.toFixed(1)}/10
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Operável */}
              {assetStats.filter(s => s.grade === 'B').length > 0 && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-sm font-bold text-blue-600 mb-1">✅ Operáveis com atenção</p>
                  <div className="flex flex-wrap gap-2">
                    {assetStats.filter(s => s.grade === 'B').map(s => (
                      <Badge key={s.asset} className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                        {s.asset} — {s.smartScore.toFixed(1)}/10
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Caution */}
              {assetStats.filter(s => s.grade === 'C').length > 0 && (
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                  <p className="text-sm font-bold text-yellow-600 mb-1">⚠️ Operar com cautela</p>
                  <div className="flex flex-wrap gap-2">
                    {assetStats.filter(s => s.grade === 'C').map(s => (
                      <Badge key={s.asset} className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                        {s.asset} — {s.smartScore.toFixed(1)}/10
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Avoid */}
              {assetStats.filter(s => s.grade === 'D').length > 0 && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                  <p className="text-sm font-bold text-red-600 mb-1">🚫 Evitar operar</p>
                  <div className="flex flex-wrap gap-2">
                    {assetStats.filter(s => s.grade === 'D').map(s => (
                      <Badge key={s.asset} className="bg-red-500/10 text-red-600 border-red-500/20">
                        {s.asset} — {s.smartScore.toFixed(1)}/10
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Insights */}
              <div className="bg-muted/30 rounded-lg p-3 space-y-2 mt-4">
                <p className="text-sm font-bold flex items-center gap-1"><BarChart3 className="w-3.5 h-3.5" /> Insights Chave</p>
                {topAsset && topAsset.longs.trades > 0 && topAsset.shorts.trades > 0 && (
                  <p className="text-xs text-muted-foreground">
                    📊 No {topAsset.asset}, você performa melhor em {(topAsset.longs.wins / topAsset.longs.trades * 100) > (topAsset.shorts.wins / topAsset.shorts.trades * 100) ? 'Long' : 'Short'}
                  </p>
                )}
                {topAsset && Object.entries(topAsset.sessions).sort((a, b) => b[1].money - a[1].money)[0] && (
                  <p className="text-xs text-muted-foreground">
                    🕐 Melhor sessão para {topAsset.asset}: {Object.entries(topAsset.sessions).sort((a, b) => b[1].money - a[1].money)[0][0]}
                  </p>
                )}
                {worstAsset && worstAsset.worstStreak >= 3 && (
                  <p className="text-xs text-muted-foreground">
                    ⚠️ {worstAsset.asset} já teve {worstAsset.worstStreak} losses seguidos — evite dobrar posição
                  </p>
                )}
                {assetStats.filter(s => s.grade === 'D').length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    💰 Eliminar ativos Classe D poderia economizar ${Math.abs(assetStats.filter(s => s.grade === 'D').reduce((sum, s) => sum + (s.totalMoney < 0 ? s.totalMoney : 0), 0)).toFixed(2)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
