import jsPDF from "jspdf";

interface OverallStats {
  total: number; wins: number; losses: number; breakeven: number;
  winRate: number; totalMoney: number; avgWin: number; avgLoss: number; profitFactor: number;
}

interface DisciplineStats {
  fullWR: number; fullCount: number; partialWR: number; partialCount: number;
  lowWR: number; lowCount: number; avgScore: number;
  itemStats: { label: string; compliance: number; winRateWhenFollowed: number; winRateWhenNot: number }[];
  comparisonData: { name: string; winRate: number; trades: number; money: number }[];
}

interface EmotionalStats {
  emotional: CategoryItem[]; rational: CategoryItem[]; routine: CategoryItem[];
  highEmotionalWR: number; lowEmotionalWR: number;
  highEmotionalCount: number; lowEmotionalCount: number;
  highEmotionalMoney: number; lowEmotionalMoney: number;
}

interface CategoryItem {
  label: string; icon: string; compliance: number; impact: number;
  wrFollowed: number; wrNot: number; followed: number; total: number;
}

interface StreakStats {
  maxWinStreak: number; maxLossStreak: number; currentStreak: number;
  currentStreakType: string | null; daysActive: number; avgTradesPerDay: number;
  maxProfitDayStreak: number;
}

interface DayOfWeekStats {
  chartData: { day: string; winRate: number; trades: number; money: number; wins: number; losses: number }[];
  bestDay: { day: string; money: number; winRate: number };
  worstDay: { day: string; money: number; winRate: number };
  mostActive: { day: string; trades: number };
  sessionChart: { session: string; winRate: number; trades: number; money: number }[];
}

interface InsightsPdfData {
  overallStats: OverallStats;
  disciplineStats: DisciplineStats | null;
  emotionalStats: EmotionalStats | null;
  streakStats: StreakStats | null;
  dayOfWeekStats: DayOfWeekStats | null;
  periodLabel: string;
  tradesCount: number;
}

const COLORS = {
  primary: [99, 102, 241] as [number, number, number],
  win: [34, 197, 94] as [number, number, number],
  loss: [239, 68, 68] as [number, number, number],
  accent: [245, 158, 11] as [number, number, number],
  dark: [15, 23, 42] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  bg: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

function drawHeader(doc: jsPDF, y: number, title: string, emoji: string): number {
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(14, y, doc.internal.pageSize.width - 28, 10, 2, 2, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`${emoji}  ${title}`, 20, y + 7);
  doc.setTextColor(...COLORS.dark);
  return y + 16;
}

function drawKpiBox(doc: jsPDF, x: number, y: number, w: number, label: string, value: string, color: [number, number, number]): void {
  doc.setFillColor(...COLORS.bg);
  doc.roundedRect(x, y, w, 18, 2, 2, "F");
  doc.setDrawColor(220, 220, 230);
  doc.roundedRect(x, y, w, 18, 2, 2, "S");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.text(label, x + w / 2, y + 6, { align: "center" });
  doc.setFontSize(12);
  doc.setTextColor(...color);
  doc.setFont("helvetica", "bold");
  doc.text(value, x + w / 2, y + 14, { align: "center" });
}

function checkNewPage(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > doc.internal.pageSize.height - 20) {
    doc.addPage();
    return 20;
  }
  return y;
}

function drawProgressBar(doc: jsPDF, x: number, y: number, w: number, h: number, pct: number, color: [number, number, number]): void {
  doc.setFillColor(230, 230, 235);
  doc.roundedRect(x, y, w, h, 1, 1, "F");
  if (pct > 0) {
    doc.setFillColor(...color);
    doc.roundedRect(x, y, Math.max(w * (pct / 100), 2), h, 1, 1, "F");
  }
}

