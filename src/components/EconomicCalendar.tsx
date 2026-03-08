import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

const mockEvents = [
  { id: 1, date: "2026-03-09", time: "09:30", event: "PIB Trimestral (EUR)", impact: "high", forecast: "0.3%", previous: "0.2%" },
  { id: 2, date: "2026-03-09", time: "15:30", event: "Non-Farm Payrolls (USD)", impact: "high", forecast: "180K", previous: "175K" },
  { id: 3, date: "2026-03-10", time: "11:00", event: "Taxa de Juros (GBP)", impact: "high", forecast: "5.25%", previous: "5.25%" },
  { id: 4, date: "2026-03-10", time: "14:00", event: "CPI Mensal (USD)", impact: "medium", forecast: "0.2%", previous: "0.3%" },
  { id: 5, date: "2026-03-11", time: "03:00", event: "Balança Comercial (JPY)", impact: "low", forecast: "-¥200B", previous: "-¥150B" },
];

export default function EconomicCalendar() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Calendário Econômico
        </CardTitle>
        <CardDescription>Eventos econômicos importantes para a semana</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 font-bold text-muted-foreground">Data</th>
                <th className="text-left py-3 px-2 font-bold text-muted-foreground">Hora</th>
                <th className="text-left py-3 px-2 font-bold text-muted-foreground">Evento</th>
                <th className="text-left py-3 px-2 font-bold text-muted-foreground">Impacto</th>
                <th className="text-left py-3 px-2 font-bold text-muted-foreground">Previsão</th>
                <th className="text-left py-3 px-2 font-bold text-muted-foreground">Anterior</th>
              </tr>
            </thead>
            <tbody>
              {mockEvents.map((event) => (
                <tr key={event.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-2 font-medium">{event.date}</td>
                  <td className="py-3 px-2">{event.time}</td>
                  <td className="py-3 px-2 font-medium">{event.event}</td>
                  <td className="py-3 px-2">
                    <Badge variant={event.impact === "high" ? "destructive" : event.impact === "medium" ? "default" : "secondary"}>
                      {event.impact === "high" ? "Alto" : event.impact === "medium" ? "Médio" : "Baixo"}
                    </Badge>
                  </td>
                  <td className="py-3 px-2">{event.forecast}</td>
                  <td className="py-3 px-2">{event.previous}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
