import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface Account {
  id: string;
  name: string;
  initialBalance: number;
  currentBalance: number;
  createdAt: string;
  dailyLossLimit?: number;
  lastResetDate?: string;
}

const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: "conta-pessoal",
    name: "Conta Pessoal",
    initialBalance: 100,
    currentBalance: 100,
    createdAt: new Date().toISOString(),
  },
  {
    id: "conta-financiada",
    name: "Conta Financiada",
    initialBalance: 50000,
    currentBalance: 50000,
    createdAt: new Date().toISOString(),
  },
  {
    id: "conta-challenger",
    name: "Challenger",
    initialBalance: 100000,
    currentBalance: 100000,
    createdAt: new Date().toISOString(),
  },
];

const ACCOUNTS_VERSION = "v2";

interface AccountContextType {
  accounts: Account[];
  activeAccountId: string;
  getActiveAccount: () => Account | undefined;
  updateAccountBalance: (accountId: string, newBalance: number) => void;
  switchAccount: (accountId: string) => void;
  updateAccountName: (accountId: string, newName: string) => void;
  updateAccountInitialBalance: (accountId: string, newBalance: number) => void;
  resetAccountData: (accountId: string, newInitialBalance?: number) => void;
  syncAccountBalance: (accountId: string) => void;
  setDailyLossLimit: (accountId: string, limit: number) => void;
  getDailyLoss: (accountId: string) => number;
  hasReachedDailyLossLimit: (accountId: string) => boolean;
}

const AccountContext = createContext<AccountContextType | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string>("conta-pessoal");

  useEffect(() => {
    const version = localStorage.getItem("trading_accounts_version");
    if (version !== ACCOUNTS_VERSION) {
      setAccounts(DEFAULT_ACCOUNTS);
      localStorage.setItem("trading_accounts", JSON.stringify(DEFAULT_ACCOUNTS));
      localStorage.setItem("trading_accounts_version", ACCOUNTS_VERSION);
      setActiveAccountId("conta-pessoal");
      localStorage.setItem("trading_active_account", "conta-pessoal");
      return;
    }

    const stored = localStorage.getItem("trading_accounts");
    if (stored) {
      try {
        setAccounts(JSON.parse(stored));
      } catch {
        setAccounts(DEFAULT_ACCOUNTS);
        localStorage.setItem("trading_accounts", JSON.stringify(DEFAULT_ACCOUNTS));
      }
    } else {
      setAccounts(DEFAULT_ACCOUNTS);
      localStorage.setItem("trading_accounts", JSON.stringify(DEFAULT_ACCOUNTS));
    }

    const storedActiveId = localStorage.getItem("trading_active_account");
    if (storedActiveId) {
      setActiveAccountId(storedActiveId);
    }
  }, []);

  useEffect(() => {
    if (accounts.length > 0) {
      localStorage.setItem("trading_accounts", JSON.stringify(accounts));
    }
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem("trading_active_account", activeAccountId);
  }, [activeAccountId]);

  const getActiveAccount = useCallback(() => {
    return accounts.find((acc) => acc.id === activeAccountId) || accounts[0];
  }, [accounts, activeAccountId]);

  const updateAccountBalance = useCallback((accountId: string, newBalance: number) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, currentBalance: newBalance } : acc))
    );
  }, []);

  const switchAccount = useCallback((accountId: string) => {
    setActiveAccountId(accountId);
  }, []);

  const updateAccountName = useCallback((accountId: string, newName: string) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, name: newName } : acc))
    );
  }, []);

  const updateAccountInitialBalance = useCallback((accountId: string, newBalance: number) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId
          ? { ...acc, initialBalance: newBalance, currentBalance: newBalance }
          : acc
      )
    );
  }, []);

  const syncAccountBalance = useCallback((accountId: string) => {
    const trades = JSON.parse(localStorage.getItem(`trades_enhanced_${accountId}`) || '[]');
    const totalMoneyResult = trades.reduce((sum: number, t: any) => sum + (t.moneyResult || 0), 0);
    const account = accounts.find((acc) => acc.id === accountId);
    if (account) {
      const newBalance = account.initialBalance + totalMoneyResult;
      updateAccountBalance(accountId, newBalance);
    }
  }, [accounts, updateAccountBalance]);

  const resetAccountData = useCallback((accountId: string, newInitialBalance: number = 100) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId
          ? { ...acc, initialBalance: newInitialBalance, currentBalance: newInitialBalance }
          : acc
      )
    );
    localStorage.setItem(`trades_enhanced_${accountId}`, JSON.stringify([]));
  }, []);

  const setDailyLossLimit = useCallback((accountId: string, limit: number) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId
          ? { ...acc, dailyLossLimit: limit, lastResetDate: new Date().toISOString() }
          : acc
      )
    );
  }, []);

  const getDailyLoss = useCallback((accountId: string): number => {
    const trades = JSON.parse(localStorage.getItem('trading_journal') || '[]');
    const today = new Date().toDateString();
    const todayTrades = trades.filter((t: any) => {
      const tradeDate = new Date(t.date).toDateString();
      return t.accountId === accountId && tradeDate === today;
    });
    return todayTrades.reduce((sum: number, t: any) => sum + Number(t.profitLoss), 0);
  }, []);

  const hasReachedDailyLossLimit = useCallback((accountId: string): boolean => {
    const account = accounts.find((acc) => acc.id === accountId);
    if (!account || !account.dailyLossLimit) return false;
    const dailyLoss = getDailyLoss(accountId);
    return dailyLoss <= -Math.abs(account.dailyLossLimit);
  }, [accounts, getDailyLoss]);

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