export function exportInsightsPdf(data: InsightsPdfData) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageW = doc.internal.pageSize.width;
  let y = 15;

  // ===== TITLE =====
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, 0, pageW, 30, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Insights", pageW / 2, 14, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Período: ${data.periodLabel} • ${data.tradesCount} trades • Gerado em ${new Date().toLocaleDateString("pt-BR")}`, pageW / 2, 22, { align: "center" });
  y = 38;

  // ===== KPIs =====
  const kpis = [
    { label: "Trades", value: `${data.overallStats.total}`, color: COLORS.primary },
    { label: "Wins", value: `${data.overallStats.wins}`, color: COLORS.win },
    { label: "Losses", value: `${data.overallStats.losses}`, color: COLORS.loss },
    { label: "Win Rate", value: `${data.overallStats.winRate.toFixed(1)}%`, color: COLORS.primary },
    { label: "Resultado", value: `$${data.overallStats.totalMoney.toFixed(2)}`, color: data.overallStats.totalMoney >= 0 ? COLORS.win : COLORS.loss },
    { label: "Ganho Médio", value: `$${data.overallStats.avgWin.toFixed(2)}`, color: COLORS.win },
    { label: "Perda Média", value: `$${data.overallStats.avgLoss.toFixed(2)}`, color: COLORS.loss },
    { label: "Fator Lucro", value: `${data.overallStats.profitFactor.toFixed(2)}`, color: COLORS.primary },
  ];

  const kpiW = (pageW - 28 - 7 * 3) / 8;
  kpis.forEach((kpi, i) => {
    drawKpiBox(doc, 14 + i * (kpiW + 3), y, kpiW, kpi.label, kpi.value, kpi.color);
  });
  y += 26;

  // ===== 1. DISCIPLINA OPERACIONAL =====
  if (data.disciplineStats) {
    y = checkNewPage(doc, y, 70);
    y = drawHeader(doc, y, "Disciplina Operacional", "🛡️");

    // Comparison cards
    const ds = data.disciplineStats;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.muted);
    doc.text(`Score Médio: ${ds.avgScore.toFixed(1)}/7`, 14, y);
    y += 6;

    const cardW = (pageW - 28 - 8) / 3;
    const cardColors: [number, number, number][] = [COLORS.win, COLORS.accent, COLORS.loss];
    ds.comparisonData.forEach((item, i) => {
      const cx = 14 + i * (cardW + 4);
      doc.setFillColor(...COLORS.bg);
      doc.roundedRect(cx, y, cardW, 20, 2, 2, "F");
      doc.setDrawColor(...cardColors[i]);
      doc.setLineWidth(0.8);
      doc.line(cx, y + 2, cx, y + 18);
      doc.setLineWidth(0.2);

      doc.setFontSize(7);
      doc.setTextColor(...COLORS.muted);
      doc.setFont("helvetica", "normal");
      doc.text(item.name, cx + 5, y + 6);

      doc.setFontSize(14);
      doc.setTextColor(...cardColors[i]);
      doc.setFont("helvetica", "bold");
      doc.text(`${item.winRate.toFixed(1)}%`, cx + 5, y + 14);

      doc.setFontSize(6);
      doc.setTextColor(...COLORS.muted);
      doc.setFont("helvetica", "normal");
      doc.text(`${item.trades} trades • $${item.money.toFixed(2)}`, cx + 5, y + 18);
    });
    y += 28;

    // Item compliance table
    y = checkNewPage(doc, y, 10 + ds.itemStats.length * 8);
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.dark);
    doc.setFont("helvetica", "bold");
    doc.text("Impacto por Item do Checklist", 14, y);
    y += 5;

    // Header row
    doc.setFillColor(...COLORS.dark);
    doc.roundedRect(14, y, pageW - 28, 6, 1, 1, "F");
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "bold");
    doc.text("Item", 18, y + 4);
    doc.text("Compliance", 75, y + 4);
    doc.text("WR Com ✓", 110, y + 4);
    doc.text("WR Sem ✗", 140, y + 4);
    doc.text("Impacto", 170, y + 4);
    y += 8;

    ds.itemStats.forEach((item, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(245, 247, 250);
        doc.rect(14, y - 2, pageW - 28, 7, "F");
      }
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.dark);
      doc.setFont("helvetica", "normal");
      doc.text(item.label, 18, y + 3);

      drawProgressBar(doc, 75, y, 28, 3, item.compliance, COLORS.primary);
      doc.setFontSize(6);
      doc.text(`${item.compliance.toFixed(0)}%`, 105, y + 3);

      doc.setTextColor(...COLORS.win);
      doc.setFont("helvetica", "bold");
      doc.text(`${item.winRateWhenFollowed.toFixed(0)}%`, 115, y + 3);

      doc.setTextColor(...COLORS.loss);
      doc.text(`${item.winRateWhenNot.toFixed(0)}%`, 145, y + 3);

      const impact = item.winRateWhenFollowed - item.winRateWhenNot;
      doc.setTextColor(...(impact >= 0 ? COLORS.win : COLORS.loss));
      doc.text(`${impact >= 0 ? "+" : ""}${impact.toFixed(0)}%`, 175, y + 3);
      y += 7;
    });
    y += 4;
  }

  // ===== 2. ANÁLISE EMOCIONAL =====
  if (data.emotionalStats) {
    y = checkNewPage(doc, y, 60);
    y = drawHeader(doc, y, "Análise Emocional & Racional", "🧠");

    const es = data.emotionalStats;

    // High vs Low prep
    const halfW = (pageW - 28 - 4) / 2;
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(14, y, halfW, 16, 2, 2, "F");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text("Preparo Alto (5-6 itens ✓)", 18, y + 5);
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.win);
    doc.setFont("helvetica", "bold");
    doc.text(`${es.highEmotionalWR.toFixed(1)}% WR`, 18, y + 12);
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text(`${es.highEmotionalCount} trades • $${es.highEmotionalMoney.toFixed(2)}`, 55, y + 12);

    doc.setFillColor(254, 242, 242);
    doc.roundedRect(14 + halfW + 4, y, halfW, 16, 2, 2, "F");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text("Preparo Baixo (0-2 itens ✓)", 18 + halfW + 4, y + 5);
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.loss);
    doc.setFont("helvetica", "bold");
    doc.text(`${es.lowEmotionalWR.toFixed(1)}% WR`, 18 + halfW + 4, y + 12);
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text(`${es.lowEmotionalCount} trades • $${es.lowEmotionalMoney.toFixed(2)}`, 55 + halfW + 4, y + 12);
    y += 22;

    // Category details
    const categories = [
      { title: "Emocional", items: es.emotional },
      { title: "Racional", items: es.rational },
      { title: "Rotina", items: es.routine },
    ];

    const catW = (pageW - 28 - 8) / 3;
    categories.forEach((cat, ci) => {
      const cx = 14 + ci * (catW + 4);
      doc.setFillColor(...COLORS.bg);
      doc.roundedRect(cx, y, catW, 6 + cat.items.length * 10, 2, 2, "F");

      doc.setFontSize(8);
      doc.setTextColor(...COLORS.primary);
      doc.setFont("helvetica", "bold");
      doc.text(cat.title, cx + 4, y + 5);

      cat.items.forEach((item, i) => {
        const iy = y + 10 + i * 10;
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.dark);
        doc.setFont("helvetica", "normal");
        doc.text(`${item.icon} ${item.label}`, cx + 4, iy);
        drawProgressBar(doc, cx + 4, iy + 2, catW - 20, 2.5, item.compliance, COLORS.primary);
        doc.setFontSize(6);
        doc.setTextColor(...(item.impact >= 0 ? COLORS.win : COLORS.loss));
        doc.setFont("helvetica", "bold");
        doc.text(`${item.impact >= 0 ? "+" : ""}${item.impact.toFixed(0)}%`, cx + catW - 12, iy);
      });
    });
    y += 6 + Math.max(...categories.map(c => c.items.length)) * 10 + 6;
  }

  // ===== 3. STREAKS & CONSISTÊNCIA =====
  if (data.streakStats) {
    y = checkNewPage(doc, y, 50);
    y = drawHeader(doc, y, "Streaks & Consistência", "🔥");

    const ss = data.streakStats;
    const streakKpis = [
      { label: "Melhor Win Streak", value: `${ss.maxWinStreak}`, color: COLORS.win },
      { label: "Pior Loss Streak", value: `${ss.maxLossStreak}`, color: COLORS.loss },
      { label: "Dias Ativos", value: `${ss.daysActive}`, color: COLORS.primary },
      { label: "Trades/Dia", value: `${ss.avgTradesPerDay}`, color: COLORS.accent },
    ];

    const skW = (pageW - 28 - 9) / 4;
    streakKpis.forEach((kpi, i) => {
      drawKpiBox(doc, 14 + i * (skW + 3), y, skW, kpi.label, kpi.value, kpi.color);
    });
    y += 24;

    // Current streak
    doc.setFillColor(...(ss.currentStreakType === "WIN" ? [240, 253, 244] as [number, number, number] : [254, 242, 242] as [number, number, number]));
    doc.roundedRect(14, y, pageW - 28, 12, 2, 2, "F");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.dark);
    doc.setFont("helvetica", "normal");
    doc.text("Sequência Atual:", 18, y + 5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...(ss.currentStreakType === "WIN" ? COLORS.win : COLORS.loss));
    doc.text(`${ss.currentStreak} ${ss.currentStreakType === "WIN" ? "vitórias" : "derrotas"} consecutivas`, 50, y + 5);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`Dias lucrativos seguidos (recorde): ${ss.maxProfitDayStreak}`, 18, y + 10);
    y += 18;
  }

  // ===== 4. ANÁLISE POR DIA DA SEMANA =====
  if (data.dayOfWeekStats) {
    y = checkNewPage(doc, y, 70);
    y = drawHeader(doc, y, "Análise por Dia da Semana", "📅");

    const dw = data.dayOfWeekStats;

    // Best/Worst/Most Active
    const thirdW = (pageW - 28 - 8) / 3;
    const highlights = [
      { label: "Melhor Dia", value: dw.bestDay.day, detail: `$${dw.bestDay.money} • ${dw.bestDay.winRate}% WR`, color: COLORS.win },
      { label: "Pior Dia", value: dw.worstDay.day, detail: `$${dw.worstDay.money} • ${dw.worstDay.winRate}% WR`, color: COLORS.loss },
      { label: "Mais Ativo", value: dw.mostActive.day, detail: `${dw.mostActive.trades} trades`, color: COLORS.primary },
    ];

    highlights.forEach((h, i) => {
      const hx = 14 + i * (thirdW + 4);
      doc.setFillColor(...COLORS.bg);
      doc.roundedRect(hx, y, thirdW, 18, 2, 2, "F");
      doc.setDrawColor(...h.color);
      doc.setLineWidth(0.8);
      doc.line(hx, y + 2, hx, y + 16);
      doc.setLineWidth(0.2);

      doc.setFontSize(6);
      doc.setTextColor(...COLORS.muted);
      doc.setFont("helvetica", "normal");
      doc.text(h.label, hx + 5, y + 5);
      doc.setFontSize(11);
      doc.setTextColor(...h.color);
      doc.setFont("helvetica", "bold");
      doc.text(h.value, hx + 5, y + 12);
      doc.setFontSize(6);
      doc.setTextColor(...COLORS.muted);
      doc.setFont("helvetica", "normal");
      doc.text(h.detail, hx + 5, y + 16);
    });
    y += 24;

    // Day table
    y = checkNewPage(doc, y, 10 + dw.chartData.length * 7);
    doc.setFillColor(...COLORS.dark);
    doc.roundedRect(14, y, pageW - 28, 6, 1, 1, "F");
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.white);
    doc.setFont("helvetica", "bold");
    doc.text("Dia", 18, y + 4);
    doc.text("Trades", 55, y + 4);
    doc.text("W/L", 80, y + 4);
    doc.text("Win Rate", 110, y + 4);
    doc.text("Resultado", 145, y + 4);
    y += 8;

    dw.chartData.forEach((day, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(245, 247, 250);
        doc.rect(14, y - 2, pageW - 28, 7, "F");
      }
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.dark);
      doc.setFont("helvetica", "bold");
      doc.text(day.day, 18, y + 3);
      doc.setFont("helvetica", "normal");
      doc.text(`${day.trades}`, 60, y + 3);
      doc.setTextColor(...COLORS.win);
      doc.text(`${day.wins}`, 80, y + 3);
      doc.setTextColor(...COLORS.dark);
      doc.text("/", 86, y + 3);
      doc.setTextColor(...COLORS.loss);
      doc.text(`${day.losses}`, 89, y + 3);
      doc.setTextColor(...(day.winRate >= 50 ? COLORS.win : COLORS.loss));
      doc.setFont("helvetica", "bold");
      doc.text(`${day.winRate}%`, 115, y + 3);
      doc.setTextColor(...(day.money >= 0 ? COLORS.win : COLORS.loss));
      doc.text(`$${day.money}`, 148, y + 3);
      y += 7;
    });
    y += 4;

    // Session table
    if (dw.sessionChart.length > 0) {
      y = checkNewPage(doc, y, 10 + dw.sessionChart.length * 7);
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.dark);
      doc.setFont("helvetica", "bold");
      doc.text("Performance por Sessão", 14, y);
      y += 6;

      dw.sessionChart.forEach((s, i) => {
        if (i % 2 === 0) {
          doc.setFillColor(245, 247, 250);
          doc.rect(14, y - 2, pageW - 28, 7, "F");
        }
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.dark);
        doc.setFont("helvetica", "bold");
        doc.text(s.session, 18, y + 3);
        doc.setFont("helvetica", "normal");
        doc.text(`${s.trades} trades`, 55, y + 3);
        doc.setTextColor(...(s.winRate >= 50 ? COLORS.win : COLORS.loss));
        doc.setFont("helvetica", "bold");
        doc.text(`${s.winRate}%`, 100, y + 3);
        doc.setTextColor(...(s.money >= 0 ? COLORS.win : COLORS.loss));
        doc.text(`$${s.money}`, 130, y + 3);
        y += 7;
      });
      y += 4;
    }
  }

  // ===== INSIGHT PERSONALIZADO =====
  if (data.dayOfWeekStats) {
    y = checkNewPage(doc, y, 25);
    doc.setFillColor(238, 242, 255);
    doc.roundedRect(14, y, pageW - 28, 20, 2, 2, "F");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text("💡 Insight Personalizado", 20, y + 6);

    doc.setFontSize(7);
    doc.setTextColor(...COLORS.dark);
    doc.setFont("helvetica", "normal");
    const insights: string[] = [];
    insights.push(`Seu melhor dia é ${data.dayOfWeekStats.bestDay.day} com ${data.dayOfWeekStats.bestDay.winRate}% de win rate.`);
    if (data.dayOfWeekStats.worstDay.money < 0) {
      insights.push(`Considere reduzir posição na ${data.dayOfWeekStats.worstDay.day} ($${data.dayOfWeekStats.worstDay.money}).`);
    }
    if (data.disciplineStats && data.disciplineStats.avgScore < 5) {
      insights.push(`Disciplina em ${data.disciplineStats.avgScore.toFixed(1)}/7 — siga o checklist completo.`);
    }
    if (data.emotionalStats && data.emotionalStats.highEmotionalWR > data.emotionalStats.lowEmotionalWR + 10) {
      insights.push(`Preparo emocional aumenta WR em +${(data.emotionalStats.highEmotionalWR - data.emotionalStats.lowEmotionalWR).toFixed(0)}%.`);
    }

    const insightText = insights.join(" ");
    const lines = doc.splitTextToSize(insightText, pageW - 48);
    doc.text(lines, 20, y + 12);
  }

  // ===== FOOTER =====
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.text(`Trading Dashboard — Insights Report — Página ${i}/${totalPages}`, pageW / 2, doc.internal.pageSize.height - 8, { align: "center" });
  }

  doc.save(`insights_${data.periodLabel.replace(/\s/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
}
