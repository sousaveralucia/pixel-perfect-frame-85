import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Wallet, Edit2, Check, X, Trash2, AlertTriangle } from "lucide-react";
import { Account, useAccountManager } from "@/hooks/useAccountManager";

export default function AccountSelector() {
  const { accounts, activeAccountId, switchAccount, updateAccountInitialBalance, resetAccountData, setDailyLossLimit, getDailyLoss, hasReachedDailyLossLimit } = useAccountManager();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState<string>("");
  const [editingLimitId, setEditingLimitId] = useState<string | null>(null);
  const [limitValue, setLimitValue] = useState<string>("");

  const activeAccount = accounts.find((acc) => acc.id === activeAccountId);

  const handleEditBalance = (account: Account) => {
    setEditingId(account.id);
    setEditValue(account.initialBalance.toString());
  };

  const handleSaveBalance = (accountId: string) => {
    const newBalance = parseFloat(editValue);
    if (!isNaN(newBalance) && newBalance > 0) {
      updateAccountInitialBalance(accountId, newBalance);
      setEditingId(null);
    }
  };

  const handleEditName = (account: Account) => {
    setEditingNameId(account.id);
    setEditNameValue(account.name);
  };

  const handleSaveName = (accountId: string) => {
    if (editNameValue.trim()) {
      // Atualizar nome da conta no localStorage
      const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
      const updatedAccounts = accounts.map((acc: Account) =>
        acc.id === accountId ? { ...acc, name: editNameValue } : acc
      );
      localStorage.setItem('accounts', JSON.stringify(updatedAccounts));
      setEditingNameId(null);
      window.location.reload(); // Recarregar para refletir mudanças
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          Gerenciador de Contas
        </CardTitle>
        <CardDescription>Alterne entre diferentes contas de trading e gerencie saldos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                activeAccountId === account.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background hover:border-primary/50"
              }`}
              onClick={() => switchAccount(account.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  {editingNameId === account.id ? (
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="text"
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        className="h-8 text-sm"
                        placeholder="Nome da conta"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => handleSaveName(account.id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => setEditingNameId(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">{account.name}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditName(account);
                        }}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  {activeAccountId === account.id && (
                    <Badge className="bg-primary text-primary-foreground text-xs mt-1">Ativa</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Saldo Inicial</p>
                  {editingId === account.id ? (
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-8 text-sm"
                        placeholder="0.00"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => handleSaveBalance(account.id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-primary">${account.initialBalance.toFixed(2)}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditBalance(account);
                        }}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Saldo Atual</p>
                  <p className={`text-lg font-bold ${account.currentBalance >= account.initialBalance ? "text-green-600" : "text-red-600"}`}>
                    ${account.currentBalance.toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Lucro/Perda</p>
                  <p className={`text-sm font-semibold ${account.currentBalance - account.initialBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {account.currentBalance - account.initialBalance >= 0 ? "+" : ""}
                    ${(account.currentBalance - account.initialBalance).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {activeAccount && (
          <div className="bg-secondary/50 p-4 rounded-lg border border-border space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Conta Ativa</p>
              <p className="text-lg font-bold text-foreground">{activeAccount.name}</p>
              <p className="text-sm text-foreground/80 mt-2">
                Todos os trades registrados serão associados a esta conta.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="w-full gap-2"
              onClick={() => {
                const msg = `Limpar dados da ${activeAccount.name}?`;
                if (confirm(msg)) {
                  resetAccountData(activeAccount.id);
                  alert('Dados limpos!');
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
              Limpar Dados
            </Button>

            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800 space-y-3 mt-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <p className="font-semibold text-amber-900 dark:text-amber-100">Limite de Perda Diaria</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Perda de hoje: <span className="font-bold">${getDailyLoss(activeAccount.id).toFixed(2)}</span>
                </p>
                {activeAccount.dailyLossLimit && (
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Limite: <span className="font-bold">-${activeAccount.dailyLossLimit.toFixed(2)}</span>
                  </p>
                )}
                {hasReachedDailyLossLimit(activeAccount.id) && (
                  <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 p-2 rounded text-red-800 dark:text-red-200 text-sm font-semibold">
                    Limite de perda diaria atingido! Pare de fazer trades hoje.
                  </div>
                )}
              </div>
              {editingLimitId === activeAccount.id ? (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={limitValue}
                    onChange={(e) => setLimitValue(e.target.value)}
                    placeholder="Ex: 50"
                    className="h-8 text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      const limit = parseFloat(limitValue);
                      if (!isNaN(limit) && limit > 0) {
                        setDailyLossLimit(activeAccount.id, limit);
                        setEditingLimitId(null);
                      }
                    }}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => setEditingLimitId(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setEditingLimitId(activeAccount.id);
                    setLimitValue(activeAccount.dailyLossLimit?.toString() || "");
                  }}
                >
                  {activeAccount.dailyLossLimit ? "Editar Limite" : "Definir Limite"}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
