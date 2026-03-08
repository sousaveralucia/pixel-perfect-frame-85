import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

const assets = [
  { symbol: "EUR/USD", winRate: 72, trades: 15, pnl: 890, best: "+$320", worst: "-$120" },
  { symbol: "XAUUSD", winRate: 68, trades: 12, pnl: 650, best: "+$450", worst: "-$180" },
  { symbol: "NASDAQ", winRate: 55, trades: 8, pnl: 120, best: "+$280", worst: "-$200" },
  { symbol: "USDJPY", winRate: 60, trades: 6, pnl: 340, best: "+$210", worst: "-$90" },
  { symbol: "BTC USD", winRate: 75, trades: 6, pnl: 520, best: "+$380", worst: "-$150" },
];

export default function AssetPerformanceAnalysis() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Performance por Ativo
        </CardTitle>
        <CardDescription>Análise detalhada de cada ativo operado</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assets.map((asset) => (
            <Card key={asset.symbol} className="border-l-4 border-l-primary">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-primary">{asset.symbol}</h3>
                  <span className={`font-bold ${asset.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                    {asset.pnl >= 0 ? "+" : ""}${asset.pnl}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Win Rate</p>
                    <p className="font-bold text-success">{asset.winRate}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Trades</p>
                    <p className="font-bold">{asset.trades}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Melhor</p>
                    <p className="font-bold text-success">{asset.best}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Pior</p>
                    <p className="font-bold text-destructive">{asset.worst}</p>
                  </div>
                </div>
                <div className="mt-3 bg-secondary rounded-full h-2">
                  <div className="bg-primary rounded-full h-2" style={{ width: `${asset.winRate}%` }} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
