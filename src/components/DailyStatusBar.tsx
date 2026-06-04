import { useDailyGate } from "@/contexts/DailyGateContext";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { formatCountdown, msUntilNextReset } from "@/lib/dailyGate";
import { Lock, CheckCircle2, Clock, AlertCircle, Sun } from "lucide-react";

interface Props { onGoCheckin: () => void; onGoCheckout: () => void; }

const STATUS_MAP = {
  not_started: { color: "bg-destructive", text: "text-destructive-foreground", label: "Dia não iniciado", icon: AlertCircle, dot: "🔴" },
  checked_in:  { color: "bg-yellow-500",  text: "text-white",                 label: "Check-In realizado", icon: CheckCircle2, dot: "🟡" },
  trading:     { color: "bg-success",     text: "text-success-foreground",    label: "Operação liberada",  icon: CheckCircle2, dot: "🟢" },
  closed:      { color: "bg-blue-500",    text: "text-white",                 label: "Dia encerrado",      icon: CheckCircle2, dot: "🔵" },
  weekend:     { color: "bg-muted",       text: "text-muted-foreground",      label: "Fim de semana — Modo consulta", icon: Sun, dot: "⚪" },
  locked_out:  { color: "bg-destructive", text: "text-destructive-foreground", label: "Bloqueado até reset", icon: Lock, dot: "🔒" },
} as const;

export default function DailyStatusBar({ onGoCheckin, onGoCheckout }: Props) {
  const { status, lockoutUntil, record } = useDailyGate();
  const [countdown, setCountdown] = useState(msUntilNextReset());

  useEffect(() => {
    const i = setInterval(() => setCountdown(msUntilNextReset()), 1000);
    return () => clearInterval(i);
  }, []);

  const cfg = STATUS_MAP[status];
  const Icon = cfg.icon;

  return (
    <div className={`w-full ${cfg.color} ${cfg.text} px-3 py-2 flex items-center justify-between gap-2 flex-wrap text-sm`}>
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="font-semibold truncate">{cfg.dot} {cfg.label}</span>
        {record?.readiness_score != null && status !== "weekend" && (
          <span className="text-xs opacity-90 hidden sm:inline">· Readiness {record.readiness_score}/100</span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {status === "locked_out" && lockoutUntil && (
          <span className="text-xs font-mono flex items-center gap-1">
            <Clock className="w-3 h-3" /> {formatCountdown(lockoutUntil.getTime() - Date.now())}
          </span>
        )}
        {(status === "trading" || status === "checked_in") && (
          <span className="text-xs font-mono hidden md:inline">Reset {formatCountdown(countdown)}</span>
        )}
        {status === "not_started" && (
          <Button size="sm" variant="secondary" className="h-7" onClick={onGoCheckin}>
            Fazer Check-In
          </Button>
        )}
        {(status === "checked_in" || status === "trading") && (
          <Button size="sm" variant="secondary" className="h-7" onClick={onGoCheckout}>
            Encerrar Dia
          </Button>
        )}
      </div>
    </div>
  );
}
