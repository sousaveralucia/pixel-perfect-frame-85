import { useState, useMemo } from "react";
import { useTradeJournalUnified } from "@/hooks/useTradeJournalUnified";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";

interface Trade {
  id: string;
  date: string;
  asset: string;
  result: "WIN" | "LOSS" | "BREAK_EVEN" | "ONGOING";
  moneyResult?: number;
  account: string;
}

interface TradesSummaryProps {
  activeAccountId?: string;
}

export function TradesSummary({ activeAccountId }: TradesSummaryProps = {}) {
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const { trades } = useTradeJournalUnified(activeAccountId || "");

  // Group trades by date for detail view
  const tradesByDate = useMemo(() => {
    const map = new Map<string, { asset: string; moneyResult: number }[]>();
    trades.forEach((trade: Trade) => {
      if (!trade.date) return;
      const list = map.get(trade.date) || [];
      list.push({ asset: trade.asset || "N/A", moneyResult: trade.moneyResult || 0 });
      map.set(trade.date, list);
    });
    return map;
  }, [trades]);

  const dailySummary = useMemo(() => {
    const summary: { [key: string]: { day: string; result: number; trades: number } } = {};
    const daysOfWeek = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

    let startDate: Date;
    let endDate: Date;

    if (viewMode === "week") {
      startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - currentDate.getDay());
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    } else {
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    }

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const dayName = viewMode === "week" ? daysOfWeek[d.getDay()] : `${d.getDate()}`;
      summary[dateStr] = { day: dayName, result: 0, trades: 0 };
    }

    trades.forEach((trade: Trade) => {
      const tradeDate = trade.date;
      if (summary[tradeDate]) {
        summary[tradeDate].result += (trade.moneyResult || 0);
        summary[tradeDate].trades += 1;
      }
    });

    return Object.entries(summary)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }));
  }, [trades, currentDate, viewMode]);

  const totalResult = dailySummary.reduce((sum, day) => sum + day.result, 0);

  const goToPreviousPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "week") {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setMonth(currentDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
    setExpandedDate(null);
  };

  const goToNextPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "week") {
      newDate.setDate(currentDate.getDate() + 7);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    setExpandedDate(null);
  };

  const getPeriodLabel = () => {
    if (viewMode === "week") {
      const startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - currentDate.getDay());
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      return `${startDate.toLocaleDateString("pt-BR")} - ${endDate.toLocaleDateString("pt-BR")}`;
    } else {
      return currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    }
  };

  const toggleExpand = (date: string, tradesCount: number) => {
    if (tradesCount === 0) return;
    setExpandedDate(expandedDate === date ? null : date);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-sm">Resumo</CardTitle>
            <CardDescription className="text-xs">{getPeriodLabel()}</CardDescription>
          </div>
          <div className="flex gap-1">
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => { setViewMode("week"); setExpandedDate(null); }}
            >
              Semana
            </Button>
            <Button
              variant={viewMode === "month" ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => { setViewMode("month"); setExpandedDate(null); }}
            >
              Mês
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto">
        <div className="space-y-1">
          {dailySummary.map((day) => (
            <div key={day.date}>
              <button
                type="button"
                onClick={() => toggleExpand(day.date, day.trades)}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                  day.trades > 0 ? "cursor-pointer hover:bg-accent/50" : "cursor-default"
                } ${expandedDate === day.date ? "bg-accent/30" : "bg-secondary/50"}`}
              >
                <div className="flex items-center gap-1.5">
                  {day.trades > 0 && (
                    expandedDate === day.date
                      ? <ChevronUp className="w-3 h-3 text-muted-foreground" />
                      : <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  )}
                  <div className="text-left">
                    <p className="font-medium text-foreground">{day.day}</p>
                    <p className="text-muted-foreground">{day.trades} trade(s)</p>
                  </div>
                </div>
                <div
                  className={`font-bold ${
                    day.result > 0 ? "text-emerald-500" : day.result < 0 ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  {day.result > 0 ? "+" : ""}${day.result.toFixed(2)}
                </div>
              </button>

              {/* Expanded trade details */}
              {expandedDate === day.date && day.trades > 0 && (
                <div className="ml-5 mt-1 mb-2 space-y-1 border-l-2 border-primary/30 pl-3">
                  {(tradesByDate.get(day.date) || []).map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1">
                      <span className="text-muted-foreground font-medium">{t.asset}</span>
                      <span
                        className={`font-semibold ${
                          t.moneyResult > 0 ? "text-emerald-500" : t.moneyResult < 0 ? "text-destructive" : "text-muted-foreground"
                        }`}
                      >
                        {t.moneyResult > 0 ? "+" : ""}${t.moneyResult.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>

      <div className="border-t border-border p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">Total:</span>
          <span className={`font-bold ${totalResult > 0 ? "text-emerald-500" : totalResult < 0 ? "text-destructive" : "text-muted-foreground"}`}>
            {totalResult > 0 ? "+" : ""}${totalResult.toFixed(2)}
          </span>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={goToPreviousPeriod}>
            <ChevronLeft className="w-3 h-3" />
          </Button>
          <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={goToNextPeriod}>
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
