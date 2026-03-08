"use client";
import { useState, useEffect, useRef } from "react";
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
import { useTradeJournal } from "@/hooks/useTradeJournal";
import { useTradeJournalUnified } from "@/hooks/useTradeJournalUnified";
import { useAccountManager } from "@/hooks/useAccountManager";
import { Plus, Trash2, Edit2, Image, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { useTradeAlerts } from "@/hooks/useTradeAlerts";
import { useExportTrades } from "@/hooks/useExportTrades";
import {
  useMarketSession,
  formatMarketSession,
  parseTimeString,
} from "@/hooks/useMarketSession";
import { Download } from "lucide-react";
import { exportTradesToExcel } from "@/lib/excelExporter";
import { SimpleImageViewer } from "./SimpleImageViewer";
import { TradeImageGallery } from "./TradeImageGallery";

interface TradeWithChecklist {
  id: string;
  date: string;
  entryTime?: string;
  asset: string;
  entryPrice: string;
  exitPrice: string;
  stopLoss: string;
  takeProfit: string;
  resultPrice: string;
  session: "Manha" | "Tarde" | "Noite" | "";
  marketSession?: "NY" | "Londres" | "Ásia" | "Sobreposição" | "Fechado";
  account: string;
  result: "WIN" | "LOSS" | "BREAK_EVEN" | "ONGOING";
  riskReward?: number;
  moneyResult?: number;
  notes: string;
  isFavorite: boolean;
  operational: {
    chochValidoHTF: boolean;
    caixaGannTracada: boolean;
    regiaoDescontada50: boolean;
    orderBlockIdentificado: boolean;
    entrada50OB: boolean;
    stopRiskManagement: boolean;
    tempoGraficoOperacional: boolean;
  };
  emotional: {
    hydration: boolean;
    breathing: boolean;
    mentalClarity: boolean;
  };
  routine: {
    hydration: boolean;
    breathing: boolean;
    sleep: boolean;
    meditation: boolean;
  };
  rational: {
    analysisConfirmed: boolean;
    planRespected: boolean;
    riskManaged: boolean;
  };
  preTradeImage?: string;
  tradingImage?: string;
  postTradeImage?: string;
  createdAt: number;
}

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
  const { exportToCSV } = useExportTrades();
  const { trades, isLoaded, addTrade: addTradeUnified, updateTrade: updateTradeUnified, deleteTrade: deleteTradeUnified, toggleFavorite: toggleFavoriteUnified } = useTradeJournalUnified(activeAccountId);

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
    operational: {
      chochValidoHTF: false,
      caixaGannTracada: false,
      regiaoDescontada50: false,
      orderBlockIdentificado: false,
      entrada50OB: false,
      stopRiskManagement: false,
      tempoGraficoOperacional: false,
    },
    emotional: {
      hydration: false,
      breathing: false,
      mentalClarity: false,
    },
    routine: {
      hydration: false,
      breathing: false,
      sleep: false,
      meditation: false,
    },
    rational: {
      analysisConfirmed: false,
      planRespected: false,
      riskManaged: false,
    },
    preTradeImage: "",
    tradingImage: "",
    postTradeImage: "",
  });

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

  const handleAddTrade = () => {
    // Validar entrada e saída (saída é opcional para trades em andamento)
    if (!formData.entryPrice) {
      toast.error("Preencha o preço de entrada!");
      return;
    }
    if (formData.result !== "ONGOING" && !formData.exitPrice) {
      toast.error("Preencha o preço de saída ou selecione 'Em Andamento'!");
      return;
    }

    // Validar checklist operacional completo
    const operationalItems = Object.values(formData.operational);
    const allOperationalComplete = operationalItems.every(
      item => item === true
    );

    if (!allOperationalComplete) {
      const incompleteCount = operationalItems.filter(
        item => item === false
      ).length;
      toast.error(
        `Checklist Operacional incompleto: ${incompleteCount} item(ns) faltando`
      );
      return;
    }

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
      createdAt: editingId
        ? trades.find(t => t.id === editingId)?.createdAt || Date.now()
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

    // Verificar limite diario POR CONTA: 2 vitorias ou 3 perdas na conta especifica
    const today = new Date().toISOString().split("T")[0];
    const todaysTrades = [...trades, newTrade].filter(
      t => t.date === today && t.account === formData.account
    );
    const wins = todaysTrades.filter(t => t.result === "WIN").length;
    const losses = todaysTrades.filter(t => t.result === "LOSS").length;

    if (wins >= 2 || losses >= 3) {
      showDailyLimitAlert(wins, losses);
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
      operational: trade.operational,
      emotional: trade.emotional,
      routine: trade.routine || {
        hydration: false,
        breathing: false,
        sleep: false,
        meditation: false,
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
      operational: {
        chochValidoHTF: false,
        caixaGannTracada: false,
        regiaoDescontada50: false,
        orderBlockIdentificado: false,
        entrada50OB: false,
        stopRiskManagement: false,
        tempoGraficoOperacional: false,
      },
      emotional: {
        hydration: false,
        breathing: false,
        mentalClarity: false,
      },
      routine: {
        hydration: false,
        breathing: false,
        sleep: false,
        meditation: false,
      },
      rational: {
        analysisConfirmed: false,
        planRespected: false,
        riskManaged: false,
      },
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
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="w-full bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Registrar Novo Trade
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
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = event => {
                          setFormData({
                            ...formData,
                            preTradeImage: event.target?.result as string,
                          });
                        };
                        reader.readAsDataURL(file);
                      }
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
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = event => {
                          setFormData({
                            ...formData,
                            tradingImage: event.target?.result as string,
                          });
                        };
                        reader.readAsDataURL(file);
                      }
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
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = event => {
                          setFormData({
                            ...formData,
                            postTradeImage: event.target?.result as string,
                          });
                        };
                        reader.readAsDataURL(file);
                      }
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

            {/* Operational Checklist - OBRIGATORIO */}
            <div className="space-y-3 bg-purple-50 p-4 rounded-lg border-2 border-purple-500">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                <h3 className="font-bold text-purple-900">
                  Checklist Operacional (OBRIGATORIO)
                </h3>
              </div>
              <p className="text-xs text-purple-800 font-semibold">
                Todos os itens abaixo DEVEM estar marcados para executar o trade
              </p>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="chochValidoHTF"
                  checked={formData.operational.chochValidoHTF}
                  onCheckedChange={checked =>
                    setFormData({
                      ...formData,
                      operational: {
                        ...formData.operational,
                        chochValidoHTF: checked as boolean,
                      },
                    })
                  }
                />
                <Label
                  htmlFor="chochValidoHTF"
                  className="text-sm text-purple-900 cursor-pointer"
                >
                  📊 CHoCH válido em HTF (H4, H2 ou H1): Identificar um Change
                  of Character válido em timeframes superiores
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="caixaGannTracada"
                  checked={formData.operational.caixaGannTracada}
                  onCheckedChange={checked =>
                    setFormData({
                      ...formData,
                      operational: {
                        ...formData.operational,
                        caixaGannTracada: checked as boolean,
                      },
                    })
                  }
                />
                <Label
                  htmlFor="caixaGannTracada"
                  className="text-sm text-purple-900 cursor-pointer"
                >
                  📦 Caixa de Gann em M30: Traçar do início do show até o fim do
                  CHoCH (High até Low para vendas, Low até High para compras)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="regiaoDescontada50"
                  checked={formData.operational.regiaoDescontada50}
                  onCheckedChange={checked =>
                    setFormData({
                      ...formData,
                      operational: {
                        ...formData.operational,
                        regiaoDescontada50: checked as boolean,
                      },
                    })
                  }
                />
                <Label
                  htmlFor="regiaoDescontada50"
                  className="text-sm text-purple-900 cursor-pointer"
                >
                  📉 Order Blocks abaixo da Gann (50% para compra) ou acima (50%
                  para venda): Apenas Order Blocks válidos em regiões
                  descontadas
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="orderBlockIdentificado"
                  checked={formData.operational.orderBlockIdentificado}
                  onCheckedChange={checked =>
                    setFormData({
                      ...formData,
                      operational: {
                        ...formData.operational,
                        orderBlockIdentificado: checked as boolean,
                      },
                    })
                  }
                />
                <Label
                  htmlFor="orderBlockIdentificado"
                  className="text-sm text-purple-900 cursor-pointer"
                >
                  🎯 Order Blocks de HTF (H4, H2, H1 ou M30): Identificar Order
                  Blocks válidos em timeframes superiores
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="entrada50OB"
                  checked={formData.operational.entrada50OB}
                  onCheckedChange={checked =>
                    setFormData({
                      ...formData,
                      operational: {
                        ...formData.operational,
                        entrada50OB: checked as boolean,
                      },
                    })
                  }
                />
                <Label
                  htmlFor="entrada50OB"
                  className="text-sm text-purple-900 cursor-pointer"
                >
                  💰 Entrada nos 50% do Order Block de HTF: Venda ou compra
                  apenas nos 50% do Order Block (mínimo M30)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="stopRiskManagement"
                  checked={formData.operational.stopRiskManagement}
                  onCheckedChange={checked =>
                    setFormData({
                      ...formData,
                      operational: {
                        ...formData.operational,
                        stopRiskManagement: checked as boolean,
                      },
                    })
                  }
                />
                <Label
                  htmlFor="stopRiskManagement"
                  className="text-sm text-purple-900 cursor-pointer"
                >
                  🛑 Stop Loss e Take Profit 1:3: Stop abaixo/acima do Order
                  Block de HTF (mínimo M30), Take Profit sempre 1:3 no mínimo
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tempoGraficoOperacional"
                  checked={formData.operational.tempoGraficoOperacional}
                  onCheckedChange={checked =>
                    setFormData({
                      ...formData,
                      operational: {
                        ...formData.operational,
                        tempoGraficoOperacional: checked as boolean,
                      },
                    })
                  }
                />
                <Label
                  htmlFor="tempoGraficoOperacional"
                  className="text-sm text-purple-900 cursor-pointer"
                >
                  ⏱️ Tempo Gráfico Operacional em M15 ou M5: Confirmar entrada
                  em timeframe operacional
                </Label>
              </div>
            </div>

            {/* Emotional Checklist - 3 Essential Questions */}
            <div className="space-y-3 bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center gap-2">
                <span className="text-2xl">❤️</span>
                <h3 className="font-bold text-red-900">
                  Checklist Emocional (3 Perguntas Essenciais)
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hydration"
                  checked={formData.emotional.hydration}
                  onCheckedChange={checked =>
                    setFormData({
                      ...formData,
                      emotional: {
                        ...formData.emotional,
                        hydration: checked as boolean,
                      },
                    })
                  }
                />
                <Label
                  htmlFor="hydration"
                  className="text-sm text-red-900 cursor-pointer font-semibold"
                >
                  ❓ Estou mentalmente preparado para fazer este trade?
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="breathing"
                  checked={formData.emotional.breathing}
                  onCheckedChange={checked =>
                    setFormData({
                      ...formData,
                      emotional: {
                        ...formData.emotional,
                        breathing: checked as boolean,
                      },
                    })
                  }
                />
                <Label
                  htmlFor="breathing"
                  className="text-sm text-red-900 cursor-pointer font-semibold"
                >
                  ❓ Estou emocionalmente estável neste momento?
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mentalClarity"
                  checked={formData.emotional.mentalClarity}
                  onCheckedChange={checked =>
                    setFormData({
                      ...formData,
                      emotional: {
                        ...formData.emotional,
                        mentalClarity: checked as boolean,
                      },
                    })
                  }
                />
                <Label
                  htmlFor="mentalClarity"
                  className="text-sm text-red-900 cursor-pointer font-semibold"
                >
                  ❓ Tenho confiança no meu plano de trading?
                </Label>
              </div>
            </div>

            {/* Routine and Health Checklist */}
            <div className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏃</span>
                <h3 className="font-bold text-blue-900">
                  Checklist Rotina e Saúde
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hydrationRoutine"
                  checked={formData.routine.hydration}
                  onCheckedChange={checked =>
                    setFormData({
                      ...formData,
                      routine: {
                        ...formData.routine,
                        hydration: checked as boolean,
                      },
                    })
                  }
                />
                <Label
                  htmlFor="hydrationRoutine"
                  className="text-sm text-blue-900 cursor-pointer"
                >
                  💧 Bebi água e estou hidratado
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="breathingRoutine"
                  checked={formData.routine.breathing}
                  onCheckedChange={checked =>
                    setFormData({
                      ...formData,
                      routine: {
                        ...formData.routine,
                        breathing: checked as boolean,
                      },
                    })
                  }
                />
                <Label
                  htmlFor="breathingRoutine"
                  className="text-sm text-blue-900 cursor-pointer"
                >
                  🧘 Respirei profundamente e relaxei
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sleepRoutine"
                  checked={formData.routine.sleep}
                  onCheckedChange={checked =>
                    setFormData({
                      ...formData,
                      routine: {
                        ...formData.routine,
                        sleep: checked as boolean,
                      },
                    })
                  }
                />
                <Label
                  htmlFor="sleepRoutine"
                  className="text-sm text-blue-900 cursor-pointer"
                >
                  😴 Dormi bem e estou descansado
                </Label>
              </div>
            </div>

            {/* Rational Checklist */}
            <div className="space-y-3 bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🧠</span>
                <h3 className="font-bold text-green-900">
                  Checklist Racional (Análise e Plano)
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="analysisConfirmed"
                  checked={formData.rational.analysisConfirmed}
                  onCheckedChange={checked =>
                    setFormData({
                      ...formData,
                      rational: {
                        ...formData.rational,
                        analysisConfirmed: checked as boolean,
                      },
                    })
                  }
                />
                <Label
                  htmlFor="analysisConfirmed"
                  className="text-sm text-green-900 cursor-pointer"
                >
                  ✅ Confirmei a análise técnica
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="planRespected"
                  checked={formData.rational.planRespected}
                  onCheckedChange={checked =>
                    setFormData({
                      ...formData,
                      rational: {
                        ...formData.rational,
                        planRespected: checked as boolean,
                      },
                    })
                  }
                />
                <Label
                  htmlFor="planRespected"
                  className="text-sm text-green-900 cursor-pointer"
                >
                  📋 Respeitei o plano operacional
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="riskManaged"
                  checked={formData.rational.riskManaged}
                  onCheckedChange={checked =>
                    setFormData({
                      ...formData,
                      rational: {
                        ...formData.rational,
                        riskManaged: checked as boolean,
                      },
                    })
                  }
                />
                <Label
                  htmlFor="riskManaged"
                  className="text-sm text-green-900 cursor-pointer"
                >
                  🛡️ Gerenciei o risco corretamente
                </Label>
              </div>
            </div>

            {/* Validation Warning */}
            {(() => {
              const operationalItems = Object.entries(formData.operational);
              const emotionalItems = Object.entries(formData.emotional);
              const rationalItems = Object.entries(formData.rational);

              const allOperational = operationalItems.every(([_, v]) => v);
              const allEmotional = emotionalItems.every(([_, v]) => v);
              const allRational = rationalItems.every(([_, v]) => v);
              const allComplete = allOperational && allEmotional && allRational;

              const incompleteOperational = operationalItems.filter(
                ([_, v]) => !v
              ).length;
              const incompleteEmotional = emotionalItems.filter(
                ([_, v]) => !v
              ).length;
              const incompleteRational = rationalItems.filter(
                ([_, v]) => !v
              ).length;

              if (!allComplete) {
                return (
                  <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300 space-y-2">
                    <p className="text-sm text-red-900 font-bold">
                      🔴 Checklist Incompleto - Não é possível registrar o trade
                    </p>
                    {!allOperational && (
                      <p className="text-xs text-red-800">
                        • <span className="font-semibold">Operacional:</span>{" "}
                        {incompleteOperational} item(ns) faltando
                      </p>
                    )}
                    {!allEmotional && (
                      <p className="text-xs text-red-800">
                        • <span className="font-semibold">Emocional:</span>{" "}
                        {incompleteEmotional} item(ns) faltando
                      </p>
                    )}
                    {!allRational && (
                      <p className="text-xs text-red-800">
                        • <span className="font-semibold">Racional:</span>{" "}
                        {incompleteRational} item(ns) faltando
                      </p>
                    )}
                  </div>
                );
              }
              return (
                <div className="bg-green-50 p-3 rounded-lg border-2 border-green-300">
                  <p className="text-sm text-green-900 font-semibold">
                    ✅ Todos os checklists foram completados! Pronto para
                    registrar.
                  </p>
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
              const tradesForExport = trades.map(t => ({
                id: t.id,
                date: t.date,
                asset: t.asset,
                entry: parseFloat(t.entryPrice),
                exit: parseFloat(t.exitPrice),
                result: (t.result === "WIN"
                  ? "Vitória"
                  : t.result === "LOSS"
                    ? "Derrota"
                    : "Empate") as "Vitória" | "Derrota" | "Empate",
                notes: t.notes,
              }));
              exportToCSV(tradesForExport);
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
          trades.map(trade => (
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
                      <div className="bg-white p-2 rounded border border-purple-200">
                        <p className="font-semibold text-purple-900 mb-1">
                          ⚠️ Operacional:
                        </p>
                        {trade.operational && (
                          <>
                            <p>
                              {trade.operational.chochValidoHTF ? "✓" : "✗"}{" "}
                              CHoCH HTF
                            </p>
                            <p>
                              {trade.operational.caixaGannTracada ? "✓" : "✗"}{" "}
                              Gann
                            </p>
                            <p>
                              {trade.operational.regiaoDescontada50 ? "✓" : "✗"}{" "}
                              Região 50%
                            </p>
                            <p>
                              {trade.operational.orderBlockIdentificado
                                ? "✓"
                                : "✗"}{" "}
                              OB HTF
                            </p>
                            <p>
                              {trade.operational.entrada50OB ? "✓" : "✗"}{" "}
                              Entrada 50%
                            </p>
                            <p>
                              {trade.operational.stopRiskManagement ? "✓" : "✗"}{" "}
                              Stop/TP
                            </p>
                            <p>
                              {trade.operational.tempoGraficoOperacional
                                ? "✓"
                                : "✗"}{" "}
                              Tempo Gráfico
                            </p>
                          </>
                        )}
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
                          🏃 Rotina e Saúde:
                        </p>
                        {trade.routine && (
                          <>
                            <p>
                              {trade.routine.hydration ? "✓" : "✗"} Hidratação
                            </p>
                            <p>
                              {trade.routine.breathing ? "✓" : "✗"} Respiração
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
          ))
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
