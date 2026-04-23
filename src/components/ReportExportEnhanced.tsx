import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Download, FileText, AlertCircle, FileSpreadsheet, Filter, Target,
  Shield, Brain, Flame, Calendar, TrendingUp, TrendingDown, DollarSign,
  Award, Clock, BarChart3, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { exportCompleteReportToExcel } from "@/lib/excelExporter";
import { useAccountManager } from "@/hooks/useAccountManager";
import { subDays, subMonths, parseISO, isAfter } from "date-fns";
import { TradeWithChecklist } from "@/hooks/useTradeJournalUnified";
import { getDefaultItems } from "@/hooks/useCustomChecklists";
import { isSectionItem } from "@/lib/executionScore";

interface ReportExportEnhancedProps {
  trades: TradeWithChecklist[];
}

type PeriodFilter = "all" | "7d" | "30d" | "90d";
const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: "all", label: "Tudo" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "3 meses" },
];

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function ReportExportEnhanced({ trades: allTradesRaw }: ReportExportEnhancedProps) {
  const { getActiveAccount, accounts } = useAccountManager();
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [filterAccount, setFilterAccount] = useState<string>("all");
  const [filterAsset, setFilterAsset] = useState<string>("all");
  const [isGenerating, setIsGenerating] = useState(false);

  const activeAccount = getActiveAccount();
  const initialBalance = activeAccount?.initialBalance ?? 0;

  // Dynamic lists
  const allAccounts = useMemo(() => [...new Set(allTradesRaw.map(t => t.account).filter(Boolean))], [allTradesRaw]);
  const allAssets = useMemo(() => [...new Set(allTradesRaw.map(t => t.asset).filter(Boolean))], [allTradesRaw]);

  // Period + account + asset filter
  const filteredTrades = useMemo(() => {
    let result = allTradesRaw;
    if (period !== "all") {
      const now = new Date();
      const cutoff = period === "7d" ? subDays(now, 7) : period === "30d" ? subMonths(now, 1) : subMonths(now, 3);
      result = result.filter(t => {
        if (!t.date) return false;
        try { return isAfter(parseISO(t.date), cutoff); } catch { return false; }
      });
    }
    if (filterAccount !== "all") result = result.filter(t => t.account === filterAccount);
    if (filterAsset !== "all") result = result.filter(t => t.asset === filterAsset);
    return result;
  }, [allTradesRaw, period, filterAccount, filterAsset]);

  // Stats
  const stats = useMemo(() => {
    const wins = filteredTrades.filter(t => t.result === "WIN").length;
    const losses = filteredTrades.filter(t => t.result === "LOSS").length;
    const be = filteredTrades.filter(t => t.result === "BREAK_EVEN").length;
    const totalPnL = filteredTrades.reduce((s, t) => s + (t.moneyResult || 0), 0);
    const avgWin = wins > 0 ? filteredTrades.filter(t => t.result === "WIN").reduce((s, t) => s + (t.moneyResult || 0), 0) / wins : 0;
    const avgLoss = losses > 0 ? filteredTrades.filter(t => t.result === "LOSS").reduce((s, t) => s + (t.moneyResult || 0), 0) / losses : 0;
    const profitFactor = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;
    const pnlPct = initialBalance > 0 ? (totalPnL / initialBalance) * 100 : 0;

    // Checklist score = % de itens operacionais marcados (modelo novo, ignora cabeçalhos)
    const opCompliance = (op: any): number => {
      if (!op || typeof op !== "object") return 0;
      const realKeys = Object.keys(op).filter((k) => !k.startsWith("_section_"));
      if (realKeys.length === 0) return 0;
      const marked = realKeys.filter((k) => op[k] === true).length;
      return marked / realKeys.length; // 0..1
    };
    const avgChecklist = filteredTrades.length > 0
      ? (filteredTrades.reduce((s, t) => s + opCompliance(t.operational), 0) / filteredTrades.length) * 100
      : 0;

    // Best/worst
    const bestTrade = filteredTrades.length > 0 ? filteredTrades.reduce((b, t) => (t.moneyResult || 0) > (b.moneyResult || 0) ? t : b) : null;
    const worstTrade = filteredTrades.length > 0 ? filteredTrades.reduce((w, t) => (t.moneyResult || 0) < (w.moneyResult || 0) ? t : w) : null;

    return {
      total: filteredTrades.length, wins, losses, be,
      winRate: filteredTrades.length > 0 ? (wins / filteredTrades.length) * 100 : 0,
      totalPnL, avgWin, avgLoss, profitFactor, pnlPct, avgChecklist,
      bestTrade, worstTrade,
    };
  }, [filteredTrades, initialBalance]);

  // Asset breakdown
  const assetBreakdown = useMemo(() => {
    const assets = [...new Set(filteredTrades.map(t => t.asset).filter(Boolean))];
    return assets.map(asset => {
      const at = filteredTrades.filter(t => t.asset === asset);
      const wins = at.filter(t => t.result === "WIN").length;
      return { asset, total: at.length, wins, winRate: at.length > 0 ? (wins / at.length) * 100 : 0, money: at.reduce((s, t) => s + (t.moneyResult || 0), 0) };
    }).sort((a, b) => b.money - a.money);
  }, [filteredTrades]);

  // Session breakdown
  const sessionBreakdown = useMemo(() => {
    const sessions = [...new Set(filteredTrades.map(t => t.session).filter(Boolean))];
    return sessions.map(session => {
      const st = filteredTrades.filter(t => t.session === session);
      const wins = st.filter(t => t.result === "WIN").length;
      return { session, total: st.length, wins, winRate: st.length > 0 ? (wins / st.length) * 100 : 0, money: st.reduce((s, t) => s + (t.moneyResult || 0), 0) };
    });
  }, [filteredTrades]);

  // Day of week
  const dayBreakdown = useMemo(() => {
    return [1, 2, 3, 4, 5].map(d => {
      const dt = filteredTrades.filter(t => new Date(t.date).getDay() === d);
      const wins = dt.filter(t => t.result === "WIN").length;
      return { day: DAY_NAMES[d], total: dt.length, wins, winRate: dt.length > 0 ? (wins / dt.length) * 100 : 0, money: dt.reduce((s, t) => s + (t.moneyResult || 0), 0) };
    });
  }, [filteredTrades]);

  // Discipline per item — uses live operational checklist (skips section headers)
  const disciplineItems = useMemo(() => {
    const items = getDefaultItems("operational")
      .filter((i) => !isSectionItem(i))
      .map((i) => ({ key: i.key, label: i.label.length > 32 ? i.label.slice(0, 30) + "…" : i.label }));
    return items.map((item) => {
      const followed = filteredTrades.filter((t) => (t.operational as any)?.[item.key]);
      const wrF = followed.length > 0
        ? (followed.filter((t) => t.result === "WIN").length / followed.length) * 100
        : 0;
      return {
        label: item.label,
        compliance: filteredTrades.length > 0 ? (followed.length / filteredTrades.length) * 100 : 0,
        wrFollowed: wrF,
      };
    });
  }, [filteredTrades]);

  // Streaks
  const streaks = useMemo(() => {
    const sorted = [...filteredTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let maxW = 0, maxL = 0, cW = 0, cL = 0;
    sorted.forEach(t => {
      if (t.result === "WIN") { cW++; cL = 0; maxW = Math.max(maxW, cW); }
      else if (t.result === "LOSS") { cL++; cW = 0; maxL = Math.max(maxL, cL); }
    });
    return { maxWin: maxW, maxLoss: maxL };
  }, [filteredTrades]);

  const generatePDFReport = async () => {
    if (filteredTrades.length === 0) {
      toast.error("Nenhum trade para exportar");
      return;
    }
    setIsGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      const m = 12;
      let y = 0;

      const co = {
        primary: [15, 23, 42] as [number, number, number],
        accent: [99, 102, 241] as [number, number, number],
        green: [34, 197, 94] as [number, number, number],
        red: [239, 68, 68] as [number, number, number],
        yellow: [245, 158, 11] as [number, number, number],
        gray: [100, 116, 139] as [number, number, number],
        lightBg: [248, 250, 252] as [number, number, number],
        white: [255, 255, 255] as [number, number, number],
      };

      const checkPage = (need: number) => { if (y + need > ph - 15) { doc.addPage(); y = 14; } };

      const secHeader = (title: string, emoji: string) => {
        checkPage(14);
        doc.setFillColor(...co.accent);
        doc.roundedRect(m, y, pw - 2 * m, 9, 2, 2, "F");
        doc.setTextColor(...co.white);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`${emoji}  ${title}`, m + 4, y + 6.5);
        y += 13;
      };

      const addFooter = (pageNum: number, totalPages: number) => {
        doc.setTextColor(...co.gray);
        doc.setFontSize(6);
        doc.setFont("helvetica", "normal");
        doc.text(`Trading Dashboard — Relatório Completo — Página ${pageNum}/${totalPages}`, pw / 2, ph - 5, { align: "center" });
      };

      const kpiBox = (x: number, yy: number, w: number, h: number, label: string, value: string, color: [number, number, number]) => {
        doc.setFillColor(...co.lightBg);
        doc.roundedRect(x, yy, w, h, 2, 2, "F");
        doc.setDrawColor(220, 225, 235);
        doc.roundedRect(x, yy, w, h, 2, 2, "S");
        doc.setTextColor(...co.gray);
        doc.setFontSize(6);
        doc.setFont("helvetica", "normal");
        doc.text(label, x + w / 2, yy + 5, { align: "center" });
        doc.setTextColor(...color);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(value, x + w / 2, yy + 12, { align: "center" });
      };

      // ========== PAGE 1: HEADER ==========
      doc.setFillColor(...co.primary);
      doc.rect(0, 0, pw, 30, "F");
      doc.setFillColor(...co.accent);
      doc.rect(0, 28, pw, 2.5, "F");

      doc.setTextColor(...co.white);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("RELATÓRIO COMPLETO DE TRADING", pw / 2, 12, { align: "center" });
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const periodLabel = PERIOD_OPTIONS.find(o => o.value === period)?.label || "Tudo";
      doc.text(`${new Date().toLocaleDateString("pt-BR")} • Período: ${periodLabel} • ${filterAccount !== "all" ? filterAccount : "Todas as Contas"} • ${filterAsset !== "all" ? filterAsset : "Todos os Ativos"}`, pw / 2, 20, { align: "center" });

      // Win rate badge
      const wrColor = stats.winRate >= 50 ? co.green : co.red;
      doc.setFillColor(...wrColor);
      doc.roundedRect(pw - m - 30, 5, 25, 12, 3, 3, "F");
      doc.setTextColor(...co.white);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`${stats.winRate.toFixed(1)}%`, pw - m - 17.5, 13, { align: "center" });

      y = 37;

      // ========== KPIs (2 rows of 5) ==========
      const kpiW = (pw - 2 * m - 4 * 3) / 5;
      const kpis = [
        { l: "Trades", v: `${stats.total}`, c: co.accent },
        { l: "Vitórias", v: `${stats.wins}`, c: co.green },
        { l: "Derrotas", v: `${stats.losses}`, c: co.red },
        { l: "Win Rate", v: `${stats.winRate.toFixed(1)}%`, c: co.accent },
        { l: "P&L Total", v: `$${stats.totalPnL.toFixed(2)}`, c: stats.totalPnL >= 0 ? co.green : co.red },
        { l: "Ganho Médio", v: `$${stats.avgWin.toFixed(2)}`, c: co.green },
        { l: "Perda Média", v: `$${stats.avgLoss.toFixed(2)}`, c: co.red },
        { l: "Fator Lucro", v: `${stats.profitFactor.toFixed(2)}`, c: co.accent },
        { l: "Retorno", v: `${stats.pnlPct >= 0 ? "+" : ""}${stats.pnlPct.toFixed(1)}%`, c: stats.pnlPct >= 0 ? co.green : co.red },
        { l: "Checklist", v: `${stats.avgChecklist.toFixed(0)}%`, c: co.accent },
      ];
      kpis.forEach((k, i) => {
        const col = i % 5;
        const row = Math.floor(i / 5);
        kpiBox(m + col * (kpiW + 3), y + row * 18, kpiW, 15, k.l, k.v, k.c);
      });
      y += 2 * 18 + 4;

      // ========== TRADES TABLE ==========
      secHeader("Histórico de Trades", "📋");
      const cols = [18, 16, 14, 14, 14, 14, 16, 10, 16, 14, 20];
      const hdrs = ["Data", "Ativo", "Entrada", "SL", "TP", "Saída", "Resultado", "R:R", "Sessão", "Status", "CL"];
      const tableW = cols.reduce((a, b) => a + b, 0);

      doc.setFillColor(...co.primary);
      doc.rect(m, y, tableW, 6, "F");
      doc.setTextColor(...co.white);
      doc.setFontSize(6);
      doc.setFont("helvetica", "bold");
      let xP = m;
      hdrs.forEach((h, i) => { doc.text(h, xP + 1.5, y + 4); xP += cols[i]; });
      y += 7.5;

      filteredTrades.forEach((trade, idx) => {
        checkPage(6);
        if (idx % 2 === 0) {
          doc.setFillColor(...co.lightBg);
          doc.rect(m, y - 3, tableW, 5.5, "F");
        }
        const mr = trade.moneyResult || 0;
        const opObj = (trade.operational as any) || {};
        const opRealKeys = Object.keys(opObj).filter((k) => !k.startsWith("_section_"));
        const opMarked = opRealKeys.filter((k) => opObj[k] === true).length;
        const opTotal = opRealKeys.length || 1;
        const clPct = Math.round((opMarked / opTotal) * 100);

        const rowData = [
          trade.date || "-", trade.asset || "-", trade.entryPrice || "-", trade.stopLoss || "-",
          trade.takeProfit || "-", trade.exitPrice || "-", `$${mr.toFixed(2)}`,
          trade.riskReward ? `${trade.riskReward}:1` : "-", trade.session || "-",
          trade.result === "WIN" ? "WIN" : trade.result === "LOSS" ? "LOSS" : "BE",
          `${clPct}%`,
        ];

        xP = m;
        rowData.forEach((d, i) => {
          if (i === 9) {
            doc.setTextColor(...(d === "WIN" ? co.green : d === "LOSS" ? co.red : co.gray));
            doc.setFont("helvetica", "bold");
          } else if (i === 6) {
            doc.setTextColor(...(mr >= 0 ? co.green : co.red));
            doc.setFont("helvetica", "bold");
          } else if (i === 10) {
            doc.setTextColor(...(clPct >= 80 ? co.green : clPct >= 60 ? co.yellow : co.red));
            doc.setFont("helvetica", "bold");
          } else {
            doc.setTextColor(...co.primary);
            doc.setFont("helvetica", "normal");
          }
          doc.setFontSize(6);
          doc.text(d, xP + 1.5, y + 0.5);
          xP += cols[i];
        });
        y += 5.5;
      });
      y += 6;

      // ========== ASSET BREAKDOWN ==========
      if (assetBreakdown.length > 0) {
        secHeader("Performance por Ativo", "🎯");
        doc.setFillColor(...co.primary);
        doc.rect(m, y, pw - 2 * m, 6, "F");
        doc.setTextColor(...co.white);
        doc.setFontSize(6);
        doc.setFont("helvetica", "bold");
        const aCols = [35, 20, 20, 25, 30];
        ["Ativo", "Trades", "Wins", "Win Rate", "Resultado"].forEach((h, i) => {
          doc.text(h, m + aCols.slice(0, i).reduce((a, b) => a + b, 0) + 2, y + 4);
        });
        y += 7.5;
        assetBreakdown.forEach((a, i) => {
          checkPage(6);
          if (i % 2 === 0) { doc.setFillColor(...co.lightBg); doc.rect(m, y - 3, pw - 2 * m, 5.5, "F"); }
          doc.setFontSize(6.5);
          let ax = m;
          [a.asset, `${a.total}`, `${a.wins}`, `${a.winRate.toFixed(1)}%`, `$${a.money.toFixed(2)}`].forEach((v, ci) => {
            doc.setTextColor(...(ci === 3 ? (a.winRate >= 50 ? co.green : co.red) : ci === 4 ? (a.money >= 0 ? co.green : co.red) : co.primary));
            doc.setFont("helvetica", ci === 0 ? "bold" : "normal");
            doc.text(v, ax + 2, y + 0.5);
            ax += aCols[ci];
          });
          y += 5.5;
        });
        y += 6;
      }

      // ========== SESSION + DAY BREAKDOWN ==========
      secHeader("Sessões & Dias da Semana", "🕐");
      const halfW = (pw - 2 * m - 4) / 2;

      // Sessions
      doc.setFontSize(8);
      doc.setTextColor(...co.primary);
      doc.setFont("helvetica", "bold");
      doc.text("Por Sessão", m, y);
      y += 4;
      sessionBreakdown.forEach((s, i) => {
        checkPage(7);
        doc.setFillColor(...(i % 2 === 0 ? co.lightBg : co.white));
        doc.rect(m, y - 2, halfW, 6, "F");
        doc.setFontSize(6.5);
        doc.setTextColor(...co.primary);
        doc.setFont("helvetica", "bold");
        doc.text(s.session, m + 2, y + 2);
        doc.setFont("helvetica", "normal");
        doc.text(`${s.total} trades`, m + 25, y + 2);
        doc.setTextColor(...(s.winRate >= 50 ? co.green : co.red));
        doc.setFont("helvetica", "bold");
        doc.text(`${s.winRate.toFixed(0)}%`, m + 50, y + 2);
        doc.setTextColor(...(s.money >= 0 ? co.green : co.red));
        doc.text(`$${s.money.toFixed(2)}`, m + 65, y + 2);
        y += 6;
      });
      y += 4;

      // Days
      doc.setFontSize(8);
      doc.setTextColor(...co.primary);
      doc.setFont("helvetica", "bold");
      doc.text("Por Dia da Semana", m, y);
      y += 4;
      dayBreakdown.forEach((d, i) => {
        checkPage(7);
        doc.setFillColor(...(i % 2 === 0 ? co.lightBg : co.white));
        doc.rect(m, y - 2, halfW, 6, "F");
        doc.setFontSize(6.5);
        doc.setTextColor(...co.primary);
        doc.setFont("helvetica", "bold");
        doc.text(d.day, m + 2, y + 2);
        doc.setFont("helvetica", "normal");
        doc.text(`${d.total} trades`, m + 18, y + 2);
        doc.setTextColor(...(d.winRate >= 50 ? co.green : co.red));
        doc.setFont("helvetica", "bold");
        doc.text(`${d.winRate.toFixed(0)}%`, m + 42, y + 2);
        doc.setTextColor(...(d.money >= 0 ? co.green : co.red));
        doc.text(`$${d.money.toFixed(2)}`, m + 58, y + 2);
        y += 6;
      });
      y += 6;

      // ========== DISCIPLINE ==========
      secHeader("Disciplina Operacional", "🛡️");
      doc.setFontSize(7);
      doc.setTextColor(...co.gray);
      doc.text(`Score Médio: ${stats.avgChecklist.toFixed(0)}% • Streaks: ${streaks.maxWin} wins / ${streaks.maxLoss} losses`, m, y);
      y += 5;

      doc.setFillColor(...co.primary);
      doc.rect(m, y, pw - 2 * m, 6, "F");
      doc.setTextColor(...co.white);
      doc.setFontSize(6);
      doc.setFont("helvetica", "bold");
      ["Item", "Compliance", "Win Rate (seguido)"].forEach((h, i) => {
        doc.text(h, m + [2, 55, 110][i], y + 4);
      });
      y += 7.5;

      disciplineItems.forEach((item, i) => {
        checkPage(6);
        if (i % 2 === 0) { doc.setFillColor(...co.lightBg); doc.rect(m, y - 3, pw - 2 * m, 5.5, "F"); }
        doc.setFontSize(6.5);
        doc.setTextColor(...co.primary);
        doc.setFont("helvetica", "bold");
        doc.text(item.label, m + 2, y + 0.5);

        // Progress bar
        doc.setFillColor(230, 230, 235);
        doc.roundedRect(m + 55, y - 1, 40, 3, 1, 1, "F");
        doc.setFillColor(...co.accent);
        doc.roundedRect(m + 55, y - 1, Math.max(40 * (item.compliance / 100), 1), 3, 1, 1, "F");
        doc.setFont("helvetica", "normal");
        doc.text(`${item.compliance.toFixed(0)}%`, m + 98, y + 0.5);

        doc.setTextColor(...(item.wrFollowed >= 50 ? co.green : co.red));
        doc.setFont("helvetica", "bold");
        doc.text(`${item.wrFollowed.toFixed(0)}%`, m + 115, y + 0.5);
        y += 5.5;
      });
      y += 6;

      // ========== BEST/WORST TRADES ==========
      if (stats.bestTrade || stats.worstTrade) {
        secHeader("Melhores & Piores Trades", "🏆");
        const bwH = 14;
        const bwW = (pw - 2 * m - 4) / 2;

        if (stats.bestTrade) {
          doc.setFillColor(240, 253, 244);
          doc.roundedRect(m, y, bwW, bwH, 2, 2, "F");
          doc.setFontSize(6);
          doc.setTextColor(...co.gray);
          doc.text("Melhor Trade", m + 3, y + 4);
          doc.setFontSize(10);
          doc.setTextColor(...co.green);
          doc.setFont("helvetica", "bold");
          doc.text(`$${(stats.bestTrade.moneyResult || 0).toFixed(2)}`, m + 3, y + 11);
          doc.setFontSize(6);
          doc.setTextColor(...co.gray);
          doc.setFont("helvetica", "normal");
          doc.text(`${stats.bestTrade.asset} • ${stats.bestTrade.date}`, m + 35, y + 11);
        }
        if (stats.worstTrade) {
          doc.setFillColor(254, 242, 242);
          doc.roundedRect(m + bwW + 4, y, bwW, bwH, 2, 2, "F");
          doc.setFontSize(6);
          doc.setTextColor(...co.gray);
          doc.text("Pior Trade", m + bwW + 7, y + 4);
          doc.setFontSize(10);
          doc.setTextColor(...co.red);
          doc.setFont("helvetica", "bold");
          doc.text(`$${(stats.worstTrade.moneyResult || 0).toFixed(2)}`, m + bwW + 7, y + 11);
          doc.setFontSize(6);
          doc.setTextColor(...co.gray);
          doc.setFont("helvetica", "normal");
          doc.text(`${stats.worstTrade.asset} • ${stats.worstTrade.date}`, m + bwW + 39, y + 11);
        }
        y += bwH + 6;
      }

      // ========== OBSERVAÇÕES ==========
      secHeader("Observações", "📝");
      doc.setDrawColor(200, 210, 220);
      doc.setLineWidth(0.3);
      const maxLines = Math.min(8, Math.floor((ph - y - 15) / 7));
      for (let i = 0; i < maxLines; i++) {
        doc.line(m, y, pw - m, y);
        y += 7;
      }

      // ========== IMAGES (compact grid - max 2 pages) ==========
      const tradesWithImages = filteredTrades.filter(t => t.preTradeImage || t.tradingImage || t.postTradeImage);
      if (tradesWithImages.length > 0) {
        // Collect all images with labels
        const allImages: { label: string; url: string }[] = [];
        for (const trade of tradesWithImages) {
          const tradeLabel = `${trade.asset || "?"} ${trade.date || ""} (${trade.result === "WIN" ? "W" : trade.result === "LOSS" ? "L" : "BE"})`;
          if (trade.preTradeImage) allImages.push({ label: `Pré: ${tradeLabel}`, url: trade.preTradeImage });
          if (trade.tradingImage) allImages.push({ label: `Op: ${tradeLabel}`, url: trade.tradingImage });
          if (trade.postTradeImage) allImages.push({ label: `Pós: ${tradeLabel}`, url: trade.postTradeImage });
        }

        // Limit to max ~12 images (fits 2 pages in 2-col grid)
        const maxImages = 12;
        const imagesToRender = allImages.slice(0, maxImages);

        doc.addPage();
        y = 14;
        secHeader("Galeria de Imagens", "📸");

        // 2 columns layout
        const colW = (pw - 2 * m - 4) / 2;
        const imgH = 50; // compact height
        let col = 0;

        for (const img of imagesToRender) {
          // Check if we need a new page (only allow 1 extra page for images = 2 pages total for gallery)
          if (y + imgH + 8 > ph - 15) {
            if (doc.internal.pages.length - 1 >= 6) break; // hard cap total pages
            doc.addPage();
            y = 14;
            col = 0;
          }

          const xPos = m + col * (colW + 4);

          try {
            const response = await fetch(img.url);
            const blob = await response.blob();
            const dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });

            // Label
            doc.setTextColor(...co.gray);
            doc.setFontSize(5.5);
            doc.setFont("helvetica", "bold");
            doc.text(img.label, xPos, y);

            // Image with border
            doc.setDrawColor(200, 210, 220);
            doc.setLineWidth(0.3);
            doc.addImage(dataUrl, "JPEG", xPos, y + 2, colW, imgH);
            doc.rect(xPos, y + 2, colW, imgH, "S");
          } catch {
            doc.setTextColor(...co.red);
            doc.setFontSize(5.5);
            doc.text(`${img.label}: indisponível`, xPos, y + 4);
          }

          col++;
          if (col >= 2) {
            col = 0;
            y += imgH + 8;
          }
        }

        if (col > 0) y += imgH + 8; // finish partial row

        if (allImages.length > maxImages) {
          doc.setTextColor(...co.gray);
          doc.setFontSize(6);
          doc.setFont("helvetica", "italic");
          doc.text(`+ ${allImages.length - maxImages} imagens omitidas para economizar páginas`, m, y);
        }
      }

      // Add footers
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(i, totalPages);
      }

      const fileName = `relatorio_completo_${periodLabel.replace(/\s/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
      toast.success(`Relatório exportado: ${fileName}`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar relatório PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col gap-4 p-4 bg-secondary/50 rounded-lg border border-border">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Período:</span>
          {PERIOD_OPTIONS.map(opt => (
            <Button key={opt.value} variant={period === opt.value ? "default" : "outline"} size="sm" onClick={() => setPeriod(opt.value)} className="h-8">
              {opt.label}
            </Button>
          ))}
          {period !== "all" && <Badge variant="secondary">{filteredTrades.length} de {allTradesRaw.length} trades</Badge>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Conta</Label>
            <Select value={filterAccount} onValueChange={setFilterAccount}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Contas</SelectItem>
                {allAccounts.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">Ativo</Label>
            <Select value={filterAsset} onValueChange={setFilterAsset}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Ativos</SelectItem>
                {allAssets.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Trades", value: `${stats.total}`, icon: BarChart3, color: "text-primary" },
          { label: "Win Rate", value: `${stats.winRate.toFixed(1)}%`, icon: Target, color: "text-primary" },
          { label: "P&L Total", value: `$${stats.totalPnL.toFixed(2)}`, icon: DollarSign, color: stats.totalPnL >= 0 ? "text-green-600" : "text-red-600" },
          { label: "Fator Lucro", value: `${stats.profitFactor.toFixed(2)}`, icon: TrendingUp, color: "text-primary" },
          { label: "Checklist", value: `${stats.avgChecklist.toFixed(0)}%`, icon: Shield, color: "text-primary" },
        ].map((kpi, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Vitórias", value: `${stats.wins}`, color: "text-green-600" },
          { label: "Derrotas", value: `${stats.losses}`, color: "text-red-600" },
          { label: "Ganho Médio", value: `$${stats.avgWin.toFixed(2)}`, color: "text-green-600" },
          { label: "Perda Média", value: `$${stats.avgLoss.toFixed(2)}`, color: "text-red-600" },
          { label: "Retorno", value: `${stats.pnlPct >= 0 ? "+" : ""}${stats.pnlPct.toFixed(1)}%`, color: stats.pnlPct >= 0 ? "text-green-600" : "text-red-600" },
        ].map((kpi, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview: asset/session/day breakdown */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Assets */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Por Ativo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {assetBreakdown.slice(0, 5).map((a, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{a.asset}</span>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold ${a.winRate >= 50 ? "text-green-600" : "text-red-600"}`}>{a.winRate.toFixed(0)}%</span>
                  <span className={`text-xs font-bold ${a.money >= 0 ? "text-green-600" : "text-red-600"}`}>${a.money.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sessions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Por Sessão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sessionBreakdown.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{s.session}</span>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">{s.total}</Badge>
                  <span className={`text-xs font-bold ${s.winRate >= 50 ? "text-green-600" : "text-red-600"}`}>{s.winRate.toFixed(0)}%</span>
                  <span className={`text-xs font-bold ${s.money >= 0 ? "text-green-600" : "text-red-600"}`}>${s.money.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Weekdays */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Por Dia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dayBreakdown.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{d.day}</span>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">{d.total}</Badge>
                  <span className={`text-xs font-bold ${d.winRate >= 50 ? "text-green-600" : "text-red-600"}`}>{d.winRate.toFixed(0)}%</span>
                  <span className={`text-xs font-bold ${d.money >= 0 ? "text-green-600" : "text-red-600"}`}>${d.money.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Streaks + Best/Worst */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Flame className="w-4 h-4 text-orange-500" /> Streaks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{streaks.maxWin}</p>
                <p className="text-xs text-muted-foreground">Melhor Win</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{streaks.maxLoss}</p>
                <p className="text-xs text-muted-foreground">Pior Loss</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Award className="w-4 h-4 text-primary" /> Melhor & Pior Trade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              {stats.bestTrade && (
                <div>
                  <p className="text-lg font-bold text-green-600">${(stats.bestTrade.moneyResult || 0).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{stats.bestTrade.asset} • {stats.bestTrade.date}</p>
                </div>
              )}
              {stats.worstTrade && (
                <div>
                  <p className="text-lg font-bold text-red-600">${(stats.worstTrade.moneyResult || 0).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{stats.worstTrade.asset} • {stats.worstTrade.date}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Exportar Relatório
          </CardTitle>
          <CardDescription>
            O PDF inclui: KPIs, tabela de trades com checklist, performance por ativo/sessão/dia, disciplina operacional, streaks, melhores/piores trades e galeria de imagens.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredTrades.length === 0 ? (
            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <p className="text-sm text-yellow-900 dark:text-yellow-200">Nenhum trade para exportar com os filtros selecionados.</p>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              <Button onClick={generatePDFReport} disabled={isGenerating} className="w-full gap-2">
                <Download className="w-4 h-4" />
                {isGenerating ? "Gerando..." : "Gerar Relatório PDF"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const totalGain = filteredTrades.filter(t => t.result === "WIN").reduce((s, t) => s + (t.moneyResult || 0), 0);
                  const totalLoss = filteredTrades.filter(t => t.result === "LOSS").reduce((s, t) => s + Math.abs(t.moneyResult || 0), 0);
                  const summary = {
                    period: PERIOD_OPTIONS.find(o => o.value === period)?.label || "Tudo",
                    totalTrades: stats.total,
                    winningTrades: stats.wins,
                    losingTrades: stats.losses,
                    winRate: stats.winRate.toFixed(1),
                    totalGain: totalGain.toFixed(2),
                    totalLoss: totalLoss.toFixed(2),
                    netProfit: (totalGain - totalLoss).toFixed(2),
                    riskReward: totalLoss > 0 ? (totalGain / totalLoss).toFixed(2) : 0,
                    maxGain: 0, maxLoss: 0,
                  };
                  const analyses = JSON.parse(localStorage.getItem("analyses") || "[]");
                  exportCompleteReportToExcel(summary, filteredTrades as any, analyses);
                  toast.success("Relatório Excel exportado!");
                }}
                className="w-full gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Gerar em Excel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
