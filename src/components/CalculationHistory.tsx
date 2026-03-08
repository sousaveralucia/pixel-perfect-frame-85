import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Calculation History Component
 * Histórico de cálculos de risco salvos para comparação
 */

interface SavedCalculation {
  id: string;
  timestamp: string;
  capital: number;
  asset: string;
  riskType: "optimal" | "risky";
  stopLoss: number;
  rrRatio: number;
  currentPrice: number;
  positionSize: number;
  takeProfitValue: number;
  pipsAtRisk: number;
  pipsPotentialProfit: number;
}

const STORAGE_KEY = "calculation_history";

export default function CalculationHistory() {
  const { user } = useAuth();
  const [calculations, setCalculations] = useState<SavedCalculation[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("calculation_history").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      if (data) {
        setCalculations(data.map((r: any) => ({
          id: r.id,
          timestamp: r.timestamp || r.created_at,
          capital: Number(r.capital),
          asset: r.asset || "",
          riskType: r.risk_type || "optimal",
          stopLoss: Number(r.stop_loss),
          rrRatio: Number(r.rr_ratio),
          currentPrice: Number(r.current_price),
          positionSize: Number(r.position_size),
          takeProfitValue: Number(r.take_profit_value),
          pipsAtRisk: Number(r.pips_at_risk),
          pipsPotentialProfit: Number(r.pips_potential_profit),
        })));
      }
      setIsLoaded(true);
    });
  }, [user]);

  const addCalculation = async (calc: Omit<SavedCalculation, "id" | "timestamp">) => {
    if (!user) return;
    const { data } = await supabase.from("calculation_history").insert({
      user_id: user.id,
      timestamp: new Date().toISOString(),
      capital: calc.capital,
      asset: calc.asset,
      risk_type: calc.riskType,
      stop_loss: calc.stopLoss,
      rr_ratio: calc.rrRatio,
      current_price: calc.currentPrice,
      position_size: calc.positionSize,
      take_profit_value: calc.takeProfitValue,
      pips_at_risk: calc.pipsAtRisk,
      pips_potential_profit: calc.pipsPotentialProfit,
    }).select().single();
    if (data) {
      setCalculations(prev => [{
        id: data.id,
        timestamp: data.timestamp || data.created_at,
        capital: Number(data.capital),
        asset: data.asset || "",
        riskType: (data.risk_type || "optimal") as any,
        stopLoss: Number(data.stop_loss),
        rrRatio: Number(data.rr_ratio),
        currentPrice: Number(data.current_price),
        positionSize: Number(data.position_size),
        takeProfitValue: Number(data.take_profit_value),
        pipsAtRisk: Number(data.pips_at_risk),
        pipsPotentialProfit: Number(data.pips_potential_profit),
      }, ...prev]);
    }
    toast.success("Cálculo salvo no histórico!");
  };

  const deleteCalculation = async (id: string) => {
    if (!user) return;
    await supabase.from("calculation_history").delete().eq("id", id).eq("user_id", user.id);
    setCalculations(calculations.filter((c) => c.id !== id));
    toast.success("Cálculo removido!");
  };

  // Copiar cálculo para clipboard
  const copyToClipboard = (calc: SavedCalculation) => {
    const text = `
Cálculo de Risco - ${new Date(calc.timestamp).toLocaleString("pt-BR")}
Ativo: ${calc.asset}
Capital: $${calc.capital}
Tipo: ${calc.riskType === "optimal" ? "Ótimo ($25)" : "Arriscado ($15)"}
Stop Loss: $${calc.stopLoss}
R:R: 1:${calc.rrRatio}
Preço Atual: ${calc.currentPrice}
---
Tamanho da Posição: $${calc.positionSize.toFixed(2)}
Take Profit: $${calc.takeProfitValue.toFixed(2)}
Pips em Risco: ${calc.pipsAtRisk}
Pips de Lucro: ${calc.pipsPotentialProfit}
    `.trim();

    navigator.clipboard.writeText(text);
    toast.success("Copiado para clipboard!");
  };

  // Exportar histórico como JSON
  const exportAsJSON = () => {
    const dataStr = JSON.stringify(calculations, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `calculation_history_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    toast.success("Histórico exportado!");
  };

  if (!isLoaded) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Cálculos</CardTitle>
        <CardDescription>Salve e compare seus cenários de risco</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Botão de Exportação */}
        {calculations.length > 0 && (
          <Button variant="outline" onClick={exportAsJSON} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Exportar Histórico
          </Button>
        )}

        {/* Lista de Cálculos */}
        {calculations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum cálculo salvo ainda.</p>
            <p className="text-sm mt-2">Use a Calculadora de Risco e clique em "Salvar Cálculo" para adicionar ao histórico.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {calculations.map((calc) => (
              <div key={calc.id} className="p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-foreground">{calc.asset}</p>
                      <Badge className={calc.riskType === "optimal" ? "bg-green-100 text-green-900" : "bg-orange-100 text-orange-900"}>
                        {calc.riskType === "optimal" ? "Ótimo" : "Arriscado"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {new Date(calc.timestamp).toLocaleString("pt-BR")}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div>
                        <p className="text-foreground/60">Capital</p>
                        <p className="font-bold">${calc.capital}</p>
                      </div>
                      <div>
                        <p className="text-foreground/60">Stop Loss</p>
                        <p className="font-bold">${calc.stopLoss}</p>
                      </div>
                      <div>
                        <p className="text-foreground/60">R:R</p>
                        <p className="font-bold">1:{calc.rrRatio}</p>
                      </div>
                      <div>
                        <p className="text-foreground/60">Posição</p>
                        <p className="font-bold">${calc.positionSize.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-2xl font-bold text-primary mb-2">${calc.takeProfitValue.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mb-3">Take Profit</p>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(calc)}
                        className="text-foreground/60 hover:bg-primary/10"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCalculation(calc.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Pips Info */}
                {calc.pipsAtRisk > 0 && (
                  <div className="bg-blue-50 p-2 rounded border border-blue-200 text-xs text-blue-900 mt-3">
                    <strong>Pips:</strong> {calc.pipsAtRisk} em risco | {calc.pipsPotentialProfit} de lucro potencial
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Export function para usar na Calculadora
export const saveCalculationToHistory = (calc: Omit<SavedCalculation, "id" | "timestamp">) => {
  const stored = localStorage.getItem(STORAGE_KEY) || "[]";
  const calculations = JSON.parse(stored) as SavedCalculation[];

  const newCalc: SavedCalculation = {
    ...calc,
    id: `calc_${Date.now()}`,
    timestamp: new Date().toISOString(),
  };

  const updated = [newCalc, ...calculations];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};
