import { createContext, useContext, useEffect, useMemo, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useAccountManager } from "@/hooks/useAccountManager";
import {
  getTradingDate, isWeekday, msUntilNextReset, nextResetDate,
  CheckinData, calcReadinessScore,
} from "@/lib/dailyGate";

export type DailyStatus =
  | "not_started"   // 🔴 dia útil sem check-in
  | "checked_in"    // 🟡 check-in feito, ainda não operou
  | "trading"       // 🟢 operação liberada (operou ao menos 1 trade)
  | "closed"        // 🔵 check-out feito
  | "weekend"       // ⚪ sábado/domingo (modo consulta)
  | "locked_out";   // 🔒 stop/meta atingido — bloqueado até próximo dia

export interface DailyRecord {
  id?: string;
  date: string;
  checkin_completed_at: string | null;
  checkout_completed_at: string | null;
  emotional_state: string | null;
  mental_clarity: number | null;
  physical_state: string | null;
  sleep_hours: number | null;
  hydration: string | null;
  daily_intention: string | null;
  readiness_score: number | null;
  day_result: number | null;
  trades_count: number | null;
  performance_score: number | null;
  checkout_notes: string | null;
  lockout_until: string | null;
  lockout_reason: string | null;
}

interface DailyGateContextValue {
  loading: boolean;
  tradingDate: string;
  status: DailyStatus;
  record: DailyRecord | null;
  readinessScore: number;
  lockoutUntil: Date | null;
  isWeekendMode: boolean;
  isOperationAllowed: boolean;          // pode acessar áreas operacionais
  isReadOnlyAllowed: boolean;           // pode ver consultas
  saveCheckin: (data: CheckinData) => Promise<void>;
  saveCheckout: (notes: string, dayResult: number, tradesCount: number, performanceScore: number) => Promise<void>;
  triggerLockout: (reason: string) => Promise<void>;
  markTrading: () => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<DailyGateContextValue | null>(null);

export function DailyGateProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { activeAccountId } = useAccountManager();
  const [tradingDate, setTradingDate] = useState(getTradingDate());
  const [record, setRecord] = useState<DailyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const fetchRecord = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const date = getTradingDate();
    setTradingDate(date);
    const { data } = await supabase
      .from("daily_validations")
      .select("*")
      .eq("user_id", user.id)
      .eq("account_key", activeAccountId)
      .eq("date", date)
      .maybeSingle();
    setRecord((data as any) ?? null);
    setLoading(false);
  }, [user, activeAccountId]);

  useEffect(() => { fetchRecord(); }, [fetchRecord]);

  // Reset automático às 00:00 GMT-3
  useEffect(() => {
    let timeout: number;
    const schedule = () => {
      timeout = window.setTimeout(() => {
        setRecord(null);
        setTradingDate(getTradingDate());
        fetchRecord();
        schedule();
      }, msUntilNextReset() + 1000);
    };
    schedule();
    return () => clearTimeout(timeout);
  }, [fetchRecord]);

  // Tick para revalidar lockout/countdowns
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  const lockoutUntil = useMemo(() => {
    if (!record?.lockout_until) return null;
    const d = new Date(record.lockout_until);
    return d > new Date() ? d : null;
  }, [record, tick]);

  const isWeekendMode = !isWeekday();

  const status: DailyStatus = useMemo(() => {
    if (lockoutUntil) return "locked_out";
    if (isWeekendMode) return "weekend";
    if (record?.checkout_completed_at) return "closed";
    if (record?.checkin_completed_at) {
      return (record.trades_count ?? 0) > 0 ? "trading" : "checked_in";
    }
    return "not_started";
  }, [record, isWeekendMode, lockoutUntil]);

  const isOperationAllowed = status === "checked_in" || status === "trading";
  const isReadOnlyAllowed = status !== "not_started"; // weekend/locked_out podem consultar; not_started não

  const upsertRecord = async (patch: Partial<DailyRecord>) => {
    if (!user) return;
    const date = getTradingDate();
    const payload = {
      user_id: user.id,
      account_key: activeAccountId,
      date,
      ...patch,
    };
    const { data } = await supabase
      .from("daily_validations")
      .upsert(payload, { onConflict: "user_id,account_key,date" })
      .select("*")
      .maybeSingle();
    if (data) setRecord(data as any);
  };

  const saveCheckin = async (data: CheckinData) => {
    const score = calcReadinessScore(data);
    await upsertRecord({
      checkin_completed_at: new Date().toISOString(),
      emotional_state: data.emotionalState,
      mental_clarity: data.mentalClarity,
      physical_state: data.physicalState,
      sleep_hours: data.sleepHours,
      hydration: data.hydration,
      daily_intention: data.dailyIntention,
      readiness_score: score,
    });
  };

  const saveCheckout = async (notes: string, dayResult: number, tradesCount: number, performanceScore: number) => {
    await upsertRecord({
      checkout_completed_at: new Date().toISOString(),
      checkout_notes: notes,
      day_result: dayResult,
      trades_count: tradesCount,
      performance_score: performanceScore,
    });
  };

  const triggerLockout = async (reason: string) => {
    const until = nextResetDate().toISOString();
    await upsertRecord({ lockout_until: until, lockout_reason: reason });
  };

  const markTrading = () => {
    setRecord((r) => r ? { ...r, trades_count: (r.trades_count ?? 0) + 1 } : r);
  };

  return (
    <Ctx.Provider value={{
      loading, tradingDate, status, record,
      readinessScore: record?.readiness_score ?? 0,
      lockoutUntil, isWeekendMode, isOperationAllowed, isReadOnlyAllowed,
      saveCheckin, saveCheckout, triggerLockout, markTrading,
      refresh: fetchRecord,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useDailyGate() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDailyGate must be used inside DailyGateProvider");
  return v;
}
