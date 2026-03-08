import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History, CheckCircle2, XCircle } from "lucide-react";

const mockHistory = [
  { id: 1, date: "2026-03-07", checklist: 7, total: 8, passed: true, notes: "Seguiu o plano com exceção do TP" },
  { id: 2, date: "2026-03-06", checklist: 8, total: 8, passed: true, notes: "Dia perfeito - todas regras seguidas" },
  { id: 3, date: "2026-03-05", checklist: 5, total: 8, passed: false, notes: "Entrou sem confirmação de CHoCH" },
  { id: 4, date: "2026-03-04", checklist: 6, total: 8, passed: false, notes: "Moveu o stop loss durante o trade" },
];

export default function AnalysisHistory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Histórico de Análises
        </CardTitle>
        <CardDescription>Acompanhe o histórico de conformidade com o plano</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockHistory.map((item) => (
            <Card key={item.id} className={`border-l-4 ${item.passed ? "border-l-success" : "border-l-destructive"}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {item.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                    <div>
                      <p className="font-bold">{item.date}</p>
                      <p className="text-xs text-muted-foreground">{item.notes}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${item.passed ? "text-success" : "text-destructive"}`}>
                      {item.checklist}/{item.total}
                    </p>
                    <p className="text-xs text-muted-foreground">Checklist</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
