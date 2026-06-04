/**
 * Daily Gate utilities — all "day" logic uses the trader's timezone (America/Sao_Paulo, GMT-3).
 * Reset acontece todos os dias às 00:00 GMT-3.
 */

const TZ = "America/Sao_Paulo";

/** Retorna a data operacional (YYYY-MM-DD) no fuso GMT-3. */
export function getTradingDate(d: Date = new Date()): string {
  // en-CA emite YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Retorna o dia da semana (0 = Dom ... 6 = Sáb) no fuso GMT-3. */
export function getTradingWeekday(d: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
  }).format(d);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[parts] ?? new Date().getDay();
}

export function isWeekday(d: Date = new Date()): boolean {
  const w = getTradingWeekday(d);
  return w >= 1 && w <= 5;
}

/** Milissegundos restantes até o próximo 00:00 GMT-3. */
export function msUntilNextReset(d: Date = new Date()): number {
  // Pega a hora local em GMT-3 para descobrir quanto falta pra meia-noite
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const [h, m, s] = fmt.format(d).split(":").map(Number);
  const elapsedSec = h * 3600 + m * 60 + s;
  const totalDaySec = 24 * 3600;
  return (totalDaySec - elapsedSec) * 1000;
}

/** Formata ms restantes como HH:MM:SS. */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/* ───────────── Readiness Score ───────────── */

export type EmotionalState =
  | "calmo" | "focado" | "confiante" | "neutro"
  | "ansioso" | "irritado" | "frustrado" | "sobrecarregado";

export const NEGATIVE_EMOTIONS: EmotionalState[] = ["ansioso", "irritado", "frustrado", "sobrecarregado"];

export type PhysicalState = "otimo" | "bom" | "neutro" | "cansado" | "exausto";
export type Hydration = "low" | "medium" | "high";

export interface CheckinData {
  emotionalState: EmotionalState | null;
  mentalClarity: number | null;   // 1–10
  physicalState: PhysicalState | null;
  sleepHours: number | null;       // horas
  hydration: Hydration | null;
  dailyIntention: string;
}

export function calcReadinessScore(c: CheckinData): number {
  const emoScore = (() => {
    switch (c.emotionalState) {
      case "calmo": case "focado": case "confiante": return 100;
      case "neutro": return 70;
      case "ansioso": case "sobrecarregado": return 40;
      case "irritado": case "frustrado": return 25;
      default: return 0;
    }
  })();
  const mentalScore = c.mentalClarity ? Math.min(100, c.mentalClarity * 10) : 0;
  const sleepScore = (() => {
    const h = c.sleepHours ?? 0;
    if (h >= 7 && h <= 9) return 100;
    if (h >= 6 && h < 7) return 75;
    if (h >= 5 && h < 6) return 50;
    if (h >= 9 && h <= 10) return 80;
    if (h < 5) return 25;
    return 50;
  })();
  const hydroScore = c.hydration === "high" ? 100 : c.hydration === "medium" ? 70 : c.hydration === "low" ? 30 : 0;
  const physScore = (() => {
    switch (c.physicalState) {
      case "otimo": return 100;
      case "bom": return 85;
      case "neutro": return 60;
      case "cansado": return 35;
      case "exausto": return 15;
      default: return 0;
    }
  })();

  // pesos: emoção 30, clareza 25, sono 20, físico 15, hidratação 10
  const total = emoScore * 0.30 + mentalScore * 0.25 + sleepScore * 0.20 + physScore * 0.15 + hydroScore * 0.10;
  return Math.round(total);
}

/** Próximo reset (instante absoluto). */
export function nextResetDate(d: Date = new Date()): Date {
  return new Date(d.getTime() + msUntilNextReset(d));
}
