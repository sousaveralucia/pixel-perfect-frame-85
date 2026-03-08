import { useState, useEffect } from "react";

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
    initialBalance: 1000,
    currentBalance: 1000,
    createdAt: new Date().toISOString(),
  },
  {
    id: "conta-challenger",
    name: "Challenger",
    initialBalance: 10000,
    currentBalance: 10000,
    createdAt: new Date().toISOString(),
  },
];

export function useAccountManager() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string>("account-100");

  // Carregar contas do localStorage
  useEffect(() => {
    const stored = localStorage.getItem("trading_accounts");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAccounts(parsed);
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

  // Salvar contas no localStorage
  useEffect(() => {
    if (accounts.length > 0) {
      localStorage.setItem("trading_accounts", JSON.stringify(accounts));
    }
  }, [accounts]);

  // Salvar conta ativa
  useEffect(() => {
    localStorage.setItem("trading_active_account", activeAccountId);
  }, [activeAccountId]);

  const getActiveAccount = () => {
    return accounts.find((acc) => acc.id === activeAccountId) || accounts[0];
  };

  const updateAccountBalance = (accountId: string, newBalance: number) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, currentBalance: newBalance } : acc))
    );
  };

  const switchAccount = (accountId: string) => {
    setActiveAccountId(accountId);
  };

  const updateAccountName = (accountId: string, newName: string) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, name: newName } : acc))
    );
  };

  const updateAccountInitialBalance = (accountId: string, newBalance: number) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId
          ? { ...acc, initialBalance: newBalance, currentBalance: newBalance }
          : acc
      )
    );
  };

  const syncAccountBalance = (accountId: string) => {
    const trades = JSON.parse(localStorage.getItem(`trades_enhanced_${accountId}`) || '[]');
    const totalMoneyResult = trades.reduce((sum: number, t: any) => sum + (t.moneyResult || 0), 0);
    const account = accounts.find((acc) => acc.id === accountId);
    if (account) {
      const newBalance = account.initialBalance + totalMoneyResult;
      updateAccountBalance(accountId, newBalance);
    }
  };

  const resetAccountData = (accountId: string, newInitialBalance: number = 100) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId
          ? { ...acc, initialBalance: newInitialBalance, currentBalance: newInitialBalance }
          : acc
      )
    );
    localStorage.setItem(`trades_enhanced_${accountId}`, JSON.stringify([]));
  };

  const setDailyLossLimit = (accountId: string, limit: number) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId
          ? { ...acc, dailyLossLimit: limit, lastResetDate: new Date().toISOString() }
          : acc
      )
    );
  };

  const getDailyLoss = (accountId: string): number => {
    const trades = JSON.parse(localStorage.getItem('trading_journal') || '[]');
    const today = new Date().toDateString();
    const todayTrades = trades.filter((t: any) => {
      const tradeDate = new Date(t.date).toDateString();
      return t.accountId === accountId && tradeDate === today;
    });
    return todayTrades.reduce((sum: number, t: any) => sum + Number(t.profitLoss), 0);
  };

  const hasReachedDailyLossLimit = (accountId: string): boolean => {
    const account = accounts.find((acc) => acc.id === accountId);
    if (!account || !account.dailyLossLimit) return false;
    const dailyLoss = getDailyLoss(accountId);
    return dailyLoss <= -Math.abs(account.dailyLossLimit);
  };

  return {
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
  };
}
