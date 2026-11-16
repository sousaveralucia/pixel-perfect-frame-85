import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DEFAULT_SETTINGS, OpSettings, tradingDate } from "@/lib/smc/engine";
import { toast } from "sonner";

export interface OpEntry { id: string; kind: string; trading_date: string; data: any; created_at: string }

export function useOp() {
  const { user } = useAuth();
  const [settings, setSettingsState] = useState<OpSettings>(DEFAULT_SETTINGS);
  const [entries, setEntries] = useState<OpEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const [s, e] = await Promise.all([
      supabase.from("op_settings").select("data").eq("user_id", user.id).maybeSingle(),
      supabase.from("op_entries").select("id,kind,trading_date,data,created_at").eq("user_id", user.id).order("created_at", { ascending: true }),
    ]);
    if (s.data?.data) setSettingsState({ ...DEFAULT_SETTINGS, ...(s.data.data as any) });
    setEntries((e.data as any) ?? []);
    setLoading(false);
  }, [user]);
  useEffect(() => { load(); }, [load]);

  const today = tradingDate(new Date(), settings.cutHourNY);

  const saveSettings = async (next: OpSettings) => {
    if (!user) return;
    setSettingsState(next);
    const { error } = await supabase.from("op_settings").upsert({ user_id: user.id, data: next as any, updated_at: new Date().toISOString() });
    if (error) toast.error("Erro ao salvar configurações"); else toast.success("Configurações salvas");
  };

  const add = async (kind: string, data: any, date = today) => {
    if (!user) return null;
    const { data: row, error } = await supabase.from("op_entries").insert({ user_id: user.id, kind, trading_date: date, data }).select("id,kind,trading_date,data,created_at").single();
    if (error) { toast.error("Erro ao salvar"); return null; }
    setEntries(p => [...p, row as any]);
    return row as any as OpEntry;
  };
  const update = async (id: string, data: any) => {
    setEntries(p => p.map(e => e.id === id ? { ...e, data } : e));
    const { error } = await supabase.from("op_entries").update({ data, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error("Erro ao salvar");
  };
  const remove = async (id: string) => {
    setEntries(p => p.filter(e => e.id !== id));
    await supabase.from("op_entries").delete().eq("id", id);
  };
  /** um registro por dia por tipo (rotina, emocional, diário) */
  const upsertDaily = async (kind: string, data: any) => {
    const ex = entries.find(e => e.kind === kind && e.trading_date === today);
    if (ex) return update(ex.id, data);
    return add(kind, data);
  };

  const byKind = useMemo(() => (k: string) => entries.filter(e => e.kind === k), [entries]);
  return { settings, saveSettings, entries, byKind, add, update, remove, upsertDaily, today, loading };
}
export type OpApi = ReturnType<typeof useOp>;
