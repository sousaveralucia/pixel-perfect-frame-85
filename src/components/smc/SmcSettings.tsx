import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OpApi } from "@/hooks/useOp";
import { OpSettings, Asset } from "@/lib/smc/engine";

const FIELDS: [keyof OpSettings, string][] = [["riskCap", "Teto de risco por trade ($)"], ["dailyTarget", "Meta do dia ($)"], ["dailyStopLimit", "Stops no dia para encerrar"], ["observeAfterStreak", "Stops seguidos → dia só observação"], ["pauseAfterStreak", "Stops seguidos → pausa de dias"], ["pauseDays", "Dias de pausa"], ["weeklyBrake", "Freio semanal ($)"], ["cushionMin", "Colchão mínimo ($)"], ["cutHourNY", "Corte do dia (hora NY)"], ["payoutValidDay", "Dia válido p/ saque ($)"], ["payoutDaysNeeded", "Dias válidos necessários"], ["payoutMax", "Saque máximo ($)"]];

export default function SmcSettings({ op }: { op: OpApi }) {
  const [s, setS] = useState<any>(op.settings);
  useEffect(() => setS(op.settings), [op.settings]);
  const setInst = (a: Asset, k: string, v: number) => setS((p: any) => ({ ...p, instruments: { ...p.instruments, [a]: { ...p.instruments[a], [k]: v } } }));
  return (
    <div className="space-y-4">
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">Limites e freios</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {FIELDS.map(([k, l]) => <div key={k}><Label>{l}</Label><Input inputMode="decimal" value={s[k]} onChange={e => setS((p: any) => ({ ...p, [k]: Number(e.target.value) }))} /></div>)}
          <div><Label>Colchão atual ($)</Label><Input inputMode="decimal" value={s.cushion ?? 2000} onChange={e => setS((p: any) => ({ ...p, cushion: Number(e.target.value) }))} /></div>
        </CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">Ativos e mão padrão</CardTitle></CardHeader>
        <CardContent className="space-y-3">{(["NAS100", "XAUUSD"] as Asset[]).map(a => (
          <div key={a} className="grid grid-cols-4 gap-2 items-end"><p className="font-semibold text-foreground">{a} ({s.instruments[a].contract})</p>
            {[["contracts", "Contratos"], ["pointValue", "$ por ponto"], ["spread", "Folga spread"]].map(([k, l]) => <div key={k}><Label className="text-xs">{l}</Label><Input inputMode="decimal" value={s.instruments[a][k]} onChange={e => setInst(a, k, Number(e.target.value))} /></div>)}
          </div>))}</CardContent></Card>
      <Button className="w-full h-12" onClick={() => op.saveSettings(s)}>Salvar configurações</Button>
      <p className="text-xs text-muted-foreground">A mão só muda na revisão mensal, com dados. Nunca guarde senhas da corretora ou da Lucid aqui.</p>
    </div>
  );
}
