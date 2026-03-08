import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitCompare } from "lucide-react";

export default function StrategyComparisonEnhanced() {
  const strategies = [
    { name: "CHoCH + OB (Principal)", winRate: 72, trades: 28, pnl: 1850, rr: "1:3.2" },
    { name: "Gann Box + Divergência", winRate: 65, trades: 12, pnl: 720, rr: "1:2.8" },
    { name: "Supply/Demand Zones", winRate: 58, trades: 7, pnl: 230, rr: "1:2.5" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-primary" />
          Comparação de Estratégias
        </CardTitle>
        <CardDescription>Análise comparativa das suas estratégias de trading</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {strategies.map((s, i) => (
            <Card key={i} className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-foreground">{s.name}</h3>
                  <span className={`font-bold ${s.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                    {s.pnl >= 0 ? "+" : ""}${s.pnl}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Win Rate</p>
                    <p className="text-lg font-bold text-success">{s.winRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Trades</p>
                    <p className="text-lg font-bold">{s.trades}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">R:R Médio</p>
                    <p className="text-lg font-bold text-primary">{s.rr}</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-3 bg-secondary rounded-full h-2">
                  <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${s.winRate}%` }} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
