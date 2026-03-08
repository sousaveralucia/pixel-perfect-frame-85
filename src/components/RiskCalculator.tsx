import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calculator } from "lucide-react";
import { useState } from "react";

export default function RiskCalculator() {
  const [balance, setBalance] = useState(1000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [stopLossPips, setStopLossPips] = useState(20);
  const [pipValue, setPipValue] = useState(10);

  const riskAmount = (balance * riskPercent) / 100;
  const lotSize = stopLossPips > 0 && pipValue > 0 ? riskAmount / (stopLossPips * pipValue) : 0;
  const tp13 = stopLossPips * 3;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          Calculadora de Risco
        </CardTitle>
        <CardDescription>Calcule o tamanho da posição baseado no seu gerenciamento de risco</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Saldo da Conta ($)</Label>
            <Input type="number" value={balance} onChange={(e) => setBalance(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Risco por Trade (%)</Label>
            <Input type="number" value={riskPercent} onChange={(e) => setRiskPercent(Number(e.target.value))} step={0.5} />
          </div>
          <div className="space-y-2">
            <Label>Stop Loss (pips)</Label>
            <Input type="number" value={stopLossPips} onChange={(e) => setStopLossPips(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Valor do Pip ($)</Label>
            <Input type="number" value={pipValue} onChange={(e) => setPipValue(Number(e.target.value))} />
          </div>
        </div>

        <Separator />

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-primary bg-primary/5">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Risco ($)</p>
              <p className="text-2xl font-bold text-primary">${riskAmount.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-success bg-success/5">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Tamanho do Lote</p>
              <p className="text-2xl font-bold text-success">{lotSize.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-chart-4 bg-success/5">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">TP 1:3 (pips)</p>
              <p className="text-2xl font-bold text-success">{tp13}</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
