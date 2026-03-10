import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle2, TrendingUp, Target, Clock, Zap, Moon, Sun, LogOut, ClipboardCheck, ArrowRight, Eye, ListChecks, ChevronDown, BarChart2, Layers, Grid3X3, Droplets, Shield, Brain, Pencil } from "lucide-react";
import { useCustomChecklists } from "@/hooks/useCustomChecklists";
import ChecklistEditor from "@/components/ChecklistEditor";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAccountManager } from "@/hooks/useAccountManager";
import { useTradeJournalUnified } from "@/hooks/useTradeJournalUnified";
import TradingCalculator from "@/components/TradingCalculator";
import EconomicCalendar from "@/components/EconomicCalendar";
import NewsAlerts from "@/components/NewsAlerts";
import TradeJournalEnhanced from "@/components/TradeJournalEnhanced";
import PerformanceDashboard from "@/components/PerformanceDashboard";
import StrategyComparisonEnhanced from "@/components/StrategyComparisonEnhanced";
import ReportExportEnhanced from "@/components/ReportExportEnhanced";
import AccountSelector from "@/components/AccountSelector";
import AnalysisHistory from "@/components/AnalysisHistory";
import DailyValidation from "@/components/DailyValidation";
import AssetPerformanceAnalysis from "@/components/AssetPerformanceAnalysis";
import { TradingCalendar } from "@/components/TradingCalendar";
import CalculationHistory from "@/components/CalculationHistory";
import { EquityAndPerformanceCharts } from "@/components/EquityAndPerformanceCharts";
import Withdrawals from "@/components/Withdrawals";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full"
      title={`Alternar para tema ${theme === "light" ? "escuro" : "claro"}`}>
      
      {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Button>);

}

