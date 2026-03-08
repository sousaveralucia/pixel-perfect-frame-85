import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, AlertCircle } from "lucide-react";

interface TradeWithChecklist {
  id: string;
  date: string;
  asset: string;
  entryPrice: string;
  exitPrice: string;
  stopLoss: string;
  takeProfit: string;
  resultPrice: string;
  session: "Manha" | "Tarde" | "Noite" | "";
  account: string;
  result: "WIN" | "LOSS" | "BREAK_EVEN" | "ONGOING";
  notes: string;
  isFavorite: boolean;
  operational: {
    chochValidoHTF: boolean;
    caixaGannTracada: boolean;
    regiaoDescontada50: boolean;
    orderBlockIdentificado: boolean;
    entrada50OB: boolean;
    stopRiskManagement: boolean;
    tempoGraficoOperacional: boolean;
  };
  emotional: {
    hydration: boolean;
    breathing: boolean;
    mentalClarity: boolean;
  };
  routine: {
    hydration: boolean;
    breathing: boolean;
    sleep: boolean;
  };
  rational: {
    analysisConfirmed: boolean;
    planRespected: boolean;
    riskManaged: boolean;
  };
  preTradeImage?: string;
  tradingImage?: string;
  postTradeImage?: string;
  createdAt: number;
}

interface StrategyComparisonEnhancedProps {
  trades: TradeWithChecklist[];
}

export default function StrategyComparisonEnhanced({ trades }: StrategyComparisonEnhancedProps) {
  const [filterAccount, setFilterAccount] = useState<string>("all");
  const [filterAsset, setFilterAsset] = useState<string>("all");
  const allAssets = ["EUR/USD", "USDJPY", "XAUUSD", "NASDAQ", "BTC USD"];
  const allAccounts = ["Conta 1 ($100)", "Conta 2 ($1000)", "Conta 3 ($10000)"];

  // Filtrar trades
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      const accountMatch = filterAccount === "all" || t.account === filterAccount;
      const assetMatch = filterAsset === "all" || t.asset === filterAsset;
      return accountMatch && assetMatch;
    });
  }, [trades, filterAccount, filterAsset]);

  // Análise de ticks faltantes (trades com loss e checklists incompletos)
  const tickAnalysis = useMemo(() => {
    const lossesWithMissingTicks = filteredTrades.filter((t) => t.result === "LOSS");
    
    const missingTicksBreakdown = {
      operational: 0,
      emotional: 0,
      routine: 0,
      rational: 0,
      total: 0,
    };

    lossesWithMissingTicks.forEach((trade) => {
      const operationalMissing = trade.operational ? Object.values(trade.operational).filter((v) => !v).length : 0;
      const emotionalMissing = trade.emotional ? Object.values(trade.emotional).filter((v) => !v).length : 0;
      const routineMissing = trade.routine ? Object.values(trade.routine).filter((v) => !v).length : 0;
      const rationalMissing = trade.rational ? Object.values(trade.rational).filter((v) => !v).length : 0;

      if (operationalMissing > 0) missingTicksBreakdown.operational++;
      if (emotionalMissing > 0) missingTicksBreakdown.emotional++;
      if (routineMissing > 0) missingTicksBreakdown.routine++;
      if (rationalMissing > 0) missingTicksBreakdown.rational++;
      if (operationalMissing > 0 || emotionalMissing > 0 || routineMissing > 0 || rationalMissing > 0) {
        missingTicksBreakdown.total++;
      }
    });

    return {
      lossesWithMissingTicks: lossesWithMissingTicks.length,
      missingTicksBreakdown,
      lossesWithCompleteTicks: lossesWithMissingTicks.filter((t) => {
        const opComplete = t.operational ? Object.values(t.operational).every((v) => v) : false;
        const emComplete = t.emotional ? Object.values(t.emotional).every((v) => v) : false;
        const raComplete = t.rational ? Object.values(t.rational).every((v) => v) : false;
        return opComplete && emComplete && raComplete;
      }).length,
    };
  }, [filteredTrades]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const wins = filteredTrades.filter((t) => t.result === "WIN").length;
    const losses = filteredTrades.filter((t) => t.result === "LOSS").length;
    const breakEven = filteredTrades.filter((t) => t.result === "BREAK_EVEN").length;

    return {
      total: filteredTrades.length,
      wins,
      losses,
      breakEven,
      winRate: filteredTrades.length > 0 ? ((wins / filteredTrades.length) * 100).toFixed(1) : 0,
    };
  }, [filteredTrades]);

  const chartData = [
    {
      name: "Resultados",
      Vitórias: stats.wins,
      Derrotas: stats.losses,
      Empates: stats.breakEven,
    },
  ];

  const pieData = [
    { name: "Vitórias", value: stats.wins, fill: "#10b981" },
    { name: "Derrotas", value: stats.losses, fill: "#ef4444" },
    { name: "Empates", value: stats.breakEven, fill: "#6b7280" },
  ];

  const missingTicksData = [
    { name: "Operacional", value: tickAnalysis.missingTicksBreakdown.operational },
    { name: "Emocional", value: tickAnalysis.missingTicksBreakdown.emotional },
    { name: "Rotina e Saúde", value: tickAnalysis.missingTicksBreakdown.routine },
    { name: "Racional", value: tickAnalysis.missingTicksBreakdown.rational },
  ];

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-lg border border-border">
        <div>
          <Label className="text-sm font-semibold mb-2 block">Filtrar por Conta</Label>
          <Select value={filterAccount} onValueChange={setFilterAccount}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Contas</SelectItem>
              {allAccounts.map((account) => (
                <SelectItem key={account} value={account}>
                  {account}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-semibold mb-2 block">Filtrar por Ativo</Label>
          <Select value={filterAsset} onValueChange={setFilterAsset}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Ativos</SelectItem>
              {allAssets.map((asset) => (
                <SelectItem key={asset} value={asset}>
                  {asset}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vitórias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.wins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Derrotas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.losses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Acerto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Análise de Ticks Faltantes (Losses)</CardTitle>
            <CardDescription>Quantos losses tiveram ticks faltantes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={missingTicksData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alerta de Ticks Faltantes */}
      {tickAnalysis.lossesWithMissingTicks > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <AlertCircle className="w-5 h-5" />
              Análise de Ticks Faltantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-yellow-900">
            <p>
              <strong>{tickAnalysis.lossesWithMissingTicks}</strong> losses tiveram ticks faltantes:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>{tickAnalysis.missingTicksBreakdown.operational}</strong> com ticks operacionais faltantes
              </li>
              <li>
                <strong>{tickAnalysis.missingTicksBreakdown.emotional}</strong> com ticks emocionais faltantes
              </li>
              <li>
                <strong>{tickAnalysis.missingTicksBreakdown.routine}</strong> com ticks de rotina e saúde faltantes
              </li>
              <li>
                <strong>{tickAnalysis.missingTicksBreakdown.rational}</strong> com ticks racionais faltantes
              </li>
            </ul>
            {tickAnalysis.lossesWithCompleteTicks > 0 && (
              <p className="mt-3 text-sm">
                ⚠️ <strong>{tickAnalysis.lossesWithCompleteTicks}</strong> losses ocorreram mesmo com TODOS os ticks marcados - revisar estratégia!
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando não há dados */}
      {filteredTrades.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Nenhum trade registrado com os filtros selecionados.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
