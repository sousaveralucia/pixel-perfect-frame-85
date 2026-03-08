import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calculator, AlertTriangle, TrendingUp, Target, DollarSign, ArrowUpDown } from "lucide-react";

/**
 * Trading Calculator – personalizada para operacional do trader.
 * Ativos: EURUSD, USDJPY, XAUUSD, NASDAQ, BTCUSD
 * Broker: Pepperstone | Gráfico: TradingView
 */

interface AssetConfig {
  label: string;
  type: "forex" | "index" | "commodity" | "crypto";
  pipSize: number;          // quanto vale 1 pip/ponto em preço
  pipLabel: string;         // "pips" ou "pontos"
  pipValuePerLot: number;   // valor em $ de 1 pip/ponto por 1 lote padrão
  stopRange: string;        // referência de stop médio
  decimals: number;         // casas decimais do preço
  multiplier: number;       // multiplicador de precisão para evitar floating point (1/pipSize)
  lotToUnits: number;       // conversão de lote para unidades (TradingView)
  stepSize: number;         // step de quantidade do símbolo no broker
  unitLabel: string;        // label para unidades no TradingView
}

const ASSETS: Record<string, AssetConfig> = {
  EURUSD: {
    label: "EUR/USD",
    type: "forex",
    pipSize: 0.0001,
    pipLabel: "pips",
    pipValuePerLot: 10,
    stopRange: "20-35 pips",
    decimals: 5,
    multiplier: 10000,
    lotToUnits: 100000,
    stepSize: 1000,
    unitLabel: "unidades",
  },
  USDJPY: {
    label: "USD/JPY",
    type: "forex",
    pipSize: 0.01,
    pipLabel: "pips",
    pipValuePerLot: 6.67,
    stopRange: "20-35 pips",
    decimals: 3,
    multiplier: 100,
    lotToUnits: 100000,
    stepSize: 1000,
    unitLabel: "unidades",
  },
  XAUUSD: {
    label: "XAU/USD",
    type: "commodity",
    pipSize: 0.01,
    pipLabel: "pontos",
    pipValuePerLot: 0.01,
    stopRange: "300-600 pontos",
    decimals: 2,
    multiplier: 100,
    lotToUnits: 100,
    stepSize: 1,
    unitLabel: "oz",
  },
  NASDAQ: {
    label: "NASDAQ",
    type: "index",
    pipSize: 1,
    pipLabel: "pontos",
    pipValuePerLot: 1,
    stopRange: "20-40 pontos",
    decimals: 1,
    multiplier: 1,
    lotToUnits: 1,
    stepSize: 0.1,
    unitLabel: "contratos",
  },
  BTCUSD: {
    label: "BTC/USD",
    type: "crypto",
    pipSize: 1,
    pipLabel: "pontos",
    pipValuePerLot: 1,
    stopRange: "1000-5000 pontos",
    decimals: 1,
    multiplier: 1,
    lotToUnits: 1,
    stepSize: 0.01,
    unitLabel: "BTC",
  },
};

const RISK_PRESETS = [10, 20, 30, 40, 50];

interface TradeResult {
  direction: "long" | "short";
  stopDistance: number;      // em pips/pontos
  lotSize: number;
  valuePerPip: number;
  tp2: number;
  tp3: number;
  tp4: number;
  profit2: number;
  profit3: number;
  profit4: number;
  rr: number;               // baseado no stop distance (será sempre calculado como stop→tp dividido)
}

