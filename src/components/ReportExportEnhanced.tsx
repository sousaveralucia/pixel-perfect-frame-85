import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, FileText, AlertCircle, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { exportCompleteReportToExcel } from "@/lib/excelExporter";
import { useAccountManager } from "@/hooks/useAccountManager";

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

interface ReportExportEnhancedProps {
  trades: TradeWithChecklist[];
}

export default function ReportExportEnhanced({ trades }: ReportExportEnhancedProps) {
  const { getActiveAccount, accounts } = useAccountManager();
  const [filterAccount, setFilterAccount] = useState<string>("all");
  const [filterAsset, setFilterAsset] = useState<string>("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const allAssets = ["EUR/USD", "USDJPY", "XAUUSD", "NASDAQ", "BTC USD"];
  const allAccounts = accounts.map(a => a.name);
  const activeAccount = getActiveAccount();
  const initialBalance = activeAccount?.initialBalance ?? 0;

  // Filtrar trades
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      const accountMatch = filterAccount === "all" || t.account === filterAccount;
      const assetMatch = filterAsset === "all" || t.asset === filterAsset;
      return accountMatch && assetMatch;
    });
  }, [trades, filterAccount, filterAsset]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const wins = filteredTrades.filter((t) => t.result === "WIN").length;
    const losses = filteredTrades.filter((t) => t.result === "LOSS").length;
    const breakEven = filteredTrades.filter((t) => t.result === "BREAK_EVEN").length;
    
    // Calcular P&L baseado em moneyResult (resultado final em dólares)
    const totalPnL = filteredTrades.reduce((sum, t) => {
      const moneyResult = parseFloat(t.moneyResult?.toString() || "0") || 0;
      return sum + moneyResult;
    }, 0);

    const pnlPercentage = initialBalance > 0 ? ((totalPnL / initialBalance) * 100) : 0;

    return {
      total: filteredTrades.length,
      wins,
      losses,
      breakEven,
      winRate: filteredTrades.length > 0 ? ((wins / filteredTrades.length) * 100).toFixed(1) : 0,
      totalPnL: totalPnL.toFixed(2),
      pnlPercentage: pnlPercentage.toFixed(1),
      avgPnL: filteredTrades.length > 0 ? (totalPnL / filteredTrades.length).toFixed(2) : 0,
    };
  }, [filteredTrades, initialBalance]);

  const generatePDFReport = async () => {
    if (filteredTrades.length === 0) {
      toast.error("Nenhum trade para exportar com os filtros selecionados");
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
        accent: [59, 130, 246] as [number, number, number],
        green: [34, 197, 94] as [number, number, number],
        red: [239, 68, 68] as [number, number, number],
        gray: [148, 163, 184] as [number, number, number],
        lightBg: [241, 245, 249] as [number, number, number],
        white: [255, 255, 255] as [number, number, number],
      };

      const checkPage = (need: number) => {
        if (y + need > ph - 10) { doc.addPage(); y = 14; }
      };

      const secTitle = (title: string, color: [number, number, number]) => {
        checkPage(14);
        doc.setFillColor(...color);
        doc.rect(m, y, 2.5, 6, "F");
        doc.setTextColor(...co.primary);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(title, m + 5, y + 4.5);
        y += 9;
      };

      const addFooter = () => {
        doc.setTextColor(...co.gray);
        doc.setFontSize(6);
        doc.setFont("helvetica", "normal");
        doc.text("Relatorio confidencial  |  Trading Dashboard", pw / 2, ph - 5, { align: "center" });
      };

      // ========== PAGE 1: HEADER + SUMMARY + TABLE ==========

      // Header bar
      doc.setFillColor(...co.primary);
      doc.rect(0, 0, pw, 28, "F");
      doc.setFillColor(...co.accent);
      doc.rect(0, 28, pw, 2, "F");

      doc.setTextColor(...co.white);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("RELATORIO DE TRADES", m, 12);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const subtitle = `${new Date().toLocaleDateString("pt-BR")}  |  ${filterAccount !== "all" ? filterAccount : "Todas as Contas"}  |  ${filterAsset !== "all" ? filterAsset : "Todos os Ativos"}`;
      doc.text(subtitle, m, 22);

      // Win rate badge
      doc.setFillColor(...(parseFloat(String(stats.winRate)) >= 50 ? co.green : co.red));
      const wrText = `${stats.winRate}%`;
      const bw = doc.getTextWidth(wrText) * 2 + 12;
      doc.roundedRect(pw - m - bw, 6, bw, 16, 3, 3, "F");
      doc.setTextColor(...co.white);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(wrText, pw - m - bw / 2, 17, { align: "center" });

      y = 36;

      // === SUMMARY CARDS (2 rows of 3) ===
      const cardW = (pw - 2 * m - 8) / 3;
      const cardH = 16;
      const summaryCards = [
        { label: "Total Trades", value: String(stats.total), color: co.accent },
        { label: "Vitorias", value: String(stats.wins), color: co.green },
        { label: "Derrotas", value: String(stats.losses), color: co.red },
        { label: "P&L Total", value: `$${stats.totalPnL}`, color: parseFloat(stats.totalPnL) >= 0 ? co.green : co.red },
        { label: "Retorno", value: `${stats.pnlPercentage}%`, color: parseFloat(stats.pnlPercentage) >= 0 ? co.green : co.red },
        { label: "P&L Medio", value: `$${stats.avgPnL}`, color: co.accent },
      ];

      summaryCards.forEach((card, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const cx = m + col * (cardW + 4);
        const cy = y + row * (cardH + 3);

        doc.setFillColor(...co.lightBg);
        doc.roundedRect(cx, cy, cardW, cardH, 2, 2, "F");
        doc.setFillColor(...card.color);
        doc.rect(cx, cy, 2.5, cardH, "F");

        doc.setTextColor(...co.gray);
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        doc.text(card.label, cx + 6, cy + 5.5);
        doc.setTextColor(...card.color);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(card.value, cx + 6, cy + 12.5);
      });

      y += 2 * (cardH + 3) + 6;

      // === TRADES TABLE ===
      secTitle("Historico de Trades", co.accent);

      const colWidths = [18, 16, 12, 16, 14, 14, 16, 10, 16, 14];
      const headers = ["Data", "Ativo", "Hora", "Entrada", "SL", "TP", "Saida", "R:R", "Resultado", "Status"];
      const tableW = colWidths.reduce((a, b) => a + b, 0);

      // Table header
      doc.setFillColor(...co.primary);
      doc.rect(m, y - 3, tableW, 7, "F");
      doc.setTextColor(...co.white);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      let xPos = m;
      headers.forEach((h, i) => {
        doc.text(h, xPos + 1.5, y + 1);
        xPos += colWidths[i];
      });
      y += 6;

      // Table rows
      doc.setFontSize(6.5);
      filteredTrades.forEach((trade, idx) => {
        checkPage(6);
        if (idx % 2 === 0) {
          doc.setFillColor(...co.lightBg);
          doc.rect(m, y - 3, tableW, 5.5, "F");
        }

        const moneyResult = parseFloat(trade.moneyResult?.toString() || "0") || 0;
        const rowData = [
          trade.date || "-",
          trade.asset || "-",
          trade.entryTime || "-",
          trade.entryPrice || "-",
          trade.stopLoss || "-",
          trade.takeProfit || "-",
          trade.exitPrice || "-",
          trade.riskReward ? `${trade.riskReward}:1` : "-",
          `$${moneyResult.toFixed(2)}`,
          trade.result === "WIN" ? "WIN" : trade.result === "LOSS" ? "LOSS" : "BE",
        ];

        xPos = m;
        rowData.forEach((d, i) => {
          // Color the status column
          if (i === rowData.length - 1) {
            doc.setTextColor(...(d === "WIN" ? co.green : d === "LOSS" ? co.red : co.gray));
            doc.setFont("helvetica", "bold");
          } else {
            doc.setTextColor(...co.primary);
            doc.setFont("helvetica", "normal");
          }
          doc.text(d, xPos + 1.5, y + 0.5);
          xPos += colWidths[i];
        });
        y += 5.5;
      });

      y += 6;

      // === CHECKLIST ANALYSIS ===
      secTitle("Analise de Checklists (Losses)", co.red);

      const lossesWithMissing = filteredTrades.filter((t) => t.result === "LOSS");
      const missing = { operational: 0, emotional: 0, routine: 0, rational: 0 };
      lossesWithMissing.forEach((trade) => {
        if (trade.operational && Object.values(trade.operational).some((v) => !v)) missing.operational++;
        if (trade.emotional && Object.values(trade.emotional).some((v) => !v)) missing.emotional++;
        if (trade.routine && Object.values(trade.routine).some((v) => !v)) missing.routine++;
        if (trade.rational && Object.values(trade.rational).some((v) => !v)) missing.rational++;
      });

      const chkCards = [
        { label: "Operacional", val: missing.operational, total: lossesWithMissing.length },
        { label: "Emocional", val: missing.emotional, total: lossesWithMissing.length },
        { label: "Rotina", val: missing.routine, total: lossesWithMissing.length },
        { label: "Racional", val: missing.rational, total: lossesWithMissing.length },
      ];
      const chkW = (pw - 2 * m - 12) / 4;
      chkCards.forEach((card, i) => {
        const cx = m + i * (chkW + 4);
        doc.setFillColor(...co.lightBg);
        doc.roundedRect(cx, y, chkW, 14, 2, 2, "F");
        doc.setTextColor(...co.gray);
        doc.setFontSize(6);
        doc.setFont("helvetica", "normal");
        doc.text(card.label, cx + 3, y + 5);
        doc.setTextColor(...co.red);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(`${card.val}/${card.total}`, cx + 3, y + 11.5);
      });
      y += 20;

      // === OBSERVACOES (lined area) ===
      secTitle("Observacoes", co.accent);
      const footerY = ph - 8;
      doc.setDrawColor(200, 210, 220);
      doc.setLineWidth(0.3);
      while (y + 7 < footerY) {
        doc.line(m, y, pw - m, y);
        y += 7;
      }

      addFooter();

      // ========== PAGE 2+: IMAGES ==========
      const tradesWithImages = filteredTrades.filter((t) => t.preTradeImage || t.tradingImage || t.postTradeImage);

      if (tradesWithImages.length > 0) {
        doc.addPage();
        // Mini header
        doc.setFillColor(...co.primary);
        doc.rect(0, 0, pw, 12, "F");
        doc.setTextColor(...co.white);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Galeria de Imagens dos Trades", m, 8);
        y = 18;

        for (const trade of tradesWithImages) {
          // New page per trade's images
          if (y > 20) { doc.addPage(); y = 14; }

          // Trade title
          doc.setTextColor(...co.accent);
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.text(`${trade.asset} - ${trade.date} (${trade.result})`, m, y);
          y += 6;

          const images: [string, string | undefined][] = [
            ["Pre-Trade", trade.preTradeImage],
            ["Trade", trade.tradingImage],
            ["Pos-Trade", trade.postTradeImage],
          ];
          const validImgs = images.filter(([, u]) => u);

          // Stack vertically, each image fills full width with equal height
          const imgW = pw - 2 * m;
          const availH = ph - y - 10;
          const imgH = Math.min(82, (availH - validImgs.length * 8) / validImgs.length);

          for (const [label, url] of validImgs) {
            if (!url) continue;
            try {
              const response = await fetch(url);
              const blob = await response.blob();
              const dataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });

              doc.setTextColor(...co.gray);
              doc.setFontSize(7);
              doc.setFont("helvetica", "bold");
              doc.text(label, m, y);
              y += 3;
              doc.addImage(dataUrl, "JPEG", m, y, imgW, imgH);
              y += imgH + 5;
            } catch {
              doc.setTextColor(...co.red);
              doc.setFontSize(6);
              doc.text(`${label}: indisponivel`, m, y);
              y += 6;
            }
          }
        }

        addFooter();
      }

      const fileName = `trading-report-${filterAccount !== "all" ? filterAccount.replace(/\s+/g, "-") : "all"}-${filterAsset !== "all" ? filterAsset : "all"}-${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
      toast.success(`Relatorio exportado: ${fileName}`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error(`Erro ao gerar relatorio PDF`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-lg border border-border">
        <div>
          <Label className="text-sm font-semibold mb-2 block">Filtrar por Conta</Label>
          <Select value={filterAccount} onValueChange={setFilterAccount}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Contas</SelectItem>
              {allAccounts.map((account) => (
                <SelectItem key={account} value={account}>
                  {account}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-semibold mb-2 block">Filtrar por Ativo</Label>
          <Select value={filterAsset} onValueChange={setFilterAsset}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Ativos</SelectItem>
              {allAssets.map((asset) => (
                <SelectItem key={asset} value={asset}>
                  {asset}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vitórias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.wins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Derrotas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.losses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Acerto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">P&L Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${parseFloat(stats.totalPnL) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${stats.totalPnL}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Retorno s/ Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${parseFloat(stats.pnlPercentage) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {parseFloat(stats.pnlPercentage) >= 0 ? '+' : ''}{stats.pnlPercentage}%
            </div>
            <p className="text-xs text-muted-foreground">Base: ${initialBalance.toFixed(0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Card de Exportação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Exportar Relatório em PDF
          </CardTitle>
          <CardDescription>Gere um relatório detalhado com todos os trades e análises</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredTrades.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-900">Nenhum trade para exportar</p>
                  <p className="text-sm text-yellow-800 mt-1">Registre trades no Diário ou ajuste os filtros para gerar um relatório.</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  📄 O relatório incluirá um resumo executivo, tabela de trades, análise de checklists e estatísticas detalhadas.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <Button
                  onClick={generatePDFReport}
                  disabled={isGenerating}
                  className="w-full bg-primary hover:bg-primary/90 gap-2"
                >
                  <Download className="w-4 h-4" />
                  {isGenerating ? "Gerando..." : "Gerar em PDF"}
                </Button>
                <Button
                  onClick={() => {
                    const analyses = JSON.parse(localStorage.getItem("analyses") || "[]");
                    const totalGain = filteredTrades.filter(t => t.result === "WIN").reduce((s, t) => s + (parseFloat(t.moneyResult?.toString() || "0") || 0), 0);
                    const totalLoss = filteredTrades.filter(t => t.result === "LOSS").reduce((s, t) => s + Math.abs(parseFloat(t.moneyResult?.toString() || "0") || 0), 0);
                    const summary = {
                      period: 'Período Selecionado',
                      totalTrades: stats.total,
                      winningTrades: stats.wins,
                      losingTrades: stats.losses,
                      winRate: stats.winRate,
                      totalGain: totalGain.toFixed(2),
                      totalLoss: totalLoss.toFixed(2),
                      netProfit: (totalGain - totalLoss).toFixed(2),
                      riskReward: totalLoss > 0 ? (totalGain / totalLoss).toFixed(2) : 0,
                      maxGain: 0,
                      maxLoss: 0,
                    };
                    exportCompleteReportToExcel(summary, filteredTrades, analyses);
                    toast.success('Relatório exportado em Excel com sucesso!');
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Gerar em Excel
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
