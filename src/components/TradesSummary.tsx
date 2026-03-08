import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

  // Carregar trades do localStorage
  const trades = useMemo(() => {
    const saved = localStorage.getItem(`trades_enhanced_${activeAccountId}`);
    return saved ? JSON.parse(saved) : [];
  }, [activeAccountId]);

  // Calcular resumo por dia
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

    // Inicializar todos os dias
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const dayName = viewMode === "week" ? daysOfWeek[d.getDay()] : `${d.getDate()}`;
      summary[dateStr] = { day: dayName, result: 0, trades: 0 };
    }

    // Preencher com dados de trades
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
  const totalTrades = dailySummary.reduce((sum, day) => sum + day.trades, 0);

  const goToPreviousPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "week") {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setMonth(currentDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNextPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "week") {
      newDate.setDate(currentDate.getDate() + 7);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
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
              onClick={() => setViewMode("week")}
            >
              Semana
            </Button>
            <Button
              variant={viewMode === "month" ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => setViewMode("month")}
            >
              Mês
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {dailySummary.map((day) => (
            <div key={day.date} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
              <div>
                <p className="font-medium">{day.day}</p>
                <p className="text-muted-foreground">{day.trades} trade(s)</p>
              </div>
              <div
                className={`font-bold ${
                  day.result > 0 ? "text-green-600" : day.result < 0 ? "text-red-600" : "text-gray-600"
                }`}
              >
                {day.result > 0 ? "+" : ""}${day.result.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <div className="border-t p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">Total:</span>
          <span className={`font-bold ${totalResult > 0 ? "text-green-600" : totalResult < 0 ? "text-red-600" : "text-gray-600"}`}>
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
