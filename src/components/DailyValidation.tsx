import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccountManager } from "@/hooks/useAccountManager";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTradeJournalUnified } from "@/hooks/useTradeJournalUnified";
import {
  CheckCircle2, AlertCircle, Clock, Shield, Brain, Heart, Target,
  Monitor, TrendingUp, TrendingDown, Zap, Eye, RotateCcw,
  ChevronRight, Flame, Trophy, XCircle, AlertTriangle
} from "lucide-react";

interface DailyValidationState {
  environment: boolean | null;
  mentalReady: "yes" | "caution" | null;
  emotionalReady: "yes" | "caution" | null;
  objective: boolean | null;
  validatedAt: string | null;
  timerStartedAt: string | null;
}

const defaultValidation: DailyValidationState = {
  environment: null,
  mentalReady: null,
  emotionalReady: null,
  objective: null,
  validatedAt: null,
  timerStartedAt: null,
};

export default function DailyValidation() {
  const { activeAccountId } = useAccountManager();
  const { user } = useAuth();
  const { trades } = useTradeJournalUnified(activeAccountId);
  const today = new Date().toISOString().split('T')[0];

  const [validation, setValidation] = useState<DailyValidationState>(defaultValidation);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("daily_validations").select("*").eq("user_id", user.id).eq("account_key", activeAccountId).eq("date", today).maybeSingle().then(({ data }) => {
      if (data) {
        setValidation({
          environment: data.environment,
          mentalReady: data.mental_ready as any,
          emotionalReady: data.emotional_ready as any,
          objective: data.objective,
          validatedAt: data.validated_at,
          timerStartedAt: data.timer_started_at,
        });
      } else {
        setValidation(defaultValidation);
      }
    });
  }, [user, activeAccountId, today]);

  const isFullyValidated =
    validation.environment !== null &&
    validation.mentalReady !== null &&
    validation.emotionalReady !== null &&
    validation.objective !== null;

  const completedCount = [
    validation.environment !== null,
    validation.mentalReady !== null,
    validation.emotionalReady !== null,
    validation.objective !== null,
  ].filter(Boolean).length;

  const hasCaution = validation.mentalReady === "caution" || validation.emotionalReady === "caution";
  const hasNegative = validation.environment === false || validation.objective === false;

  const saveValidation = async (newValidation: DailyValidationState) => {
    setValidation(newValidation);
    if (!user) return;
    await supabase.from("daily_validations").upsert({
      user_id: user.id,
      account_key: activeAccountId,
      date: today,
      environment: newValidation.environment,
      mental_ready: newValidation.mentalReady,
      emotional_ready: newValidation.emotionalReady,
      objective: newValidation.objective,
      validated_at: newValidation.validatedAt,
      timer_started_at: newValidation.timerStartedAt,
    }, { onConflict: "user_id,account_key,date" });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (validation.timerStartedAt) {
        const startTime = new Date(validation.timerStartedAt).getTime();
        const now = new Date().getTime();
        const elapsed = now - startTime;
        const twentyFourHours = 24 * 60 * 60 * 1000;
        const remaining = Math.max(0, twentyFourHours - elapsed);
        setTimeRemaining(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [validation.timerStartedAt]);

  useEffect(() => {
    if (isFullyValidated && !validation.timerStartedAt) {
      const updatedValidation = {
        ...validation,
        validatedAt: new Date().toISOString(),
        timerStartedAt: new Date().toISOString(),
      };
      saveValidation(updatedValidation);
    }
  }, [isFullyValidated, validation.timerStartedAt]);

  const isWeekday = () => {
    const day = new Date().getDay();
    return day >= 1 && day <= 5;
  };

  const isTimerValid = validation.timerStartedAt && timeRemaining > 0;
  const canOperateToday = isFullyValidated && isWeekday() && isTimerValid;
  const isWeekdayCheck = isWeekday();

  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const todayTrades = useMemo(() => {
    return trades.filter((t) => {
      const tradeDate = t.date ? t.date.split('T')[0] : '';
      return tradeDate === today;
    });
  }, [trades, today]);

  const losses = todayTrades.filter((t) => t.result === "LOSS").length;
  const takes = todayTrades.filter((t) => t.result === "WIN").length;
  const canTrade = losses < 3 && takes < 2;

  const resetValidation = async () => {
    const reset = { ...defaultValidation };
    await saveValidation(reset);
  };

  const progressPercent = (completedCount / 4) * 100;

  const dayName = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
  const fullDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      {/* Header com data e status principal */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground capitalize">{dayName}</h2>
          <p className="text-sm text-muted-foreground">{fullDate}</p>
        </div>
        {validation.timerStartedAt && (
          <Button variant="ghost" size="sm" onClick={resetValidation} className="text-muted-foreground hover:text-destructive gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />
            Resetar
          </Button>
        )}
      </div>

      {/* Status Banner */}
      <Card className={`border overflow-hidden ${
        canOperateToday && canTrade
          ? "border-primary/50 bg-primary/5"
          : !isWeekdayCheck
          ? "border-blue-500/30 bg-blue-500/5"
          : isFullyValidated && !isTimerValid
          ? "border-destructive/30 bg-destructive/5"
          : hasNegative
          ? "border-destructive/30 bg-destructive/5"
          : "border-border"
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Progress Ring */}
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                <circle
                  cx="32" cy="32" r="28" fill="none"
                  stroke={isFullyValidated && !hasNegative ? "hsl(var(--primary))" : hasNegative ? "hsl(var(--destructive))" : "hsl(var(--chart-1))"}
                  strokeWidth="4"
                  strokeDasharray={`${progressPercent * 1.76} 176`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-foreground">{completedCount}/4</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {canOperateToday && canTrade ? (
                  <Shield className="w-5 h-5 text-primary" />
                ) : !isWeekdayCheck ? (
                  <Clock className="w-5 h-5 text-blue-500" />
                ) : hasNegative ? (
                  <XCircle className="w-5 h-5 text-destructive" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                )}
                <span className="font-semibold text-foreground">
                  {canOperateToday && canTrade
                    ? "Liberado para Operar"
                    : !isWeekdayCheck
                    ? "Fim de Semana"
                    : isFullyValidated && !isTimerValid
                    ? "Timer Expirado"
                    : isFullyValidated && hasNegative
                    ? "Condições Desfavoráveis"
                    : isFullyValidated && hasCaution
                    ? "Operar com Cautela"
                    : `${4 - completedCount} ${4 - completedCount === 1 ? 'item pendente' : 'itens pendentes'}`
                  }
                </span>
              </div>

              {isTimerValid && (
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm font-mono text-muted-foreground">{formatTimeRemaining(timeRemaining)}</span>
                </div>
              )}

              {!isWeekdayCheck && (
                <p className="text-sm text-muted-foreground">Análise noturna disponível Dom-Qui 20h-20h30</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Cards */}
      <div className="space-y-3">
        {/* 1. Ambiente */}
        <ChecklistItem
          step={1}
          icon={<Monitor className="w-5 h-5" />}
          title="Ambiente Configurado"
          description="Plataforma aberta, gráficos prontos, internet estável"
          value={validation.environment}
          type="boolean"
          onChange={(val) => saveValidation({ ...validation, environment: val as boolean })}
        />

        {/* 2. Mental */}
        <ChecklistItem
          step={2}
          icon={<Brain className="w-5 h-5" />}
          title="Prontidão Mental"
          description="Focado, sem distrações, capacidade de decisão clara"
          value={validation.mentalReady}
          type="tristate"
          onChange={(val) => saveValidation({ ...validation, mentalReady: val as "yes" | "caution" })}
        />

        {/* 3. Emocional */}
        <ChecklistItem
          step={3}
          icon={<Heart className="w-5 h-5" />}
          title="Prontidão Emocional"
          description="Calmo, controlado, sem ganância ou medo"
          value={validation.emotionalReady}
          type="tristate"
          onChange={(val) => saveValidation({ ...validation, emotionalReady: val as "yes" | "caution" })}
        />

        {/* 4. Objetivo */}
        <ChecklistItem
          step={4}
          icon={<Target className="w-5 h-5" />}
          title="Objetivo Definido"
          description="Meta: 2 wins = sucesso • Máx 3 losses • Setup confirmado"
          value={validation.objective}
          type="boolean"
          onChange={(val) => saveValidation({ ...validation, objective: val as boolean })}
        />
      </div>

      {/* Painel Operacional - Limites do Dia */}
      {canOperateToday && (
        <Card className="border overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Painel Operacional</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-3">
              {/* Wins */}
              <div className={`relative p-4 rounded-lg border ${
                takes >= 2 ? "border-primary/50 bg-primary/10" : "border-border bg-card"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Wins</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-bold ${takes >= 2 ? "text-primary" : "text-foreground"}`}>{takes}</span>
                  <span className="text-lg text-muted-foreground">/2</span>
                </div>
                {takes >= 2 && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-primary font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Meta atingida!
                  </div>
                )}
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (takes / 2) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Losses */}
              <div className={`relative p-4 rounded-lg border ${
                losses >= 3 ? "border-destructive/50 bg-destructive/10" : "border-border bg-card"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-4 h-4 text-destructive" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Losses</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-bold ${losses >= 3 ? "text-destructive" : "text-foreground"}`}>{losses}</span>
                  <span className="text-lg text-muted-foreground">/3</span>
                </div>
                {losses >= 3 && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-destructive font-medium">
                    <XCircle className="w-3.5 h-3.5" />
                    PARAR de operar
                  </div>
                )}
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-destructive rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (losses / 3) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {!canTrade && (
              <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                <span className="text-sm font-medium text-destructive">
                  Limite diário atingido — encerre as operações
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Setup Reminder */}
      <Card className="border border-border bg-card/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">Setup Obrigatório</p>
              <div className="flex flex-wrap gap-1.5">
                {["Estrutura HTF", "Fibonacci", "Order Block", "Gann Box", "Entrada 1:3"].map((step) => (
                  <span key={step} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
                    {step}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Apenas operações com todos os critérios confirmados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ────────────────────── Checklist Item Component ────────────────────── */

interface ChecklistItemProps {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  value: boolean | "yes" | "caution" | null;
  type: "boolean" | "tristate";
  onChange: (val: boolean | "yes" | "caution") => void;
}

function ChecklistItem({ step, icon, title, description, value, type, onChange }: ChecklistItemProps) {
  const isAnswered = value !== null;
  const isPositive = value === true || value === "yes";
  const isCaution = value === "caution";
  const isNegative = value === false;

  return (
    <Card className={`border transition-all duration-300 ${
      isPositive ? "border-primary/40 bg-primary/5" :
      isCaution ? "border-yellow-500/40 bg-yellow-500/5" :
      isNegative ? "border-destructive/40 bg-destructive/5" :
      "border-border hover:border-muted-foreground/30"
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Step indicator */}
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
            isPositive ? "bg-primary/15 text-primary" :
            isCaution ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400" :
            isNegative ? "bg-destructive/15 text-destructive" :
            "bg-muted text-muted-foreground"
          }`}>
            {isAnswered ? (
              isPositive ? <CheckCircle2 className="w-5 h-5" /> :
              isCaution ? <AlertTriangle className="w-5 h-5" /> :
              <XCircle className="w-5 h-5" />
            ) : icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-medium text-muted-foreground">#{step}</span>
              <span className="font-semibold text-sm text-foreground">{title}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{description}</p>

            <div className="flex gap-2">
              {type === "boolean" ? (
                <>
                  <Button
                    size="sm"
                    variant={value === true ? "default" : "outline"}
                    className={`h-8 text-xs ${value === true ? "bg-primary hover:bg-primary/90" : ""}`}
                    onClick={() => onChange(true)}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Sim
                  </Button>
                  <Button
                    size="sm"
                    variant={value === false ? "destructive" : "outline"}
                    className="h-8 text-xs"
                    onClick={() => onChange(false)}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Não
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant={value === "yes" ? "default" : "outline"}
                    className={`h-8 text-xs ${value === "yes" ? "bg-primary hover:bg-primary/90" : ""}`}
                    onClick={() => onChange("yes")}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Sim
                  </Button>
                  <Button
                    size="sm"
                    variant={isCaution ? "default" : "outline"}
                    className={`h-8 text-xs ${isCaution ? "bg-yellow-600 hover:bg-yellow-700 text-white" : ""}`}
                    onClick={() => onChange("caution")}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                    Cautela
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
