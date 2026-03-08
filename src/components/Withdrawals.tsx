import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAccountContext } from "@/contexts/AccountContext";
import { toast } from "sonner";
import { DollarSign, Upload, Trash2, FileText, Image, TrendingDown, Percent, Wallet } from "lucide-react";

interface Withdrawal {
  id: string;
  account_key: string;
  amount: number;
  capital_at_withdrawal: number;
  profit_percentage: number;
  proof_url: string | null;
  notes: string | null;
  date: string;
  created_at: string;
}

export default function Withdrawals() {
  const { user } = useAuth();
  const { activeAccountId, getActiveAccount, updateAccountBalance, refreshAccounts } = useAccountContext();
  const activeAccount = getActiveAccount();

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const loadWithdrawals = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("user_id", user.id)
      .eq("account_key", activeAccountId)
      .order("created_at", { ascending: false });
    if (data) setWithdrawals(data as Withdrawal[]);
  }, [user, activeAccountId]);

  useEffect(() => {
    loadWithdrawals();
  }, [loadWithdrawals]);

  const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);
  const currentBalance = activeAccount?.currentBalance ?? 0;
  const initialBalance = activeAccount?.initialBalance ?? 0;
  const totalProfit = currentBalance - initialBalance + totalWithdrawn;
  const withdrawnPct = totalProfit > 0 ? (totalWithdrawn / totalProfit) * 100 : 0;
  const retainedPct = totalProfit > 0 ? ((currentBalance - initialBalance) / totalProfit) * 100 : 0;

  const handleSubmit = async () => {
    if (!user || !activeAccount) return;
    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      toast.error("Informe um valor válido para o saque.");
      return;
    }
    if (withdrawalAmount > currentBalance) {
      toast.error("Saldo insuficiente para este saque.");
      return;
    }

    setLoading(true);
    try {
      let proofUrl: string | null = null;

      if (proofFile) {
        const ext = proofFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("withdrawal-proofs")
          .upload(path, proofFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("withdrawal-proofs")
          .getPublicUrl(path);
        proofUrl = urlData.publicUrl;
      }

      const newBalance = currentBalance - withdrawalAmount;
      const profitPct = currentBalance > 0 ? (withdrawalAmount / currentBalance) * 100 : 0;

      const { error } = await supabase.from("withdrawals").insert({
        user_id: user.id,
        account_key: activeAccountId,
        amount: withdrawalAmount,
        capital_at_withdrawal: currentBalance,
        profit_percentage: profitPct,
        proof_url: proofUrl,
        notes: notes || null,
        date,
      });

      if (error) throw error;

      await updateAccountBalance(activeAccountId, newBalance);
      refreshAccounts();

      setAmount("");
      setNotes("");
      setProofFile(null);
      loadWithdrawals();
      toast.success(`Saque de $${withdrawalAmount.toFixed(2)} registrado! Novo saldo: $${newBalance.toFixed(2)}`);
    } catch (err: any) {
      toast.error("Erro ao registrar saque: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (withdrawal: Withdrawal) => {
    if (!user) return;
    const { error } = await supabase.from("withdrawals").delete().eq("id", withdrawal.id);
    if (error) {
      toast.error("Erro ao excluir saque.");
      return;
    }
    // Restore balance
    const newBalance = currentBalance + withdrawal.amount;
    await updateAccountBalance(activeAccountId, newBalance);
    refreshAccounts();
    loadWithdrawals();
    toast.success("Saque excluído e saldo restaurado.");
  };

  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Saldo Atual</p>
            </div>
            <p className="text-xl font-bold text-foreground">${currentBalance.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-green-500" />
              <p className="text-xs text-muted-foreground">Total Sacado</p>
            </div>
            <p className="text-xl font-bold text-green-500">${totalWithdrawn.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Percent className="w-4 h-4 text-amber-500" />
              <p className="text-xs text-muted-foreground">% Sacado do Lucro</p>
            </div>
            <p className="text-xl font-bold text-amber-500">{withdrawnPct.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-blue-500" />
              <p className="text-xs text-muted-foreground">% Lucro Retido</p>
            </div>
            <p className="text-xl font-bold text-blue-500">{retainedPct.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* New Withdrawal Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Registrar Saque
          </CardTitle>
          <CardDescription>
            Registre um saque da conta <strong>{activeAccount?.name}</strong>. O saldo será atualizado automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Valor do Saque ($)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Comprovante (imagem ou PDF)</Label>
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Input
              placeholder="Ex: Saque via PIX para conta pessoal"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {amount && parseFloat(amount) > 0 && (
            <Card className="bg-secondary/30 border-dashed">
              <CardContent className="pt-4 pb-3">
                <p className="text-sm text-muted-foreground">
                  Após o saque de <strong className="text-green-500">${parseFloat(amount).toFixed(2)}</strong>, 
                  seu novo saldo será <strong className="text-foreground">${(currentBalance - parseFloat(amount)).toFixed(2)}</strong> — 
                  esse valor passa a ser seu novo capital operacional.
                </p>
              </CardContent>
            </Card>
          )}

          <Button onClick={handleSubmit} disabled={loading} className="w-full md:w-auto">
            {loading ? "Registrando..." : "Registrar Saque"}
          </Button>
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Saques</CardTitle>
          <CardDescription>{withdrawals.length} saque(s) registrado(s) nesta conta</CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum saque registrado ainda.</p>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((w) => (
                <Card key={w.id} className="border-l-4 border-l-green-500/50">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-lg font-bold text-green-500">${w.amount.toFixed(2)}</span>
                          <Badge variant="outline" className="text-xs">
                            {w.profit_percentage.toFixed(1)}% do capital
                          </Badge>
                          <span className="text-xs text-muted-foreground">{w.date}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Capital no momento: ${w.capital_at_withdrawal.toFixed(2)}
                        </p>
                        {w.notes && (
                          <p className="text-sm text-foreground/70">{w.notes}</p>
                        )}
                        {w.proof_url && (
                          <a
                            href={w.proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                          >
                            {isImage(w.proof_url) ? (
                              <Image className="w-3 h-3" />
                            ) : (
                              <FileText className="w-3 h-3" />
                            )}
                            Ver comprovante
                          </a>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(w)}
                        title="Excluir saque e restaurar saldo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
