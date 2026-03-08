import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TradeWithChecklist {
  id: string;
  date: string;
  entryTime?: string;
  asset: string;
  entryPrice: string;
  exitPrice: string;
  stopLoss: string;
  takeProfit: string;
  result: "WIN" | "LOSS" | "BREAK_EVEN" | "ONGOING";
  resultPrice: string;
  session: "Manha" | "Tarde" | "Noite" | "";
  marketSession?: "NY" | "Londres" | "Ásia" | "Sobreposição" | "Fechado";
  account: string;
  notes: string;
  isFavorite: boolean;
  moneyResult?: number;
  riskReward?: number;
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
  [key: string]: any; // allow extra fields
}

function mapRowToTrade(row: any): TradeWithChecklist {
  return {
    id: row.id,
    date: row.date || "",
    entryTime: row.entry_time || undefined,
    asset: row.asset || "",
    entryPrice: row.entry_price || "",
    exitPrice: row.exit_price || "",
    stopLoss: row.stop_loss || "",
    takeProfit: row.take_profit || "",
    result: row.result || "ONGOING",
    resultPrice: row.result_price || "",
    session: row.session || "",
    account: row.account_key || "",
    notes: row.notes || "",
    isFavorite: row.is_favorite || false,
    moneyResult: row.money_result ? Number(row.money_result) : undefined,
    riskReward: row.risk_reward != null ? Number(row.risk_reward) : undefined,
    operational: row.operational || { chochValidoHTF: false, caixaGannTracada: false, regiaoDescontada50: false, orderBlockIdentificado: false, entrada50OB: false, stopRiskManagement: false, tempoGraficoOperacional: false },
    emotional: row.emotional || { hydration: false, breathing: false, mentalClarity: false },
    rational: row.rational || { analysisConfirmed: false, planRespected: false, riskManaged: false },
    routine: row.routine || { hydration: false, breathing: false, sleep: false, meditation: false },
    preTradeImage: row.pre_trade_image || undefined,
    tradingImage: row.trading_image || undefined,
    postTradeImage: row.post_trade_image || undefined,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export const useTradeJournalUnified = (accountId: string) => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<TradeWithChecklist[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadTrades = useCallback(async () => {
    if (!user || !accountId) { setTrades([]); setIsLoaded(true); return; }
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .eq("account_key", accountId)
      .order("created_at", { ascending: true });
    if (!error && data) {
      setTrades(data.map(mapRowToTrade));
    }
    setIsLoaded(true);
  }, [user, accountId]);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  const saveTrades = useCallback((updatedTrades: TradeWithChecklist[]) => {
    setTrades(updatedTrades);
  }, []);

  const addTrade = useCallback(async (trade: Omit<TradeWithChecklist, "id" | "createdAt">) => {
    if (!user) return null;
    const { data, error } = await supabase.from("trades").insert({
      user_id: user.id,
      account_key: accountId,
      date: trade.date,
      entry_time: trade.entryTime || null,
      asset: trade.asset,
      entry_price: trade.entryPrice,
      exit_price: trade.exitPrice,
      stop_loss: trade.stopLoss,
      take_profit: trade.takeProfit,
      result: trade.result,
      result_price: trade.resultPrice,
      session: trade.session,
      notes: trade.notes,
      is_favorite: trade.isFavorite,
      money_result: trade.moneyResult || null,
      risk_reward: trade.riskReward ?? null,
      operational: trade.operational as any,
      emotional: trade.emotional as any,
      rational: trade.rational as any,
      routine: trade.routine as any,
      pre_trade_image: trade.preTradeImage || null,
      trading_image: trade.tradingImage || null,
      post_trade_image: trade.postTradeImage || null,
    }).select().single();
    if (!error && data) {
      const newTrade = mapRowToTrade(data);
      setTrades((prev) => [...prev, newTrade]);
      return newTrade;
    }
    return null;
  }, [user, accountId]);

  const updateTrade = useCallback(async (id: string, updates: Partial<TradeWithChecklist>) => {
    if (!user) return;
    const dbUpdates: any = {};
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.entryTime !== undefined) dbUpdates.entry_time = updates.entryTime;
    if (updates.asset !== undefined) dbUpdates.asset = updates.asset;
    if (updates.entryPrice !== undefined) dbUpdates.entry_price = updates.entryPrice;
    if (updates.exitPrice !== undefined) dbUpdates.exit_price = updates.exitPrice;
    if (updates.stopLoss !== undefined) dbUpdates.stop_loss = updates.stopLoss;
    if (updates.takeProfit !== undefined) dbUpdates.take_profit = updates.takeProfit;
    if (updates.result !== undefined) dbUpdates.result = updates.result;
    if (updates.resultPrice !== undefined) dbUpdates.result_price = updates.resultPrice;
    if (updates.session !== undefined) dbUpdates.session = updates.session;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.isFavorite !== undefined) dbUpdates.is_favorite = updates.isFavorite;
    if (updates.moneyResult !== undefined) dbUpdates.money_result = updates.moneyResult;
    if (updates.riskReward !== undefined) dbUpdates.risk_reward = updates.riskReward;
    if (updates.operational !== undefined) dbUpdates.operational = updates.operational;
    if (updates.emotional !== undefined) dbUpdates.emotional = updates.emotional;
    if (updates.rational !== undefined) dbUpdates.rational = updates.rational;
    if (updates.routine !== undefined) dbUpdates.routine = updates.routine;
    if (updates.preTradeImage !== undefined) dbUpdates.pre_trade_image = updates.preTradeImage;
    if (updates.tradingImage !== undefined) dbUpdates.trading_image = updates.tradingImage;
    if (updates.postTradeImage !== undefined) dbUpdates.post_trade_image = updates.postTradeImage;

    await supabase.from("trades").update(dbUpdates).eq("id", id).eq("user_id", user.id);
    setTrades((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, [user]);

  const toggleFavorite = useCallback(async (id: string) => {
    const trade = trades.find((t) => t.id === id);
    if (!trade || !user) return;
    const newVal = !trade.isFavorite;
    await supabase.from("trades").update({ is_favorite: newVal }).eq("id", id).eq("user_id", user.id);
    setTrades((prev) => prev.map((t) => (t.id === id ? { ...t, isFavorite: newVal } : t)));
  }, [trades, user]);

  const deleteTrade = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from("trades").delete().eq("id", id).eq("user_id", user.id);
    setTrades((prev) => prev.filter((t) => t.id !== id));
  }, [user]);

  const getTradesBySession = (session: string) => trades.filter((t) => t.session === session);
  const getTradesByAsset = (asset: string) => trades.filter((t) => t.asset === asset);

  const getStatistics = () => {
    const wins = trades.filter((t) => t.result === "WIN").length;
    const losses = trades.filter((t) => t.result === "LOSS").length;
    const breakEven = trades.filter((t) => t.result === "BREAK_EVEN").length;
    const total = trades.length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    return { total, wins, losses, breakEven, winRate: winRate.toFixed(1) };
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
