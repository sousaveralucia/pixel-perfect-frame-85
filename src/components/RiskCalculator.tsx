import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calculator, Save } from "lucide-react";
import { saveCalculationToHistory } from "./CalculationHistory";
import { toast } from "sonner";

/**
 * Risk Calculator Component
 * Calcula o tamanho da posição baseado em capital, risco e R:R
 * Converte valores para pips para cada ativo
 */

interface CalculationResult {
  positionSize: number;
  stopLossDistance: number;
  takeProfitDistance: number;
  pipsAtRisk: number;
  pipsPotentialProfit: number;
  riskReward: string;
}

// Pip values for different assets (value per pip per standard lot)
const PIP_VALUES: Record<string, number> = {
  "GBP/USD": 10, // 1 pip = $10 per standard lot (100k)
  "USD/JPY": 9.26, // 1 pip = $9.26 per standard lot
  "XAU/USD": 0.01, // 1 pip = $0.01 per standard lot (100 oz)
};

const PIP_DECIMALS: Record<string, number> = {
  "GBP/USD": 4,
  "USD/JPY": 2,
  "XAU/USD": 2,
};

export default function RiskCalculator() {
  const [capital, setCapital] = useState("150");
  const [selectedAsset, setSelectedAsset] = useState("GBP/USD");
  const [riskType, setRiskType] = useState("optimal"); // optimal or risky
  const [stopLoss, setStopLoss] = useState(riskType === "optimal" ? "25" : "15");
  const [rrRatio, setRrRatio] = useState("3");
  const [currentPrice, setCurrentPrice] = useState("");
  const [result, setResult] = useState<CalculationResult | null>(null);

  // Update stop loss when risk type changes
  const handleRiskTypeChange = (type: string) => {
    setRiskType(type);
    setStopLoss(type === "optimal" ? "25" : "15");
  };

  const calculateRisk = () => {
    const capitalNum = parseFloat(capital);
    const stopLossNum = parseFloat(stopLoss);
    const rrNum = parseFloat(rrRatio);
    const currentPriceNum = currentPrice ? parseFloat(currentPrice) : null;

    if (!capitalNum || !stopLossNum || !rrNum) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    // Calculate position size
    const positionSize = (capitalNum * 0.01) / stopLossNum; // 1% risk per trade
    const takeProfitValue = stopLossNum * rrNum;

    // Calculate pips (if current price is provided)
    let pipsAtRisk = 0;
    let pipsPotentialProfit = 0;

    if (currentPriceNum && PIP_DECIMALS[selectedAsset]) {
      const pipDecimal = Math.pow(10, -PIP_DECIMALS[selectedAsset]);
      pipsAtRisk = Math.round(stopLossNum / (currentPriceNum * pipDecimal));
      pipsPotentialProfit = Math.round(takeProfitValue / (currentPriceNum * pipDecimal));
    }

    setResult({
      positionSize,
      stopLossDistance: stopLossNum,
      takeProfitDistance: takeProfitValue,
      pipsAtRisk,
      pipsPotentialProfit,
      riskReward: `1:${rrNum}`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          Calculadora de Risco
        </CardTitle>
        <CardDescription>Calcule o tamanho da posição e converta para pips</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="calculator" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calculator">Calculadora</TabsTrigger>
            <TabsTrigger value="reference">Referência de Pips</TabsTrigger>
          </TabsList>

          {/* Calculator Tab */}
          <TabsContent value="calculator" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Capital */}
              <div className="space-y-2">
                <Label htmlFor="capital">Capital Total ($)</Label>
                <Input
                  id="capital"
                  type="number"
                  value={capital}
                  onChange={(e) => setCapital(e.target.value)}
                  placeholder="150"
                  className="border-border"
                />
                <p className="text-xs text-muted-foreground">Seu saldo atual</p>
              </div>

              {/* Asset Selection */}
              <div className="space-y-2">
                <Label htmlFor="asset">Ativo</Label>
                <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                  <SelectTrigger id="asset">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GBP/USD">GBP/USD</SelectItem>
                    <SelectItem value="USD/JPY">USD/JPY</SelectItem>
                    <SelectItem value="XAU/USD">XAU/USD (Ouro)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Risk Type */}
              <div className="space-y-2">
                <Label>Tipo de Trade</Label>
                <div className="flex gap-2">
                  <Button
                    variant={riskType === "optimal" ? "default" : "outline"}
                    onClick={() => handleRiskTypeChange("optimal")}
                    className="flex-1"
                  >
                    Ótimo ($25)
                  </Button>
                  <Button
                    variant={riskType === "risky" ? "default" : "outline"}
                    onClick={() => handleRiskTypeChange("risky")}
                    className="flex-1"
                  >
                    Arriscado ($15)
                  </Button>
                </div>
              </div>

              {/* Stop Loss */}
              <div className="space-y-2">
                <Label htmlFor="stopLoss">Stop Loss ($)</Label>
                <Input
                  id="stopLoss"
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  placeholder="25"
                  className="border-border"
                />
                <p className="text-xs text-muted-foreground">Valor a arriscar</p>
              </div>

              {/* R:R Ratio */}
              <div className="space-y-2">
                <Label htmlFor="rrRatio">Relação Risco:Retorno</Label>
                <div className="flex gap-2">
                  <span className="flex items-center text-foreground font-medium">1:</span>
                  <Input
                    id="rrRatio"
                    type="number"
                    value={rrRatio}
                    onChange={(e) => setRrRatio(e.target.value)}
                    placeholder="3"
                    className="border-border"
                  />
                </div>
              </div>

              {/* Current Price (Optional) */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="currentPrice">Preço Atual (Opcional - para cálculo em pips)</Label>
                <Input
                  id="currentPrice"
                  type="number"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                  placeholder="Ex: 1.2850"
                  step="0.0001"
                  className="border-border"
                />
              </div>
            </div>

            {/* Calculate Button */}
            <div className="flex gap-2">
              <Button onClick={calculateRisk} className="flex-1 bg-primary hover:bg-primary/90">
                Calcular
              </Button>
              {result && (
                <Button
                  onClick={() => {
                    saveCalculationToHistory({
                      capital: parseFloat(capital),
                      asset: selectedAsset,
                      riskType: riskType as "optimal" | "risky",
                      stopLoss: parseFloat(stopLoss),
                      rrRatio: parseFloat(rrRatio),
                      currentPrice: currentPrice ? parseFloat(currentPrice) : 0,
                      positionSize: result.positionSize,
                      takeProfitValue: result.takeProfitDistance,
                      pipsAtRisk: result.pipsAtRisk,
                      pipsPotentialProfit: result.pipsPotentialProfit,
                    });
                    toast.success("Cálculo salvo no histórico!");
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
              )}
            </div>

            {/* Results */}
            {result && (
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="font-bold text-foreground">Resultados</h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-secondary/50 p-4 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Tamanho da Posição</p>
                    <p className="text-2xl font-bold text-primary">${result.positionSize.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Valor a investir</p>
                  </div>

                  <div className="bg-secondary/50 p-4 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Stop Loss</p>
                    <p className="text-2xl font-bold text-destructive">${result.stopLossDistance.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Risco máximo</p>
                  </div>

                  <div className="bg-secondary/50 p-4 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Take Profit</p>
                    <p className="text-2xl font-bold text-green-600">${result.takeProfitDistance.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Lucro potencial</p>
                  </div>

                  <div className="bg-secondary/50 p-4 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Relação Risco:Retorno</p>
                    <p className="text-2xl font-bold text-primary">{result.riskReward}</p>
                    <p className="text-xs text-muted-foreground mt-1">Proporção</p>
                  </div>
                </div>

                {/* Pips Calculation */}
                {result.pipsAtRisk > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-2">
                    <p className="font-bold text-blue-900">Conversão em Pips ({selectedAsset})</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-blue-900">Pips em Risco</p>
                        <p className="text-xl font-bold text-blue-900">{result.pipsAtRisk}</p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-900">Pips de Lucro</p>
                        <p className="text-xl font-bold text-green-600">{result.pipsPotentialProfit}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-900">
                    <strong>Lembre-se:</strong> Esta calculadora usa 1% de risco por trade. Ajuste conforme necessário para sua estratégia pessoal.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Reference Tab */}
          <TabsContent value="reference" className="space-y-4">
            <div className="space-y-4">
              <p className="text-sm text-foreground/90">
                Referência de valores de pips para cada ativo (por lote padrão de 100k unidades):
              </p>

              {Object.entries(PIP_VALUES).map(([asset, pipValue]) => (
                <div key={asset} className="bg-secondary/50 p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-foreground">{asset}</p>
                    <Badge className="bg-primary text-primary-foreground">{PIP_DECIMALS[asset]} decimais</Badge>
                  </div>
                  <p className="text-sm text-foreground/90">
                    <strong>1 pip = ${pipValue.toFixed(2)}</strong> por lote padrão
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Exemplo: Se você arriscar $25, isso equivale a aproximadamente {Math.round(25 / pipValue)} pips
                  </p>
                </div>
              ))}

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>Dica:</strong> Use a calculadora acima inserindo o preço atual para obter conversões precisas em pips para sua operação.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