export default function Home() {
  const { signOut } = useAuth();
  const { accounts, activeAccountId, getActiveAccount, switchAccount } = useAccountManager();
  const { trades } = useTradeJournalUnified(activeAccountId);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState(false);
  const [editingGoldenRule, setEditingGoldenRule] = useState(false);
  const planChecklist = useCustomChecklists("plan");
  const goldenRuleChecklist = useCustomChecklists("goldenRule");
  const activeAccount = getActiveAccount();
  const currentBalance = activeAccount?.currentBalance ?? 0;
  const initialBalance = activeAccount?.initialBalance ?? 0;
  const balancePct = initialBalance > 0 ? (currentBalance - initialBalance) / initialBalance * 100 : 0;
  const isPositive = balancePct >= 0;

  return (
    <div className="min-h-screen bg-[#c7c7c7]">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-10 bg-[#fbbd23]/[0.47]">
        <div className="container py-6 bg-[#f59f0a]/0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black bg-[#d9f99f]/0">Trading Journal Profissional </h1>
              <p className="mt-1 text-black text-xl text-left font-serif bg-[#d8ff8f]/0">Trading Journal Pofissional - Everything you need for to be a profissional trader.     </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={activeAccountId} onValueChange={switchAccount}>
                <SelectTrigger className="w-[180px] h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) =>
                  <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <div className="gap-2 px-3 py-1.5 border-primary border-0 shadow-none opacity-100 flex-row border-none flex items-center justify-center text-[#e9560c]/0 rounded-xl bg-white">
                <span className="text-sm font-bold text-foreground">${currentBalance.toFixed(2)}</span>
                <span className={`text-xs font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? '+' : ''}{balancePct.toFixed(1)}%
                </span>
              </div>
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={signOut} className="rounded-full" title="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12 border-black/0 bg-[#fbbd23]/0">
        <Tabs defaultValue="calendario-trading" className="w-full bg-neutral-600">
          <TabsList className="flex w-full mb-8 overflow-x-auto gap-1 bg-secondary/30 p-1 rounded-lg border border-border">
            <TabsTrigger value="calendario-trading" className="text-xs whitespace-nowrap">Calendário</TabsTrigger>
            <TabsTrigger value="contas" className="text-xs whitespace-nowrap">Contas</TabsTrigger>
            <TabsTrigger value="autoconhecimento" className="text-xs whitespace-nowrap">Pessoal</TabsTrigger>
            <TabsTrigger value="ativos" className="text-xs whitespace-nowrap">Ativos</TabsTrigger>
            <TabsTrigger value="estrategia" className="text-xs whitespace-nowrap">Estratégia</TabsTrigger>
            <TabsTrigger value="validacao" className="text-xs whitespace-nowrap">Pré-Op</TabsTrigger>
            <TabsTrigger value="rotina" className="text-xs whitespace-nowrap">Rotina</TabsTrigger>
            <TabsTrigger value="alertas" className="text-xs whitespace-nowrap">Alertas</TabsTrigger>
            <TabsTrigger value="analises" className="text-xs whitespace-nowrap">Análises</TabsTrigger>
            <TabsTrigger value="calculadora" className="text-xs whitespace-nowrap">Calculadora</TabsTrigger>
            <TabsTrigger value="diario" className="text-xs whitespace-nowrap">Diário</TabsTrigger>
            <TabsTrigger value="calendario" className="text-xs whitespace-nowrap">Cal. Econômico</TabsTrigger>
            <TabsTrigger value="insights" className="text-xs whitespace-nowrap">Insights</TabsTrigger>
            <TabsTrigger value="comparacao" className="text-xs whitespace-nowrap">Comparação</TabsTrigger>
            <TabsTrigger value="relatorio" className="text-xs whitespace-nowrap">Relatório</TabsTrigger>
            <TabsTrigger value="saques" className="text-xs whitespace-nowrap">Saques</TabsTrigger>
          </TabsList>

          <TabsContent value="calendario-trading" className="space-y-6">
            <TradingCalendar activeAccountId={activeAccountId} />
          </TabsContent>

          <TabsContent value="autoconhecimento" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Autoconhecimento
                </CardTitle>
                <CardDescription>Entenda seus objetivos, motivações e características como trader</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-bold text-foreground mb-3">Por que você faz trade? Quais são seus objetivos?</h3>
                  <p className="text-foreground/80">
                    O principal objetivo é <strong>viver do mercado financeiro e sair do regime CLT</strong>, buscando uma melhor qualidade de vida, mais liberdade e remuneração justa.
                  </p>
                </div>
                <Separator />
                <div>
                  <h3 className="font-bold text-foreground mb-3">Regime de Operação</h3>
                  <Badge className="bg-primary/10 text-primary">Meio Período</Badge>
                  <p className="text-sm text-foreground/80 mt-2">Operações nas horas vagas disponíveis do trabalho CLT</p>
                </div>
                <Separator />
                <div>
                  <h3 className="font-bold text-foreground mb-3">Motivação Principal</h3>
                  <p className="text-foreground/80">
                    A esperança de poder <strong>mudar de vida</strong> para si e para a família é a principal motivação.
                  </p>
                </div>
                <Separator />
                <div>
                  <h3 className="font-bold text-foreground mb-3">5 Pontos Fortes</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                    { title: "Persistência", desc: "Capacidade de continuar buscando o objetivo" },
                    { title: "Força de vontade", desc: "Determinação para alcançar o sucesso" },
                    { title: "Tempo para estudar", desc: "Dedicação extra ao aprendizado" },
                    { title: "Foco no objetivo", desc: "Clareza sobre viver do mercado" },
                    { title: "Paciência", desc: "Esperar pelas melhores oportunidades" }].
                    map((point, idx) =>
                    <Card key={idx} className="bg-success/5 border-success/20">
                        <CardContent className="pt-4">
                          <p className="font-bold text-success">{point.title}</p>
                          <p className="text-sm text-muted-foreground">{point.desc}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="font-bold text-foreground mb-3">5 Pontos Fracos e Estratégias</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                    { title: "Emocional", strategy: "Controle emocional através de mindfulness e revisão pós-trade" },
                    { title: "Contas apertadas", strategy: "Gerenciar capital de forma conservadora" },
                    { title: "Ansiedade", strategy: "Rotinas pré-trade e técnicas de respiração" },
                    { title: "Falta de disciplina", strategy: "Checklist diário rigoroso" },
                    { title: "Sair do plano", strategy: "Pausa forçada após cada desvio" }].
                    map((point, idx) =>
                    <Card key={idx} className="bg-destructive/5 border-destructive/20">
                        <CardContent className="pt-4">
                          <p className="font-bold text-destructive">{point.title}</p>
                          <p className="text-sm text-muted-foreground">{point.strategy}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
                <Separator />
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-success/5 border-success/20">
                    <CardContent className="pt-6">
                      <p className="font-bold text-success mb-2">DIAS BONS</p>
                      <p className="text-sm text-muted-foreground">
                        "Hoje, a disciplina e a paciência foram recompensadas. Cada trade executado conforme o plano me aproxima da liberdade financeira."
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-destructive/5 border-destructive/20">
                    <CardContent className="pt-6">
                      <p className="font-bold text-destructive mb-2">DIAS RUINS</p>
                      <p className="text-sm text-muted-foreground">
                        "Um dia de aprendizado não é um dia perdido. Mantenho o foco no objetivo maior e volto mais forte amanhã."
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contas" className="space-y-6">
            <AccountSelector />
          </TabsContent>

          <TabsContent value="ativos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Ativos Operados
                </CardTitle>
                <CardDescription>5 ativos principais para operação</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                  { symbol: "EUR/USD", type: "Forex", session: "Sessão Europeia" },
                  { symbol: "USDJPY", type: "Forex", session: "Sessão Asiática" },
                  { symbol: "XAUUSD", type: "Commodity", session: "24 horas" },
                  { symbol: "NASDAQ", type: "Índice", session: "Sessão Americana" },
                  { symbol: "BTC USD", type: "Criptomoeda", session: "24 horas" }].
                  map((asset) =>
                  <Card key={asset.symbol} className="border-l-4 border-l-primary">
                      <CardContent className="pt-6">
                        <p className="text-2xl font-bold text-primary">{asset.symbol}</p>
                        <p className="text-sm text-muted-foreground">{asset.type}</p>
                        <p className="text-xs text-muted-foreground mt-2">{asset.session}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estrategia" className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground bg-neutral-600/0">Minha Estratégia</h2>
                <p className="text-sm text-muted-foreground">Smart Money Concepts — Modelo Operacional Completo</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">ICT / SMC</span>
              </div>
            </div>

            {/* Visão Geral da Estratégia */}
            <Card className="border overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Eye className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground mb-1">Visão Geral</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Opero com base em <strong className="text-foreground">Smart Money Concepts</strong>: identifico a estrutura 
                      de mercado em timeframes maiores (HTF), busco confirmação de mudança de caráter (CHoCH/BOS), 
                      e entro em <strong className="text-foreground">Order Blocks descontados</strong> dentro da Caixa de Gann 
                      com RR mínimo de 1:3. Ativos: EUR/USD, USD/JPY, XAU/USD, NAS100, BTC/USD e DXY como referência.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fluxo Operacional - Passo a Passo */}
            <Card className="border">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                    <ListChecks className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Checklist Operacional — 8 Passos</CardTitle>
                </div>
                <CardDescription className="text-xs">Seguir na ordem. Não pular etapas.</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {[
                  {
                    step: 1,
                    title: "CHoCH Válido em HTF",
                    timeframe: "H4 / H2 / H1",
                    desc: "Identificar mudança de caráter: um LOW ou HIGH protegido rompido com corpo de candle.",
                    detail: "CHoCH = Change of Character. É a primeira confirmação de que o mercado pode estar mudando de direção. Sem CHoCH válido, não há setup.",
                    tag: "Estrutura",
                    tagColor: "bg-primary/10 text-primary border-primary/20"
                  },
                  {
                    step: 2,
                    title: "Caixa de Gann em M30",
                    timeframe: "M30",
                    desc: "Traçar do início do movimento até o fim do CHoCH. Usar regiões 0%, 50% e 100%.",
                    detail: "A Caixa de Gann define a zona premium (acima de 50%) e discount (abaixo de 50%). Só opero em zonas de desconto para compra e premium para venda.",
                    tag: "Gann",
                    tagColor: "bg-chart-3/10 text-chart-3 border-chart-3/20"
                  },
                  {
                    step: 3,
                    title: "Order Blocks Descontados",
                    timeframe: "50% da Gann",
                    desc: "Apenas OBs abaixo de 50% (compra) ou acima de 50% (venda).",
                    detail: "Order Blocks fora da zona de desconto têm menor probabilidade. A confluência com a Gann aumenta a taxa de acerto significativamente.",
                    tag: "Desconto",
                    tagColor: "bg-success/10 text-success border-success/20"
                  },
                  {
                    step: 4,
                    title: "Order Blocks Válidos",
                    timeframe: "H4 / H2 / H1 / M30",
                    desc: "Se candle com muito pavio e pouco corpo → traçar o candle inteiro.",
                    detail: "Um OB válido é o último candle de baixa antes de um impulso de alta (ou vice-versa). Deve ter causado deslocamento significativo no preço.",
                    tag: "OB",
                    tagColor: "bg-warning/10 text-warning border-warning/20"
                  },
                  {
                    step: 5,
                    title: "Entrada no 50% do Order Block",
                    timeframe: "M15 / M5",
                    desc: "Identificar ineficiências de HTF e entrar sempre no 50% da região.",
                    detail: "O 50% do OB é o ponto ótimo de entrada (OTE — Optimal Trade Entry). Garante melhor RR e stop mais curto. Usar limit order.",
                    tag: "Entrada",
                    tagColor: "bg-destructive/10 text-destructive border-destructive/20"
                  },
                  {
                    step: 6,
                    title: "Stop Loss com Folga",
                    timeframe: "M30+",
                    desc: "Stop abaixo/acima do OB com folga. Nunca stop no extremo exato.",
                    detail: "Adicionar 5-10 pips de folga além do OB. Stops apertados demais são varridos por liquidez institucional antes do movimento real.",
                    tag: "Proteção",
                    tagColor: "bg-chart-2/10 text-chart-2 border-chart-2/20"
                  },
                  {
                    step: 7,
                    title: "Take Profit Mínimo 1:3",
                    timeframe: "Obrigatório",
                    desc: "RR mínimo de 1:3. Abaixo disso, não entrar.",
                    detail: "Com 1:3, você pode errar 2 de cada 3 trades e ainda ficar positivo. É a base matemática que torna a estratégia sustentável no longo prazo.",
                    tag: "RR",
                    tagColor: "bg-chart-4/10 text-chart-4 border-chart-4/20"
                  },
                  {
                    step: 8,
                    title: "Confirmação em LTF",
                    timeframe: "M15 / M5",
                    desc: "Confirmar o setup no tempo gráfico operacional antes de executar.",
                    detail: "Buscar CHoCH ou BOS em M15/M5 dentro do Order Block de HTF. É a confirmação final antes de posicionar a ordem.",
                    tag: "Execução",
                    tagColor: "bg-ring/10 text-ring border-ring/20"
                  }].
                  map((item, idx) =>
                  <details key={idx} className="group">
                      <summary className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-muted-foreground/30 cursor-pointer transition-colors bg-card">
                        <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {item.step}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-foreground">{item.title}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${item.tagColor}`}>{item.tag}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono flex-shrink-0">{item.timeframe}</span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180 flex-shrink-0" />
                      </summary>
                      <div className="mt-1 ml-10 mr-3 mb-2 p-3 rounded-lg bg-muted/50 border border-border">
                        <p className="text-xs text-foreground/80 leading-relaxed">{item.detail}</p>
                      </div>
                    </details>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Conceitos Chave */}
            <div className="grid grid-cols-2 gap-3">
              {[
              { icon: <TrendingUp className="w-4 h-4" />, title: "CHoCH", desc: "Mudança de caráter — primeiro sinal de reversão" },
              { icon: <BarChart2 className="w-4 h-4" />, title: "BOS", desc: "Break of Structure — continuação de tendência" },
              { icon: <Layers className="w-4 h-4" />, title: "Order Block", desc: "Última vela contrária antes do impulso" },
              { icon: <Grid3X3 className="w-4 h-4" />, title: "Gann Box", desc: "Ferramenta de desconto — 0%, 50%, 100%" },
              { icon: <Droplets className="w-4 h-4" />, title: "Liquidez", desc: "Pools de ordens acima/abaixo de highs/lows" },
              { icon: <Zap className="w-4 h-4" />, title: "FVG / Imbalance", desc: "Gap de valor justo — região de ineficiência" }].
              map((concept, idx) =>
              <Card key={idx} className="border hover:border-primary/30 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        {concept.icon}
                      </div>
                      <span className="font-semibold text-xs text-foreground">{concept.title}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{concept.desc}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Gestão de Risco */}
            <Card className="border">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-destructive" />
                  <CardTitle className="text-sm font-semibold">Gestão de Risco</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <p className="text-2xl font-bold text-destructive">3</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">Max Losses/Dia</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-2xl font-bold text-primary">2</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">Meta Wins/Dia</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-chart-4/5 border border-chart-4/20">
                    <p className="text-2xl font-bold text-chart-4">1:3</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">RR Mínimo</p>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {[
                  { rule: "Nunca arriscar mais de 1-2% do capital por trade", icon: "🛡️" },
                  { rule: "Se bater 3 losses, parar imediatamente — sem exceções", icon: "🛑" },
                  { rule: "Após 2 wins, considerar encerrar o dia positivo", icon: "✅" },
                  { rule: "Não operar por vingança ou FOMO — respeitar o plano", icon: "🧠" },
                  { rule: "DXY é referência — se o dólar diverge, cautela redobrada", icon: "💵" }].
                  map((item, idx) =>
                  <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/50">
                      <span className="text-sm">{item.icon}</span>
                      <span className="text-xs text-foreground/80">{item.rule}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Psicologia e Disciplina */}
            <Card className="border border-warning/30 bg-warning/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warning/15 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground mb-2">Mentalidade de Trader Profissional</p>
                    <div className="space-y-1.5">
                      {[
                      "O resultado de um trade individual é irrelevante — foco no processo",
                      "Perdas fazem parte. Um trader lucrativo perde regularmente",
                      "A disciplina de NÃO operar é tão valiosa quanto a de operar",
                      "Consistência > resultados excepcionais esporádicos",
                      "Analisar à noite, operar de dia — separar emoção de execução"].
                      map((tip, idx) =>
                      <p key={idx} className="text-xs text-foreground/70 flex items-start gap-1.5">
                          <span className="text-warning mt-0.5">▸</span>
                          {tip}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saques" className="space-y-6">
            <Withdrawals />
          </TabsContent>

          <TabsContent value="rotina" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Minha Rotina de Trading
                </CardTitle>
                <CardDescription>Rotina pessoal baseada no meu operacional — Análise noturna + Operação diurna</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Weekly Calendar */}
                  <Card className="border-2 border-primary/30 bg-primary/5">
                    <CardContent className="pt-6">
                      <p className="font-bold text-primary mb-4">📅 Calendário Semanal</p>
                      <div className="grid grid-cols-7 gap-2">
                        {[
                        { day: "DOM", analysis: true, operation: false, color: "bg-chart-3/20 border-chart-3" },
                        { day: "SEG", analysis: true, operation: true, color: "bg-primary/20 border-primary" },
                        { day: "TER", analysis: true, operation: true, color: "bg-primary/20 border-primary" },
                        { day: "QUA", analysis: true, operation: true, color: "bg-primary/20 border-primary" },
                        { day: "QUI", analysis: true, operation: true, color: "bg-primary/20 border-primary" },
                        { day: "SEX", analysis: false, operation: true, color: "bg-warning/20 border-warning" },
                        { day: "SÁB", analysis: false, operation: false, color: "bg-muted border-border" }].
                        map((item) =>
                        <Card key={item.day} className={`border ${item.color} text-center`}>
                            <CardContent className="pt-3 pb-3 px-1">
                              <p className="font-bold text-foreground text-sm">{item.day}</p>
                              <div className="mt-2 space-y-1">
                                {item.analysis &&
                              <Badge variant="outline" className="text-[10px] px-1 py-0 block bg-chart-3/10 text-chart-3 border-chart-3/30">
                                    🌙 Análise
                                  </Badge>
                              }
                                {item.operation &&
                              <Badge variant="outline" className="text-[10px] px-1 py-0 block bg-primary/10 text-primary border-primary/30">
                                    📈 Operar
                                  </Badge>
                              }
                                {!item.analysis && !item.operation &&
                              <Badge variant="outline" className="text-[10px] px-1 py-0 block text-muted-foreground">
                                    😴 Folga
                                  </Badge>
                              }
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-chart-3/30 inline-block"></span> Noite de Análise</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary/30 inline-block"></span> Dia de Operação + Análise</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-warning/30 inline-block"></span> Só Operação (sem análise à noite)</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted inline-block"></span> Folga</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Routine Flow */}
                  {[
                  {
                    period: "Noite (20h-20h30) — Análise", icon: "🌙",
                    description: "Dom, Seg, Ter, Qua, Qui",
                    tasks: [
                    "Análise de mercado dos ativos que opero",
                    "Traçar regiões de interesse (Order Blocks, Gann, etc.)",
                    "Marcar zonas de liquidez e pontos de entrada",
                    "Definir cenários para o dia seguinte",
                    "Registrar análises na aba Análises"]

                  },
                  {
                    period: "Manhã (ao acordar) — Revisão", icon: "🌅",
                    description: "Seg a Sex",
                    tasks: [
                    "Revisar as marcações feitas na noite anterior",
                    "Observar como o mercado se moveu durante a madrugada",
                    "Verificar se as regiões traçadas estão sendo buscadas ou respeitadas",
                    "Entender melhor o contexto sem a pressão de traçar e operar na hora",
                    "Ajustar cenários se necessário"]

                  },
                  {
                    period: "Dia — Operação", icon: "📈",
                    description: "Seg a Sex",
                    tasks: [
                    "Operar baseado nas marcações da noite anterior",
                    "Aguardar o preço chegar nas regiões marcadas",
                    "Executar conforme o checklist operacional",
                    "Registrar trades no Diário com todos os checklists",
                    "Respeitar limites de perdas e ganhos diários"]

                  }].
                  map((item, idx) =>
                  <Card key={idx} className="border-l-4 border-l-primary">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="text-3xl">{item.icon}</div>
                          <div className="flex-1">
                            <p className="font-bold text-foreground text-lg">{item.period}</p>
                            <p className="text-xs text-muted-foreground mb-3">{item.description}</p>
                            <ul className="space-y-2">
                              {item.tasks.map((task, taskIdx) =>
                            <li key={taskIdx} className="flex items-start gap-2 text-sm text-foreground/80">
                                  <span className="text-primary font-bold mt-0.5">•</span>
                                  <span>{task}</span>
                                </li>
                            )}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Vantagem */}
                  <Card className="border-2 border-chart-3/30 bg-chart-3/5">
                    <CardContent className="pt-6">
                      <p className="font-bold text-chart-3 mb-3">💡 Vantagem dessa Rotina</p>
                      <p className="text-sm text-foreground/80">
                        Analisando à noite e operando pela manhã, o mercado já terá se movido durante a madrugada. 
                        Isso permite <strong>ver se as regiões traçadas estão sendo buscadas ou respeitadas</strong>, 
                        sem a agonia de traçar uma região e em 30 minutos já estar tomando trade lá. 
                        A separação entre análise e execução traz mais clareza e disciplina.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-destructive/30 bg-destructive/5">
                    <CardContent className="pt-6">
                      <p className="font-bold text-destructive mb-4">⚠️ Limites Diários Obrigatórios</p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <Card className="border-l-4 border-l-destructive">
                          <CardContent className="pt-4">
                            <p className="text-sm font-bold text-destructive">Máximo de Perdas</p>
                            <p className="text-2xl font-bold text-destructive mt-2">3 Losses</p>
                            <p className="text-xs text-muted-foreground mt-1">Parar operações se atingir 3 perdas</p>
                          </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-success">
                          <CardContent className="pt-4">
                            <p className="text-sm font-bold text-success">Máximo de Ganhos</p>
                            <p className="text-2xl font-bold text-success mt-2">2 Wins</p>
                            <p className="text-xs text-muted-foreground mt-1">Considerar parar após 2 vitórias</p>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Regra de ouro */}
                  <Card className="border-2 border-warning/30 bg-warning/5">
                    <CardContent className="pt-6">
                      <p className="font-bold text-warning mb-3">🏆 Regra de Ouro</p>
                      <p className="text-sm text-foreground/80">
                        <strong>Sexta e sábado à noite: NÃO analiso.</strong> Domingo à noite volto a analisar para 
                        preparar a semana. A disciplina de respeitar os dias de descanso é tão importante quanto a 
                        disciplina de operar bem.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alertas" className="space-y-6">
            <NewsAlerts />
          </TabsContent>

          <TabsContent value="analises" className="space-y-6">
            <AnalysisHistory />
          </TabsContent>

          <TabsContent value="calculadora" className="space-y-6">
            <TradingCalculator />
          </TabsContent>

          <TabsContent value="diario" className="space-y-6">
            <TradeJournalEnhanced />
          </TabsContent>

          <TabsContent value="calendario" className="space-y-6">
            <EconomicCalendar />
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <PerformanceDashboard />
            <AssetPerformanceAnalysis />
          </TabsContent>

          <TabsContent value="comparacao" className="space-y-6">
            <StrategyComparisonEnhanced trades={trades} />
          </TabsContent>

          <TabsContent value="relatorio" className="space-y-6">
            <ReportExportEnhanced trades={trades} />
          </TabsContent>

          <TabsContent value="validacao" className="space-y-6">
            <DailyValidation />
          </TabsContent>
        </Tabs>

        {/* Summary Card */}
        <Card className="mt-12 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Seu Operacional Estruturado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Um plano completo e disciplinado</h2>
              <p className="text-foreground/80 mb-6">
                Para trading no mercado financeiro. Todas as suas regras, estratégias e rotinas em um único lugar.
              </p>
              <Button onClick={() => setShowPlanDialog(true)}>
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Visualizar Plano
              </Button>
            </div>
            <Separator className="my-6" />
            <p className="text-sm text-foreground/80">
              Este plano foi estruturado para garantir disciplina, consistência e gestão rigorosa de risco. Cada trade deve seguir este plano de ação para que a vantagem lucrativa se concretize.
            </p>
          </CardContent>
        </Card>

        {/* Dialog do Plano Operacional */}
        <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <ClipboardCheck className="w-5 h-5 text-primary" />
                Plano Operacional de Trade
              </DialogTitle>
              <DialogDescription>
                Siga este checklist antes de cada operação
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              {/* Etapa 1 */}
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                  Confirmação de Estrutura (HTF)
                </h3>
                <div className="flex items-start gap-2 ml-8">
                  <ArrowRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground/80">CHoCH (Change of Character) validado em timeframe maior</p>
                </div>
              </div>

              {/* Etapa 2 */}
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                  Caixa de Gann Traçada
                </h3>
                <div className="flex items-start gap-2 ml-8">
                  <ArrowRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground/80">Desenhar a Gann Box no movimento principal para identificar níveis</p>
                </div>
              </div>

              {/* Etapa 3 */}
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                  Região Descontada (50%)
                </h3>
                <div className="flex items-start gap-2 ml-8">
                  <ArrowRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground/80">Preço está na região de desconto (abaixo de 50% da Gann Box)</p>
                </div>
              </div>

              {/* Etapa 4 */}
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">4</span>
                  Order Block Identificado
                </h3>
                <div className="flex items-start gap-2 ml-8">
                  <ArrowRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground/80">Identificar o Order Block (OB) na zona de interesse</p>
                </div>
              </div>

              {/* Etapa 5 */}
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">5</span>
                  Entrada nos 50% do OB
                </h3>
                <div className="flex items-start gap-2 ml-8">
                  <ArrowRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground/80">Posicionar entrada nos 50% do Order Block para melhor R:R</p>
                </div>
              </div>

              {/* Etapa 6 */}
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">6</span>
                  Stop & Risk Management
                </h3>
                <div className="flex items-start gap-2 ml-8">
                  <ArrowRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground/80">Stop loss posicionado corretamente, risco controlado (máx 1-2% do capital)</p>
                </div>
              </div>

              {/* Etapa 7 */}
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">7</span>
                  Tempo Gráfico Operacional
                </h3>
                <div className="flex items-start gap-2 ml-8">
                  <ArrowRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground/80">Confirmação no timeframe operacional antes de executar</p>
                </div>
              </div>

              {/* Regra de ouro */}
              <div className="rounded-lg border-2 border-primary/50 bg-primary/5 p-4 mt-4">
                <h3 className="font-bold text-sm text-primary mb-2">⚡ Regra de Ouro</h3>
                <p className="text-sm text-foreground/80">
                  Somente execute se <strong>todos os 7 itens</strong> estiverem confirmados. Setup incompleto = sem entrada. 
                  Alvo mínimo de <strong>R:R 1:3</strong>.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>);

}