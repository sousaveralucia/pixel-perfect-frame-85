import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useDailyGate } from "@/contexts/DailyGateContext";
import { useTradeJournalUnified } from "@/hooks/useTradeJournalUnified";
import { useAccountManager } from "@/hooks/useAccountManager";
import { getTradingDate } from "@/lib/dailyGate";
import { toast } from "sonner";

export default function DailyCheckout({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { saveCheckout } = useDailyGate();
  const { activeAccountId } = useAccountManager();
  const { trades } = useTradeJournalUnified(activeAccountId);

  const todayTrades = useMemo(() => {
    const today = getTradingDate();
    return trades.filter((t) => (t.date ?? "").startsWith(today));
  }, [trades]);

  const dayResult = todayTrades.reduce((s, t) => s + (Number((t as any).profit ?? (t as any).result_value ?? 0)), 0);
  const wins = todayTrades.filter((t) => t.result === "WIN").length;
  const losses = todayTrades.filter((t) => t.result === "LOSS").length;
  const winrate = todayTrades.length ? Math.round((wins / todayTrades.length) * 100) : 0;

  const [notes, setNotes] = useState("");
  const [performance, setPerformance] = useState([Math.min(100, Math.max(0, 50 + winrate / 2))]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    await saveCheckout(notes, dayResult, todayTrades.length, performance[0]);
    toast.success("Check-Out registrado. Dia encerrado.");
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Check-Out Pós Mercado</DialogTitle>
          <DialogDescription>Encerre o dia e registre as conclusões.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-border p-2">
              <p className="text-xs text-muted-foreground">Trades</p>
              <p className="text-lg font-bold">{todayTrades.length}</p>
            </div>
            <div className="rounded-lg border border-border p-2">
              <p className="text-xs text-muted-foreground">W / L</p>
              <p className="text-lg font-bold">{wins} / {losses}</p>
            </div>
            <div className="rounded-lg border border-border p-2">
              <p className="text-xs text-muted-foreground">Winrate</p>
              <p className="text-lg font-bold">{winrate}%</p>
            </div>
          </div>

          <div className="rounded-lg border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground">Resultado do dia</p>
            <p className={`text-2xl font-bold ${dayResult >= 0 ? "text-success" : "text-destructive"}`}>
              {dayResult >= 0 ? "+" : ""}${dayResult.toFixed(2)}
            </p>
          </div>

          <div>
            <Label className="text-xs">Auto-avaliação de execução: {performance[0]}/100</Label>
            <Slider value={performance} onValueChange={setPerformance} min={0} max={100} step={5} className="mt-2" />
          </div>

          <div>
            <Label className="text-xs">Notas / Lições do dia</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="O que funcionou, o que melhorar, observações..."
              rows={4}
              className="mt-1"
            />
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={saving}>
            {saving ? "Salvando..." : "Concluir Check-Out"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
