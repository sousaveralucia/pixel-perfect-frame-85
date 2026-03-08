import { useState, useEffect } from "react";

export interface Trade {
  id: string;
  accountId: string; // ID da conta (account-100, account-1000, account-10000)
  entryDateTime: string; // ISO string
  exitDateTime: string; // ISO string
  asset: string; // GBP/USD, USD/JPY, XAU/USD
  type: "BUY" | "SELL";
  entryPrice: number;
  exitPrice: number;
  contractSize: number; // Tamanho do contrato (ex: 16000)
  stopPrice: number; // Preço do stop
  stopLossInDollars: number; // Stop loss em $ (calculado automaticamente)
  takeProfit: number; // Take profit em $
  profitLoss: number; // em $
  profitLossPercent: number; // em %
  pipsGained: number;
  entryReason: "50% OB - Execução Direta" | "Primeiro Toque - Alinhamento de Fluxo";
  status: "GANHO" | "PERDA" | "CANCELADO";
  notes: string;
  duration: string; // formato "2h 30m"
  session: string; // Sessão precisa por ativo
  createdAt: string; // ISO string
  isFavorite: boolean; // Marcado como favorito
  preTradeImage?: string; // URL da imagem pré-trading
  tradingImage?: string; // URL da imagem durante o trade
  postTradeImage?: string; // URL da imagem pós-trading
}

const STORAGE_KEY = "trading_journal";

// Hook para gerenciar trades com edição, favoritos e imagens
export interface UseTradeJournalReturn {
  trades: Trade[];
  isLoaded: boolean;
  addTrade: (trade: Omit<Trade, "id" | "createdAt" | "isFavorite">) => Trade;
  updateTrade: (id: string, updates: Partial<Trade>) => void;
  deleteTrade: (id: string) => void;
  toggleFavorite: (id: string) => void;
  getStatistics: () => any;
  exportAsJSON: () => void;
  exportAsCSV: () => void;
}

// Detectar sessão precisa baseado no horário de Brasília e ativo
export const detectSessionByAsset = (brasiliDateTime: Date, asset: string): string => {
  const hour = brasiliDateTime.getHours();
  const minute = brasiliDateTime.getMinutes();
  const timeInMinutes = hour * 60 + minute;

  // Horários em minutos (Brasília)
  // Tóquio: 21:00-06:00 (1260-360 minutos)
  // Londres: 06:00-12:00 (360-720 minutos)
  // NY: 12:00-21:00 (720-1260 minutos)

  const tokyoStart = 21 * 60; // 21:00
  const tokyoEnd = 6 * 60; // 06:00
  const londonStart = 6 * 60; // 06:00
  const londonEnd = 12 * 60; // 12:00
  const nyStart = 12 * 60; // 12:00
  const nyEnd = 21 * 60; // 21:00

  // Verificar sobreposições
  const isTokyoActive = timeInMinutes >= tokyoStart || timeInMinutes < tokyoEnd;
  const isLondonActive = timeInMinutes >= londonStart && timeInMinutes < londonEnd;
  const isNYActive = timeInMinutes >= nyStart && timeInMinutes < nyEnd;

  // Sobreposições
  if (isTokyoActive && isLondonActive) return "Tóquio-Londres";
  if (isLondonActive && isNYActive) return "Londres-NY";
  if (isTokyoActive && isNYActive) return "Tóquio-NY"; // Raro, mas possível

  // Sessões individuais
  if (isTokyoActive) return "Tóquio";
  if (isLondonActive) return "Londres";
  if (isNYActive) return "NY";

  return "Desconhecida";
};

// Manter compatibilidade com função antiga
export const detectSession = (brasiliDateTime: Date): string => {
  return detectSessionByAsset(brasiliDateTime, "");
};

