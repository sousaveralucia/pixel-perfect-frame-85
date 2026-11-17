import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { OpApi } from "@/hooks/useOp";
import { Asset, Mode, MODE_INFO, MODE_NEXT, fiboLevel } from "@/lib/smc/engine";
import { SCAN_ITEMS } from "@/lib/smc/content";
import { currentModes } from "./SmcToday";
import { toast } from "sonner";

function AssetMap({ op, asset, mode }: { op: OpApi; asset: Asset; mode: Mode }) {
  const fibo = op.byKind("fibo").filter(e => e.data.asset === asset && !e.data.archived).slice(-1)[0];
  const [origin, setOrigin] = useState(""); const [top, setTop] = useState(""); const [dir, setDir] = useState("compra"); const [scenario, setScenario] = useState("");
  const [scan, setScan] = useState<Record<number, boolean>>({}); const [note, setNote] = useState("");
  const setMode = (m: Mode) => op.add("mode", { asset, mode: m });
  const newFibo = async () => {
    if (!origin || !top) return toast.error("Informe origem e topo");
    await op.add("fibo", { asset, dir, origin: Number(origin), top: Number(top), scenario, archived: false });
    if (mode === "RESET") await setMode("VIGIA");
    setOrigin(""); setTop(""); setScenario("");
  };
  const reset = async () => {
    if (!fibo) return;
    await op.update(fibo.id, { ...fibo.data, archived: true, archivedReason: "origem rompida", archivedAt: new Date().toISOString() });
    await setMode("RESET"); toast.warning(`${asset}: RESET — trace a nova fibo`);
  };
  const saveScan = async () => {
    await op.add("scan", { asset, mode, items: scan, note, time: new Date().toISOString() });
    setScan({}); setNote(""); toast.success("Scan anotado");
  };
  const scans = op.byKind("scan").filter(e => e.data.asset === asset && e.trading_date === op.today);

  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{asset}</CardTitle><Badge className={MODE_INFO[mode].color}>{MODE_INFO[mode].label}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-1">{(Object.keys(MODE_INFO) as Mode[]).map(m => <Button key={m} size="sm" variant={m === mode ? "default" : "outline"} onClick={() => setMode(m)}>{MODE_INFO[m].label}</Button>)}
          <Button size="sm" variant="secondary" onClick={() => setMode(MODE_NEXT[mode])}>→ {MODE_INFO[MODE_NEXT[mode]].label}</Button></div>
        <p className="text-xs text-muted-foreground">{MODE_INFO[mode].cadence}</p>

        {fibo ? (
          <div className="space-y-2">
            <p className="text-sm text-foreground">Fibo ativa ({fibo.data.dir}): origem <b className="font-mono">{fibo.data.origin}</b> → topo <b className="font-mono">{fibo.data.top}</b></p>
            <div className="grid grid-cols-5 gap-1 font-mono text-xs">{op.settings.fiboLevels.map(d => <div key={d} className="rounded bg-secondary p-2 text-center"><p className="text-muted-foreground">{Math.round(d * 100)}%</p><p className="text-foreground">{fiboLevel(fibo.data.origin, fibo.data.top, d).toFixed(2)}</p></div>)}</div>
            {fibo.data.scenario && <p className="text-xs text-muted-foreground">Cenário: {fibo.data.scenario}</p>}
            <Button variant="destructive" size="sm" onClick={reset}>Origem rompida → RESET</Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Sem fibo ativa. Trace a perna de impulso HTF/MTF:</p>
            <div className="grid grid-cols-3 gap-2">
              <select className="rounded-md border border-input bg-background px-2 text-sm" value={dir} onChange={e => setDir(e.target.value)}><option>compra</option><option>venda</option></select>
              <Input placeholder="Origem" inputMode="decimal" value={origin} onChange={e => setOrigin(e.target.value)} />
              <Input placeholder="Topo" inputMode="decimal" value={top} onChange={e => setTop(e.target.value)} />
            </div>
            <Input placeholder="Cenário A/B: se... então..." value={scenario} onChange={e => setScenario(e.target.value)} />
            <Button size="sm" onClick={newFibo}>Salvar fibo</Button>
          </div>
        )}

        <div className="border-t border-border pt-3 space-y-2">
          <Label>Scan de 3 minutos</Label>
          {SCAN_ITEMS.map((it, i) => <label key={i} className="flex items-center gap-2 text-sm"><Checkbox checked={!!scan[i]} onCheckedChange={v => setScan(p => ({ ...p, [i]: !!v }))} />{it}</label>)}
          <Input placeholder="Nota rápida" value={note} onChange={e => setNote(e.target.value)} />
          <Button size="sm" className="w-full" onClick={saveScan}>Anotar scan</Button>
          {scans.length > 0 && <div className="text-xs text-muted-foreground space-y-1">{scans.map(s => <p key={s.id}>{new Date(s.data.time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {MODE_INFO[s.data.mode as Mode]?.label} · {s.data.note}</p>)}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SmcMap({ op }: { op: OpApi }) {
  const modes = currentModes(op);
  return <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{(["XAUUSD", "NAS100"] as Asset[]).map(a => <AssetMap key={a} op={op} asset={a} mode={modes[a]} />)}</div>;
}
