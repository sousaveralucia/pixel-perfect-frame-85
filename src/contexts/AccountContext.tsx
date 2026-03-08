import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Account {
  id: string;
  account_key: string;
  name: string;
  initialBalance: number;
  currentBalance: number;
  createdAt: string;
  dailyLossLimit?: number;
  lastResetDate?: string;
}

interface AccountContextType {
  accounts: Account[];
  activeAccountId: string;
  getActiveAccount: () => Account | undefined;
  updateAccountBalance: (accountKey: string, newBalance: number) => void;
  switchAccount: (accountKey: string) => void;
  updateAccountName: (accountKey: string, newName: string) => void;
  updateAccountInitialBalance: (accountKey: string, newBalance: number) => void;
  resetAccountData: (accountKey: string, newInitialBalance?: number) => void;
  syncAccountBalance: (accountKey: string) => void;
  setDailyLossLimit: (accountKey: string, limit: number) => void;
  getDailyLoss: (accountKey: string) => number;
  hasReachedDailyLossLimit: (accountKey: string) => boolean;
  refreshAccounts: () => void;
}

const AccountContext = createContext<AccountContextType | null>(null);

function mapRow(row: any): Account {
  return {
    id: row.account_key,
    account_key: row.account_key,
    name: row.name,
    initialBalance: Number(row.initial_balance),
    currentBalance: Number(row.current_balance),
    createdAt: row.created_at,
    dailyLossLimit: row.daily_loss_limit ? Number(row.daily_loss_limit) : undefined,
    lastResetDate: row.last_reset_date || undefined,
  };
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string>("conta-pessoal");

  const loadAccounts = useCallback(async () => {
    if (!user) { setAccounts([]); return; }
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at");
    if (!error && data) {
      setAccounts(data.map(mapRow));
    }
  }, [user]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    const stored = localStorage.getItem("trading_active_account");
    if (stored) setActiveAccountId(stored);
  }, []);

  useEffect(() => {
    localStorage.setItem("trading_active_account", activeAccountId);
  }, [activeAccountId]);

  const getActiveAccount = useCallback(() => {
    return accounts.find((acc) => acc.id === activeAccountId) || accounts[0];
  }, [accounts, activeAccountId]);

  const updateAccountBalance = useCallback(async (accountKey: string, newBalance: number) => {
    if (!user) return;
    await supabase.from("accounts").update({ current_balance: newBalance }).eq("user_id", user.id).eq("account_key", accountKey);
    setAccounts((prev) => prev.map((acc) => acc.id === accountKey ? { ...acc, currentBalance: newBalance } : acc));
  }, [user]);

  const switchAccount = useCallback((accountKey: string) => {
    setActiveAccountId(accountKey);
  }, []);

  const updateAccountName = useCallback(async (accountKey: string, newName: string) => {
    if (!user) return;
    await supabase.from("accounts").update({ name: newName }).eq("user_id", user.id).eq("account_key", accountKey);
    setAccounts((prev) => prev.map((acc) => acc.id === accountKey ? { ...acc, name: newName } : acc));
  }, [user]);

  const updateAccountInitialBalance = useCallback(async (accountKey: string, newBalance: number) => {
    if (!user) return;
    await supabase.from("accounts").update({ initial_balance: newBalance, current_balance: newBalance }).eq("user_id", user.id).eq("account_key", accountKey);
    setAccounts((prev) => prev.map((acc) => acc.id === accountKey ? { ...acc, initialBalance: newBalance, currentBalance: newBalance } : acc));
  }, [user]);

  const syncAccountBalance = useCallback(async (accountKey: string) => {
    if (!user) return;
    const [tradesRes, withdrawalsRes] = await Promise.all([
      supabase.from("trades").select("money_result").eq("user_id", user.id).eq("account_key", accountKey),
      supabase.from("withdrawals").select("amount").eq("user_id", user.id).eq("account_key", accountKey),
    ]);
    const totalMoneyResult = (tradesRes.data || []).reduce((sum, t) => sum + (Number(t.money_result) || 0), 0);
    const totalWithdrawn = (withdrawalsRes.data || []).reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
    const account = accounts.find((acc) => acc.id === accountKey);
    if (account) {
      const newBalance = account.initialBalance + totalMoneyResult - totalWithdrawn;
      updateAccountBalance(accountKey, newBalance);
    }
  }, [accounts, user, updateAccountBalance]);

  const resetAccountData = useCallback(async (accountKey: string, newInitialBalance: number = 100) => {
    if (!user) return;
    await supabase.from("accounts").update({ initial_balance: newInitialBalance, current_balance: newInitialBalance }).eq("user_id", user.id).eq("account_key", accountKey);
    await supabase.from("trades").delete().eq("user_id", user.id).eq("account_key", accountKey);
    setAccounts((prev) => prev.map((acc) => acc.id === accountKey ? { ...acc, initialBalance: newInitialBalance, currentBalance: newInitialBalance } : acc));
  }, [user]);

  const setDailyLossLimit = useCallback(async (accountKey: string, limit: number) => {
    if (!user) return;
    await supabase.from("accounts").update({ daily_loss_limit: limit, last_reset_date: new Date().toISOString() }).eq("user_id", user.id).eq("account_key", accountKey);
    setAccounts((prev) => prev.map((acc) => acc.id === accountKey ? { ...acc, dailyLossLimit: limit, lastResetDate: new Date().toISOString() } : acc));
  }, [user]);

  const getDailyLoss = useCallback((accountKey: string): number => {
    // This is synchronous for now - would need async for full DB support
    return 0;
  }, []);

  const hasReachedDailyLossLimit = useCallback((accountKey: string): boolean => {
    const account = accounts.find((acc) => acc.id === accountKey);
    if (!account || !account.dailyLossLimit) return false;
    return false;
  }, [accounts]);

  return (
    <AccountContext.Provider
      value={{
        accounts,
        activeAccountId,
        getActiveAccount,
        updateAccountBalance,
        switchAccount,
        updateAccountName,
        updateAccountInitialBalance,
        resetAccountData,
        syncAccountBalance,
        setDailyLossLimit,
        getDailyLoss,
        hasReachedDailyLossLimit,
        refreshAccounts: loadAccounts,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccountContext() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccountContext must be used within AccountProvider");
  return ctx;
}
