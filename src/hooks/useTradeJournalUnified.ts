import { useState, useEffect } from "react";

export interface TradeWithChecklist {
  id: string;
  date: string;
  asset: string;
  entryPrice: string;
  exitPrice: string;
  stopLoss: string;
  takeProfit: string;
  result: "WIN" | "LOSS" | "BREAK_EVEN" | "ONGOING";
  resultPrice: string;
  session: "Manha" | "Tarde" | "Noite" | "";
  account: "Conta 1 ($100)" | "Conta 2 ($1000)" | "Conta 3 ($10000)";
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
  rational: {
    analysisConfirmed: boolean;
    planRespected: boolean;
    riskManaged: boolean;
  };
  routine: {
    hydration: boolean;
    breathing: boolean;
    sleep: boolean;
    meditation: boolean;
  };
  preTradeImage?: string;
  tradingImage?: string;
  postTradeImage?: string;
  createdAt: number;
}

export const useTradeJournalUnified = (accountId: string) => {
  const [trades, setTrades] = useState<TradeWithChecklist[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar trades do localStorage
  useEffect(() => {
    const loadTrades = () => {
      const saved = localStorage.getItem(`trades_enhanced_${accountId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setTrades(parsed);
        } catch (error) {
          console.error("Erro ao carregar trades:", error);
          setTrades([]);
        }
      }
      setIsLoaded(true);
    };

    loadTrades();

    // Listener para sincronizar em tempo real quando o localStorage muda
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `trades_enhanced_${accountId}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setTrades(parsed);
        } catch (error) {
          console.error("Erro ao sincronizar trades:", error);
        }
      }
    };

    // Listener para eventos customizados (sincronização entre abas)
    const handleCustomEvent = () => {
      loadTrades();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("tradesUpdated", handleCustomEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("tradesUpdated", handleCustomEvent);
    };
  }, [accountId]);

  // Salvar trades no localStorage
  const saveTrades = (updatedTrades: TradeWithChecklist[]) => {
    setTrades(updatedTrades);
    localStorage.setItem(`trades_enhanced_${accountId}`, JSON.stringify(updatedTrades));
    // Disparar evento customizado para sincronizar entre componentes
    window.dispatchEvent(new Event("tradesUpdated"));
  };

  // Adicionar novo trade
  const addTrade = (trade: Omit<TradeWithChecklist, "id" | "createdAt">) => {
    const newTrade: TradeWithChecklist = {
      ...trade,
      id: `trade_${Date.now()}`,
      createdAt: Date.now(),
    };
    saveTrades([...trades, newTrade]);
    return newTrade;
  };

  // Atualizar trade existente
  const updateTrade = (id: string, updates: Partial<TradeWithChecklist>) => {
    const updated = trades.map((t) => (t.id === id ? { ...t, ...updates } : t));
    saveTrades(updated);
  };

  // Alternar favorito
  const toggleFavorite = (id: string) => {
    const updated = trades.map((t) => (t.id === id ? { ...t, isFavorite: !t.isFavorite } : t));
    saveTrades(updated);
  };

  // Deletar trade
  const deleteTrade = (id: string) => {
    saveTrades(trades.filter((t) => t.id !== id));
  };

  // Filtrar trades por sessão
  const getTradesBySession = (session: string) => {
    return trades.filter((t) => t.session === session);
  };

  // Filtrar trades por ativo
  const getTradesByAsset = (asset: string) => {
    return trades.filter((t) => t.asset === asset);
  };

  // Obter estatísticas
  const getStatistics = () => {
    const wins = trades.filter((t) => t.result === "WIN").length;
    const losses = trades.filter((t) => t.result === "LOSS").length;
    const breakEven = trades.filter((t) => t.result === "BREAK_EVEN").length;
    const total = trades.length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;

    return {
      total,
      wins,
      losses,
      breakEven,
      winRate: winRate.toFixed(1),
    };
  };

  return {
    trades,
    isLoaded,
    addTrade,
    updateTrade,
    toggleFavorite,
    deleteTrade,
    getTradesBySession,
    getTradesByAsset,
    getStatistics,
    saveTrades,
  };
};
