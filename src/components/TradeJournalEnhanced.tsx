"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useTradeJournalUnified, TradeWithChecklist } from "@/hooks/useTradeJournalUnified";
import { useAccountManager } from "@/hooks/useAccountManager";
import { Plus, Trash2, Edit2, Image, FileSpreadsheet, FileDown, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useTradeAlerts } from "@/hooks/useTradeAlerts";
import { parseTimeString } from "@/hooks/useMarketSession";
import { Download } from "lucide-react";
import { exportTradesToExcel, exportToCSV as exportToCSVFile } from "@/lib/excelExporter";
import { SimpleImageViewer } from "./SimpleImageViewer";
import { TradeImageGallery } from "./TradeImageGallery";
import { useCustomChecklists, ChecklistItem } from "@/hooks/useCustomChecklists";
import ChecklistEditor from "./ChecklistEditor";
import { compressImage } from "@/lib/imageOptimizer";
import {
  isSectionItem,
  getExecutionScore,
  CRITICAL_OPERATIONAL_KEYS,
  migrateLegacyOperational,
} from "@/lib/executionScore";

// Using TradeWithChecklist from useTradeJournalUnified

// Função para obter informações de sessão de mercado (sem hook)
function getMarketSessionInfo(
  asset: string,
  entryHourBrasilia: number,
  entryMinuteBrasilia: number = 0
): {
  marketSession: "NY" | "Londres" | "Ásia" | "Sobreposição" | "Fechado";
  timeOfDay: "Manhã" | "Tarde" | "Noite";
  description: string;
} {
  const totalMinutes = entryHourBrasilia * 60 + entryMinuteBrasilia;

  let marketSession: "NY" | "Londres" | "Ásia" | "Sobreposição" | "Fechado" =
    "Fechado";
  let description = "";

  const asia_start = 23 * 60;
  const asia_end = 8 * 60;
  const london_start = 3 * 60;
  const london_end = 12 * 60;
  const ny_start = 8 * 60;
  const ny_end = 17 * 60;

  const isForex = ["EUR/USD", "USDJPY"].includes(asset);
  const isGold = asset === "XAUUSD";
  const isCrypto = asset === "BTC USD";
  const isIndices = asset === "NASDAQ";

  if (isForex || isGold) {
    if (totalMinutes >= asia_start || totalMinutes < asia_end) {
      marketSession = "Ásia";
      description = "Sessão Asiática";
    } else if (totalMinutes >= london_start && totalMinutes < london_end) {
      marketSession = "Londres";
      description = "Sessão de Londres";
    } else if (totalMinutes >= ny_start && totalMinutes < ny_end) {
      marketSession = "NY";
      description = "Sessão de Nova York";
    } else if (
      totalMinutes >= london_start &&
      totalMinutes < ny_end &&
      totalMinutes >= ny_start
    ) {
      if (totalMinutes >= ny_start && totalMinutes < london_end) {
        marketSession = "Sobreposição";
        description = "Sobreposição Londres-NY";
      }
    }

    if (marketSession === "Fechado") {
      if (totalMinutes >= asia_start || totalMinutes < london_start) {
        marketSession = "Ásia";
        description = "Sessão Asiática";
      } else {
        marketSession = "Sobreposição";
        description = "Sobreposição Ásia-Londres";
      }
    }
  } else if (isCrypto) {
    if (totalMinutes >= ny_start && totalMinutes < ny_end) {
      marketSession = "NY";
      description = "Horário de pico (NY ativo)";
    } else if (totalMinutes >= london_start && totalMinutes < london_end) {
      marketSession = "Londres";
      description = "Horário de pico (Londres ativo)";
    } else if (totalMinutes >= asia_start || totalMinutes < asia_end) {
      marketSession = "Ásia";
      description = "Horário de pico (Ásia ativa)";
    } else {
      marketSession = "Fechado";
      description = "Cripto 24h (volume baixo)";
    }
  } else if (isIndices) {
    const nasdaq_start = 10 * 60 + 30;
    const nasdaq_end = 17 * 60;

    if (totalMinutes >= nasdaq_start && totalMinutes < nasdaq_end) {
      marketSession = "NY";
      description = "NASDAQ em operação";
    } else {
      marketSession = "Fechado";
      description = "NASDAQ fechado";
    }
  }

  let timeOfDay: "Manhã" | "Tarde" | "Noite" = "Manhã";
  if (entryHourBrasilia >= 12 && entryHourBrasilia < 18) {
    timeOfDay = "Tarde";
  } else if (entryHourBrasilia >= 18 || entryHourBrasilia < 6) {
    timeOfDay = "Noite";
  }

  return {
    marketSession,
    timeOfDay,
    description,
  };
}

