import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Target, Activity } from "lucide-react";

export default function PerformanceDashboard() {
  const stats = [
    { label: "Win Rate", value: "68%", icon: Target, color: "text-success" },
    { label: "Profit Factor", value: "2.4", icon: TrendingUp, color: "text-primary" },
    { label: "Total Trades", value: "47", icon: Activity, color: "text-foreground" },
    { label: "Melhor Mês", value: "+$2,340", icon: BarChart3, color: "text-success" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Dashboard de Performance
        </CardTitle>
        <CardDescription>Visão geral do desempenho das suas operações</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Simulated chart area */}
        <Card className="bg-secondary/30">
          <CardContent className="pt-6">
            <p className="text-sm font-bold text-foreground mb-4">Evolução do Saldo</p>
            <div className="h-48 flex items-end gap-1">
              {[40, 55, 45, 60, 52, 70, 65, 80, 75, 90, 85, 95].map((h, i) => (
                <div key={i} className="flex-1 bg-primary/70 rounded-t transition-all hover:bg-primary" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span>
              <span>Jul</span><span>Ago</span><span>Set</span><span>Out</span><span>Nov</span><span>Dez</span>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
