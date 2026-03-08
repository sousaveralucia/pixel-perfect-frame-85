import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAccountManager } from "@/hooks/useAccountManager";
import { Trade } from "@/hooks/useTradeJournal";
import { useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface WinRateAnalysisProps {
  trades: Trade[];
}

export default function WinRateAnalysis({ trades }: WinRateAnalysisProps) {
  const { accounts, activeAccountId, switchAccount } = useAccountManager();
  const [filterAsset, setFilterAsset] = useState<string>("all");
  const [filterSession, setFilterSession] = useState<string>("all");

  // Filtrar trades pela conta ativa
  const filteredTrades = trades.filter((t) => t.accountId === activeAccountId);

  // Obter lista única de ativos e sessões
  const uniqueAssets = ["all", ...Array.from(new Set(filteredTrades.map((t) => t.asset)))];
  const uniqueSessions = ["all", ...Array.from(new Set(filteredTrades.map((t) => t.session)))];

  // Aplicar filtros adicionais
  let analysisData = filteredTrades;
  if (filterAsset !== "all") {
    analysisData = analysisData.filter((t) => t.asset === filterAsset);
  }
  if (filterSession !== "all") {
    analysisData = analysisData.filter((t) => t.session === filterSession);
  }

  // Calcular estatísticas gerais
  const totalTrades = analysisData.length;
  const winTrades = analysisData.filter((t) => t.status === "GANHO");
  const lossTrades = analysisData.filter((t) => t.status === "PERDA");
  const winRate = totalTrades > 0 ? ((winTrades.length / totalTrades) * 100).toFixed(1) : 0;
  const totalProfit = analysisData.reduce((sum, t) => sum + t.profitLoss, 0);

  // Win Rate por Ativo
  const assetStats = filteredTrades.reduce(
    (acc, trade) => {
      if (!acc[trade.asset]) {
        acc[trade.asset] = { total: 0, wins: 0, profit: 0 };
      }
      acc[trade.asset].total++;
      if (trade.status === "GANHO") acc[trade.asset].wins++;
      acc[trade.asset].profit += trade.profitLoss;
      return acc;
    },
    {} as Record<string, { total: number; wins: number; profit: number }>
  );

  // Win Rate por Sessão
  const sessionStats = filteredTrades.reduce(
    (acc, trade) => {
      if (!acc[trade.session]) {
        acc[trade.session] = { total: 0, wins: 0, profit: 0 };
      }
      acc[trade.session].total++;
      if (trade.status === "GANHO") acc[trade.session].wins++;
      acc[trade.session].profit += trade.profitLoss;
      return acc;
    },
    {} as Record<string, { total: number; wins: number; profit: number }>
  );

  // Seletor de Conta
  const accountSelector = (
    <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg border border-border">
      <Label className="font-semibold">Conta Ativa:</Label>
      <Select value={activeAccountId} onValueChange={switchAccount}>
        <SelectTrigger className="w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              Conta ${account.initialBalance} (Saldo: ${account.currentBalance.toFixed(2)})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  if (filteredTrades.length === 0) {
    return (
      <div className="space-y-6">
        {accountSelector}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Win Rate por Sessão, Ativo e Conta
            </CardTitle>
            <CardDescription>Análise detalhada de performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">Registre trades para ver análises</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {accountSelector}

      {/* Filtros */}
      <div className="flex gap-4 p-4 bg-secondary/50 rounded-lg border border-border">
        <div className="flex-1">
          <Label className="text-sm font-semibold mb-2 block">Filtrar por Ativo</Label>
          <Select value={filterAsset} onValueChange={setFilterAsset}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {uniqueAssets.map((asset) => (
                <SelectItem key={asset} value={asset}>
                  {asset === "all" ? "Todos os Ativos" : asset}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label className="text-sm font-semibold mb-2 block">Filtrar por Sessão</Label>
          <Select value={filterSession} onValueChange={setFilterSession}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {uniqueSessions.map((session) => (
                <SelectItem key={session} value={session}>
                  {session === "all" ? "Todas as Sessões" : session}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resumo Geral */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Geral</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <p className="text-sm text-muted-foreground mb-1">Total de Trades</p>
            <p className="text-2xl font-bold text-primary">{totalTrades}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <p className="text-sm text-muted-foreground mb-1">Ganhos</p>
            <p className="text-2xl font-bold text-green-600">{winTrades.length}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <p className="text-sm text-muted-foreground mb-1">Perdas</p>
            <p className="text-2xl font-bold text-red-600">{lossTrades.length}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
            <p className="text-2xl font-bold text-primary">{winRate}%</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <p className="text-sm text-muted-foreground mb-1">Lucro Total</p>
            <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${totalProfit.toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Win Rate por Ativo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Win Rate por Ativo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(assetStats).map(([asset, stats]) => {
              const wr = ((stats.wins / stats.total) * 100).toFixed(1);
              return (
                <div key={asset} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 transition">
                  <div>
                    <p className="font-semibold text-foreground">{asset}</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.wins}/{stats.total} ganhos ({wr}%)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${stats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${stats.profit.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Win Rate por Sessão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-primary" />
            Win Rate por Sessão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(sessionStats).map(([session, stats]) => {
              const wr = ((stats.wins / stats.total) * 100).toFixed(1);
              return (
                <div key={session} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 transition">
                  <div>
                    <p className="font-semibold text-foreground">{session}</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.wins}/{stats.total} ganhos ({wr}%)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${stats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${stats.profit.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Comparação Operacional */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Comparação Operacional</CardTitle>
          <CardDescription className="text-blue-800">
            Resumo de performance por conta operada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-white border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-2">Melhor Ativo</p>
              {Object.entries(assetStats).length > 0 && (
                <>
                  <p className="text-lg font-bold text-blue-600">
                    {Object.entries(assetStats).sort(([, a], [, b]) => (b.wins / b.total) - (a.wins / a.total))[0][0]}
                  </p>
                  <p className="text-xs text-blue-700">
                    {((Object.entries(assetStats).sort(([, a], [, b]) => (b.wins / b.total) - (a.wins / a.total))[0][1].wins / Object.entries(assetStats).sort(([, a], [, b]) => (b.wins / b.total) - (a.wins / a.total))[0][1].total) * 100).toFixed(1)}% de acerto
                  </p>
                </>
              )}
            </div>
            <div className="p-4 rounded-lg bg-white border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-2">Melhor Sessão</p>
              {Object.entries(sessionStats).length > 0 && (
                <>
                  <p className="text-lg font-bold text-blue-600">
                    {Object.entries(sessionStats).sort(([, a], [, b]) => (b.wins / b.total) - (a.wins / a.total))[0][0]}
                  </p>
                  <p className="text-xs text-blue-700">
                    {((Object.entries(sessionStats).sort(([, a], [, b]) => (b.wins / b.total) - (a.wins / a.total))[0][1].wins / Object.entries(sessionStats).sort(([, a], [, b]) => (b.wins / b.total) - (a.wins / a.total))[0][1].total) * 100).toFixed(1)}% de acerto
                  </p>
                </>
              )}
            </div>
          </div>
          <p className="text-sm text-blue-800 mt-4">
            💡 Dica: Concentre-se em operar os ativos e sessões com melhor desempenho para maximizar seus ganhos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
