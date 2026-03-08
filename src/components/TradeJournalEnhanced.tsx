import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus } from "lucide-react";
import { useState } from "react";

interface Trade {
  id: number;
  date: string;
  asset: string;
  type: "BUY" | "SELL";
  entry: number;
  stopLoss: number;
  takeProfit: number;
  result: "WIN" | "LOSS" | "BREAKEVEN";
  pnl: number;
  notes: string;
}

const mockTrades: Trade[] = [
  { id: 1, date: "2026-03-07", asset: "EUR/USD", type: "BUY", entry: 1.0850, stopLoss: 1.0820, takeProfit: 1.0940, result: "WIN", pnl: 270, notes: "CHoCH H4 + OB M30" },
  { id: 2, date: "2026-03-07", asset: "XAUUSD", type: "SELL", entry: 2045.00, stopLoss: 2055.00, takeProfit: 2015.00, result: "WIN", pnl: 300, notes: "Gann box + divergência" },
  { id: 3, date: "2026-03-06", asset: "NASDAQ", type: "BUY", entry: 18250, stopLoss: 18200, takeProfit: 18400, result: "LOSS", pnl: -150, notes: "Entrei fora do plano" },
  { id: 4, date: "2026-03-06", asset: "BTC USD", type: "BUY", entry: 67500, stopLoss: 67000, takeProfit: 69000, result: "WIN", pnl: 450, notes: "OB H1 respeitado" },
];

export default function TradeJournalEnhanced() {
  const [trades] = useState<Trade[]>(mockTrades);

  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
  const wins = trades.filter((t) => t.result === "WIN").length;
  const winRate = trades.length > 0 ? ((wins / trades.length) * 100).toFixed(1) : "0";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Diário de Trades
            </CardTitle>
            <CardDescription>Registre e acompanhe todos os seus trades</CardDescription>
          </div>
          <Button size="sm" className="gap-1">
            <Plus className="w-4 h-4" /> Novo Trade
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Total P&L</p>
              <p className={`text-xl font-bold ${totalPnl >= 0 ? "text-success" : "text-destructive"}`}>
                ${totalPnl.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-success">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Win Rate</p>
              <p className="text-xl font-bold text-success">{winRate}%</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-chart-2">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Total Trades</p>
              <p className="text-xl font-bold text-foreground">{trades.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Trade List */}
        <div className="space-y-3">
          {trades.map((trade) => (
            <Card key={trade.id} className={`border-l-4 ${trade.result === "WIN" ? "border-l-success" : trade.result === "LOSS" ? "border-l-destructive" : "border-l-muted"}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{trade.asset}</span>
                    <Badge variant={trade.type === "BUY" ? "default" : "destructive"} className="text-xs">
                      {trade.type}
                    </Badge>
                    <Badge variant={trade.result === "WIN" ? "default" : "destructive"} className="text-xs">
                      {trade.result}
                    </Badge>
                  </div>
                  <span className={`font-bold ${trade.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                    {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{trade.date}</span>
                  <span>Entry: {trade.entry}</span>
                  <span>SL: {trade.stopLoss}</span>
                  <span>TP: {trade.takeProfit}</span>
                </div>
                {trade.notes && <p className="text-xs text-muted-foreground mt-2 italic">📝 {trade.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
