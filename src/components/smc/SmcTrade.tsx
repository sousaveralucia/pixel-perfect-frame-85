import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { OpApi } from "@/hooks/useOp";
import { TRADE_CHECKLIST, blockingComplete } from "@/lib/smc/content";
import { Asset, Dir, riskUsd, maxStopPoints, maxLeg } from "@/lib/smc/engine";
import { brakeNow } from "./SmcToday";
import { toast } from "sonner";

export default function SmcTrade({ op }: { op: OpApi }) {
  const s = op.settings;
  const [asset, setAsset] = useState<Asset>("NAS100");
  const [dir, setDir] = useState<Dir>("compra");
  const [level, setLevel] = useState<0.75 | 0.85>(0.75);
  const [start, setStart] = useState(""); const [top, setTop] = useState("");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState(""); const [beMoved, setBe] = useState(false); const [bos, setBos] = useState(false);
  const [emo, setEmo] = useState({ antes: "", durante: "", depois: "" }); const [notes, setNotes] = useState("");
  const inst = s.instruments[asset];
  const st = Number(start), tp = Number(top);
  const valid = start !== "" && top !== "" && st !== tp;
  const R = tp - st; const sign = Math.sign(R) || 1;
  const entry = tp - level * R; const stop = st - sign * inst.spread;
  const stopPts = Math.abs(entry - stop); const target = entry + sign * 3 * stopPts;
  const risk = riskUsd(stopPts, inst.contracts, inst.pointValue);
  const stopMax = maxStopPoints(s.riskCap, inst.contracts, inst.pointValue);
  const giant = valid && risk > s.riskCap;
  const bc = blockingComplete(checks); const brake = brakeNow(op);
  const dirOk = !valid || (dir === "compra" ? R > 0 : R < 0);

  const save = async () => {
    if (brake.blocksEntry) return toast.error(brake.message);
    if (!bc.ok && !confirm(`Checklist incompleto (${bc.missing.length} itens nas seções 2–5). Regra de ouro: NÃO ENTRO. Registrar mesmo assim como "checklist incompleto"?`)) return;
    const res = Number(result || 0);
    await op.add("trade", { asset, contract: inst.contract, dir, ltfLevel: level, start: st, top: tp, entry, stop, target, stopPts, contracts: inst.contracts, riskUsd: risk, reguaOk: !giant, checks, checklistComplete: bc.ok, beMoved, bosConfirmed: bos, processBroken: beMoved && !bos, resultUsd: res, resultR: risk ? res / risk : 0, emo, notes, time: new Date().toISOString() });
    if (beMoved && !bos) toast.warning("Processo quebrado: BE sem BOS confirmado");
    toast.success("Trade registrado"); setChecks({}); setResult(""); setNotes(""); setBe(false); setBos(false);
  };
  const f = (n: number) => valid ? n.toFixed(asset === "XAUUSD" ? 2 : 2) : "—";

  return (
    <div className="space-y-4">
      {brake.blocksEntry && <Card className="border-destructive"><CardContent className="p-3 text-sm text-destructive font-medium">{brake.message}</CardContent></Card>}
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">Calculadora e régua</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(["NAS100", "XAUUSD"] as Asset[]).map(a => <Button key={a} size="sm" variant={asset === a ? "default" : "outline"} onClick={() => setAsset(a)}>{a} ({s.instruments[a].contract})</Button>)}
            {(["compra", "venda"] as Dir[]).map(d => <Button key={d} size="sm" variant={dir === d ? "default" : "outline"} onClick={() => setDir(d)}>{d}</Button>)}
            {([0.75, 0.85] as const).map(l => <Button key={l} size="sm" variant={level === l ? "default" : "outline"} onClick={() => setLevel(l)}>{l * 100}%</Button>)}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Começo da perna LTF (varredura)</Label><Input inputMode="decimal" value={start} onChange={e => setStart(e.target.value)} /></div>
            <div><Label>Topo do CHoCH LTF</Label><Input inputMode="decimal" value={top} onChange={e => setTop(e.target.value)} /></div>
          </div>
          {!dirOk && <p className="text-sm text-destructive">Perna não bate com a direção ({dir}).</p>}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-sm">
            {[["Entrada", f(entry)], ["Stop", f(stop)], ["Alvo 1:3", f(target)], ["Stop pts", f(stopPts)], ["Risco", valid ? `$${risk.toFixed(0)}` : "—"], ["Stop máx", stopMax.toFixed(2)], ["Perna máx", maxLeg(stopMax, level).toFixed(2)], ["Mão", `${inst.contracts} ${inst.contract}`]].map(([l, v]) => (
              <div key={l} className="rounded-md bg-secondary p-2"><p className="text-[10px] text-muted-foreground">{l}</p><p className="text-foreground">{v}</p></div>
            ))}
          </div>
          {giant && <div className="rounded-md bg-destructive p-3 text-center font-bold text-destructive-foreground">OB GIGANTE — NÃO ENTRO</div>}
        </CardContent>
      </Card>

      {TRADE_CHECKLIST.map(sec => {
        const done = sec.items.filter((_, i) => checks[`${sec.id}.${i}`]).length;
        return (
          <Card key={sec.id} className={sec.blocking && done < sec.items.length ? "border-warning/60" : ""}>
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm">{sec.id}. {sec.title}</CardTitle>
              <Badge variant={done === sec.items.length ? "default" : "secondary"}>{done}/{sec.items.length}{sec.blocking ? " • trava" : ""}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {sec.items.map((it, i) => { const k = `${sec.id}.${i}`; return (
                <label key={k} className="flex items-start gap-3 py-1 cursor-pointer"><Checkbox className="mt-0.5 h-5 w-5" checked={!!checks[k]} onCheckedChange={v => setChecks(p => ({ ...p, [k]: !!v }))} /><span className="text-sm text-foreground">{it}</span></label>
              ); })}
            </CardContent>
          </Card>
        );
      })}

      <Card className={bc.ok ? "border-success" : "border-destructive"}>
        <CardContent className="p-4 space-y-3">
          <p className={`font-bold ${bc.ok ? "text-success" : "text-destructive"}`}>{bc.ok ? "✅ PRONTO PARA ENTRAR" : `⛔ NÃO ENTRO — faltam ${bc.missing.length} itens (seções 2–5)`}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label>Resultado (USD)</Label><Input inputMode="decimal" value={result} onChange={e => setResult(e.target.value)} placeholder="ex: 600 ou -200" /></div>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={bos} onCheckedChange={v => setBos(!!v)} />BOS confirmado</label>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={beMoved} onCheckedChange={v => setBe(!!v)} />Stop movido para BE</label>
          </div>
          {beMoved && !bos && <p className="text-sm font-semibold text-destructive">PROCESSO QUEBRADO — BE sem BOS confirmado</p>}
          <div className="grid grid-cols-3 gap-2">{(["antes", "durante", "depois"] as const).map(k => <div key={k}><Label className="capitalize">Emoção {k}</Label><Input value={emo[k]} onChange={e => setEmo(p => ({ ...p, [k]: e.target.value }))} /></div>)}</div>
          <Textarea placeholder="Observações" value={notes} onChange={e => setNotes(e.target.value)} />
          <Button className="w-full h-12" onClick={save} disabled={brake.blocksEntry}>Registrar trade</Button>
        </CardContent>
      </Card>
    </div>
  );
}
