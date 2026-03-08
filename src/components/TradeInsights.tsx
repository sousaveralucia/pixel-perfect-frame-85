import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, AlertCircle, Zap } from "lucide-react";
import { Trade } from "@/hooks/useTradeJournal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAccountManager } from "@/hooks/useAccountManager";
import { useState } from "react";

interface TradeInsightsProps {
  trades: Trade[];
}

export default function TradeInsights({ trades }: TradeInsightsProps) {
  const { accounts, activeAccountId, switchAccount } = useAccountManager();
  // Filtrar trades pela conta ativa
  const filteredTrades = trades.filter((t) => t.accountId === activeAccountId);

  // Análises básicas
  const totalTrades = filteredTrades.length;
  const winTrades = filteredTrades.filter((t) => t.status === "GANHO");
  const lossTrades = filteredTrades.filter((t) => t.status === "PERDA");
  const winRate = totalTrades > 0 ? (winTrades.length / totalTrades) * 100 : 0;

  // Análise por tipo de entrada
  const obTrades = filteredTrades.filter((t) => t.entryReason === "50% OB - Execução Direta");
  const touchTrades = filteredTrades.filter((t) => t.entryReason === "Primeiro Toque - Alinhamento de Fluxo");

  const obWinRate = obTrades.length > 0 ? (obTrades.filter((t) => t.status === "GANHO").length / obTrades.length) * 100 : 0;
  const touchWinRate = touchTrades.length > 0 ? (touchTrades.filter((t) => t.status === "GANHO").length / touchTrades.length) * 100 : 0;

  // Análise por ativo
  const assetStats = filteredTrades.reduce(
    (acc, trade) => {
      if (!acc[trade.asset]) {
        acc[trade.asset] = { total: 0, wins: 0, profit: 0 };
      }
      acc[trade.asset].total++;
      if (trade.status === "GANHO") acc[trade.asset].wins++;
      acc[trade.asset].profit += Number(trade.profitLoss);
      return acc;
    },
    {} as Record<string, { total: number; wins: number; profit: number }>
  );

  // Análise por sessão
  const sessionStats = filteredTrades.reduce(
    (acc, trade) => {
      if (!acc[trade.session]) {
        acc[trade.session] = { total: 0, wins: 0, profit: 0 };
      }
      acc[trade.session].total++;
      if (trade.status === "GANHO") acc[trade.session].wins++;
      acc[trade.session].profit += Number(trade.profitLoss);
      return acc;
    },
    {} as Record<string, { total: number; wins: number; profit: number }>
  );

  // Maiores ganhos e perdas
  const sortedByProfit = [...filteredTrades].sort((a, b) => Number(b.profitLoss) - Number(a.profitLoss));
  const bestTrade = sortedByProfit[0];
  const worstTrade = sortedByProfit[sortedByProfit.length - 1];

  // Lucro total e médias
  const totalProfit = filteredTrades.reduce((sum, trade) => sum + Number(trade.profitLoss), 0);
  const avgProfit = totalTrades > 0 ? totalProfit / totalTrades : 0;
  const avgWinTrade = winTrades.length > 0 ? winTrades.reduce((sum, t) => sum + Number(t.profitLoss), 0) / winTrades.length : 0;
  const avgLossTrade = lossTrades.length > 0 ? lossTrades.reduce((sum, t) => sum + Number(t.profitLoss), 0) / lossTrades.length : 0;
  const profitFactor = avgLossTrade !== 0 ? Math.abs(avgWinTrade / avgLossTrade) : 0;

  // Padrões em trades vencedores
  const winningPatterns = {
    bestAsset: Object.entries(assetStats).sort(([, a], [, b]) => b.wins / b.total - a.wins / a.total)[0],
    bestSession: Object.entries(sessionStats).sort(([, a], [, b]) => b.wins / b.total - a.wins / a.total)[0],
    bestEntryType: obWinRate > touchWinRate ? "50% OB" : "Primeiro Toque",
  };

  // Seletor de Conta sempre visível
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

  if (totalTrades === 0) {
    return (
      <div className="space-y-6">
        {accountSelector}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Insights de Trades
            </CardTitle>
            <CardDescription>Análise automática de padrões e performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Registre trades para ver insights</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {accountSelector}

      {/* Resumo Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Resumo Geral
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{totalTrades}</p>
            <p className="text-sm text-muted-foreground">Total de Trades</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{winTrades.length}</p>
            <p className="text-sm text-muted-foreground">Ganhos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{lossTrades.length}</p>
            <p className="text-sm text-muted-foreground">Perdas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{winRate.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">Taxa de Acerto</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>${totalProfit.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Lucro Total</p>
          </div>
        </CardContent>
      </Card>

      {/* Comparação de Estratégias */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação de Tipos de Entrada</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-border">
            <p className="font-semibold text-foreground mb-3">50% OB - Execução Direta</p>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Operações</p>
                <p className="text-lg font-bold text-foreground">{obTrades.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Acerto</p>
                <p className={`text-lg font-bold ${obWinRate >= 50 ? "text-green-600" : "text-red-600"}`}>{obWinRate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lucro Total</p>
                <p className={`text-lg font-bold ${obTrades.reduce((sum, t) => sum + Number(t.profitLoss), 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ${obTrades.reduce((sum, t) => sum + Number(t.profitLoss), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-border">
            <p className="font-semibold text-foreground mb-3">Primeiro Toque - Alinhamento de Fluxo</p>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Operações</p>
                <p className="text-lg font-bold text-foreground">{touchTrades.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Acerto</p>
                <p className={`text-lg font-bold ${touchWinRate >= 50 ? "text-green-600" : "text-red-600"}`}>{touchWinRate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lucro Total</p>
                <p className={`text-lg font-bold ${touchTrades.reduce((sum, t) => sum + Number(t.profitLoss), 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ${touchTrades.reduce((sum, t) => sum + Number(t.profitLoss), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance por Ativo */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Ativo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(assetStats).map(([asset, stats]) => (
              <div key={asset} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="font-semibold text-foreground">{asset}</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.wins}/{stats.total} ganhos ({((stats.wins / stats.total) * 100).toFixed(1)}%)
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${stats.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    ${stats.profit.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance por Sessão */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Sessão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(sessionStats).map(([session, stats]) => (
              <div key={session} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="font-semibold text-foreground">{session}</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.wins}/{stats.total} ganhos ({((stats.wins / stats.total) * 100).toFixed(1)}%)
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${stats.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    ${stats.profit.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Maiores Ganhos e Perdas */}
      <Card>
        <CardHeader>
          <CardTitle>Maiores Movimentos</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bestTrade && (
            <div className="p-4 rounded-lg border border-green-200 bg-green-50">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <p className="font-semibold text-green-900">Melhor Trade</p>
              </div>
              <p className="text-sm text-green-800 mb-2">
                {bestTrade.asset} - {new Date(bestTrade.entryDateTime).toLocaleDateString("pt-BR")}
              </p>
              <p className="text-2xl font-bold text-green-600">${Number(bestTrade.profitLoss).toFixed(2)}</p>
            </div>
          )}

          {worstTrade && (
            <div className="p-4 rounded-lg border border-red-200 bg-red-50">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <p className="font-semibold text-red-900">Pior Trade</p>
              </div>
              <p className="text-sm text-red-800 mb-2">
                {worstTrade.asset} - {new Date(worstTrade.entryDateTime).toLocaleDateString("pt-BR")}
              </p>
              <p className="text-2xl font-bold text-red-600">${Number(worstTrade.profitLoss).toFixed(2)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Médias de Ganho e Perda */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de Médias</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <p className="text-sm text-muted-foreground mb-1">Ganho Médio</p>
            <p className="text-2xl font-bold text-green-600">${avgWinTrade.toFixed(2)}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <p className="text-sm text-muted-foreground mb-1">Perda Média</p>
            <p className="text-2xl font-bold text-red-600">${avgLossTrade.toFixed(2)}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <p className="text-sm text-muted-foreground mb-1">Lucro Médio</p>
            <p className={`text-2xl font-bold ${avgProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>${avgProfit.toFixed(2)}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <p className="text-sm text-muted-foreground mb-1">Fator de Lucro</p>
            <p className="text-2xl font-bold text-primary">{profitFactor.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Padrões em Trades Vencedores */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-900">Padrões em Trades Vencedores</CardTitle>
          <CardDescription className="text-green-800">Recomendações baseadas em seus melhores trades</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {winningPatterns.bestAsset && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-green-200">
              <p className="font-semibold text-green-900">Ativo Mais Lucrativo</p>
              <Badge className="bg-green-600 text-white">{winningPatterns.bestAsset[0]}</Badge>
            </div>
          )}

          {winningPatterns.bestSession && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-green-200">
              <p className="font-semibold text-green-900">Sessão Mais Lucrativa</p>
              <Badge className="bg-green-600 text-white">{winningPatterns.bestSession[0]}</Badge>
            </div>
          )}

          <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-green-200">
            <p className="font-semibold text-green-900">Tipo de Entrada Preferido</p>
            <Badge className="bg-green-600 text-white">{winningPatterns.bestEntryType}</Badge>
          </div>

          <p className="text-sm text-green-800 mt-4">
            💡 Dica: Concentre-se em operar {winningPatterns.bestAsset?.[0]} durante a sessão {winningPatterns.bestSession?.[0]} usando a estratégia "{winningPatterns.bestEntryType}" para maximizar seus ganhos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