export default function TradeJournalEnhanced() {
  const { accounts, activeAccountId } = useAccountManager();
  
  const { trades, isLoaded, addTrade: addTradeUnified, updateTrade: updateTradeUnified, deleteTrade: deleteTradeUnified, toggleFavorite: toggleFavoriteUnified } = useTradeJournalUnified(activeAccountId);

  // Custom checklists
  const opChecklist = useCustomChecklists("operational");
  const emChecklist = useCustomChecklists("emotional");
  const rtChecklist = useCustomChecklists("routine");
  const raChecklist = useCustomChecklists("rational");
  const [editingChecklist, setEditingChecklist] = useState<string | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedTradeForGallery, setSelectedTradeForGallery] =
    useState<TradeWithChecklist | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const buildChecklistState = (items: ChecklistItem[]) => {
    const state: Record<string, boolean> = {};
    items.forEach((i) => {
      state[i.key] = false;
    });
    return state;
  };

  const normalizeChecklistState = (
    current: Record<string, boolean>,
    items: ChecklistItem[],
  ) => Object.fromEntries(items.map((item) => [item.key, current?.[item.key] === true])) as Record<string, boolean>;

  const getChecklistProgress = (
    state: Record<string, boolean>,
    items: ChecklistItem[],
  ) => {
    const total = items.length;
    const checked = items.filter((item) => state?.[item.key] === true).length;
    const percentage = total === 0 ? 100 : Math.round((checked / total) * 100);
    return { total, checked, percentage };
  };

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    entryTime: "",
    asset: "EUR/USD",
    entryPrice: "",
    exitPrice: "",
    stopLoss: "",
    takeProfit: "",
    stopLossPips: "",
    takeProfitPips: "",
    stopLossTicks: "",
    takeProfitTicks: "",
    stopLossDollars: "",
    takeProfitDollars: "",
    session: "" as "Manha" | "Tarde" | "Noite" | "",
    account: "",
    result: "WIN" as "WIN" | "LOSS" | "BREAK_EVEN" | "ONGOING",
    riskReward: 0,
    moneyResult: 0,
    notes: "",
    isFavorite: false,
    operational: {} as Record<string, boolean>,
    emotional: {} as Record<string, boolean>,
    routine: {} as Record<string, boolean>,
    rational: {} as Record<string, boolean>,
    preTradeImage: "",
    tradingImage: "",
    postTradeImage: "",
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      operational: normalizeChecklistState(prev.operational, opChecklist.items),
      emotional: normalizeChecklistState(prev.emotional, emChecklist.items),
      routine: normalizeChecklistState(prev.routine, rtChecklist.items),
      rational: normalizeChecklistState(prev.rational, raChecklist.items),
    }));
  }, [opChecklist.items, emChecklist.items, rtChecklist.items, raChecklist.items]);

  const checklistProgress = useMemo(() => ({
    operacional: getChecklistProgress(formData.operational, opChecklist.items),
    emocional: getChecklistProgress(formData.emotional, emChecklist.items),
    rotina: getChecklistProgress(formData.routine, rtChecklist.items),
    racional: getChecklistProgress(formData.rational, raChecklist.items),
  }), [formData.operational, formData.emotional, formData.routine, formData.rational, opChecklist.items, emChecklist.items, rtChecklist.items, raChecklist.items]);

  // Usar hook de alertas
  useTradeAlerts(trades, activeAccountId);

  // saveTrades is now handled by useTradeJournalUnified
  const saveTrades = (_newTrades: TradeWithChecklist[]) => {
    // no-op: trades are managed by Supabase hook
  };

  const showDailyLimitAlert = (wins: number, losses: number) => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    const isLossLimit = losses >= 3;
    const alertDiv = document.createElement("div");
    alertDiv.className = `fixed inset-0 z-[9999] flex items-center justify-center ${isDarkMode ? "bg-black/80" : "bg-black/50"}`;

    const title = isLossLimit
      ? "LIMITE DE PERDAS ATINGIDO"
      : "LIMITE DE VITORIAS ATINGIDO";
    const bgColor = isLossLimit ? "bg-red-600" : "bg-green-600";
    const message = isLossLimit
      ? "Voce alcancou 3 perdas hoje. PARE DE OPERAR IMEDIATAMENTE para proteger seu capital!"
      : "Voce alcancou 2 vitorias hoje. Recomenda-se parar de operar para preservar ganhos.";

    alertDiv.innerHTML = `
      <div class="${isDarkMode ? "bg-slate-900" : "bg-white"} border-4 ${isLossLimit ? "border-red-500" : "border-green-500"} rounded-xl p-10 max-w-md shadow-2xl text-center">
        <div class="text-6xl mb-6 font-bold ${bgColor} text-white rounded-full w-20 h-20 flex items-center justify-center mx-auto">${isLossLimit ? "⛔" : "✓"}</div>
        <h2 class="text-3xl font-bold mb-4 ${isLossLimit ? "text-red-500" : "text-green-500"}">${title}</h2>
        <p class="${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-8 text-lg leading-relaxed">${message}</p>
        <div class="space-y-3 mb-8 p-4 ${isDarkMode ? "bg-slate-800" : "bg-gray-100"} rounded-lg">
          <p class="${isDarkMode ? "text-gray-300" : "text-gray-700"}"><strong>Vitorias hoje:</strong> <span class="text-green-500 font-bold text-lg">${wins}</span></p>
          <p class="${isDarkMode ? "text-gray-300" : "text-gray-700"}"><strong>Perdas hoje:</strong> <span class="text-red-500 font-bold text-lg">${losses}</span></p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="${bgColor} hover:opacity-90 text-white font-bold py-3 px-8 rounded-lg transition text-lg w-full">
          Entendi, Vou Parar
        </button>
      </div>
    `;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
      if (alertDiv.parentElement) alertDiv.remove();
    }, 15000);
  };

  // Verificar se o dia está bloqueado para trades (3 losses ou 2 wins)
  const today = new Date().toISOString().split("T")[0];
  const todayTradesForAccount = trades.filter(
    t => t.date === today
  );
  const todayWins = todayTradesForAccount.filter(t => t.result === "WIN").length;
  const todayLosses = todayTradesForAccount.filter(t => t.result === "LOSS").length;
  const isDayBlocked = todayWins >= 2 || todayLosses >= 3;

  const handleAddTrade = () => {
    // Bloqueio diário: não permitir novos trades se meta de loss ou win foi batida
    if (!editingId && isDayBlocked) {
      toast.error(
        todayWins >= 2
          ? "🚫 Meta diária de 2 WINs atingida! Trades bloqueados até o próximo dia útil."
          : "🚫 Limite de 3 LOSSes atingido! Trades bloqueados até o próximo dia útil.",
        { duration: 5000 }
      );
      return;
    }
    // Validar entrada e saída (saída é opcional para trades em andamento)
    if (!formData.entryPrice) {
      toast.error("Preencha o preço de entrada!");
      return;
    }
    if (formData.result !== "ONGOING" && !formData.exitPrice) {
      toast.error("Preencha o preço de saída ou selecione 'Em Andamento'!");
      return;
    }

    // === MODO DISCIPLINA: Operacional exige >=80% + itens críticos marcados ===
    const opItemsReal = opChecklist.items.filter((i) => !isSectionItem(i));
    if (opItemsReal.length > 0) {
      const opMarked = opItemsReal.filter((i) => formData.operational[i.key] === true).length;
      const opPct = (opMarked / opItemsReal.length) * 100;

      // Itens críticos (apenas se existirem no checklist atual)
      const missingCritical = CRITICAL_OPERATIONAL_KEYS.filter(
        (k) => opItemsReal.some((i) => i.key === k) && formData.operational[k] !== true,
      );

      if (missingCritical.length > 0) {
        const labelMap: Record<string, string> = {
          htfZoneInteraction: "Interação com zona HTF/MTF",
          chochExterno: "CHOCH externo",
          bosExterno: "BOS externo",
          chochInterno: "CHOCH interno",
        };
        toast.error(
          `🔴 Trade inválido — fora do modelo operacional. Faltando: ${missingCritical
            .map((k) => labelMap[k])
            .join(", ")}.`,
          { duration: 6000 },
        );
        return;
      }

      if (opPct < 80) {
        toast.error(
          `🔴 Checklist Operacional incompleto (${opMarked}/${opItemsReal.length} = ${Math.round(opPct)}%). Mínimo: 80%.`,
          { duration: 6000 },
        );
        return;
      }
    }

    // Demais checklists com pesos: Emocional / Rotina / Racional exigem >=65%
    const checkGroups = [
      { name: "Emocional", items: emChecklist.items, values: formData.emotional, min: 65 },
      { name: "Rotina", items: rtChecklist.items, values: formData.routine, min: 65 },
      { name: "Racional", items: raChecklist.items, values: formData.rational, min: 65 },
    ];

    for (const group of checkGroups) {
      const realItems = group.items.filter((i) => !isSectionItem(i));
      if (realItems.length === 0) continue;

      const marked = realItems.filter((item) => group.values[item.key] === true).length;
      const pct = (marked / realItems.length) * 100;

      if (pct < group.min) {
        toast.error(
          `Checklist ${group.name} insuficiente: ${marked}/${realItems.length} (${Math.round(pct)}%). Mínimo: ${group.min}%.`,
        );
        return;
      }
    }

    const allOperationalComplete =
      opItemsReal.length > 0 &&
      opItemsReal.every((item) => formData.operational[item.key] === true);

    // Validar R:R
    const rr = formData.riskReward || 0;
    if (formData.result === "WIN" && (rr < 1 || rr > 10)) {
      toast.error("Para WIN: R:R deve ser entre +1 e +10");
      return;
    }
    if (formData.result === "LOSS" && rr !== -1) {
      toast.error("Para LOSS: R:R deve ser -1");
      return;
    }
    if (formData.result === "BREAK_EVEN" && rr !== 0) {
      toast.error("Para BREAK_EVEN: R:R deve ser 0");
      return;
    }
    if (formData.result === "ONGOING" && !formData.exitPrice) {
      // Para trades em andamento, exitPrice é opcional
    }

    // Detectar sessão de mercado automaticamente
    let marketSession:
      | "NY"
      | "Londres"
      | "Ásia"
      | "Sobreposição"
      | "Fechado"
      | undefined = undefined;
    if (formData.entryTime) {
      const { hour, minute } = parseTimeString(formData.entryTime);
      // Usar a função diretamente, não como hook
      const sessionInfo = getMarketSessionInfo(formData.asset, hour, minute);
      marketSession = sessionInfo.marketSession;
    }

    const checklistLabels = {
      operational: Object.fromEntries(opChecklist.items.map((item) => [item.key, `${item.emoji} ${item.label}`.trim()])),
      emotional: Object.fromEntries(emChecklist.items.map((item) => [item.key, `${item.emoji} ${item.label}`.trim()])),
      routine: Object.fromEntries(rtChecklist.items.map((item) => [item.key, `${item.emoji} ${item.label}`.trim()])),
      rational: Object.fromEntries(raChecklist.items.map((item) => [item.key, `${item.emoji} ${item.label}`.trim()])),
    };

    const newTrade: TradeWithChecklist = {
      id: editingId || Date.now().toString(),
      date: formData.date,
      entryTime: formData.entryTime,
      asset: formData.asset,
      entryPrice: formData.entryPrice,
      exitPrice: formData.exitPrice,
      stopLoss: formData.stopLoss,
      takeProfit: formData.takeProfit,
      resultPrice: "",
      session: formData.session,
      marketSession: marketSession,
      account: formData.account,
      result: formData.result,
      riskReward: formData.riskReward || 0,
      moneyResult: formData.moneyResult || 0,
      notes: formData.notes,
      isFavorite: formData.isFavorite,
      preTradeImage: formData.preTradeImage || undefined,
      tradingImage: formData.tradingImage || undefined,
      postTradeImage: formData.postTradeImage || undefined,
      operational: formData.operational,
      emotional: formData.emotional,
      routine: formData.routine,
      rational: formData.rational,
      checklistLabels,
      createdAt: editingId
        ? trades.find((t) => t.id === editingId)?.createdAt || Date.now()
        : Date.now(),
    };

    // Notificação de setup confirmado
    if (allOperationalComplete) {
      toast.success(
        "✅ Setup Confirmado! Todos os 6 itens do checklist operacional foram validados!",
        {
          duration: 5000,
        }
      );
    }

    if (editingId) {
      updateTradeUnified(editingId, newTrade);
      toast.success("Trade atualizado!");
    } else {
      addTradeUnified(newTrade);
      toast.success("Trade registrado!");
    }


    setIsOpen(false);
    resetForm();
  };

  const handleEditTrade = (trade: TradeWithChecklist) => {
    setEditingId(trade.id);
    setFormData({
      date: trade.date,
      entryTime: trade.entryTime || "",
      asset: trade.asset,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      stopLoss: trade.stopLoss,
      takeProfit: trade.takeProfit,
      stopLossPips: "",
      takeProfitPips: "",
      stopLossTicks: "",
      takeProfitTicks: "",
      stopLossDollars: "",
      takeProfitDollars: "",
      session: trade.session,
      account: trade.account,
      result: trade.result,
      riskReward: trade.riskReward || 0,
      moneyResult: trade.moneyResult || 0,
      notes: trade.notes,
      isFavorite: trade.isFavorite || false,
      operational: { ...migrateLegacyOperational(trade.operational), ...(trade.operational || {}) },
      emotional: trade.emotional,
      routine: trade.routine || {
        nightAnalysis: false,
        morningReview: false,
        regionsValidated: false,
        sleep: false,
      },
      rational: trade.rational,
      preTradeImage: trade.preTradeImage || "",
      tradingImage: trade.tradingImage || "",
      postTradeImage: trade.postTradeImage || "",
    });
    setIsOpen(true);
  };

  const handleDeleteTrade = (id: string) => {
    deleteTradeUnified(id);
    toast.success("Trade removido!");
  };

  const handleExportTradePDF = async (trade: TradeWithChecklist) => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    let y = 0;
    const m = 12; // margin

    const c = {
      primary: [15, 23, 42] as [number, number, number],
      accent: [59, 130, 246] as [number, number, number],
      green: [34, 197, 94] as [number, number, number],
      red: [239, 68, 68] as [number, number, number],
      yellow: [234, 179, 8] as [number, number, number],
      gray: [148, 163, 184] as [number, number, number],
      lightBg: [241, 245, 249] as [number, number, number],
      white: [255, 255, 255] as [number, number, number],
    };
    const resultColor = trade.result === "WIN" ? c.green : trade.result === "LOSS" ? c.red : trade.result === "BREAK_EVEN" ? c.yellow : c.gray;
    const resultText = trade.result === "WIN" ? "WIN" : trade.result === "LOSS" ? "LOSS" : trade.result === "BREAK_EVEN" ? "BE" : "ONGOING";

    // === PAGE 1: HEADER + DATA + ALL CHECKLISTS ===

    // Header bar (compact)
    doc.setFillColor(...c.primary);
    doc.rect(0, 0, pw, 28, "F");
    doc.setFillColor(...c.accent);
    doc.rect(0, 28, pw, 2, "F");

    doc.setTextColor(...c.white);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`TRADE REPORT  -  ${trade.asset}`, m, 12);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`${trade.date || "N/A"}  |  ${trade.session || "N/A"}  |  ${trade.entryTime || ""}  |  R:R ${trade.riskReward ?? "N/A"}  |  ${trade.moneyResult != null ? "$" + trade.moneyResult.toFixed(2) : ""}`, m, 22);

    // Result badge
    doc.setFillColor(...resultColor);
    const bw = doc.getTextWidth(resultText) * 1.8 + 10;
    doc.roundedRect(pw - m - bw, 6, bw, 16, 3, 3, "F");
    doc.setTextColor(...c.white);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(resultText, pw - m - bw / 2, 17, { align: "center" });

    y = 36;

    const sanitizePdfText = (value: string) =>
      (value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\x20-\x7E]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const ensurePdfSpace = (needed = 10) => {
      if (y + needed > ph - 12) {
        doc.addPage();
        y = 14;
      }
    };

    const secTitle = (title: string, color: [number, number, number]) => {
      ensurePdfSpace(10);
      doc.setFillColor(...color);
      doc.rect(m, y, 2.5, 6, "F");
      doc.setTextColor(...c.primary);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(sanitizePdfText(title), m + 5, y + 4.5);
      y += 8;
    };

    const dRow = (label: string, value: string, x: number, w: number, alt: boolean) => {
      ensurePdfSpace(7);
      if (alt) {
        doc.setFillColor(...c.lightBg);
        doc.rect(x, y - 3, w, 6, "F");
      }
      doc.setTextColor(...c.gray);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text(sanitizePdfText(label), x + 2, y + 0.5);
      doc.setTextColor(...c.primary);
      doc.setFont("helvetica", "bold");
      doc.text(sanitizePdfText(value), x + w / 2, y + 0.5);
      y += 6;
    };

    // Render a checklist row that wraps long labels and skips section headers.
    const chk = (label: string, checked: boolean, x: number, w: number) => {
      const cleaned = sanitizePdfText(label);
      const textW = w - 22; // space for bullet + sim/nao tag on the right
      doc.setFontSize(7);
      const lines: string[] = doc.splitTextToSize(cleaned, textW);
      const lineH = 3.2;
      const rowH = Math.max(5, lines.length * lineH + 1.5);
      ensurePdfSpace(rowH + 1);
      doc.setFillColor(...(checked ? c.green : c.red));
      doc.circle(x + 4, y + 1.2, 1.7, "F");
      doc.setTextColor(...c.primary);
      doc.setFont("helvetica", "normal");
      lines.forEach((ln, idx) => {
        doc.text(ln, x + 8, y + 1.5 + idx * lineH);
      });
      doc.setTextColor(...(checked ? c.green : c.red));
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.text(checked ? "SIM" : "NAO", x + w - 2, y + 1.5, { align: "right" });
      y += rowH;
    };

    // === TRADE DATA (two columns) ===
    secTitle("Dados do Trade", c.accent);
    const halfW = (pw - 2 * m) / 2;
    const dataLeft: [string, string][] = [
      ["Entrada", trade.entryPrice || "N/A"],
      ["Saida", trade.exitPrice || "N/A"],
      ["Stop Loss", trade.stopLoss || "N/A"],
      ["Take Profit", trade.takeProfit || "N/A"],
    ];
    const dataRight: [string, string][] = [
      ["Resultado", trade.result],
      ["R:R", String(trade.riskReward ?? "N/A")],
      ["Resultado $", trade.moneyResult != null ? `$${trade.moneyResult.toFixed(2)}` : "N/A"],
      ["Ativo", trade.asset],
    ];
    const savedY = y;
    dataLeft.forEach(([l, v], i) => dRow(l, v, m, halfW, i % 2 === 0));
    const leftEnd = y;
    y = savedY;
    dataRight.forEach(([l, v], i) => dRow(l, v, m + halfW, halfW, i % 2 === 0));
    y = Math.max(leftEnd, y) + 4;

    // === CHECKLISTS — full width, full labels, skip section headers ===
    // Migrate legacy operational on the fly so old trades show meaningful data.
    const opMerged = { ...migrateLegacyOperational(trade.operational), ...(trade.operational || {}) };

    const renderChecklist = (
      title: string,
      titleColor: [number, number, number],
      items: typeof opChecklist.items,
      values: Record<string, boolean> | undefined,
    ) => {
      const real = items.filter((i) => !isSectionItem(i));
      if (real.length === 0) return;
      const marked = real.filter((i) => values?.[i.key] === true).length;
      const pct = Math.round((marked / real.length) * 100);
      ensurePdfSpace(10);
      doc.setFillColor(...titleColor);
      doc.rect(m, y, 2.5, 6, "F");
      doc.setTextColor(...c.primary);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(sanitizePdfText(title), m + 5, y + 4.5);
      // Score pill on the right
      const scoreColor = pct >= 80 ? c.green : pct >= 60 ? c.yellow : c.red;
      doc.setFillColor(...scoreColor);
      doc.roundedRect(pw - m - 28, y, 28, 6, 1.5, 1.5, "F");
      doc.setTextColor(...c.white);
      doc.setFontSize(7.5);
      doc.text(`${marked}/${real.length}  ${pct}%`, pw - m - 14, y + 4.2, { align: "center" });
      y += 9;

      items.forEach((item) => {
        if (isSectionItem(item)) {
          // Section header row
          ensurePdfSpace(7);
          doc.setFillColor(...c.lightBg);
          doc.rect(m, y - 1, pw - 2 * m, 5.5, "F");
          doc.setTextColor(...c.gray);
          doc.setFontSize(7.2);
          doc.setFont("helvetica", "bold");
          doc.text(sanitizePdfText(`${item.emoji} ${item.label}`), m + 2, y + 2.5);
          y += 6;
          return;
        }
        chk(`${item.emoji} ${item.label}`, values?.[item.key] === true, m, pw - 2 * m);
      });
      y += 3;
    };

    renderChecklist("Checklist Operacional", c.accent, opChecklist.items, opMerged);
    renderChecklist("Checklist Emocional", [139, 92, 246], emChecklist.items, trade.emotional as any);
    renderChecklist("Checklist Rotina", c.green, rtChecklist.items, trade.routine as any);
    renderChecklist("Checklist Racional", [14, 165, 233], raChecklist.items, trade.rational as any);

    // === NOTAS (compact) ===
    if (trade.notes) {
      secTitle("Notas", c.gray);
      doc.setTextColor(...c.primary); doc.setFontSize(7.5); doc.setFont("helvetica", "normal");
      const noteLines = doc.splitTextToSize(trade.notes, pw - 2 * m - 8);
      noteLines.forEach((line: string) => {
        if (y > ph - 12) { doc.addPage(); y = 14; }
        doc.text(line, m + 4, y);
        y += 4.5;
      });
      y += 2;
    }

    // === OBSERVAÇÕES (lined area for handwriting) ===
    secTitle("Observacoes", c.accent);
    const footerY = ph - 8;
    const lineSpacing = 7;
    doc.setDrawColor(200, 210, 220);
    doc.setLineWidth(0.3);
    while (y + lineSpacing < footerY) {
      doc.line(m, y, pw - m, y);
      y += lineSpacing;
    }

    // === FOOTER page 1 ===
    doc.setTextColor(...c.gray); doc.setFontSize(6); doc.setFont("helvetica", "normal");
    doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}  |  Trading Dashboard`, pw / 2, ph - 6, { align: "center" });

    // === PAGE 2: IMAGES (only if there are images) ===
    const imageEntries: [string, string | undefined][] = [
      ["Pre-Trade", trade.preTradeImage],
      ["Trade", trade.tradingImage],
      ["Pos-Trade", trade.postTradeImage],
    ];
    const validImages = imageEntries.filter(([, url]) => url);

    if (validImages.length > 0) {
      doc.addPage();
      y = 14;

      // Mini header
      doc.setFillColor(...c.primary);
      doc.rect(0, 0, pw, 12, "F");
      doc.setTextColor(...c.white); doc.setFontSize(10); doc.setFont("helvetica", "bold");
      doc.text(`${trade.asset}  -  Imagens do Trade`, m, 8);
      y = 18;

      // Force all images to fit on this single page
      const availH = ph - y - 8;
      const imgH = (availH - validImages.length * 6) / validImages.length;
      const imgW = pw - 2 * m;

      for (const [label, url] of validImages) {
        if (!url) continue;
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });

          doc.setTextColor(...c.accent); doc.setFontSize(7); doc.setFont("helvetica", "bold");
          doc.text(label, m, y);
          y += 3;
          doc.addImage(dataUrl, "JPEG", m, y, imgW, imgH);
          y += imgH + 3;
        } catch {
          doc.setTextColor(...c.red); doc.setFontSize(7);
          doc.text(`Imagem ${label} indisponivel`, m, y);
          y += 5;
        }
      }

      // Footer page 2
      doc.setTextColor(...c.gray); doc.setFontSize(6); doc.setFont("helvetica", "normal");
      doc.text(`Trading Dashboard`, pw / 2, ph - 6, { align: "center" });
    }

    doc.save(`Trade_${trade.asset}_${trade.date || "sem-data"}.pdf`);
    toast.success("PDF exportado com sucesso!");
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      entryTime: "",
      asset: "EUR/USD",
      entryPrice: "",
      exitPrice: "",
      stopLoss: "",
      takeProfit: "",
      session: "",
      account: "",
      result: "WIN",
      riskReward: 0,
      moneyResult: 0,
      notes: "",
      isFavorite: false,
      stopLossPips: "",
      takeProfitPips: "",
      stopLossTicks: "",
      takeProfitTicks: "",
      stopLossDollars: "",
      takeProfitDollars: "",
      operational: buildChecklistState(opChecklist.items),
      emotional: buildChecklistState(emChecklist.items),
      routine: buildChecklistState(rtChecklist.items),
      rational: buildChecklistState(raChecklist.items),
      preTradeImage: "",
      tradingImage: "",
      postTradeImage: "",
    });
  };

  const stats = {
    total: trades.length,
    wins: trades.filter(t => t.result === "WIN").length,
    losses: trades.filter(t => t.result === "LOSS").length,
    winRate:
      trades.length > 0
        ? (
            (trades.filter(t => t.result === "WIN").length / trades.length) *
            100
          ).toFixed(1)
        : "0",
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total de Trades</p>
            <p className="text-3xl font-bold text-primary">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Vitórias</p>
            <p className="text-3xl font-bold text-green-600">{stats.wins}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Derrotas</p>
            <p className="text-3xl font-bold text-red-600">{stats.losses}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Taxa de Acerto</p>
            <p className="text-3xl font-bold text-blue-600">{stats.winRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Trade Button */}
      {isDayBlocked && (
        <div className="w-full p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm text-center font-medium">
          🚫 {todayWins >= 2 ? "Meta de 2 WINs atingida" : "Limite de 3 LOSSes atingido"} — Trades bloqueados até o próximo dia útil
        </div>
      )}
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (open && isDayBlocked && !editingId) {
          toast.error("Trades bloqueados para hoje nesta conta!");
          return;
        }
        setIsOpen(open);
      }}>
        <DialogTrigger asChild>
          <Button className="w-full bg-primary hover:bg-primary/90" disabled={isDayBlocked}>
            <Plus className="w-4 h-4 mr-2" />
            {isDayBlocked ? "Trades Bloqueados Hoje" : "Registrar Novo Trade"}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Trade" : "Registrar Novo Trade"}
            </DialogTitle>
            <DialogDescription>
              Preencha os detalhes do trade e os checklists operacional,
              emocional e racional
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Trade Details */}
            <div className="space-y-4">
              <h3 className="font-bold text-foreground">Detalhes do Trade</h3>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={e =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Horário de Entrada (Brasília)</Label>
                  <Input
                    type="time"
                    value={formData.entryTime}
                    onChange={e =>
                      setFormData({ ...formData, entryTime: e.target.value })
                    }
                  />
                  {formData.entryTime && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {(() => {
                        const [hour, minute] = formData.entryTime
                          .split(":")
                          .map(Number);
                        const sessionInfo = getMarketSessionInfo(
                          formData.asset,
                          hour,
                          minute
                        );
                        return `📍 ${sessionInfo.marketSession} - ${sessionInfo.description}`;
                      })()}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Ativo</Label>
                  <select
                    value={formData.asset}
                    onChange={e =>
                      setFormData({ ...formData, asset: e.target.value })
                    }
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="EUR/USD">EUR/USD</option>
                    <option value="USDJPY">USDJPY</option>
                    <option value="XAUUSD">XAUUSD</option>
                    <option value="NASDAQ">NASDAQ</option>
                    <option value="BTC USD">BTC USD</option>
                  </select>
                  {formData.entryTime && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {(() => {
                        const [hour, minute] = formData.entryTime
                          .split(":")
                          .map(Number);
                        const sessionInfo = getMarketSessionInfo(
                          formData.asset,
                          hour,
                          minute
                        );
                        return `📍 ${sessionInfo.marketSession} - ${sessionInfo.description}`;
                      })()}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <Label>Entrada</Label>
                  <Input
                    type="number"
                    step="0.00001"
                    value={formData.entryPrice}
                    onChange={e =>
                      setFormData({ ...formData, entryPrice: e.target.value })
                    }
                    placeholder="1.2500"
                  />
                </div>
                <div>
                  <Label>Stop Loss</Label>
                  <Input
                    type="number"
                    step="0.00001"
                    value={formData.stopLoss}
                    onChange={e =>
                      setFormData({ ...formData, stopLoss: e.target.value })
                    }
                    placeholder="1.2490"
                  />
                </div>
                <div>
                  <Label>Take Profit</Label>
                  <Input
                    type="number"
                    step="0.00001"
                    value={formData.takeProfit}
                    onChange={e =>
                      setFormData({ ...formData, takeProfit: e.target.value })
                    }
                    placeholder="1.2530"
                  />
                </div>
              </div>

              {/* Pips, Ticks e Dólares para Stop Loss e Take Profit */}
              {(formData.asset === "EUR/USD" ||
                formData.asset === "USDJPY" ||
                formData.asset === "XAUUSD" ||
                formData.asset === "NASDAQ") && (
                <div className="grid md:grid-cols-2 gap-4 bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div>
                    <Label>Stop Loss em Pips</Label>
                    <Input
                      type="number"
                      step="1"
                      value={formData.stopLossPips}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          stopLossPips: e.target.value,
                        })
                      }
                      placeholder="Ex: 50"
                    />
                  </div>
                  <div>
                    <Label>Take Profit em Pips</Label>
                    <Input
                      type="number"
                      step="1"
                      value={formData.takeProfitPips}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          takeProfitPips: e.target.value,
                        })
                      }
                      placeholder="Ex: 150"
                    />
                  </div>
                </div>
              )}

              {formData.asset === "BTC USD" && (
                <div className="grid md:grid-cols-2 gap-4 bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div>
                    <Label>Stop Loss em Ticks</Label>
                    <Input
                      type="number"
                      step="1"
                      value={formData.stopLossTicks}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          stopLossTicks: e.target.value,
                        })
                      }
                      placeholder="Ex: 10"
                    />
                  </div>
                  <div>
                    <Label>Take Profit em Ticks</Label>
                    <Input
                      type="number"
                      step="1"
                      value={formData.takeProfitTicks}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          takeProfitTicks: e.target.value,
                        })
                      }
                      placeholder="Ex: 30"
                    />
                  </div>
                </div>
              )}

              {/* Dólares para todos os ativos */}
              <div className="grid md:grid-cols-2 gap-4 bg-green-50 p-4 rounded-lg border border-green-200">
                <div>
                  <Label>Stop Loss em Dólares ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.stopLossDollars}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        stopLossDollars: e.target.value,
                      })
                    }
                    placeholder="Ex: 50"
                  />
                </div>
                <div>
                  <Label>Take Profit em Dólares ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.takeProfitDollars}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        takeProfitDollars: e.target.value,
                      })
                    }
                    placeholder="Ex: 150"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Saida</Label>
                  <Input
                    type="number"
                    step="0.00001"
                    value={formData.exitPrice}
                    onChange={e =>
                      setFormData({ ...formData, exitPrice: e.target.value })
                    }
                    placeholder="1.2510"
                  />
                </div>
                <div>
                  <Label>Sessao</Label>
                  <select
                    value={formData.session}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        session: e.target.value as any,
                      })
                    }
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Selecione a sessao</option>
                    <option value="Manha">Manha</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noite">Noite</option>
                  </select>
                </div>
                <div>
                  <Label>Conta</Label>
                  <select
                    value={formData.account}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        account: e.target.value,
                      })
                    }
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Resultado</Label>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant={
                        formData.result === "WIN" ? "default" : "outline"
                      }
                      onClick={() =>
                        setFormData({ ...formData, result: "WIN" })
                      }
                      className="flex-1 min-w-[80px]"
                    >
                      Vitória
                    </Button>
                    <Button
                      type="button"
                      variant={
                        formData.result === "LOSS" ? "default" : "outline"
                      }
                      onClick={() =>
                        setFormData({ ...formData, result: "LOSS" })
                      }
                      className="flex-1 min-w-[80px]"
                    >
                      Derrota
                    </Button>
                    <Button
                      type="button"
                      variant={
                        formData.result === "BREAK_EVEN" ? "default" : "outline"
                      }
                      onClick={() =>
                        setFormData({ ...formData, result: "BREAK_EVEN" })
                      }
                      className="flex-1 min-w-[80px]"
                    >
                      Empate
                    </Button>
                    <Button
                      type="button"
                      variant={
                        formData.result === "ONGOING" ? "default" : "outline"
                      }
                      onClick={() =>
                        setFormData({ ...formData, result: "ONGOING" })
                      }
                      className="flex-1 min-w-[80px] bg-amber-600 hover:bg-amber-700"
                    >
                      Em Andamento
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Risco:Retorno (R:R)</Label>
                  <Input
                    type="number"
                    step="1"
                    value={formData.riskReward}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        riskReward: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="Ex: 3 para 1:3, 4 para 1:4, -1 para loss"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Apenas números inteiros: +1, +2, +3, +4, +5 para wins | -1
                    para loss | 0 para break-even
                  </p>
                </div>
                <div>
                  <Label>Resultado em Dinheiro ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.moneyResult}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        moneyResult: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="Ex: +20, +60, -20"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Valor em dólares do resultado do trade
                  </p>
                </div>
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={formData.notes}
                  onChange={e =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Notas sobre o trade..."
                  className="min-h-24"
                />
              </div>

              {/* Favorito */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFavorite"
                  checked={formData.isFavorite}
                  onCheckedChange={checked =>
                    setFormData({ ...formData, isFavorite: checked as boolean })
                  }
                />
                <Label htmlFor="isFavorite" className="cursor-pointer">
                  ⭐ Marcar como favorito
                </Label>
              </div>

              {/* Image Uploads */}
              <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-bold text-blue-900">
                  Imagens do Trade (Opcionais)
                </h3>

                <div>
                  <Label>Imagem Pré-Trading</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const compressed = await compressImage(file);
                      setFormData(prev => ({ ...prev, preTradeImage: compressed }));
                    }}
                  />
                  {formData.preTradeImage && (
                    <div className="mt-2 flex gap-2 items-end">
                      <div
                        className="w-16 h-16 rounded-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 border-primary/30 relative group"
                        onClick={() => {
                          const div = document.createElement("div");
                          div.innerHTML = `<div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 9999;" onclick="this.remove()"><img src="${formData.preTradeImage}" style="max-width: 90vw; max-height: 90vh; object-fit: contain;" /></div>`;
                          document.body.appendChild(div.firstChild as Node);
                        }}
                      >
                        <img
                          src={formData.preTradeImage}
                          alt="Pre-Trade"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          setFormData({ ...formData, preTradeImage: "" })
                        }
                        className="h-8 w-8 p-0"
                      >
                        ✕
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Imagem Durante Trading</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const compressed = await compressImage(file);
                      setFormData(prev => ({ ...prev, tradingImage: compressed }));
                    }}
                  />
                  {formData.tradingImage && (
                    <div className="mt-2 flex gap-2 items-end">
                      <div
                        className="w-16 h-16 rounded-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 border-primary/30 relative group"
                        onClick={() => {
                          const div = document.createElement("div");
                          div.innerHTML = `<div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 9999;" onclick="this.remove()"><img src="${formData.tradingImage}" style="max-width: 90vw; max-height: 90vh; object-fit: contain;" /></div>`;
                          document.body.appendChild(div.firstChild as Node);
                        }}
                      >
                        <img
                          src={formData.tradingImage}
                          alt="Trading"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          setFormData({ ...formData, tradingImage: "" })
                        }
                        className="h-8 w-8 p-0"
                      >
                        ✕
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Imagem Pós-Trading</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const compressed = await compressImage(file);
                      setFormData(prev => ({ ...prev, postTradeImage: compressed }));
                    }}
                  />
                  {formData.postTradeImage && (
                    <div className="mt-2 flex gap-2 items-end">
                      <div
                        className="w-16 h-16 rounded-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 border-primary/30 relative group"
                        onClick={() => {
                          const div = document.createElement("div");
                          div.innerHTML = `<div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 9999;" onclick="this.remove()"><img src="${formData.postTradeImage}" style="max-width: 90vw; max-height: 90vh; object-fit: contain;" /></div>`;
                          document.body.appendChild(div.firstChild as Node);
                        }}
                      >
                        <img
                          src={formData.postTradeImage}
                          alt="Post-Trade"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          setFormData({ ...formData, postTradeImage: "" })
                        }
                        className="h-8 w-8 p-0"
                      >
                        ✕
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dynamic Checklist Sections */}
            {[
              { group: "operational", checklist: opChecklist, title: "Checklist Operacional", icon: "📋", bgClass: "bg-purple-50 dark:bg-purple-950/30", borderClass: "border-purple-300 dark:border-purple-700", textClass: "text-purple-900 dark:text-purple-200", formKey: "operational" as const },
              { group: "emotional", checklist: emChecklist, title: "Checklist Emocional", icon: "❤️", bgClass: "bg-red-50 dark:bg-red-950/30", borderClass: "border-red-200 dark:border-red-700", textClass: "text-red-900 dark:text-red-200", formKey: "emotional" as const },
              { group: "routine", checklist: rtChecklist, title: "Checklist Rotina Operacional", icon: "📋", bgClass: "bg-blue-50 dark:bg-blue-950/30", borderClass: "border-blue-200 dark:border-blue-700", textClass: "text-blue-900 dark:text-blue-200", formKey: "routine" as const },
              { group: "rational", checklist: raChecklist, title: "Checklist Racional (Análise e Plano)", icon: "🧠", bgClass: "bg-green-50 dark:bg-green-950/30", borderClass: "border-green-200 dark:border-green-700", textClass: "text-green-900 dark:text-green-200", formKey: "rational" as const },
            ].map(({ group, checklist, title, icon, bgClass, borderClass, textClass, formKey }) => (
              <div key={group} className={`space-y-3 ${bgClass} p-4 rounded-lg border ${borderClass}`}>
                <div className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{icon}</span>
                    <h3 className={`font-bold ${textClass}`}>{title}</h3>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingChecklist(group)}
                    className="h-7 w-7 p-0 opacity-60 hover:opacity-100"
                    title="Editar checklist"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {group === "emotional" && (
                  <p className="text-xs opacity-70">3 Perguntas Essenciais</p>
                )}

                {checklist.items.map((item) => {
                  if (isSectionItem(item)) {
                    return (
                      <div
                        key={item.key}
                        className={`mt-3 pt-2 border-t ${borderClass} text-xs font-bold uppercase tracking-wider opacity-80 ${textClass}`}
                      >
                        {item.emoji} {item.label}
                      </div>
                    );
                  }
                  return (
                    <div key={item.key} className="flex items-start space-x-2">
                      <Checkbox
                        id={`${group}-${item.key}`}
                        checked={!!formData[formKey]?.[item.key]}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            [formKey]: {
                              ...formData[formKey],
                              [item.key]: checked as boolean,
                            },
                          })
                        }
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor={`${group}-${item.key}`}
                        className={`text-sm ${textClass} cursor-pointer leading-snug`}
                      >
                        {item.emoji} {item.label}
                      </Label>
                    </div>
                  );
                })}

                <ChecklistEditor
                  items={checklist.items}
                  onSave={checklist.saveItems}
                  onReset={checklist.resetToDefaults}
                  isCustomized={checklist.isCustomized}
                  title={title}
                  open={editingChecklist === group}
                  onOpenChange={(open) => { if (!open) setEditingChecklist(null); }}
                />
              </div>
            ))}

            {/* Score de Execução + Validação */}
            {(() => {
              const opPct = checklistProgress.operacional.percentage;
              const score = getExecutionScore(opPct);
              const opItemsReal = opChecklist.items.filter((i) => !isSectionItem(i));
              const missingCritical = CRITICAL_OPERATIONAL_KEYS.filter(
                (k) =>
                  opItemsReal.some((i) => i.key === k) &&
                  formData.operational[k] !== true,
              );
              const labelMap: Record<string, string> = {
                htfZoneInteraction: "Interação HTF/MTF",
                chochExterno: "CHOCH externo",
                bosExterno: "BOS externo",
                chochInterno: "CHOCH interno",
              };
              const opBlocked = opPct < 80 || missingCritical.length > 0;
              const otherGroups = [
                { title: "Emocional", data: checklistProgress.emocional },
                { title: "Rotina", data: checklistProgress.rotina },
                { title: "Racional", data: checklistProgress.racional },
              ];
              const otherInvalid = otherGroups.some((g) => g.data.percentage < 50);
              const blocked = opBlocked || otherInvalid;

              return (
                <div className="space-y-3">
                  {/* Score de Execução (Operacional) */}
                  <div
                    className={`p-4 rounded-lg border-2 ${
                      blocked
                        ? "bg-destructive/10 border-destructive/40"
                        : "bg-success/10 border-success/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <span className="text-sm font-bold flex items-center gap-2">
                        {blocked ? "🔴 TRADE BLOQUEADO" : "🟢 TRADE PERMITIDO"}
                      </span>
                      <Badge className={`${score.colorClass} text-xs`}>
                        {score.emoji} {score.label} — {opPct}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      <span className="font-semibold">Operacional:</span>{" "}
                      {checklistProgress.operacional.checked}/
                      {checklistProgress.operacional.total} • mínimo 80% + itens críticos
                    </p>
                    {missingCritical.length > 0 && (
                      <p className="text-xs text-destructive font-semibold">
                        ⚠️ Faltando: {missingCritical.map((k) => labelMap[k]).join(", ")}
                      </p>
                    )}
                    <div className="mt-2 grid sm:grid-cols-3 gap-2">
                      {otherGroups.map((group) => (
                        <p
                          key={group.title}
                          className={`text-xs ${
                            group.data.percentage < 50 ? "text-destructive" : "text-foreground/80"
                          }`}
                        >
                          • <span className="font-semibold">{group.title}:</span>{" "}
                          {group.data.checked}/{group.data.total} ({group.data.percentage}%)
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            <Button
              onClick={handleAddTrade}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {editingId ? "Atualizar Trade" : "Registrar Trade"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Buttons */}
      {trades.length > 0 && (
        <div className="grid md:grid-cols-2 gap-3">
          <Button
            onClick={() => {
              const headers = ['Data', 'Ativo', 'Entrada', 'Saída', 'Resultado ($)', 'Sessão', 'Status', 'Notas'];
              const data = trades.map(t => [
                t.date, t.asset, t.entryPrice, t.exitPrice,
                t.moneyResult || 0,
                t.session || '',
                t.result === "WIN" ? "Vitória" : t.result === "LOSS" ? "Derrota" : "Empate",
                t.notes || '',
              ]);
              const wins = trades.filter(t => t.result === 'WIN').length;
              const losses = trades.filter(t => t.result === 'LOSS').length;
              const total = data.reduce((s, r) => s + (Number(r[4]) || 0), 0);
              exportToCSVFile(
                `trades_${new Date().toISOString().split('T')[0]}.csv`,
                headers,
                data,
                [
                  ['RESUMO'],
                  ['Total Trades', String(trades.length), 'Vitórias', String(wins), 'Derrotas', String(losses), 'Resultado', `$${total.toFixed(2)}`],
                ]
              );
              toast.success("Trades exportados em CSV com sucesso!");
            }}
            variant="outline"
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar em CSV
          </Button>
          <Button
            onClick={() => {
              const tradesForExport = trades.map(t => ({
                date: t.date,
                asset: t.asset,
                timeframe: t.account,
                entryPrice: t.entryPrice,
                stopLoss: t.stopLoss,
                takeProfit: t.takeProfit,
                exitPrice: t.exitPrice,
                resultValue: t.moneyResult || 0,
                resultPercent: 0,
                session: t.session,
                status:
                  t.result === "WIN"
                    ? "Vitória"
                    : t.result === "LOSS"
                      ? "Derrota"
                      : "Empate",
                notes: t.notes,
              }));
              exportTradesToExcel(tradesForExport);
              toast.success("Trades exportados em Excel com sucesso!");
            }}
            variant="outline"
            className="w-full"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Exportar em Excel
          </Button>
        </div>
      )}

      {/* Trades List */}
      <div className="space-y-3">
        {trades.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Nenhum trade registrado ainda. Comece a registrar seus trades!
            </CardContent>
          </Card>
        ) : (
          (() => {
            const totalPages = Math.max(1, Math.ceil(trades.length / PAGE_SIZE));
            const safePage = Math.min(currentPage, totalPages);
            const start = (safePage - 1) * PAGE_SIZE;
            const paginatedTrades = trades.slice(start, start + PAGE_SIZE);
            return paginatedTrades.map(trade => (
            <Card
              key={trade.id}
              className={
                trade.result === "WIN"
                  ? "border-green-200 bg-green-50"
                  : trade.result === "LOSS"
                    ? "border-red-200 bg-red-50"
                    : "border-gray-200"
              }
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <p className="font-bold text-foreground">{trade.asset}</p>
                      <Badge
                        className={
                          trade.result === "WIN"
                            ? "bg-green-600"
                            : trade.result === "LOSS"
                              ? "bg-red-600"
                              : "bg-gray-600"
                        }
                      >
                        {trade.result === "WIN"
                          ? "✓ Vitória"
                          : trade.result === "LOSS"
                            ? "✗ Derrota"
                            : "= Empate"}
                      </Badge>
                      {trade.session && (
                        <Badge variant="outline" className="text-xs">
                          {trade.session === "Manha"
                            ? "🌅 Manhã"
                            : trade.session === "Tarde"
                              ? "☀️ Tarde"
                              : "🌙 Noite"}
                        </Badge>
                      )}
                      {trade.marketSession && (
                        <Badge className="text-xs bg-purple-600 text-white">
                          {trade.marketSession === "NY"
                            ? "🗽 NY"
                            : trade.marketSession === "Londres"
                              ? "🇬🇧 Londres"
                              : trade.marketSession === "Ásia"
                                ? "🌏 Ásia"
                                : trade.marketSession === "Sobreposição"
                                  ? "🔄 Sobreposição"
                                  : "❌ Fechado"}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {trade.date}
                      </span>
                      {trade.entryTime && (
                        <span className="text-xs text-muted-foreground">
                          {trade.entryTime}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Entrada: {trade.entryPrice} → Saída: {trade.exitPrice}
                    </p>

                    {/* Checklists */}
                    <div className="grid md:grid-cols-4 gap-3 text-xs">
                      <div className="bg-card p-2 rounded border border-purple-200 dark:border-purple-800">
                        <p className="font-semibold text-purple-900 dark:text-purple-200 mb-1 flex items-center justify-between gap-2">
                          <span>⚠️ Operacional:</span>
                          {(() => {
                            const real = opChecklist.items.filter((i) => !isSectionItem(i));
                            const marked = real.filter((i) => (trade.operational as any)?.[i.key] === true).length;
                            const pct = real.length === 0 ? 0 : Math.round((marked / real.length) * 100);
                            const score = getExecutionScore(pct);
                            return (
                              <Badge className={`text-[10px] ${score.colorClass}`}>
                                {score.emoji} {pct}%
                              </Badge>
                            );
                          })()}
                        </p>
                        {(() => {
                          const real = opChecklist.items.filter((i) => !isSectionItem(i));
                          const marked = real.filter((i) => (trade.operational as any)?.[i.key] === true).length;
                          return (
                            <p className="text-muted-foreground">
                              {marked}/{real.length} itens marcados
                            </p>
                          );
                        })()}
                      </div>
                      <div className="bg-white p-2 rounded border border-red-200">
                        <p className="font-semibold text-red-900 mb-1">
                          ❤️ Emocional:
                        </p>
                        <p>
                          {trade.emotional.hydration ? "✓" : "✗"} Preparação
                          Mental
                        </p>
                        <p>
                          {trade.emotional.breathing ? "✓" : "✗"} Estabilidade
                          Emocional
                        </p>
                        <p>
                          {trade.emotional.mentalClarity ? "✓" : "✗"} Confiança
                          no Plano
                        </p>
                      </div>
                      <div className="bg-white p-2 rounded border border-blue-200">
                        <p className="font-semibold text-blue-900 mb-1">
                          📋 Rotina Operacional:
                        </p>
                        {trade.routine && (
                          <>
                            <p>
                              {trade.routine.nightAnalysis ? "✓" : "✗"} Análise Noturna
                            </p>
                            <p>
                              {trade.routine.morningReview ? "✓" : "✗"} Revisão Manhã
                            </p>
                            <p>
                              {trade.routine.regionsValidated ? "✓" : "✗"} Regiões Validadas
                            </p>
                            <p>{trade.routine.sleep ? "✓" : "✗"} Sono</p>
                          </>
                        )}
                      </div>
                      <div className="bg-white p-2 rounded border border-green-200">
                        <p className="font-semibold text-green-900 mb-1">
                          🧠 Racional:
                        </p>
                        <p>
                          {trade.rational.analysisConfirmed ? "✓" : "✗"} Análise
                        </p>
                        <p>{trade.rational.planRespected ? "✓" : "✗"} Plano</p>
                        <p>{trade.rational.riskManaged ? "✓" : "✗"} Risco</p>
                      </div>
                    </div>

                    {trade.notes && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        "{trade.notes}"
                      </p>
                    )}

                    {/* Image Buttons */}
                    {(trade.preTradeImage ||
                      trade.tradingImage ||
                      trade.postTradeImage) && (
                      <div className="flex gap-2 mt-3">
                        {trade.preTradeImage && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedImage({
                                url: trade.preTradeImage!,
                                title: "Pré-Trading",
                              });
                              setImageViewerOpen(true);
                            }}
                          >
                            📸 Pré
                          </Button>
                        )}
                        {trade.tradingImage && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedImage({
                                url: trade.tradingImage!,
                                title: "Durante Trading",
                              });
                              setImageViewerOpen(true);
                            }}
                          >
                            📸 Durante
                          </Button>
                        )}
                        {trade.postTradeImage && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedImage({
                                url: trade.postTradeImage!,
                                title: "Pós-Trading",
                              });
                              setImageViewerOpen(true);
                            }}
                          >
                            📸 Pós
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant={trade.isFavorite ? "default" : "outline"}
                      onClick={() => {
                        toggleFavoriteUnified(trade.id);
                      }}
                      title={
                        trade.isFavorite
                          ? "Remover dos favoritos"
                          : "Adicionar aos favoritos"
                      }
                    >
                      {trade.isFavorite ? "⭐" : "☆"}
                    </Button>
                    {(trade.preTradeImage ||
                      trade.tradingImage ||
                      trade.postTradeImage) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTradeForGallery(trade);
                          setGalleryOpen(true);
                        }}
                        title="Ver galeria de imagens"
                      >
                        <Image className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExportTradePDF(trade)}
                      title="Exportar trade em PDF"
                    >
                      <FileDown className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditTrade(trade)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTrade(trade.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            ));
          })()
        )}
        {trades.length > PAGE_SIZE && (
          <div className="flex items-center justify-between gap-2 pt-3">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span className="text-xs text-muted-foreground">
              Página {Math.min(currentPage, Math.ceil(trades.length / PAGE_SIZE))} de{" "}
              {Math.ceil(trades.length / PAGE_SIZE)} • {trades.length} trades
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage >= Math.ceil(trades.length / PAGE_SIZE)}
              onClick={() =>
                setCurrentPage(p => Math.min(Math.ceil(trades.length / PAGE_SIZE), p + 1))
              }
            >
              Próxima
            </Button>
          </div>
        )}
      </div>

      {/* Image Viewer */}
      {selectedImage && imageViewerOpen && (
        <SimpleImageViewer
          imageUrl={selectedImage.url}
          onClose={() => {
            setImageViewerOpen(false);
            setSelectedImage(null);
          }}
        />
      )}

      {/* Trade Image Gallery */}
      {galleryOpen && selectedTradeForGallery && (
        <TradeImageGallery
          preImage={selectedTradeForGallery.preTradeImage}
          duringImage={selectedTradeForGallery.tradingImage}
          postImage={selectedTradeForGallery.postTradeImage}
          onClose={() => {
            setGalleryOpen(false);
            setSelectedTradeForGallery(null);
          }}
        />
      )}
    </div>
  );
}
