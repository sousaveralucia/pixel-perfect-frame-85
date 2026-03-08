import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ClipboardCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const checklistItems = [
  "Verificar prontidão mental e emocional",
  "Confirmar CHoCH válido em HTF (H4, H2 ou H1)",
  "Traçar Caixa de Gann em M30",
  "Identificar Order Blocks descontados (50% da Gann)",
  "Validar OB em timeframe adequado (H4, H2, H1 ou M30)",
  "Confirmar entrada no 50% do Order Block",
  "Definir Stop Loss com folga abaixo/acima do OB",
  "Garantir Take Profit mínimo 1:3",
  "Confirmar tempo gráfico operacional (M15 ou M5)",
  "Verificar calendário econômico para eventos de alto impacto",
];

export default function DailyValidation() {
  const [checked, setChecked] = useState<boolean[]>(new Array(checklistItems.length).fill(false));

  const handleToggle = (index: number) => {
    const updated = [...checked];
    updated[index] = !updated[index];
    setChecked(updated);
  };

  const completedCount = checked.filter(Boolean).length;
  const allDone = completedCount === checklistItems.length;

  const handleValidate = () => {
    if (allDone) {
      toast.success("✅ Validação diária completa! Você está pronto para operar.");
    } else {
      toast.warning(`⚠️ Faltam ${checklistItems.length - completedCount} itens para completar a validação.`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-primary" />
          Validação Diária
        </CardTitle>
        <CardDescription>
          Complete o checklist antes de iniciar as operações ({completedCount}/{checklistItems.length})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="bg-secondary rounded-full h-3">
          <div
            className={`rounded-full h-3 transition-all ${allDone ? "bg-success" : "bg-primary"}`}
            style={{ width: `${(completedCount / checklistItems.length) * 100}%` }}
          />
        </div>

        <div className="space-y-3">
          {checklistItems.map((item, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                checked[i] ? "bg-success/5 border-success/30" : "bg-secondary/30 border-border"
              }`}
            >
              <Checkbox checked={checked[i]} onCheckedChange={() => handleToggle(i)} className="mt-0.5" />
              <span className={`text-sm ${checked[i] ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {item}
              </span>
            </div>
          ))}
        </div>

        <Button onClick={handleValidate} className="w-full" size="lg">
          {allDone ? "✅ Validação Completa - Pronto para Operar" : "Validar Checklist"}
        </Button>
      </CardContent>
    </Card>
  );
}
