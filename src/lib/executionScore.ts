import type { ChecklistItem } from "@/hooks/useCustomChecklists";

export const SECTION_PREFIX = "_section_";

export function isSectionItem(item: ChecklistItem | { key: string }): boolean {
  return item.key.startsWith(SECTION_PREFIX);
}

/** Counts only "real" (non-section) items for percentage / score. */
export function getChecklistProgress(
  values: Record<string, boolean> | undefined,
  items: ChecklistItem[],
) {
  const real = items.filter((i) => !isSectionItem(i));
  const total = real.length;
  const checked = real.filter((i) => values?.[i.key] === true).length;
  const percentage = total === 0 ? 0 : Math.round((checked / total) * 100);
  return { checked, total, percentage };
}

export type ExecutionTier = "PERFECT" | "GOOD" | "AVERAGE" | "OUT_OF_MODEL";

export interface ExecutionScore {
  percentage: number;
  tier: ExecutionTier;
  label: string;
  emoji: string;
  colorClass: string;
}

export function getExecutionScore(percentage: number): ExecutionScore {
  if (percentage >= 90)
    return {
      percentage,
      tier: "PERFECT",
      label: "EXECUÇÃO PERFEITA",
      emoji: "🏆",
      colorClass: "bg-emerald-600 text-white",
    };
  if (percentage >= 75)
    return {
      percentage,
      tier: "GOOD",
      label: "EXECUÇÃO BOA",
      emoji: "✅",
      colorClass: "bg-green-500 text-white",
    };
  if (percentage >= 60)
    return {
      percentage,
      tier: "AVERAGE",
      label: "EXECUÇÃO MÉDIA",
      emoji: "⚠️",
      colorClass: "bg-amber-500 text-white",
    };
  return {
    percentage,
    tier: "OUT_OF_MODEL",
    label: "FORA DO MODELO",
    emoji: "🚫",
    colorClass: "bg-destructive text-destructive-foreground",
  };
}

/** Critical operational keys — if any is FALSE, trade is blocked regardless of %. */
export const CRITICAL_OPERATIONAL_KEYS = [
  "htfZoneInteraction",
  "chochExterno",
  "bosExterno",
  "chochInterno",
  "bosInterno",
] as const;

/** External confirmation keys (CHOCH + BOS externo). */
export const EXTERNAL_CONFIRMATION_KEYS = ["chochExterno", "bosExterno"] as const;
/** Internal confirmation keys (CHOCH + BOS interno). */
export const INTERNAL_CONFIRMATION_KEYS = ["chochInterno", "bosInterno"] as const;

export type ConfirmationStatus = "FULL" | "PARTIAL" | "BLOCKED";

/**
 * Tristate visual indicator:
 * 🔴 BLOCKED: missing HTF interaction OR external (CHOCH+BOS) confirmation
 * 🟡 PARTIAL: external OK but internal (CHOCH+BOS interno) incomplete
 * 🟢 FULL: HTF + external + internal confirmed
 */
export function getConfirmationStatus(
  values: Record<string, boolean> | undefined,
): ConfirmationStatus {
  const v = values || {};
  const htfOk = v["htfZoneInteraction"] === true;
  const externalOk = EXTERNAL_CONFIRMATION_KEYS.every((k) => v[k] === true);
  const internalOk = INTERNAL_CONFIRMATION_KEYS.every((k) => v[k] === true);
  if (!htfOk || !externalOk) return "BLOCKED";
  if (!internalOk) return "PARTIAL";
  return "FULL";
}

/** Map old operational keys (legacy 7-item checklist) to closest new keys. */
export const LEGACY_OPERATIONAL_MAP: Record<string, string[]> = {
  chochValidoHTF: ["chochExterno", "bosExterno"],
  caixaGannTracada: ["gannTraced", "gannSideAligned"],
  regiaoDescontada50: ["discountedRegion", "noMidMove"],
  orderBlockIdentificado: ["validZone", "zoneAligned"],
  entrada50OB: ["waitedCorrection", "validZone"],
  stopRiskManagement: ["stopCorrect", "stopProtected", "rrMin"],
  tempoGraficoOperacional: ["movedToLTF", "waitChochInterno"],
};

/** Migrate a legacy operational state to the new key-set. */
export function migrateLegacyOperational(
  legacy: Record<string, boolean> | undefined | null,
): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  if (!legacy) return out;
  for (const [oldKey, value] of Object.entries(legacy)) {
    if (value !== true) continue;
    const targets = LEGACY_OPERATIONAL_MAP[oldKey];
    if (targets) targets.forEach((k) => (out[k] = true));
    else out[oldKey] = true; // keep unknown keys as-is
  }
  return out;
}
