import { describe, it, expect } from "vitest";
import { fiboLevel, ltfPlan, maxStopPoints, maxLeg, isGiantOB, evaluateBrakes, DEFAULT_SETTINGS, emotionalRule, payoutStatus, tradingDate, consecutiveStops } from "./engine";

const S = DEFAULT_SETTINGS;
describe("fórmulas", () => {
  it("nível 50% da perna 100→200", () => expect(fiboLevel(100, 200, 0.5)).toBe(150));
  it("entrada 75%: alvo 1:3 = topo", () => { const p = ltfPlan(100, 200, 0.75); expect(p.entry).toBe(125); expect(p.target).toBe(200); });
  it("entrada 85%: alvo = início + 60% da perna", () => expect(ltfPlan(100, 200, 0.85).target).toBeCloseTo(160));
  it("régua MNQ 4 contratos $200 = 25 pts", () => expect(maxStopPoints(200, 4, 2)).toBe(25));
  it("régua MGC 2 contratos $200 = $10", () => expect(maxStopPoints(200, 2, 10)).toBe(10));
  it("perna máx 75% = 4x stop", () => expect(maxLeg(25, 0.75)).toBe(100));
  it("OB gigante acima do teto", () => { expect(isGiantOB(26, 4, 2, 200)).toBe(true); expect(isGiantOB(25, 4, 2, 200)).toBe(false); });
});
describe("freios", () => {
  const t = (r: number) => ({ date: "d", resultUsd: r, resultR: 0, checklistComplete: true });
  it("$200 de lucro encerra o dia", () => expect(evaluateBrakes(S, [t(200)], [t(200)], 200, 2000).level).toBe("encerrar_dia"));
  it("2 stops encerram o dia", () => expect(evaluateBrakes(S, [t(-100), t(-100)], [t(50), t(-100), t(-100)], 0, 2000).blocksEntry).toBe(true));
  it("1 stop = pausa sem bloquear", () => expect(evaluateBrakes(S, [t(-100)], [t(-100)], 0, 2000).level).toBe("pausa"));
  it("4 stops seguidos entre dias = observação", () => expect(evaluateBrakes(S, [], [t(-1), t(-1), t(-1), t(-1)], 0, 2000).level).toBe("observacao"));
  it("stops seguidos zeram com ganho", () => expect(consecutiveStops([t(-1), t(5), t(-1)])).toBe(1));
});
describe("emocional e saque", () => {
  it("calma 1 = fora", () => expect(emotionalRule({ calma: 1, sono: 5 }, 0)).toBe("fora"));
  it("2 SIM = metade", () => expect(emotionalRule({ calma: 4 }, 2)).toBe("metade"));
  it("5 dias de $200 = apto", () => expect(payoutStatus([200, 250, 300, 199, 200, 210], S)).toEqual({ valid: 5, eligible: true }));
});
describe("corte do dia 17h NY", () => {
  it("após 17h NY conta como dia seguinte", () => expect(tradingDate(new Date("2026-11-16T22:30:00Z"))).toBe("2026-11-17"));
  it("antes das 17h NY é o mesmo dia", () => expect(tradingDate(new Date("2026-11-16T20:00:00Z"))).toBe("2026-11-16"));
});
