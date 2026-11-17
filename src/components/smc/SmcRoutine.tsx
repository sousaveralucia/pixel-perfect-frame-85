import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OpApi } from "@/hooks/useOp";
import { ROUTINE, THERMO, HONEST_Q, PAUSE_PROTOCOL } from "@/lib/smc/content";
import { emotionalRule } from "@/lib/smc/engine";
import { toast } from "sonner";

export default function SmcRoutine({ op }: { op: OpApi }) {
  const get = (k: string) => op.byKind(k).find(e => e.trading_date === op.today)?.data;
  const [routine, setRoutine] = useState<Record<string, boolean>>({});
  const [scores, setScores] = useState<Record<string, number>>({}); const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [decision, setDecision] = useState("");
  const [journal, setJournal] = useState({ vou: "", naoVou: "", frase: "", diario: "", tradei: "", semTrade: "" });
  useEffect(() => {
    if (op.loading) return;
    setRoutine(get("routine")?.checks ?? {});
    const em = get("emotional"); if (em) { setScores(em.scores); setAnswers(em.answers); setDecision(em.decision ?? ""); }
    const j = get("journal"); if (j) setJournal(j);
  }, [op.loading]); // eslint-disable-line

  const yes = Object.values(answers).filter(Boolean).length;
  const complete = THERMO.every(t => scores[t.k]);
  const rule = complete ? emotionalRule(scores, yes) : null;
  const toggle = (k: string, v: boolean) => { const n = { ...routine, [k]: v }; setRoutine(n); op.upsertDaily("routine", { checks: n }); };

  return (
    <div className="space-y-4">
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">Check emocional</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {THERMO.map(t => (
            <div key={t.k} className="flex items-center justify-between gap-2"><span className="text-sm text-foreground">{t.l}</span>
              <div className="flex gap-1">{[1, 2, 3, 4, 5].map(n => <Button key={n} size="sm" className="w-9" variant={scores[t.k] === n ? "default" : "outline"} onClick={() => setScores(p => ({ ...p, [t.k]: n }))}>{n}</Button>)}</div></div>
          ))}
          <div className="border-t border-border pt-3 space-y-2">{HONEST_Q.map((q, i) => (
            <div key={i} className="flex items-center justify-between gap-2"><span className="text-sm text-foreground">{q}</span>
              <div className="flex gap-1"><Button size="sm" variant={answers[i] === true ? "destructive" : "outline"} onClick={() => setAnswers(p => ({ ...p, [i]: true }))}>Sim</Button><Button size="sm" variant={answers[i] === false ? "default" : "outline"} onClick={() => setAnswers(p => ({ ...p, [i]: false }))}>Não</Button></div></div>
          ))}</div>
          {rule && rule !== "ok" && <div className="rounded-md bg-destructive p-4 text-center text-lg font-bold text-destructive-foreground">{rule === "fora" ? "CALMA 1 — NÃO OPERO AGORA" : "RISCO PELA METADE OU FORA DO DIA"}</div>}
          {rule === "ok" && <p className="text-sm font-semibold text-success">Emocional ok para operar.</p>}
          {rule && rule !== "ok" && <Input placeholder="Minha decisão (fica registrada)" value={decision} onChange={e => setDecision(e.target.value)} />}
          <Button className="w-full" disabled={!complete} onClick={() => { op.upsertDaily("emotional", { scores, answers, yes, rule, decision }); toast.success("Check emocional salvo"); }}>Salvar check emocional</Button>
        </CardContent>
      </Card>

      <Card><CardHeader className="pb-2"><CardTitle className="text-base">Protocolo de pausa (3 min)</CardTitle></CardHeader>
        <CardContent><ol className="list-decimal pl-5 text-sm space-y-1 text-foreground">{PAUSE_PROTOCOL.map(p => <li key={p}>{p}</li>)}</ol>
          <p className="text-xs text-muted-foreground mt-2">Sinais de alerta: FOMO, vingança, medo, euforia, tédio, olhar o placar em dinheiro.</p></CardContent></Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(ROUTINE).map(([block, items]) => (
          <Card key={block}><CardHeader className="pb-2"><CardTitle className="text-sm">{block} ({items.filter((_, i) => routine[`${block}.${i}`]).length}/{items.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">{items.map((it, i) => <label key={i} className="flex items-center gap-2 text-sm"><Checkbox checked={!!routine[`${block}.${i}`]} onCheckedChange={v => toggle(`${block}.${i}`, !!v)} />{it}</label>)}</CardContent></Card>
        ))}
      </div>

      <Card><CardHeader className="pb-2"><CardTitle className="text-base">Intenção e diário</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Hoje eu vou</Label><Input value={journal.vou} onChange={e => setJournal(p => ({ ...p, vou: e.target.value }))} /></div>
          <div><Label>Hoje eu NÃO vou</Label><Input value={journal.naoVou} onChange={e => setJournal(p => ({ ...p, naoVou: e.target.value }))} /></div>
          <div><Label>Frase de compromisso</Label><Input value={journal.frase} onChange={e => setJournal(p => ({ ...p, frase: e.target.value }))} /></div>
          <div className="flex gap-2 items-center"><Label>Tradei hoje?</Label>{["sim", "não"].map(v => <Button key={v} size="sm" variant={journal.tradei === v ? "default" : "outline"} onClick={() => setJournal(p => ({ ...p, tradei: v }))}>{v}</Button>)}</div>
          {journal.tradei === "não" && <Textarea placeholder="O que o preço fez (varreduras, CHoCH que não virou setup, zonas tocadas) e por que não entrei" value={journal.semTrade} onChange={e => setJournal(p => ({ ...p, semTrade: e.target.value }))} />}
          <Textarea rows={5} placeholder="Diário: como me senti antes/durante/depois, gatilho emocional, melhor e pior decisão, o que aprendi, vitória do dia, plano de amanhã" value={journal.diario} onChange={e => setJournal(p => ({ ...p, diario: e.target.value }))} />
          <Button className="w-full" onClick={() => { op.upsertDaily("journal", journal); toast.success("Diário salvo"); }}>Salvar</Button>
        </CardContent>
      </Card>
    </div>
  );
}
