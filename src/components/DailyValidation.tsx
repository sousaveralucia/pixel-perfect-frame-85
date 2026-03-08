import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccountManager } from "@/hooks/useAccountManager";
import { useTradeJournal } from "@/hooks/useTradeJournal";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface DailyValidationState {
  environment: boolean | null;
  mentalReady: "yes" | "caution" | null;
  emotionalReady: "yes" | "caution" | null;
  objective: boolean | null;
  validatedAt: string | null;
  timerStartedAt: string | null;
}

export default function DailyValidation() {
  const { activeAccountId } = useAccountManager();
  const { trades } = useTradeJournal();
  const today = new Date().toISOString().split('T')[0];

  const [validation, setValidation] = useState<DailyValidationState>(() => {
    const saved = localStorage.getItem(`validation_${activeAccountId}_${today}`);
    return saved ? JSON.parse(saved) : {
      environment: null,
      mentalReady: null,
      emotionalReady: null,
      objective: null,
      validatedAt: null,
      timerStartedAt: null,
    };
  });

  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const isFullyValidated =
    validation.environment !== null &&
    validation.mentalReady !== null &&
    validation.emotionalReady !== null &&
    validation.objective !== null;

  const saveValidation = (newValidation: DailyValidationState) => {
    setValidation(newValidation);
    localStorage.setItem(`validation_${activeAccountId}_${today}`, JSON.stringify(newValidation));
  };

  // Timer de 24 horas
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

  // Iniciar timer quando todas as validacoes forem completas
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

  // Verificar se eh dia de semana (seg-sex)
  const isWeekday = () => {
    const day = new Date().getDay();
    return day >= 1 && day <= 5; // 1 = seg, 5 = sex
  };

  // Verificar se timer ainda esta valido
  const isTimerValid = validation.timerStartedAt && timeRemaining > 0;
  const canOperateToday = isFullyValidated && isWeekday() && isTimerValid;

  // Formatar tempo restante
  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Verificar se eh dia de semana (seg-sex)
  const isWeekdayCheck = isWeekday();
  const todayTrades = useMemo(() => {
    return trades.filter((t) => {
      const tradeDate = new Date(t.entryDateTime).toISOString().split('T')[0];
      return tradeDate === today && t.accountId === activeAccountId;
    });
  }, [trades, today, activeAccountId]);

  const losses = todayTrades.filter((t) => t.status === "PERDA").length;
  const takes = todayTrades.filter((t) => t.status === "GANHO").length;
  const canTrade = losses < 3 && takes < 2;

  const getStatusColor = (value: boolean | "yes" | "caution" | null) => {
    if (value === null) return "bg-gray-100 dark:bg-gray-800";
    if (value === true || value === "yes") return "bg-green-100 dark:bg-green-900";
    if (value === "caution") return "bg-amber-100 dark:bg-amber-900";
    return "bg-red-100 dark:bg-red-900";
  };

  const getStatusText = (value: boolean | "yes" | "caution" | null) => {
    if (value === null) return "Não respondido";
    if (value === true || value === "yes") return "✓ Sim";
    if (value === "caution") return "⚠ Com Cautela";
    return "✗ Não";
  };

  return (
    <div className="space-y-6">
      <Card className={`border-2 ${
        canOperateToday
          ? "border-green-500 bg-green-50 dark:bg-green-950/30"
          : isFullyValidated && !isWeekdayCheck
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
          : isFullyValidated && !isTimerValid
          ? "border-red-500 bg-red-50 dark:bg-red-950/30"
          : "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
      }`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {canOperateToday ? (
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              )}
              <div>
                <CardTitle className={`${
                  canOperateToday
                    ? "text-green-900 dark:text-green-100"
                    : isFullyValidated && !isWeekdayCheck
                    ? "text-blue-900 dark:text-blue-100"
                    : isFullyValidated && !isTimerValid
                    ? "text-red-900 dark:text-red-100"
                    : "text-amber-900 dark:text-amber-100"
                }`}>
                  {canOperateToday
                    ? "✓ Você pode operar hoje"
                    : isFullyValidated && !isWeekdayCheck
                    ? "Fim de semana - Operação bloqueada"
                    : isFullyValidated && !isTimerValid
                    ? "Timer expirado - Valide novamente"
                    : "Validação Diária Pendente"}
                </CardTitle>
                <CardDescription className={`${
                  canOperateToday
                    ? "text-green-700 dark:text-green-300"
                    : isFullyValidated && !isWeekdayCheck
                    ? "text-blue-700 dark:text-blue-300"
                    : isFullyValidated && !isTimerValid
                    ? "text-red-700 dark:text-red-300"
                    : "text-amber-700 dark:text-amber-300"
                }`}>
                  {canOperateToday
                    ? `Timer: ${formatTimeRemaining(timeRemaining)} restante`
                    : isFullyValidated && !isWeekdayCheck
                    ? "Volte na segunda-feira"
                    : isFullyValidated && !isTimerValid
                    ? "Complete a validação novamente para resetar o timer"
                    : "Complete todas as 4 perguntas antes de operar"}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {/* Pergunta 1: Ambiente */}
        <Card className={`border-l-4 ${validation.environment === null ? "border-l-gray-300" : validation.environment ? "border-l-green-500" : "border-l-red-500"}`}>
          <CardHeader>
            <CardTitle className="text-base">1. Meu ambiente está configurado?</CardTitle>
            <CardDescription>Computador/celular preparado, plataforma aberta, gráficos prontos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                onClick={() => saveValidation({ ...validation, environment: true })}
                variant={validation.environment === true ? "default" : "outline"}
                className={validation.environment === true ? "bg-green-600 hover:bg-green-700" : ""}
              >
                Sim
              </Button>
              <Button
                onClick={() => saveValidation({ ...validation, environment: false })}
                variant={validation.environment === false ? "default" : "outline"}
                className={validation.environment === false ? "bg-red-600 hover:bg-red-700" : ""}
              >
                Não
              </Button>
              <div className={`flex-1 flex items-center justify-end px-4 py-2 rounded-md font-semibold text-sm ${getStatusColor(validation.environment)}`}>
                {getStatusText(validation.environment)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pergunta 2: Preparação Mental */}
        <Card className={`border-l-4 ${validation.mentalReady === null ? "border-l-gray-300" : validation.mentalReady === "yes" ? "border-l-green-500" : "border-l-amber-500"}`}>
          <CardHeader>
            <CardTitle className="text-base">2. Estou mentalmente preparado?</CardTitle>
            <CardDescription>Focado, sem distrações, pronto para tomar decisões</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                onClick={() => saveValidation({ ...validation, mentalReady: "yes" })}
                variant={validation.mentalReady === "yes" ? "default" : "outline"}
                className={validation.mentalReady === "yes" ? "bg-green-600 hover:bg-green-700" : ""}
              >
                Sim
              </Button>
              <Button
                onClick={() => saveValidation({ ...validation, mentalReady: "caution" })}
                variant={validation.mentalReady === "caution" ? "default" : "outline"}
                className={validation.mentalReady === "caution" ? "bg-amber-600 hover:bg-amber-700" : ""}
              >
                Com Cautela
              </Button>
              <div className={`flex-1 flex items-center justify-end px-4 py-2 rounded-md font-semibold text-sm ${getStatusColor(validation.mentalReady)}`}>
                {getStatusText(validation.mentalReady)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pergunta 3: Preparação Emocional */}
        <Card className={`border-l-4 ${validation.emotionalReady === null ? "border-l-gray-300" : validation.emotionalReady === "yes" ? "border-l-green-500" : "border-l-amber-500"}`}>
          <CardHeader>
            <CardTitle className="text-base">3. Estou emocionalmente preparado?</CardTitle>
            <CardDescription>Calmo, controlado, sem ganância ou medo excessivo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                onClick={() => saveValidation({ ...validation, emotionalReady: "yes" })}
                variant={validation.emotionalReady === "yes" ? "default" : "outline"}
                className={validation.emotionalReady === "yes" ? "bg-green-600 hover:bg-green-700" : ""}
              >
                Sim
              </Button>
              <Button
                onClick={() => saveValidation({ ...validation, emotionalReady: "caution" })}
                variant={validation.emotionalReady === "caution" ? "default" : "outline"}
                className={validation.emotionalReady === "caution" ? "bg-amber-600 hover:bg-amber-700" : ""}
              >
                Com Cautela
              </Button>
              <div className={`flex-1 flex items-center justify-end px-4 py-2 rounded-md font-semibold text-sm ${getStatusColor(validation.emotionalReady)}`}>
                {getStatusText(validation.emotionalReady)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pergunta 4: Objetivo */}
        <Card className={`border-l-4 ${validation.objective === null ? "border-l-gray-300" : validation.objective ? "border-l-green-500" : "border-l-red-500"}`}>
          <CardHeader>
            <CardTitle className="text-base">4. Sei o que quero alcançar hoje?</CardTitle>
            <CardDescription>Meta clara: 2 wins = sucesso, máx 3 losses, stop se atingido</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                onClick={() => saveValidation({ ...validation, objective: true })}
                variant={validation.objective === true ? "default" : "outline"}
                className={validation.objective === true ? "bg-green-600 hover:bg-green-700" : ""}
              >
                Sim
              </Button>
              <Button
                onClick={() => saveValidation({ ...validation, objective: false })}
                variant={validation.objective === false ? "default" : "outline"}
                className={validation.objective === false ? "bg-red-600 hover:bg-red-700" : ""}
              >
                Não
              </Button>
              <div className={`flex-1 flex items-center justify-end px-4 py-2 rounded-md font-semibold text-sm ${getStatusColor(validation.objective)}`}>
                {getStatusText(validation.objective)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo de Metas Diárias */}
      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Metas de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Alvo de Sucesso</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">2 Wins</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Operações vencedoras</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-xs text-red-600 dark:text-red-400 font-semibold">Limite de Perdas</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">3 Losses</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">Máximo por dia</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Horários de Operação</p>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Manhã • Tarde • Noite (Seg-Sex)</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Apenas operações com setup confirmado (Fibonacci → OB → Gann Box → Entry 1:3)</p>
          </div>
        </CardContent>
      </Card>

      {/* Status de Limites do Dia */}
      {canOperateToday && (
      <Card className={`border-2 ${canTrade ? "border-green-500 bg-green-50 dark:bg-green-950/30" : "border-red-500 bg-red-50 dark:bg-red-950/30"}`}>
        <CardHeader>
          <CardTitle className={`text-base ${canTrade ? "text-green-900 dark:text-green-100" : "text-red-900 dark:text-red-100"}`}>
            {canTrade ? "✓ Você pode operar hoje" : "✗ Limite diário atingido - PARAR DE OPERAR"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-3 rounded-lg border ${losses >= 3 ? "border-red-500 bg-red-100 dark:bg-red-900/30" : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30"}`}>
              <p className={`text-xs font-semibold ${losses >= 3 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>Perdas Hoje</p>
              <p className={`text-2xl font-bold ${losses >= 3 ? "text-red-900 dark:text-red-100" : "text-amber-900 dark:text-amber-100"}`}>
                {losses}/3
              </p>
            </div>
            <div className={`p-3 rounded-lg border ${takes >= 2 ? "border-green-500 bg-green-100 dark:bg-green-900/30" : "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30"}`}>
              <p className={`text-xs font-semibold ${takes >= 2 ? "text-green-600 dark:text-green-400" : "text-green-600 dark:text-green-400"}`}>Wins Hoje</p>
              <p className={`text-2xl font-bold ${takes >= 2 ? "text-green-900 dark:text-green-100" : "text-green-900 dark:text-green-100"}`}>
                {takes}/2
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