export default function TradingCalculator() {
  const [selectedAsset, setSelectedAsset] = useState("EURUSD");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLossPrice, setStopLossPrice] = useState("");
  const [risk, setRisk] = useState("20");
  const [showSummary, setShowSummary] = useState(false);

  const asset = ASSETS[selectedAsset];

  const result = useMemo<TradeResult | null>(() => {
    const entry = parseFloat(entryPrice);
    const sl = parseFloat(stopLossPrice);
    const riskAmt = parseFloat(risk);

    if (!entry || !sl || !riskAmt || entry === sl) return null;

    const direction: "long" | "short" = entry > sl ? "long" : "short";
    const priceDiff = Math.abs(entry - sl);

    // Use multiplier to avoid floating point precision issues
    const entryInt = Math.round(entry * asset.multiplier);
    const slInt = Math.round(sl * asset.multiplier);
    const stopDistance = Math.abs(entryInt - slInt);

    if (stopDistance <= 0) return null;

    // Valor por pip = risco / distância do stop
    const valuePerPip = riskAmt / stopDistance;

    // Lot size = valor por pip / valor por pip por lote
    const rawLotSize = valuePerPip / asset.pipValuePerLot;

    // Quantidade em unidades (para TradingView)
    const rawUnits = rawLotSize * asset.lotToUnits;
    // Arredondar para o step do símbolo
    const units = Math.floor(rawUnits / asset.stepSize) * asset.stepSize;
    // Lot size arredondado baseado nas unidades
    const lotSize = units / asset.lotToUnits;

    // TPs baseados na distância do stop (em preço)
    const tpOffset2 = priceDiff * 2;
    const tpOffset3 = priceDiff * 3;
    const tpOffset4 = priceDiff * 4;

    const sign = direction === "long" ? 1 : -1;
    const tp2 = entry + sign * tpOffset2;
    const tp3 = entry + sign * tpOffset3;
    const tp4 = entry + sign * tpOffset4;

    return {
      direction,
      stopDistance,
      lotSize,
      units,
      valuePerPip,
      tp2,
      tp3,
      tp4,
      profit2: riskAmt * 2,
      profit3: riskAmt * 3,
      profit4: riskAmt * 4,
      rr: 3,
    };
  }, [entryPrice, stopLossPrice, risk, asset]);

  const formatPrice = (price: number) => price.toFixed(asset.decimals);

  const isRRBelowMin = result !== null; // RR is always based on stop distance, check if user's actual intended RR is below 3
  // The calculator always shows 1:2, 1:3, 1:4 so the warning shows when result exists and we note 1:2 is below plan

  return (
    <div className="space-y-6">
      {/* Main Calculator Card */}
      <Card className="border-primary/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calculator className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-lg">Calculadora de Trading</span>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                Pepperstone • TradingView
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Asset selector */}
          <div className="space-y-2">
            <Label>Ativo</Label>
            <Select value={selectedAsset} onValueChange={(v) => { setSelectedAsset(v); setShowSummary(false); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ASSETS).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      {cfg.label}
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {cfg.type === "forex" ? "Forex" : cfg.type === "commodity" ? "Ouro" : cfg.type === "index" ? "Índice" : "Cripto"}
                      </Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Stop médio: {asset.stopRange} • 1 {asset.pipLabel.slice(0, -1)} = {asset.pipSize}
            </p>
          </div>

          {/* Entry & Stop */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entry">Entrada (Entry)</Label>
              <Input
                id="entry"
                type="number"
                step={asset.pipSize}
                value={entryPrice}
                onChange={(e) => { setEntryPrice(e.target.value); setShowSummary(false); }}
                placeholder={selectedAsset === "EURUSD" ? "1.10000" : selectedAsset === "XAUUSD" ? "2350.00" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sl">Stop Loss</Label>
              <Input
                id="sl"
                type="number"
                step={asset.pipSize}
                value={stopLossPrice}
                onChange={(e) => { setStopLossPrice(e.target.value); setShowSummary(false); }}
                placeholder={selectedAsset === "EURUSD" ? "1.09970" : selectedAsset === "XAUUSD" ? "2345.00" : ""}
              />
            </div>
          </div>

          {/* Risk */}
          <div className="space-y-2">
            <Label>Risco ($)</Label>
            <div className="flex gap-2 flex-wrap">
              {RISK_PRESETS.map((r) => (
                <Button
                  key={r}
                  variant={risk === String(r) ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setRisk(String(r)); setShowSummary(false); }}
                  className="min-w-[52px]"
                >
                  ${r}
                </Button>
              ))}
              <Input
                type="number"
                value={risk}
                onChange={(e) => { setRisk(e.target.value); setShowSummary(false); }}
                className="w-24"
                placeholder="Custom"
              />
            </div>
          </div>

          {/* Auto results */}
          {result && (
            <div className="space-y-4 pt-4 border-t border-border">
              {/* Direction badge */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                <Badge variant={result.direction === "long" ? "default" : "destructive"} className={result.direction === "long" ? "bg-emerald-600 hover:bg-emerald-700" : ""}>
                  {result.direction === "long" ? "LONG (Compra)" : "SHORT (Venda)"}
                </Badge>
              </div>

              {/* Key metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-secondary/60 p-3 text-center border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Stop</p>
                  <p className="text-lg font-bold text-destructive">{result.stopDistance}</p>
                  <p className="text-[10px] text-muted-foreground">{asset.pipLabel}</p>
                </div>
                <div className="rounded-lg bg-secondary/60 p-3 text-center border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Lot Size</p>
                  <p className="text-lg font-bold text-primary">{result.lotSize.toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">lotes</p>
                </div>
                <div className="rounded-lg bg-secondary/60 p-3 text-center border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">$/pip</p>
                  <p className="text-lg font-bold text-foreground">${result.valuePerPip.toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">por {asset.pipLabel.slice(0, -1)}</p>
                </div>
              </div>

              {/* TP Levels */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" /> Take Profits
                </p>
                <div className="space-y-1.5">
                  {[
                    { label: "TP 1:2", price: result.tp2, profit: result.profit2, warn: true },
                    { label: "TP 1:3", price: result.tp3, profit: result.profit3, warn: false },
                    { label: "TP 1:4", price: result.tp4, profit: result.profit4, warn: false },
                  ].map((tp) => (
                    <div key={tp.label} className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-2 border border-border">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={tp.warn ? "border-amber-500 text-amber-600" : "border-emerald-500 text-emerald-600"}>
                          {tp.label}
                        </Badge>
                        <span className="text-sm font-mono text-foreground">{formatPrice(tp.price)}</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-600">+${tp.profit.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warning for 1:2 */}
              <Alert className="border-amber-500/50 bg-amber-500/5">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-amber-700 dark:text-amber-400 text-xs">
                  TP 1:2 está <strong>fora do plano</strong> (mínimo 1:3). Use apenas TP 1:3 ou superior.
                </AlertDescription>
              </Alert>

              {/* Generate Trade Button */}
              <Button
                onClick={() => setShowSummary(true)}
                className="w-full"
                size="lg"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Gerar Trade
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trade Summary */}
      {showSummary && result && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Resumo do Trade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {[
                ["Ativo", asset.label],
                ["Direção", result.direction === "long" ? "LONG" : "SHORT"],
                ["Entry", formatPrice(parseFloat(entryPrice))],
                ["Stop Loss", formatPrice(parseFloat(stopLossPrice))],
                ["Stop", `${result.stopDistance} ${asset.pipLabel}`],
                ["Lot Size", result.lotSize.toFixed(2)],
                ["Risco", `$${parseFloat(risk).toFixed(0)}`],
                ["$/pip", `$${result.valuePerPip.toFixed(2)}`],
                ["TP 1:2", formatPrice(result.tp2)],
                ["TP 1:3", formatPrice(result.tp3)],
                ["TP 1:4", formatPrice(result.tp4)],
                ["Lucro 1:3", `$${result.profit3.toFixed(0)}`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-mono font-semibold text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
