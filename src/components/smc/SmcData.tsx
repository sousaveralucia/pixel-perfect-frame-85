import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OpApi } from "@/hooks/useOp";
import { streakProbability } from "@/lib/smc/engine";

export default function SmcData({ op }: { op: OpApi }) {
  const tr = op.byKind("trade").map(e => e.data);
  const n = tr.length; const wins = tr.filter(t => t.resultUsd > 0);
  const wr = n ? wins.length / n : 0;
  const avgWinR = wins.length ? wins.reduce((a, t) => a + t.resultR, 0) / wins.length : 0;
  const process = n ? tr.filter(t => t.checklistComplete && t.reguaOk && !t.processBroken).length / n * 100 : 0;
  const expect = wr * avgWinR - (1 - wr) * 1;
  let cum = 0, peak = 0, dd = 0; tr.forEach(t => { cum += t.resultR; peak = Math.max(peak, cum); dd = Math.min(dd, cum - peak); });
  const group = (label: string, fn: (t: any) => string) => {
    const g: Record<string, any[]> = {}; tr.forEach(t => { (g[fn(t)] ??= []).push(t); });
    return <Card key={label}><CardHeader className="pb-2"><CardTitle className="text-sm">{label}</CardTitle></CardHeader><CardContent className="space-y-1 text-sm">
      {Object.entries(g).map(([k, v]) => <div key={k} className="flex justify-between font-mono"><span className="text-foreground">{k}</span><span className="text-muted-foreground">{v.length} trades · {Math.round(v.filter(t => t.resultUsd > 0).length / v.length * 100)}% · {v.reduce((a, t) => a + t.resultR, 0).toFixed(1)}R</span></div>)}
      {!tr.length && <p className="text-muted-foreground">Sem trades ainda.</p>}</CardContent></Card>;
  };
  const p = wr || 0.3;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">{[["Trades", n], ["Acerto", `${(wr * 100).toFixed(0)}%`], ["Nota de processo", `${process.toFixed(0)}%`], ["Expectativa", `${expect.toFixed(2)}R`], ["Drawdown", `${dd.toFixed(1)}R`]].map(([l, v]) => <Card key={l as string}><CardContent className="p-3"><p className="text-xs text-muted-foreground">{l}</p><p className="text-lg font-bold font-mono text-foreground">{v}</p></CardContent></Card>)}</div>
      <p className="text-xs text-muted-foreground">Meta: 100 a 200 trades com as regras atuais antes de tirar conclusões. Meta de processo: 100%.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {group("Processo × resultado", t => `${t.checklistComplete && !t.processBroken ? "Processo certo" : "Processo quebrado"} · ${t.resultUsd > 0 ? "lucro" : "stop"}`)}
        {group("75% vs 85%", t => `${t.ltfLevel * 100}%`)}
        {group("Ativo", t => t.asset)}
        {group("Direção", t => t.dir)}
        {group("Checklist", t => t.checklistComplete ? "completo" : "incompleto")}
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Chance de sequência de stops em 100 trades (acerto {(p * 100).toFixed(0)}%)</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm font-mono">{[4, 5, 6, 8, 10].map(N => <div key={N} className="flex justify-between"><span>{N} stops seguidos</span><span>{(streakProbability(p, N) * 100).toFixed(0)}% · custo ${N * op.settings.riskCap}</span></div>)}</CardContent></Card>
      </div>
    </div>
  );
}
