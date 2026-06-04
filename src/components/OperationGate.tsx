import { ReactNode } from "react";
import { useDailyGate } from "@/contexts/DailyGateContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, AlertCircle, Sun, Clock } from "lucide-react";
import { formatCountdown } from "@/lib/dailyGate";
import { useEffect, useState } from "react";

interface Props {
  children: ReactNode;
  /** Permite ler em fim-de-semana / locked_out (modo consulta) */
  allowReadOnly?: boolean;
  onGoCheckin?: () => void;
}

export default function OperationGate({ children, allowReadOnly = false, onGoCheckin }: Props) {
  const { status, lockoutUntil, record } = useDailyGate();
  const [, force] = useState(0);
  useEffect(() => { const i = setInterval(() => force((x) => x + 1), 1000); return () => clearInterval(i); }, []);

  // Acesso pleno
  if (status === "checked_in" || status === "trading" || status === "closed") {
    return <>{children}</>;
  }

  // Modo consulta liberado (fim de semana, locked_out): mostra conteúdo se aba é read-only
  if (allowReadOnly && (status === "weekend" || status === "locked_out")) {
    return <>{children}</>;
  }

  // Bloqueio
  let title = "Acesso bloqueado";
  let message = "";
  let Icon = Lock;
  let cta: ReactNode = null;

  if (status === "not_started") {
    Icon = AlertCircle;
    title = "Dia operacional não iniciado";
    message = "Você ainda não iniciou seu dia operacional. Complete o Check-In Pré Mercado para liberar o sistema.";
    cta = onGoCheckin ? <Button onClick={onGoCheckin}>Ir para Check-In</Button> : null;
  } else if (status === "weekend") {
    Icon = Sun;
    title = "Fim de semana";
    message = "O mercado está fechado. Esta área é exclusiva dos dias úteis (Seg–Sex). Use o modo consulta para revisar relatórios e estudos.";
  } else if (status === "locked_out") {
    Icon = Lock;
    title = "Limite operacional atingido";
    message = record?.lockout_reason
      ? `${record.lockout_reason} — Seu limite operacional diário foi atingido. O mercado continuará amanhã. O acesso para novas operações será liberado automaticamente às 00:00 GMT-3.`
      : "Seu limite operacional diário foi atingido. O mercado continuará amanhã. O acesso para novas operações será liberado automaticamente às 00:00 GMT-3.";
  }

  return (
    <div className="py-8 px-4">
      <Card className="max-w-xl mx-auto border-destructive/30 bg-destructive/5">
        <CardContent className="pt-6 pb-6 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <Icon className="w-7 h-7 text-destructive" />
          </div>
          <h3 className="font-bold text-lg text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
          {status === "locked_out" && lockoutUntil && (
            <div className="flex items-center justify-center gap-2 text-sm font-mono text-destructive">
              <Clock className="w-4 h-4" />
              {formatCountdown(lockoutUntil.getTime() - Date.now())}
            </div>
          )}
          {cta}
        </CardContent>
      </Card>
    </div>
  );
}
