import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STEPS, GLOSSARY, COMMITMENTS } from "@/lib/smc/content";

export default function SmcStudy() {
  const [recite, setRecite] = useState(false); const [shown, setShown] = useState<Record<number, boolean>>({});
  const phases = ["LER", "GATILHO", "EXECUTAR", "GERIR"];
  return (
    <div className="space-y-4">
      <div className="flex gap-2"><Button variant={recite ? "outline" : "default"} onClick={() => setRecite(false)}>Os 11 passos</Button><Button variant={recite ? "default" : "outline"} onClick={() => { setRecite(true); setShown({}); }}>Recite ao acordar</Button></div>
      {phases.map(ph => (
        <Card key={ph}><CardHeader className="pb-2"><CardTitle className="text-sm">{ph}</CardTitle></CardHeader>
          <CardContent className="space-y-3">{STEPS.filter(s => s.phase === ph).map(s => (
            <div key={s.n} className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 mb-1"><Badge>{s.n}</Badge><span className="font-semibold text-foreground">{s.title}</span></div>
              {recite && !shown[s.n] ? (<><p className="text-sm text-muted-foreground">{s.blank}</p><Button size="sm" variant="ghost" onClick={() => setShown(p => ({ ...p, [s.n]: true }))}>Ver gabarito</Button></>) : <p className="text-sm text-foreground">{s.text}</p>}
            </div>))}</CardContent></Card>
      ))}
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">Por que só 75% e 85%</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1 text-foreground">
          <p>Entrando a 75%, o risco é 25% da perna: o alvo 1:3 cai exatamente no topo.</p>
          <p>A 85%, o risco é 15%: o 1:3 cai em 60% da perna, antes do topo — melhor RR.</p>
          <p>A 62%, o 1:3 ficaria 52% da perna acima do topo. Fórmula: profundidade do alvo = 4·d − 3.</p>
          <p className="text-muted-foreground">Com RR 1:3, o ponto de equilíbrio é 25% de acerto.</p>
        </CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">Glossário</CardTitle></CardHeader>
        <CardContent className="space-y-2">{GLOSSARY.map(([t, d]) => <p key={t} className="text-sm"><b className="text-foreground">{t}:</b> <span className="text-muted-foreground">{d}</span></p>)}</CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">Compromissos racionais</CardTitle></CardHeader>
        <CardContent><ul className="list-disc pl-5 text-sm space-y-1 text-foreground">{COMMITMENTS.map(c => <li key={c}>{c}</li>)}</ul></CardContent></Card>
    </div>
  );
}
