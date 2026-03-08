import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccountManager } from "@/hooks/useAccountManager";
import { useTradeJournalUnified } from "@/hooks/useTradeJournalUnified";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface TradeWithChecklist {
  id: string;
  date: string;
  asset: string;
  entryPrice: string;
  exitPrice: string;
  result: "WIN" | "LOSS" | "BREAK_EVEN" | "ONGOING";
  notes: string;
  emotional: {
    hydration: boolean;
    breathing: boolean;
    mentalClarity: boolean;
  };
  rational: {
    analysisConfirmed: boolean;
    planRespected: boolean;
    riskManaged: boolean;
  };
  createdAt: number;
}

export default function PerformanceDashboard() {
  const { activeAccountId } = useAccountManager();

  const trades = useMemo(() => {
    const saved = localStorage.getItem(`trades_enhanced_${activeAccountId}`);
    return saved ? JSON.parse(saved) : [];
  }, [activeAccountId]);

  // Agrupar trades por data
  const dailyStats = useMemo(() => {
    const grouped: { [key: string]: TradeWithChecklist[] } = {};
    
    trades.forEach((trade: TradeWithChecklist) => {
      if (!grouped[trade.date]) {
        grouped[trade.date] = [];
      }
      grouped[trade.date].push(trade);
    });

    return Object.entries(grouped)
      .map(([date, dayTrades]) => {
        const wins = dayTrades.filter(t => t.result === "WIN").length;
        const losses = dayTrades.filter(t => t.result === "LOSS").length;
        const breakeven = dayTrades.filter(t => t.result === "BREAK_EVEN").length;
        
        return {
          date,
          wins,
          losses,
          breakeven,
          total: dayTrades.length,
          winRate: dayTrades.length > 0 ? ((wins / dayTrades.length) * 100).toFixed(1) : "0",
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Últimos 30 dias
  }, [trades]);

  // Estatísticas por ativo
  const assetStats = useMemo(() => {
    const grouped: { [key: string]: TradeWithChecklist[] } = {};
    
    trades.forEach((trade: TradeWithChecklist) => {
      if (!grouped[trade.asset]) {
        grouped[trade.asset] = [];
      }
      grouped[trade.asset].push(trade);
    });

    return Object.entries(grouped)
      .map(([asset, assetTrades]) => {
        const wins = assetTrades.filter(t => t.result === "WIN").length;
        const losses = assetTrades.filter(t => t.result === "LOSS").length;
        
        return {
          name: asset,
          wins,
          losses,
          total: assetTrades.length,
          winRate: assetTrades.length > 0 ? ((wins / assetTrades.length) * 100).toFixed(1) : "0",
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [trades]);

  // Estatísticas gerais
  const overallStats = useMemo(() => {
    const totalTrades = trades.length;
    const wins = trades.filter((t: TradeWithChecklist) => t.result === "WIN").length;
    const losses = trades.filter((t: TradeWithChecklist) => t.result === "LOSS").length;
    const breakeven = trades.filter((t: TradeWithChecklist) => t.result === "BREAK_EVEN").length;

    return {
      totalTrades,
      wins,
      losses,
      breakeven,
      winRate: totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : "0",
      consecutiveWins: calculateConsecutiveWins(trades),
      bestDay: findBestDay(dailyStats),
    };
  }, [trades, dailyStats]);

  // Dados para gráfico de pizza (resultado geral)
  const resultPieData = [
    { name: "Vitórias", value: overallStats.wins, color: "#22c55e" },
    { name: "Derrotas", value: overallStats.losses, color: "#ef4444" },
    { name: "Empates", value: overallStats.breakeven, color: "#94a3b8" },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total de Trades</p>
            <p className="text-3xl font-bold text-primary">{overallStats.totalTrades}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Vitórias</p>
            <p className="text-3xl font-bold text-green-600">{overallStats.wins}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Derrotas</p>
            <p className="text-3xl font-bold text-red-600">{overallStats.losses}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Taxa de Acerto</p>
            <p className="text-3xl font-bold text-blue-600">{overallStats.winRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Melhor Dia</p>
            <p className="text-2xl font-bold text-purple-600">{overallStats.bestDay}</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Resultados Diários */}
      {dailyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Diária (Últimos 30 dias)</CardTitle>
            <CardDescription>Vitórias e derrotas por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="wins" fill="#22c55e" name="Vitórias" />
                <Bar dataKey="losses" fill="#ef4444" name="Derrotas" />
                <Bar dataKey="breakeven" fill="#94a3b8" name="Empates" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Taxa de Acerto Diária */}
      {dailyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Acerto Diária</CardTitle>
            <CardDescription>Evolução da taxa de acerto ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="winRate" 
                  stroke="#0066cc" 
                  name="Taxa de Acerto (%)"
                  dot={{ fill: "#0066cc" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Distribuição de Resultados */}
      {resultPieData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Resultados</CardTitle>
            <CardDescription>Proporção de vitórias, derrotas e empates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={resultPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {resultPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Análise de Checklist Emocional */}
      <Card>
        <CardHeader>
          <CardTitle>❤️ Análise de Checklist Emocional</CardTitle>
          <CardDescription>Estatísticas de hidratação, respiração e clareza mental</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-600 font-semibold mb-2">Hidratação</p>
              <p className="text-3xl font-bold text-blue-900">
                {trades.filter((t: TradeWithChecklist) => t.emotional?.hydration).length}/{trades.length}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {trades.length > 0 ? (((trades.filter((t: TradeWithChecklist) => t.emotional?.hydration).length / trades.length) * 100).toFixed(1)) : 0}%
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-600 font-semibold mb-2">Respiração</p>
              <p className="text-3xl font-bold text-green-900">
                {trades.filter((t: TradeWithChecklist) => t.emotional?.breathing).length}/{trades.length}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {trades.length > 0 ? (((trades.filter((t: TradeWithChecklist) => t.emotional?.breathing).length / trades.length) * 100).toFixed(1)) : 0}%
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-600 font-semibold mb-2">Clareza Mental</p>
              <p className="text-3xl font-bold text-purple-900">
                {trades.filter((t: TradeWithChecklist) => t.emotional?.mentalClarity).length}/{trades.length}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                {trades.length > 0 ? (((trades.filter((t: TradeWithChecklist) => t.emotional?.mentalClarity).length / trades.length) * 100).toFixed(1)) : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance por Ativo */}
      {assetStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance por Ativo</CardTitle>
            <CardDescription>Estatísticas de cada ativo operado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assetStats.map((asset) => (
                <div key={asset.name} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border">
                  <div>
                    <p className="font-bold text-foreground">{asset.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {asset.wins}W / {asset.losses}L ({asset.total} trades)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{asset.winRate}%</p>
                    <p className="text-xs text-muted-foreground">Taxa de Acerto</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem vazia */}
      {trades.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Nenhum trade registrado ainda. Comece a registrar seus trades para ver o dashboard de performance!
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function calculateConsecutiveWins(trades: TradeWithChecklist[]): number {
  let consecutive = 0;
  for (let i = trades.length - 1; i >= 0; i--) {
    if (trades[i].result === "WIN") {
      consecutive++;
    } else {
      break;
    }
  }
  return consecutive;
}

function findBestDay(dailyStats: any[]): string {
  if (dailyStats.length === 0) return "N/A";
  const best = dailyStats.reduce((prev, current) => 
    (parseFloat(current.winRate) > parseFloat(prev.winRate)) ? current : prev
  );
  return `${best.date} (${best.winRate}%)`;
}
