import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";
import { useState } from "react";

const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface DayData {
  date: number;
  trades: number;
  pnl: number;
  result: "win" | "loss" | "mixed" | "none";
}

function generateMonthData(): DayData[] {
  const days: DayData[] = [];
  for (let i = 1; i <= 31; i++) {
    const dayOfWeek = new Date(2026, 2, i).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      days.push({ date: i, trades: 0, pnl: 0, result: "none" });
    } else {
      const results: Array<"win" | "loss" | "mixed" | "none"> = ["win", "loss", "mixed", "win", "win", "none"];
      const result = results[Math.floor(Math.random() * results.length)];
      const pnl = result === "win" ? Math.floor(Math.random() * 500 + 100) : result === "loss" ? -Math.floor(Math.random() * 300 + 50) : result === "mixed" ? Math.floor(Math.random() * 200 - 100) : 0;
      days.push({ date: i, trades: result === "none" ? 0 : Math.floor(Math.random() * 3 + 1), pnl, result });
    }
  }
  return days;
}

export function TradingCalendar() {
  const [days] = useState<DayData[]>(generateMonthData);

  const totalPnl = days.reduce((sum, d) => sum + d.pnl, 0);
  const tradingDays = days.filter((d) => d.result !== "none").length;
  const winDays = days.filter((d) => d.result === "win").length;

  // Calculate first day offset
  const firstDayOfWeek = new Date(2026, 2, 1).getDay();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            Calendário de Trading - Março 2026
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="secondary">{tradingDays} dias operados</Badge>
            <Badge className={totalPnl >= 0 ? "bg-success text-success-foreground" : "bg-destructive"}>
              {totalPnl >= 0 ? "+" : ""}${totalPnl}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Dias Operados</p>
              <p className="text-xl font-bold">{tradingDays}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-success">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Dias Positivos</p>
              <p className="text-xl font-bold text-success">{winDays}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-destructive">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Dias Negativos</p>
              <p className="text-xl font-bold text-destructive">{days.filter((d) => d.result === "loss").length}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-chart-2">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">P&L Total</p>
              <p className={`text-xl font-bold ${totalPnl >= 0 ? "text-success" : "text-destructive"}`}>
                ${totalPnl}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {daysOfWeek.map((d) => (
            <div key={d} className="text-center text-xs font-bold text-muted-foreground py-2">{d}</div>
          ))}
          {/* Empty cells for offset */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map((day) => (
            <div
              key={day.date}
              className={`rounded-lg p-2 text-center text-sm border transition-colors ${
                day.result === "win"
                  ? "bg-success/10 border-success/30 text-success"
                  : day.result === "loss"
                  ? "bg-destructive/10 border-destructive/30 text-destructive"
                  : day.result === "mixed"
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-secondary/30 border-border text-muted-foreground"
              }`}
            >
              <p className="font-bold">{day.date}</p>
              {day.trades > 0 && (
                <p className="text-[10px]">
                  {day.pnl >= 0 ? "+" : ""}${day.pnl}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-success/20 border border-success/30" />
            <span className="text-muted-foreground">Positivo</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-destructive/20 border border-destructive/30" />
            <span className="text-muted-foreground">Negativo</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-primary/20 border border-primary/30" />
            <span className="text-muted-foreground">Misto</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-secondary/30 border border-border" />
            <span className="text-muted-foreground">Sem operação</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
