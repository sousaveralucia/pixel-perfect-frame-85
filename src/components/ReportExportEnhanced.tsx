import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, FileText, AlertCircle, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { exportCompleteReportToExcel } from "@/lib/excelExporter";

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
  account: "Conta 1 ($100)" | "Conta 2 ($1000)" | "Conta 3 ($10000)";
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
  const [filterAccount, setFilterAccount] = useState<string>("all");
  const [filterAsset, setFilterAsset] = useState<string>("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const allAssets = ["EUR/USD", "USDJPY", "XAUUSD", "NASDAQ", "BTC USD"];
  const allAccounts = ["Conta 1 ($100)", "Conta 2 ($1000)", "Conta 3 ($10000)"];

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

    return {
      total: filteredTrades.length,
      wins,
      losses,
      breakEven,
      winRate: filteredTrades.length > 0 ? ((wins / filteredTrades.length) * 100).toFixed(1) : 0,
      totalPnL: totalPnL.toFixed(2),
      avgPnL: filteredTrades.length > 0 ? (totalPnL / filteredTrades.length).toFixed(2) : 0,
    };
  }, [filteredTrades]);

  const generatePDFReport = async () => {
    if (filteredTrades.length === 0) {
      toast.error("Nenhum trade para exportar com os filtros selecionados");
      return;
    }

    setIsGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      let yPosition = 15;
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      const maxWidth = doc.internal.pageSize.getWidth() - 2 * margin;

      // Função auxiliar para adicionar nova página
      const addNewPage = () => {
        try {
          doc.addPage();
          yPosition = margin;
        } catch (e) {
          console.error("Erro ao adicionar página:", e);
        }
      };

      // Título
      doc.setFontSize(20);
      doc.setFont("" as any, "bold" as any);
      doc.text("Relatório de Trades", margin, yPosition);
      yPosition += 10;

      // Informações gerais
      doc.setFontSize(10);
      doc.setFont("" as any, "normal" as any);
      doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, margin, yPosition as any);
      yPosition += 5;

      if (filterAccount !== "all") {
        doc.text(`Conta: ${filterAccount}`, margin, yPosition as any);
        yPosition += 5;
      }

      if (filterAsset !== "all") {
        doc.text(`Ativo: ${filterAsset}`, margin, yPosition as any);
        yPosition += 5;
      }

      yPosition += 5;

      // Resumo Executivo
      doc.setFontSize(12);
      doc.setFont("" as any, "bold" as any);
      doc.text("Resumo Executivo", margin, yPosition as any);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont("" as any, "normal" as any);
      const summaryData = [
        [`Total de Trades: ${stats.total}`, `Vitórias: ${stats.wins}`, `Derrotas: ${stats.losses}`],
        [`Taxa de Acerto: ${stats.winRate}%`, `P&L Total: $${stats.totalPnL}`, `P&L Médio: $${stats.avgPnL}`],
      ];

      summaryData.forEach((row) => {
        row.forEach((text, index) => {
          doc.text(text, margin + index * 60, yPosition as any);
        });
        yPosition += 6;
      });

      yPosition += 5;

      // Tabela de Trades
      if (yPosition > pageHeight - 50) {
        addNewPage();
      }

      doc.setFontSize(12);
      doc.setFont("" as any, "bold" as any);
      doc.text("Histórico de Trades", margin, yPosition as any);
      yPosition += 8;

      // Cabeçalho da tabela
      doc.setFontSize(9);
      doc.setFont("" as any, "bold" as any);
      doc.setTextColor(0, 0, 0); // Texto em preto
      doc.setFillColor(200, 220, 250); // Fundo azul claro
      
      const tableHeaders = ["Data", "Ativo", "Hora", "Entrada", "SL", "TP", "Saída", "Pips/Ticks", "R:R", "Resultado ($)", "Status"];
      const colWidths = [18, 15, 12, 15, 15, 15, 15, 15, 10, 18, 15];
      let xPos = margin;

      tableHeaders.forEach((header, index) => {
        doc.rect(xPos, yPosition, colWidths[index], 6, "F" as any);
        doc.text(header, xPos + 1, yPosition + 4 as any);
        xPos += colWidths[index];
      });

      yPosition += 8;
      doc.setTextColor(0, 0, 0); // Garantir texto em preto
      doc.setFont("" as any, "normal" as any);

      // Dados da tabela
      filteredTrades.forEach((trade, index) => {
        if (yPosition > pageHeight - 20) {
          addNewPage();
        }

        // Cor de fundo alternada
        const bgColor = index % 2 === 0 ? [245, 245, 245] : [255, 255, 255];
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        
        let rowXPos = margin;
        const rowHeight = 6;
        doc.rect(margin, yPosition, maxWidth, rowHeight, "F" as any);

        // Texto sempre em preto para legibilidade
        doc.setTextColor(0, 0, 0); // Preto

        doc.setFontSize(7);
        const moneyResult = parseFloat(trade.moneyResult?.toString() || "0") || 0;
        const rowData = [
          trade.date,
          trade.asset,
          trade.entryTime || "-",
          trade.entryPrice,
          trade.stopLoss,
          trade.takeProfit,
          trade.exitPrice,
          "-", // Pips/Ticks (será preenchido manualmente)
          trade.riskReward ? `${trade.riskReward}:1` : "-",
          `$${moneyResult.toFixed(2)}`,
          trade.result === "WIN" ? "WIN" : trade.result === "LOSS" ? "LOSS" : "BE",
        ];

        rowXPos = margin;
        rowData.forEach((data, colIndex) => {
          doc.text(data, rowXPos + 1, yPosition + 4 as any);
          rowXPos += colWidths[colIndex];
        });

        doc.setTextColor(0, 0, 0);
        yPosition += rowHeight + 1;
      });

      yPosition += 10;

      // Análise de Checklists
      if (yPosition > pageHeight - 40) {
        addNewPage();
      }

      doc.setFontSize(12);
      doc.setFont("" as any, "bold" as any);
      doc.text("Análise de Checklists", margin, yPosition as any);
      yPosition += 8;

      // Contar ticks faltantes em losses
      const lossesWithMissingTicks = filteredTrades.filter((t) => t.result === "LOSS");
      const missingTicksBreakdown = {
        operational: 0,
        emotional: 0,
        routine: 0,
        rational: 0,
      };

      lossesWithMissingTicks.forEach((trade) => {
        const opMissing = trade.operational ? Object.values(trade.operational).filter((v) => !v).length : 0;
        const emMissing = trade.emotional ? Object.values(trade.emotional).filter((v) => !v).length : 0;
        const routineMissing = trade.routine ? Object.values(trade.routine).filter((v) => !v).length : 0;
        const raMissing = trade.rational ? Object.values(trade.rational).filter((v) => !v).length : 0;

        if (opMissing > 0) missingTicksBreakdown.operational++;
        if (emMissing > 0) missingTicksBreakdown.emotional++;
        if (routineMissing > 0) missingTicksBreakdown.routine++;
        if (raMissing > 0) missingTicksBreakdown.rational++;
      });

      doc.setFontSize(10);
      doc.setFont("" as any, "normal" as any);
      doc.text(`Total de Losses: ${lossesWithMissingTicks.length}`, margin, yPosition as any);
      yPosition += 5;
      doc.text(`Losses com ticks operacionais faltantes: ${missingTicksBreakdown.operational}`, margin, yPosition as any);
      yPosition += 5;
      doc.text(`Losses com ticks emocionais faltantes: ${missingTicksBreakdown.emotional}`, margin, yPosition as any);
      yPosition += 5;
      doc.text(`Losses com ticks de rotina e saúde faltantes: ${missingTicksBreakdown.routine}`, margin, yPosition as any);
      yPosition += 5;
      doc.text(`Losses com ticks racionais faltantes: ${missingTicksBreakdown.rational}`, margin, yPosition as any);
      yPosition += 10;

      // Galeria de Imagens dos Trades
      const tradesWithImages = filteredTrades.filter((t) => t.preTradeImage || t.tradingImage || t.postTradeImage);
      
      if (tradesWithImages.length > 0) {
        if (yPosition > pageHeight - 40) {
          addNewPage();
        }

        doc.setFontSize(12);
        doc.setFont("" as any, "bold" as any);
        doc.text("Galeria de Imagens", margin, yPosition as any);
        yPosition += 8;

        doc.setFontSize(9);
        doc.setFont("" as any, "normal" as any);

        tradesWithImages.forEach((trade, index) => {
          if (yPosition > pageHeight - 50) {
            addNewPage();
          }

          // Título do trade
          doc.setFont("" as any, "bold" as any);
          doc.text(`${trade.asset} - ${trade.date}`, margin, yPosition as any);
          yPosition += 6;

          doc.setFont("" as any, "normal" as any);
          const imageHeight = 80;
          const imageWidth = 150;
          const imageSpacing = 5;
          const pageMargin = 10;
          let imageX = margin;

          // Verificar se precisa de nova página
          const imagesCount = (trade.preTradeImage ? 1 : 0) + (trade.tradingImage ? 1 : 0) + (trade.postTradeImage ? 1 : 0);
          if (imagesCount > 0 && yPosition + imageHeight + 30 > pageHeight - pageMargin) {
            doc.addPage();
            yPosition = pageMargin;
          }

          // Pré-Trading
          if (trade.preTradeImage) {
            try {
              if (imageX + imageWidth > doc.internal.pageSize.getWidth() - margin) {
                imageX = margin;
                yPosition += imageHeight + 15;
                if (yPosition + imageHeight > pageHeight - pageMargin) {
                  doc.addPage();
                  yPosition = pageMargin;
                }
              }
              doc.addImage(trade.preTradeImage, "JPEG", imageX, yPosition, imageWidth, imageHeight);
              doc.setFontSize(9);
              doc.text("Pré-Trading", imageX + 5, yPosition + imageHeight + 5);
              imageX += imageWidth + imageSpacing;
            } catch (e) {
              // Ignorar erros de imagem
            }
          }

          // Durante-Trading
          if (trade.tradingImage) {
            try {
              if (imageX + imageWidth > doc.internal.pageSize.getWidth() - margin) {
                imageX = margin;
                yPosition += imageHeight + 15;
                if (yPosition + imageHeight > pageHeight - pageMargin) {
                  doc.addPage();
                  yPosition = pageMargin;
                }
              }
              doc.addImage(trade.tradingImage, "JPEG", imageX, yPosition, imageWidth, imageHeight);
              doc.setFontSize(9);
              doc.text("Durante", imageX + 10, yPosition + imageHeight + 5);
              imageX += imageWidth + imageSpacing;
            } catch (e) {
              // Ignorar erros de imagem
            }
          }

          // Pós-Trading
          if (trade.postTradeImage) {
            try {
              if (imageX + imageWidth > doc.internal.pageSize.getWidth() - margin) {
                imageX = margin;
                yPosition += imageHeight + 15;
                if (yPosition + imageHeight > pageHeight - pageMargin) {
                  doc.addPage();
                  yPosition = pageMargin;
                }
              }
              doc.addImage(trade.postTradeImage, "JPEG", imageX, yPosition, imageWidth, imageHeight);
              doc.setFontSize(9);
              doc.text("Pós-Trading", imageX + 10, yPosition + imageHeight + 5);
            } catch (e) {
              // Ignorar erros de imagem
            }
          }

          yPosition += imageHeight + 20;
        });
      }

      // Rodapé
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text("Relatório confidencial - Apenas para uso pessoal", margin, pageHeight - 10);

      // Salvar PDF
      try {
        const fileName = `trading-report-${filterAccount !== "all" ? filterAccount.replace(/\s+/g, "-") : "all"}-${filterAsset !== "all" ? filterAsset : "all"}-${new Date().toISOString().split("T")[0]}.pdf`;
        doc.save(fileName);
        toast.success(`Relatório exportado com sucesso: ${fileName}`);
      } catch (saveError) {
        console.error("Erro ao salvar PDF:", saveError);
        toast.error("Erro ao salvar relatório PDF");
      }
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error(`Erro ao gerar relatório PDF: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
