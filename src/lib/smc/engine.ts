// Motor de regras do operacional SMC (fórmulas seções 2.3, 6 e 8 do documento)
export type Dir = "compra" | "venda";
export type Asset = "XAUUSD" | "NAS100";
export type Mode = "VIGIA" | "ALERTA" | "CACA" | "TRADE" | "RESET";

export interface OpSettings {
  riskCap: number; dailyTarget: number; dailyStopLimit: number;
  observeAfterStreak: number; pauseAfterStreak: number; pauseDays: number;
  weeklyBrake: number; cushionMin: number; cutHourNY: number;
  payoutValidDay: number; payoutDaysNeeded: number; payoutMax: number;
  instruments: Record<Asset, { contract: string; pointValue: number; contracts: number; spread: number }>;
  fiboLevels: number[];
}

export const DEFAULT_SETTINGS: OpSettings = {
  riskCap: 200, dailyTarget: 200, dailyStopLimit: 2,
  observeAfterStreak: 4, pauseAfterStreak: 6, pauseDays: 2,
  weeklyBrake: 500, cushionMin: 1000, cutHourNY: 17,
  payoutValidDay: 200, payoutDaysNeeded: 5, payoutMax: 2000,
  instruments: {
    NAS100: { contract: "MNQ", pointValue: 2, contracts: 4, spread: 1 },
    XAUUSD: { contract: "MGC", pointValue: 10, contracts: 2, spread: 0.3 },
  },
  fiboLevels: [0.5, 0.62, 0.75, 0.85, 1],
};

/** preço do nível de recuo d numa perna (compra: topo - d*R; venda espelhado) */
export function fiboLevel(origin: number, top: number, d: number): number {
  return top - d * (top - origin);
}

export function ltfPlan(start: number, top: number, d: 0.75 | 0.85, spread = 0) {
  const R = top - start;
  const entry = top - d * R;
  const sign = Math.sign(R) || 1;
  const stop = start - sign * spread;
  const risk = Math.abs(entry - stop);
  const target = entry + sign * 3 * risk;
  return { entry, stop, risk, target };
}

export function maxStopPoints(riskCap: number, contracts: number, pointValue: number) {
  return riskCap / (contracts * pointValue);
}
export function maxLeg(stopMax: number, d: 0.75 | 0.85) {
  return d === 0.75 ? 4 * stopMax : stopMax / 0.15;
}
export function riskUsd(stopPoints: number, contracts: number, pointValue: number) {
  return Math.abs(stopPoints) * contracts * pointValue;
}
export function isGiantOB(stopPoints: number, contracts: number, pointValue: number, riskCap: number) {
  return riskUsd(stopPoints, contracts, pointValue) > riskCap + 1e-9;
}

/** dia de trading com corte às cutHourNY (America/New_York) */
export function tradingDate(now: Date = new Date(), cutHourNY = 17): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const g = (t: string) => Number(parts.find(p => p.type === t)!.value);
  const d = new Date(Date.UTC(g("year"), g("month") - 1, g("day")));
  if (g("hour") >= cutHourNY) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export interface TradeLite { date: string; resultUsd: number; resultR: number; checklistComplete: boolean; }

/** stops seguidos contando entre dias (trades em ordem cronológica) */
export function consecutiveStops(trades: TradeLite[]): number {
  let n = 0;
  for (let i = trades.length - 1; i >= 0; i--) { if (trades[i].resultUsd < 0) n++; else break; }
  return n;
}

export type Brake = { level: "ok" | "pausa" | "encerrar_dia" | "observacao" | "pausa_dias" | "encerrar_semana" | "colchao"; message: string; blocksEntry: boolean };

export function evaluateBrakes(s: OpSettings, today: TradeLite[], all: TradeLite[], weekPnl: number, cushion: number): Brake {
  const pnl = today.reduce((a, t) => a + t.resultUsd, 0);
  const stops = today.filter(t => t.resultUsd < 0).length;
  const streak = consecutiveStops(all);
  if (cushion < s.cushionMin) return { level: "colchao", message: "Colchão abaixo do mínimo — pausa e revisão do método.", blocksEntry: true };
  if (streak >= s.pauseAfterStreak) return { level: "pausa_dias", message: `${streak} stops seguidos — pausa de ${s.pauseDays} dias e revisão com outra pessoa.`, blocksEntry: true };
  if (-weekPnl >= s.weeklyBrake) return { level: "encerrar_semana", message: "Freio semanal atingido — semana encerrada.", blocksEntry: true };
  if (pnl >= s.dailyTarget) return { level: "encerrar_dia", message: `Meta de $${s.dailyTarget} batida — dia encerrado.`, blocksEntry: true };
  if (stops >= s.dailyStopLimit) return { level: "encerrar_dia", message: `${stops} stops hoje — dia encerrado.`, blocksEntry: true };
  if (streak >= s.observeAfterStreak) return { level: "observacao", message: `${streak} stops seguidos — hoje é só observação.`, blocksEntry: true };
  if (stops === 1) return { level: "pausa", message: "1 stop: pausa de 3 min e reler o checklist.", blocksEntry: false };
  return { level: "ok", message: "Dentro do plano.", blocksEntry: false };
}

/** regra emocional: >=2 notas 1-2 ou >=2 SIM = risco pela metade; calma 1 = fora */
export function emotionalRule(scores: Record<string, number>, yes: number): "ok" | "metade" | "fora" {
  if (scores.calma === 1) return "fora";
  const low = Object.values(scores).filter(v => v <= 2).length;
  if (low >= 2 || yes >= 2) return "metade";
  return "ok";
}

/** dias válidos para saque no ciclo */
export function payoutStatus(dailyPnl: number[], s: OpSettings) {
  const valid = dailyPnl.filter(p => p >= s.payoutValidDay).length;
  return { valid, eligible: valid >= s.payoutDaysNeeded };
}

/** chance de >=1 sequência de N stops em `trades` trades com acerto p (DP) */
export function streakProbability(p: number, N: number, trades = 100): number {
  // estado: tamanho da sequência atual de stops (0..N-1); absorvente = N
  let dist = new Array(N).fill(0); dist[0] = 1; let hit = 0;
  for (let t = 0; t < trades; t++) {
    const next = new Array(N).fill(0);
    for (let k = 0; k < N; k++) {
      next[0] += dist[k] * p;
      if (k + 1 >= N) hit += dist[k] * (1 - p); else next[k + 1] += dist[k] * (1 - p);
    }
    dist = next;
  }
  return hit;
}

export const MODE_INFO: Record<Mode, { label: string; cadence: string; color: string }> = {
  VIGIA: { label: "Vigía", cadence: "Scan a cada 60 min (30 se perto da zona)", color: "bg-secondary text-secondary-foreground" },
  ALERTA: { label: "Alerta", cadence: "Scan a cada 5–10 min", color: "bg-warning/20 text-warning" },
  CACA: { label: "Caça", cadence: "Tela aberta — checklist 100%", color: "bg-primary/20 text-primary" },
  TRADE: { label: "Trade", cadence: "Tela aberta — BOS = BE", color: "bg-success/20 text-success" },
  RESET: { label: "Reset", cadence: "Nova fibo agora", color: "bg-destructive/20 text-destructive" },
};
export const MODE_NEXT: Record<Mode, Mode> = { VIGIA: "ALERTA", ALERTA: "CACA", CACA: "TRADE", TRADE: "VIGIA", RESET: "VIGIA" };
