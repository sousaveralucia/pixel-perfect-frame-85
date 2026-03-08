import { useState, useMemo } from "react";
import { useTradeJournalUnified } from "@/hooks/useTradeJournalUnified";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useAccountManager } from "@/hooks/useAccountManager";
import { MonthlyPhotoGallery } from "./MonthlyPhotoGallery";
import { TradingDashboard } from "./TradingDashboard";
import { TradesSummary } from "./TradesSummary";
import { EquityCurveChart } from "./EquityCurveChart";

interface Trade {
  id: string;
  date: string;
  asset: string;
  entryPrice: string;
  exitPrice: string;
  resultPrice: string;
  result: "WIN" | "LOSS" | "BREAK_EVEN" | "ONGOING";
  riskReward?: number;
  postTradeImage?: string;
  notes: string;
  account: string;
  createdAt: number;
}

interface DayData {
  date: string;
  trades: Trade[];
  totalResult: number;
  totalRR: number;
  profitLoss: number;
}

interface TradingCalendarProps {
  activeAccountId?: string;
}

export function TradingCalendar({ activeAccountId: propAccountId }: TradingCalendarProps = {}) {
  const { activeAccountId: hookAccountId, syncAccountBalance, accounts, switchAccount } = useAccountManager();
  const accountId = propAccountId || hookAccountId;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month" | "year">("month");
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [filterResult, setFilterResult] = useState<"ALL" | "WIN" | "LOSS" | "BREAK_EVEN" | "FAVORITES">("ALL");

  // Carregar trades do Supabase
  const { trades } = useTradeJournalUnified(accountId);

  // Sincronizar saldo quando trades mudam
  useMemo(() => {
    syncAccountBalance(accountId);
  }, [trades, accountId]);

  // Agrupar trades por data
  const tradesByDate = useMemo(() => {
    const grouped: { [key: string]: Trade[] } = {};
    trades.forEach((trade: Trade) => {
      if (!grouped[trade.date]) {
        grouped[trade.date] = [];
      }
      grouped[trade.date].push(trade);
    });
    return grouped;
  }, [trades]);

  // Calcular dados do dia
  const getDayData = (dateStr: string): DayData => {
    const dayTrades = tradesByDate[dateStr] || [];
    const totalResult = dayTrades.reduce((sum, trade) => {
      const moneyResult = (trade as any).moneyResult || 0;
      return sum + moneyResult;
    }, 0);

    const totalRR = Math.round(dayTrades.reduce((sum, trade) => sum + (trade.riskReward || 0), 0));
    const profitLoss = dayTrades.reduce((sum, trade) => {
      if (trade.result === "WIN") return sum + 1;
      if (trade.result === "LOSS") return sum - 1;
      return sum;
    }, 0);

    return {
      date: dateStr,
      trades: dayTrades,
      totalResult,
      totalRR,
      profitLoss,
    };
  };

  // Gerar dias do mês
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push(dateStr);
    }
    return days;
  };

  // Filtrar dias baseado no filtro selecionado
  const getFilteredDays = () => {
    if (filterResult === "ALL") return getDaysInMonth(currentDate);
    
    const allDays = getDaysInMonth(currentDate);
    return allDays.filter(dateStr => {
      if (!dateStr) return true;
      const dayData = getDayData(dateStr);
      if (dayData.trades.length === 0) return false;
      
      if (filterResult === "WIN") return dayData.trades.some(t => t.result === "WIN");
      if (filterResult === "LOSS") return dayData.trades.some(t => t.result === "LOSS");
      if (filterResult === "BREAK_EVEN") return dayData.trades.some(t => t.result === "BREAK_EVEN");
      if (filterResult === "FAVORITES") return dayData.trades.some((t: any) => t.isFavorite);
      return true;
    });
  };

  const days = getFilteredDays();
  const monthName = currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getResultColor = (result: number) => {
    if (result > 0) return "text-green-600 bg-green-50";
    if (result < 0) return "text-red-600 bg-red-50";
    return "text-gray-600 bg-gray-50";
  };

  // Contar wins e losses do dia
  const getTodayStats = () => {
    const today = new Date().toISOString().split("T")[0];
    const todayTrades = tradesByDate[today] || [];
    const wins = todayTrades.filter(t => t.result === "WIN").length;
    const losses = todayTrades.filter(t => t.result === "LOSS").length;
    return { wins, losses };
  };

  const { wins, losses } = getTodayStats();
  const isLimitReached = wins >= 2 || losses >= 3;

  return (
    <div className="space-y-6">
      {/* Alert for daily limit */}
      {isLimitReached && (
        <div className="bg-red-100 border-2 border-red-500 rounded-lg p-4 text-red-700 font-bold text-center">
          {wins >= 2 && "🛑 Limite de 2 vitórias atingido! Novos trades bloqueados."}
          {losses >= 3 && "🛑 Limite de 3 perdas atingido! Novos trades bloqueados."}
        </div>
      )}

      {/* 3-Column Layout: Summary | Calendar | Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left: Trades Summary */}
        <div className="lg:col-span-1">
          <TradesSummary activeAccountId={accountId} />
        </div>

        {/* Center: Calendar */}
        <div className="lg:col-span-2">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-3">
            <div>
              <CardTitle className="capitalize">{monthName}</CardTitle>
              <CardDescription>Resultados diários de trading</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filterResult === "ALL" ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => setFilterResult("ALL")}
            >
              Todos
            </Button>
            <Button
              variant={filterResult === "WIN" ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => setFilterResult("WIN")}
            >
              Vitórias
            </Button>
            <Button
              variant={filterResult === "LOSS" ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => setFilterResult("LOSS")}
            >
              Perdas
            </Button>
            <Button
              variant={filterResult === "BREAK_EVEN" ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => setFilterResult("BREAK_EVEN")}
            >
              Empates
            </Button>
            <Button
              variant={filterResult === "FAVORITES" ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => setFilterResult("FAVORITES")}
            >
              ⭐ Favoritos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
              <div key={day} className="text-center font-bold text-sm text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {getDaysInMonth(currentDate).map((dateStr, idx) => {
              if (!dateStr) {
                return <div key={`empty-${idx}`} className="aspect-square" />;
              }

              const dayData = getDayData(dateStr);
              const hasTrades = dayData.trades.length > 0;
              const resultColor = getResultColor(dayData.totalResult);
              const shouldShow = filterResult === "ALL" || 
                (filterResult === "WIN" && dayData.trades.some((t: Trade) => t.result === "WIN")) ||
                (filterResult === "LOSS" && dayData.trades.some((t: Trade) => t.result === "LOSS")) ||
                (filterResult === "BREAK_EVEN" && dayData.trades.some((t: Trade) => t.result === "BREAK_EVEN")) ||
                (filterResult === "FAVORITES" && dayData.trades.some((t: any) => t.isFavorite));

              if (!shouldShow && (filterResult as string) !== "ALL") {
                return <div key={dateStr} className="aspect-square" />;
              }

              return (
                <button
                  key={dateStr}
                  onClick={() => hasTrades && setSelectedDay(dayData)}
                  className={`aspect-square p-2 rounded-lg border-2 transition-all ${
                    hasTrades
                      ? `${resultColor} border-current cursor-pointer hover:shadow-md`
                      : "border-gray-200 bg-gray-50"
                  }`}
                  disabled={!hasTrades}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>{dateStr.split("-")[2]}</span>
                    {dayData.trades.some((t: any) => t.isFavorite) && <span>⭐</span>}
                  </div>
                  {hasTrades && (
                    <div className="text-xs mt-1 space-y-0.5">
                      <div className="font-bold">
                        {dayData.totalResult > 0 ? "+" : ""}
                        ${dayData.totalResult.toFixed(2)}
                      </div>
                      {dayData.totalRR !== 0 && (
                        <div className="text-xs opacity-75">
                          RR: {dayData.totalRR > 0 ? "+" : ""}
                          {dayData.totalRR}
                        </div>
                      )}
                      <div className="text-xs opacity-75">{dayData.trades.length} trade(s)</div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
        </div>

        {/* Right: Monthly Photo Gallery */}
        <div className="lg:col-span-1">
          <MonthlyPhotoGallery activeAccountId={accountId} />
        </div>
      </div>

      {/* Equity Curve Chart */}
      <EquityCurveChart activeAccountId={accountId} />

      {/* Trading Dashboard with KPIs */}
      <TradingDashboard activeAccountId={accountId} />

      {/* Day Details Modal */}
      {selectedDay && (
        <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Trades do dia {selectedDay.date}</DialogTitle>
              <DialogDescription>
                Total: {selectedDay.totalResult > 0 ? "+" : ""}
                ${selectedDay.totalResult.toFixed(2)} | R:R: {selectedDay.totalRR > 0 ? "+" : ""}
                {selectedDay.totalRR} | {selectedDay.trades.length} trade(s)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {selectedDay.trades.map((trade) => (
                <Card key={trade.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Ativo</p>
                        <p className="font-bold">{trade.asset}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Resultado</p>
                        <Badge
                          variant={
                            trade.result === "WIN"
                              ? "default"
                              : trade.result === "LOSS"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {trade.result === "WIN" && "Vitória"}
                          {trade.result === "LOSS" && "Derrota"}
                          {trade.result === "BREAK_EVEN" && "Empate"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Entrada</p>
                        <p className="font-bold">{trade.entryPrice}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Saída</p>
                        <p className="font-bold">{trade.exitPrice}</p>
                      </div>
                      {trade.riskReward !== 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground">R:R</p>
                          <p className={`font-bold ${trade.riskReward! > 0 ? "text-green-600" : "text-red-600"}`}>
                            {trade.riskReward! > 0 ? "+" : ""}
                            {trade.riskReward}RR
                          </p>
                        </div>
                      )}
                      {(trade as any).moneyResult !== 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground">Resultado ($)</p>
                          <p className={`font-bold text-lg ${
                            (trade as any).moneyResult! > 0 ? "text-green-600" : "text-red-600"
                          }`}>
                            {(trade as any).moneyResult! > 0 ? "+" : ""}
                            ${(trade as any).moneyResult?.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>

                    {trade.notes && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Notas</p>
                        <p className="text-sm">{trade.notes}</p>
                      </div>
                    )}

                    {trade.postTradeImage && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-2">Imagem Pós-Trading</p>
                        <button
                          onClick={() => setExpandedImage(trade.postTradeImage!)}
                          className="w-full hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={trade.postTradeImage}
                            alt="Post-Trade"
                            className="w-full h-64 object-cover rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
                          />
                        </button>
                        <p className="text-xs text-muted-foreground mt-1 text-center">Clique para ampliar</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Expanded Image Modal - Full Screen */}
      {expandedImage && (
        <Dialog open={!!expandedImage} onOpenChange={() => setExpandedImage(null)}>
          <DialogContent className="max-w-7xl max-h-[95vh] overflow-auto p-0">
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <button
                onClick={() => setExpandedImage(null)}
                className="absolute top-4 right-4 z-50 bg-white rounded-full p-2 hover:bg-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={expandedImage}
                alt="Expanded"
                className="max-w-full max-h-[90vh] object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
