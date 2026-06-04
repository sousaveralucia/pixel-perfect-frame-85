import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useDailyGate } from "@/contexts/DailyGateContext";
import { CheckinData, EmotionalState, NEGATIVE_EMOTIONS, PhysicalState, Hydration, calcReadinessScore } from "@/lib/dailyGate";
import { CheckCircle2, AlertTriangle, Brain, Heart, Activity, Moon, Droplets, Target } from "lucide-react";
import { toast } from "sonner";

const EMOTIONS: { v: EmotionalState; label: string; emoji: string }[] = [
  { v: "calmo", label: "Calmo", emoji: "😌" },
  { v: "focado", label: "Focado", emoji: "🎯" },
  { v: "confiante", label: "Confiante", emoji: "💪" },
  { v: "neutro", label: "Neutro", emoji: "😐" },
  { v: "ansioso", label: "Ansioso", emoji: "😰" },
  { v: "irritado", label: "Irritado", emoji: "😠" },
  { v: "frustrado", label: "Frustrado", emoji: "😞" },
  { v: "sobrecarregado", label: "Sobrecarregado", emoji: "🥵" },
];

const PHYSICAL: { v: PhysicalState; label: string }[] = [
  { v: "otimo", label: "Ótimo" },
  { v: "bom", label: "Bom" },
  { v: "neutro", label: "Neutro" },
  { v: "cansado", label: "Cansado" },
  { v: "exausto", label: "Exausto" },
];

const HYDRA: { v: Hydration; label: string }[] = [
  { v: "high", label: "Alta" },
  { v: "medium", label: "Média" },
  { v: "low", label: "Baixa" },
];

export default function PreMarketCheckin() {
  const { record, status, saveCheckin, isWeekendMode } = useDailyGate();

  const [emotionalState, setEmotionalState] = useState<EmotionalState | null>(record?.emotional_state as any ?? null);
  const [mentalClarity, setMentalClarity] = useState<number>(record?.mental_clarity ?? 7);
  const [physicalState, setPhysicalState] = useState<PhysicalState | null>(record?.physical_state as any ?? null);
  const [sleepHours, setSleepHours] = useState<string>(record?.sleep_hours != null ? String(record.sleep_hours) : "");
  const [hydration, setHydration] = useState<Hydration | null>(record?.hydration as any ?? null);
  const [dailyIntention, setDailyIntention] = useState<string>(record?.daily_intention ?? "");
  const [saving, setSaving] = useState(false);

  const data: CheckinData = {
    emotionalState, mentalClarity,
    physicalState,
    sleepHours: sleepHours ? Number(sleepHours) : null,
    hydration, dailyIntention,
  };
  const score = calcReadinessScore(data);
  const isComplete = !!emotionalState && !!physicalState && !!hydration && sleepHours !== "";
  const hasRiskAlert = emotionalState && NEGATIVE_EMOTIONS.includes(emotionalState) && score < 60;
  const alreadyDone = !!record?.checkin_completed_at;

  const submit = async () => {
    if (!isComplete) { toast.error("Preencha todos os campos do Check-In."); return; }
    setSaving(true);
    await saveCheckin(data);
    toast.success(`Check-In concluído. Readiness ${score}/100`);
    setSaving(false);
  };

  if (isWeekendMode) {
    return (
      <Card className="border-muted">
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground">Fim de semana — Check-In não é exigido. Modo consulta liberado.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={alreadyDone ? "border-success/30 bg-success/5" : "border-primary/30"}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
          <span className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Check-In Pré Mercado
          </span>
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${score >= 75 ? "bg-success/15 text-success" : score >= 50 ? "bg-yellow-500/15 text-yellow-600" : "bg-destructive/15 text-destructive"}`}>
            Readiness {score}/100
          </span>
        </CardTitle>
        <CardDescription>
          {alreadyDone
            ? "Check-In do dia já concluído. Você pode atualizar as respostas se necessário."
            : "Obrigatório em dias úteis para liberar o sistema operacional."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Emocional */}
        <div>
          <Label className="text-xs font-semibold mb-2 flex items-center gap-1"><Heart className="w-3 h-3" /> Estado emocional</Label>
          <div className="flex flex-wrap gap-2">
            {EMOTIONS.map((e) => (
              <button
                key={e.v}
                onClick={() => setEmotionalState(e.v)}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  emotionalState === e.v
                    ? NEGATIVE_EMOTIONS.includes(e.v)
                      ? "bg-destructive text-destructive-foreground border-destructive"
                      : "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-primary/40"
                }`}
              >
                {e.emoji} {e.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clareza mental */}
        <div>
          <Label className="text-xs font-semibold mb-2 flex items-center gap-1"><Brain className="w-3 h-3" /> Clareza mental: {mentalClarity}/10</Label>
          <Slider value={[mentalClarity]} onValueChange={(v) => setMentalClarity(v[0])} min={1} max={10} step={1} />
        </div>

        {/* Físico */}
        <div>
          <Label className="text-xs font-semibold mb-2 flex items-center gap-1"><Activity className="w-3 h-3" /> Estado físico</Label>
          <div className="flex flex-wrap gap-2">
            {PHYSICAL.map((p) => (
              <button
                key={p.v}
                onClick={() => setPhysicalState(p.v)}
                className={`text-xs px-3 py-1.5 rounded-full border ${physicalState === p.v ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Sono */}
          <div>
            <Label className="text-xs font-semibold mb-2 flex items-center gap-1"><Moon className="w-3 h-3" /> Horas de sono</Label>
            <Input type="number" min={0} max={24} step={0.5} value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} placeholder="ex: 7.5" />
          </div>
          {/* Hidratação */}
          <div>
            <Label className="text-xs font-semibold mb-2 flex items-center gap-1"><Droplets className="w-3 h-3" /> Hidratação</Label>
            <div className="flex gap-1">
              {HYDRA.map((h) => (
                <button
                  key={h.v}
                  onClick={() => setHydration(h.v)}
                  className={`text-xs px-3 py-1.5 rounded-md border flex-1 ${hydration === h.v ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Intenção */}
        <div>
          <Label className="text-xs font-semibold mb-2 flex items-center gap-1"><Target className="w-3 h-3" /> Intenção do dia</Label>
          <Textarea value={dailyIntention} onChange={(e) => setDailyIntention(e.target.value)} placeholder="Qual o foco para hoje?" rows={2} />
        </div>

        {hasRiskAlert && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-xs text-destructive font-medium">
              Hoje você apresenta sinais de risco emocional elevado. Considere reduzir exposição ou permanecer fora do mercado.
            </p>
          </div>
        )}

        <Button onClick={submit} disabled={!isComplete || saving} className="w-full">
          {saving ? "Salvando..." : alreadyDone ? "Atualizar Check-In" : "Concluir Check-In"}
          {alreadyDone && <CheckCircle2 className="w-4 h-4 ml-2" />}
        </Button>
      </CardContent>
    </Card>
  );
}