// Calcular duração entre dois horários
export const calculateDuration = (entryDateTime: string, exitDateTime: string): string => {
  const entry = new Date(entryDateTime);
  const exit = new Date(exitDateTime);
  const diffMs = exit.getTime() - entry.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

// Converter horário para Brasília (GMT-3)
export const toBrasiliaTime = (date: Date): Date => {
  const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return new Date(utcDate.getTime() - 3 * 60 * 60 * 1000);
};

// Pip values para cada ativo (valor em $ por pip por 1 lote)
const PIP_VALUES: Record<string, number> = {
  "GBP/USD": 10,
  "USD/JPY": 9.26,
  "XAU/USD": 0.01,
};

// Tamanho do pip para cada ativo
const PIP_SIZES: Record<string, number> = {
  "GBP/USD": 0.0001,
  "USD/JPY": 0.01,
  "XAU/USD": 0.01,
};

// Calcular pips ganhos
export const calculatePips = (
  entryPrice: number,
  exitPrice: number,
  asset: string,
  type: "BUY" | "SELL"
): number => {
  const pipSize = PIP_SIZES[asset] || 0.0001;
  const priceDiff = type === "BUY" ? exitPrice - entryPrice : entryPrice - exitPrice;
  
  return Math.round(priceDiff / pipSize);
};

// Calcular tamanho da posição baseado no stop loss em pips
export const calculatePositionSize = (
  stopLossInDollars: number,
  stopLossInPips: number,
  asset: string
): number => {
  const pipValue = PIP_VALUES[asset] || 10;
  // Tamanho = Stop Loss ($) / (Stop Loss em pips × Valor do pip)
  return stopLossInDollars / (stopLossInPips * (pipValue / 1000000));
};

// Calcular Stop Loss em $ baseado no preco de entrada e stop
export const calculateStopLossInDollars = (
  entryPrice: number,
  stopPrice: number,
  contractSize: number
): number => {
  const priceDiff = Math.abs(entryPrice - stopPrice);
  return priceDiff * contractSize;
};

// Calcular P&L baseado em tamanho de contrato
export const calculateProfitLossByContract = (
  entryPrice: number,
  exitPrice: number,
  contractSize: number,
  type: "BUY" | "SELL"
): { profitLoss: number; profitLossPercent: number; pipsGained: number } => {
  const priceDiff = type === "BUY" ? exitPrice - entryPrice : entryPrice - exitPrice;
  const profitLoss = priceDiff * contractSize;
  const profitLossPercent = (profitLoss / (entryPrice * contractSize)) * 100;
  const pipsGained = Math.round(priceDiff * 10000);
  
  return {
    profitLoss: Math.round(profitLoss * 100) / 100,
    profitLossPercent: Math.round(profitLossPercent * 100) / 100,
    pipsGained,
  };
};

// Manter compatibilidade com funcao antiga
export const calculateProfitLoss = (
  pipsGained: number,
  stopLossInPips: number,
  stopLossInDollars: number,
  asset: string
): { profitLoss: number; profitLossPercent: number } => {
  const pipValue = PIP_VALUES[asset] || 10;
  const positionSize = calculatePositionSize(stopLossInDollars, stopLossInPips, asset);
  
  // P&L = Pips x Valor do pip x Tamanho da posicao
  const profitLoss = (pipsGained * pipValue * positionSize) / 1000000;
  const profitLossPercent = (profitLoss / stopLossInDollars) * 100;
  
  return {
    profitLoss: Math.round(profitLoss * 100) / 100,
    profitLossPercent: Math.round(profitLossPercent * 100) / 100,
  };
};

export const useTradeJournal = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar trades do localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTrades(parsed);
      } catch (error) {
        console.error("Erro ao carregar trades:", error);
        setTrades([]);
      }
    }
    setIsLoaded(true);
  }, []);

  // Salvar trades no localStorage
  const saveTrades = (updatedTrades: Trade[]) => {
    setTrades(updatedTrades);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTrades));
  };

  // Adicionar novo trade
  const addTrade = (trade: Omit<Trade, "id" | "createdAt" | "isFavorite">) => {
    const newTrade: Trade = {
      ...trade,
      id: `trade_${Date.now()}`,
      createdAt: new Date().toISOString(),
      isFavorite: false,
    };
    saveTrades([...trades, newTrade]);
    
    // Sincronizar saldo da conta
    const accounts = JSON.parse(localStorage.getItem("trading_accounts") || "[]");
    const account = accounts.find((acc: any) => acc.id === trade.accountId);
    if (account) {
      const newBalance = account.currentBalance + trade.profitLoss;
      const updatedAccounts = accounts.map((acc: any) =>
        acc.id === trade.accountId ? { ...acc, currentBalance: newBalance } : acc
      );
      localStorage.setItem("trading_accounts", JSON.stringify(updatedAccounts));
    }
    
    return newTrade;
  };

  // Atualizar trade existente
  const updateTrade = (id: string, updates: Partial<Trade>) => {
    const oldTrade = trades.find((t) => t.id === id);
    const updated = trades.map((t) => (t.id === id ? { ...t, ...updates } : t));
    saveTrades(updated);
    
    // Sincronizar saldo da conta se o P&L foi alterado
    if (oldTrade && (updates.profitLoss !== undefined || updates.status !== undefined)) {
      const accounts = JSON.parse(localStorage.getItem("trading_accounts") || "[]");
      const account = accounts.find((acc: any) => acc.id === oldTrade.accountId);
      if (account) {
        // Remover o P&L antigo e adicionar o novo
        const oldPnL = oldTrade.profitLoss;
        const newPnL = updates.profitLoss ?? oldTrade.profitLoss;
        const newBalance = account.currentBalance - oldPnL + newPnL;
        const updatedAccounts = accounts.map((acc: any) =>
          acc.id === oldTrade.accountId ? { ...acc, currentBalance: newBalance } : acc
        );
        localStorage.setItem("trading_accounts", JSON.stringify(updatedAccounts));
      }
    }
  };

  // Alternar favorito
  const toggleFavorite = (id: string) => {
    const updated = trades.map((t) => (t.id === id ? { ...t, isFavorite: !t.isFavorite } : t));
    saveTrades(updated);
  };

  // Deletar trade
  const deleteTrade = (id: string) => {
    const tradeToDelete = trades.find((t) => t.id === id);
    if (tradeToDelete) {
      saveTrades(trades.filter((t) => t.id !== id));
      
      // Sincronizar saldo da conta
      const accounts = JSON.parse(localStorage.getItem("trading_accounts") || "[]");
      const account = accounts.find((acc: any) => acc.id === tradeToDelete.accountId);
      if (account) {
        const newBalance = account.currentBalance - tradeToDelete.profitLoss;
        const updatedAccounts = accounts.map((acc: any) =>
          acc.id === tradeToDelete.accountId ? { ...acc, currentBalance: newBalance } : acc
        );
        localStorage.setItem("trading_accounts", JSON.stringify(updatedAccounts));
      }
    } else {
      saveTrades(trades.filter((t) => t.id !== id));
    }
  };

  // Obter estatísticas
  const getStatistics = () => {
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        canceledTrades: 0,
        winRate: 0,
        totalProfit: 0,
        totalLoss: 0,
        netProfit: 0,
        averageProfit: 0,
        averageLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        totalPips: 0,
      };
    }

    const winning = trades.filter((t) => t.status === "GANHO");
    const losing = trades.filter((t) => t.status === "PERDA");
    const canceled = trades.filter((t) => t.status === "CANCELADO");

    const totalProfit = winning.reduce((sum, t) => sum + t.profitLoss, 0);
    const totalLoss = losing.reduce((sum, t) => sum + Math.abs(t.profitLoss), 0);
    const totalPips = trades.reduce((sum, t) => sum + t.pipsGained, 0);

    return {
      totalTrades: trades.length,
      winningTrades: winning.length,
      losingTrades: losing.length,
      canceledTrades: canceled.length,
      winRate: ((winning.length / (winning.length + losing.length)) * 100).toFixed(2),
      totalProfit: totalProfit.toFixed(2),
      totalLoss: totalLoss.toFixed(2),
      netProfit: (totalProfit - totalLoss).toFixed(2),
      averageProfit: winning.length > 0 ? (totalProfit / winning.length).toFixed(2) : 0,
      averageLoss: losing.length > 0 ? (totalLoss / losing.length).toFixed(2) : 0,
      largestWin: winning.length > 0 ? Math.max(...winning.map((t) => t.profitLoss)).toFixed(2) : 0,
      largestLoss: losing.length > 0 ? Math.min(...losing.map((t) => t.profitLoss)).toFixed(2) : 0,
      totalPips: totalPips,
    };
  };

  // Exportar trades como JSON
  const exportAsJSON = () => {
    const dataStr = JSON.stringify(trades, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trading_journal_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
  };

  // Exportar trades como CSV
  const exportAsCSV = () => {
    const headers = [
      "Data Entrada",
      "Data Saida",
      "Ativo",
      "Tipo",
      "Preco Entrada",
      "Preco Saida",
      "Preco Stop",
      "Tamanho Contrato",
      "Stop Loss ($)",
      "Take Profit",
      "Lucro/Perda ($)",
      "Lucro/Perda (%)",
      "Pips",
      "Motivo Entrada",
      "Status",
      "Duracao",
      "Sessao",
      "Notas",
    ];

    const rows = trades.map((t) => [
      t.entryDateTime,
      t.exitDateTime,
      t.asset,
      t.type,
      t.entryPrice,
      t.exitPrice,
      t.stopPrice,
      t.contractSize,
      `${t.stopLossInDollars}$`,
      t.takeProfit,
      t.profitLoss,
      t.profitLossPercent,
      t.pipsGained,
      t.entryReason,
      t.status,
      t.duration,
      t.session,
      t.notes,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const dataBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trading_journal_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return {
    trades,
    isLoaded,
    addTrade,
    updateTrade,
    deleteTrade,
    toggleFavorite,
    getStatistics,
    exportAsJSON,
    exportAsCSV,
  };
};
