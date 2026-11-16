import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OpApi } from "@/hooks/useOp";
import { evaluateBrakes, payoutStatus, MODE_INFO, Mode, Asset, consecutiveStops, TradeLite } from "@/lib/smc/engine";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

export function tradesLite(op: OpApi): TradeLite[] {
  return op.byKind("trade").map(e => ({ date: e.trading_date, resultUsd: Number(e.data.resultUsd || 0), resultR: Number(e.data.resultR || 0), checklistComplete: !!e.data.checklistComplete })).filter((_, i, arr) => true);
}
export function currentModes(op: OpApi): Record<Asset, Mode> {
  const m: Record<Asset, Mode> = { XAUUSD: "VIGIA", NAS100: "VIGIA" };
  op.byKind("mode").forEach(e => { m[e.data.asset as Asset] = e.data.mode; });
  return m;
}
export function weekPnl(op: OpApi) {
  const d = new Date(op.today + "T12:00:00Z"); const dow = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - dow);
  const start = d.toISOString().slice(0, 10);
  return tradesLite(op).filter(t => t.date >= start).reduce((a, t) => a + t.resultUsd, 0);
}
export function brakeNow(op: OpApi) {
  const all = tradesLite(op); const today = all.filter(t => t.date === op.today);
  const unlocked = op.byKind("unlock").some(e => e.trading_date === op.today);
  const cushion = Number((op.settings as any).cushion ?? 2000);
  const b = evaluateBrakes(op.settings, today, all, weekPnl(op), cushion);
  return { ...b, blocksEntry: b.blocksEntry && !unlocked, unlocked };
}

export default function SmcToday({ op, go }: { op: OpApi; go: (t: string) => void }) {
  const all = tradesLite(op); const today = all.filter(t => t.date === op.today);
  const pnl = today.reduce((a, t) => a + t.resultUsd, 0);
  const stops = today.filter(t => t.resultUsd < 0).length;
  const brake = brakeNow(op); const modes = currentModes(op);
  const days: Record<string, number> = {}; all.forEach(t => { days[t.date] = (days[t.date] || 0) + t.resultUsd; });
  const lastPayout = op.byKind("payout").slice(-1)[0]?.trading_date ?? "0000";
  const cycle = Object.entries(days).filter(([d]) => d > lastPayout).map(([, v]) => v);
  const pay = payoutStatus(cycle, op.settings);
  const emo = op.byKind("emotional").find(e => e.trading_date === op.today);
  const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "USD" });

  const unlock = async () => {
    const reason = prompt("Desbloqueio consciente — por que? (fica registrado)");
    if (reason) await op.add("unlock", { reason, brake: brake.message });
  };

  return (
    <div className="space-y-4">
      <Card className={brake.blocksEntry ? "border-destructive" : brake.level === "pausa" ? "border-warning" : "border-success"}>
        <CardContent className="p-4 flex items-start gap-3">
          {brake.blocksEntry ? <ShieldAlert className="h-6 w-6 text-destructive shrink-0" /> : brake.level === "pausa" ? <AlertTriangle className="h-6 w-6 text-warning shrink-0" /> : <CheckCircle2 className="h-6 w-6 text-success shrink-0" />}
          <div className="flex-1">
            <p className="font-semibold text-foreground">{brake.blocksEntry ? "Entradas bloqueadas" : "Liberado para operar"}</p>
            <p className="text-sm text-muted-foreground">{brake.message}{brake.unlocked && " (desbloqueio consciente registrado)"}</p>
          </div>
          {brake.blocksEntry && <Button size="sm" variant="outline" onClick={unlock}>Desbloquear</Button>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[["Lucro do dia", fmt(pnl), `meta ${fmt(op.settings.dailyTarget)}`], ["Stops hoje", `${stops}/${op.settings.dailyStopLimit}`, ""], ["Stops seguidos", String(consecutiveStops(all)), `observação em ${op.settings.observeAfterStreak}`], ["Semana", fmt(weekPnl(op)), `freio -${fmt(op.settings.weeklyBrake)}`], ["Dias válidos saque", `${pay.valid}/${op.settings.payoutDaysNeeded}`, pay.eligible ? "APTO A SACAR" : `≥ ${fmt(op.settings.payoutValidDay)}`]].map(([l, v, s]) => (
          <Card key={l}><CardContent className="p-3"><p className="text-xs text-muted-foreground">{l}</p><p className="text-lg font-bold font-mono text-foreground">{v}</p><p className="text-[11px] text-muted-foreground">{s}</p></CardContent></Card>
        ))}
      </div>

      <Card><CardHeader className="pb-2"><CardTitle className="text-base">Modo de cada ativo</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(Object.keys(modes) as Asset[]).map(a => (
            <div key={a} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div><p className="font-semibold text-foreground">{a}</p><p className="text-xs text-muted-foreground">{MODE_INFO[modes[a]].cadence}</p></div>
              <Badge className={MODE_INFO[modes[a]].color}>{MODE_INFO[modes[a]].label}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card><CardHeader className="pb-2"><CardTitle className="text-base">Próximos passos</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button variant={emo ? "outline" : "default"} className="h-12" onClick={() => go("op-rotina")}>{emo ? "✓ Check emocional feito" : "Fazer check emocional"}</Button>
          <Button variant="outline" className="h-12" onClick={() => go("op-mapa")}>Novo scan / Fibo</Button>
          <Button className="h-12" disabled={brake.blocksEntry} onClick={() => go("op-trade")}>Novo trade</Button>
        </CardContent>
      </Card>
    </div>
  );
}
