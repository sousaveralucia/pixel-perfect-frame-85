import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

const mockAlerts = [
  { id: 1, type: "bullish", asset: "EUR/USD", message: "CHoCH válido identificado em H4 - Possível reversão de alta", time: "09:30", priority: "high" },
  { id: 2, type: "bearish", asset: "XAUUSD", message: "Rompimento de suporte em H1 - Tendência de baixa", time: "10:15", priority: "medium" },
  { id: 3, type: "news", asset: "NASDAQ", message: "NFP será divulgado às 15:30 - Alta volatilidade esperada", time: "08:00", priority: "high" },
  { id: 4, type: "bullish", asset: "BTC USD", message: "Order Block de demanda respeitado em H4", time: "11:45", priority: "medium" },
  { id: 5, type: "bearish", asset: "USDJPY", message: "Divergência bearish no RSI em H1", time: "12:30", priority: "low" },
];

export default function NewsAlerts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Alertas de Mercado
        </CardTitle>
        <CardDescription>Alertas e notícias relevantes para seus ativos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockAlerts.map((alert) => (
            <Card key={alert.id} className={`border-l-4 ${
              alert.type === "bullish" ? "border-l-success" : 
              alert.type === "bearish" ? "border-l-destructive" : 
              "border-l-primary"
            }`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {alert.type === "bullish" ? (
                      <TrendingUp className="w-5 h-5 text-success mt-0.5" />
                    ) : alert.type === "bearish" ? (
                      <TrendingDown className="w-5 h-5 text-destructive mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-primary mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-foreground">{alert.asset}</span>
                        <Badge variant={alert.priority === "high" ? "destructive" : "secondary"} className="text-xs">
                          {alert.priority === "high" ? "Alta" : alert.priority === "medium" ? "Média" : "Baixa"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{alert.time}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
