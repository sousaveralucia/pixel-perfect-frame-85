import { useState, lazy, Suspense } from "react";
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
import TabSkeleton from "@/components/TabSkeleton";
import MobileNav from "@/components/MobileNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { AnimatePresence, motion } from "framer-motion";

// Lazy load all heavy components
const TradingCalculator = lazy(() => import("@/components/TradingCalculator"));
const EconomicCalendar = lazy(() => import("@/components/EconomicCalendar"));
const NewsAlerts = lazy(() => import("@/components/NewsAlerts"));
const TradeJournalEnhanced = lazy(() => import("@/components/TradeJournalEnhanced"));
const PerformanceDashboard = lazy(() => import("@/components/PerformanceDashboard"));
const StrategyComparisonEnhanced = lazy(() => import("@/components/StrategyComparisonEnhanced"));
const ReportExportEnhanced = lazy(() => import("@/components/ReportExportEnhanced"));
const AccountSelector = lazy(() => import("@/components/AccountSelector"));
const AnalysisHistory = lazy(() => import("@/components/AnalysisHistory"));
const DailyValidation = lazy(() => import("@/components/DailyValidation"));
const AssetPerformanceAnalysis = lazy(() => import("@/components/AssetPerformanceAnalysis"));
const TradingCalendar = lazy(() => import("@/components/TradingCalendar").then(m => ({ default: m.TradingCalendar })));
const CalculationHistory = lazy(() => import("@/components/CalculationHistory"));
const EquityAndPerformanceCharts = lazy(() => import("@/components/EquityAndPerformanceCharts").then(m => ({ default: m.EquityAndPerformanceCharts })));
const Withdrawals = lazy(() => import("@/components/Withdrawals"));
const DisciplineAnalysis = lazy(() => import("@/components/DisciplineAnalysis"));

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full h-8 w-8"
      title={`Alternar para tema ${theme === "light" ? "escuro" : "claro"}`}>
      {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Button>
  );
}

function LazyTab({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<TabSkeleton />}>{children}</Suspense>;
}

const TABS = [
  { value: "calendario-trading", label: "Calendário" },
  { value: "contas", label: "Contas" },
  { value: "autoconhecimento", label: "Pessoal" },
  { value: "estrategia", label: "Estratégia" },
  { value: "validacao", label: "Pré-Op" },
  { value: "rotina", label: "Rotina" },
  { value: "alertas", label: "Alertas" },
  { value: "analises", label: "Análises" },
  { value: "calculadora", label: "Calculadora" },
  { value: "diario", label: "Diário" },
  { value: "calendario", label: "Cal. Econômico" },
  { value: "insights", label: "Insights" },
  { value: "disciplina", label: "Disciplina" },
  { value: "comparacao", label: "Comparação" },
  { value: "relatorio", label: "Relatório" },
  { value: "saques", label: "Saques" },
];

export default function Home() {
  const { signOut } = useAuth();
  const { accounts, activeAccountId, getActiveAccount, switchAccount } = useAccountManager();
  const { trades } = useTradeJournalUnified(activeAccountId);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState(false);
  const [editingGoldenRule, setEditingGoldenRule] = useState(false);
  const [activeTab, setActiveTab] = useState("calendario-trading");
  const planChecklist = useCustomChecklists("plan");
  const goldenRuleChecklist = useCustomChecklists("goldenRule");
  const isMobile = useIsMobile();
  const activeAccount = getActiveAccount();
  const currentBalance = activeAccount?.currentBalance ?? 0;
  const initialBalance = activeAccount?.initialBalance ?? 0;
  const balancePct = initialBalance > 0 ? (currentBalance - initialBalance) / initialBalance * 100 : 0;
  const isPositive = balancePct >= 0;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-30 bg-background/80 backdrop-blur-xl">
        <div className="container py-3">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg md:text-xl font-semibold text-foreground truncate">Trading Journal</h1>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Select value={activeAccountId} onValueChange={switchAccount}>
                <SelectTrigger className="w-[110px] md:w-[170px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) =>
                    <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <div className="gap-1.5 px-2 md:px-3 py-1.5 flex items-center rounded-lg bg-card border border-border">
                <span className="text-xs md:text-sm font-bold text-foreground">${currentBalance.toFixed(2)}</span>
                <span className={`text-[10px] md:text-xs font-semibold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                  {isPositive ? '+' : ''}{balancePct.toFixed(1)}%
                </span>
              </div>
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={signOut} className="rounded-full h-8 w-8" title="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-4 md:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Desktop tabs */}
          <div className="hidden md:block mb-6">
            <div className="overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] touch-pan-x">
              <TabsList className="inline-flex min-w-max justify-start gap-0.5 bg-secondary p-1 rounded-lg">
                {TABS.map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value} className="text-xs whitespace-nowrap">{tab.label}</TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
            >

          <TabsContent value="calendario-trading" className="space-y-6 mt-0">
            <LazyTab><TradingCalendar activeAccountId={activeAccountId} /></LazyTab>
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
                  <h3 className="font-semibold text-foreground mb-3">Por que você faz trade? Quais são seus objetivos?</h3>
                  <p className="text-foreground/80 text-sm">
                    O principal objetivo é <strong>viver do mercado financeiro e sair do regime CLT</strong>, buscando uma melhor qualidade de vida, mais liberdade e remuneração justa.
                  </p>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Regime de Operação</h3>
                  <Badge variant="secondary">Meio Período</Badge>
                  <p className="text-sm text-muted-foreground mt-2">Operações nas horas vagas disponíveis do trabalho CLT</p>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Motivação Principal</h3>
                  <p className="text-foreground/80 text-sm">
                    A esperança de poder <strong>mudar de vida</strong> para si e para a família é a principal motivação.
                  </p>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold text-foreground mb-3">5 Pontos Fortes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                    { title: "Persistência", desc: "Capacidade de continuar buscando o objetivo" },
                    { title: "Força de vontade", desc: "Determinação para alcançar o sucesso" },
                    { title: "Tempo para estudar", desc: "Dedicação extra ao aprendizado" },
                    { title: "Foco no objetivo", desc: "Clareza sobre viver do mercado" },
                    { title: "Paciência", desc: "Esperar pelas melhores oportunidades" }
                    ].map((point, idx) =>
                    <Card key={idx} className="border-success/20 bg-success/5">
                        <CardContent className="pt-4">
                          <p className="font-semibold text-success text-sm">{point.title}</p>
                          <p className="text-xs text-muted-foreground">{point.desc}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold text-foreground mb-3">5 Pontos Fracos e Estratégias</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                    { title: "Emocional", strategy: "Controle emocional através de mindfulness e revisão pós-trade" },
                    { title: "Contas apertadas", strategy: "Gerenciar capital de forma conservadora" },
                    { title: "Ansiedade", strategy: "Rotinas pré-trade e técnicas de respiração" },
                    { title: "Falta de disciplina", strategy: "Checklist diário rigoroso" },
                    { title: "Sair do plano", strategy: "Pausa forçada após cada desvio" }
                    ].map((point, idx) =>
                    <Card key={idx} className="border-destructive/20 bg-destructive/5">
                        <CardContent className="pt-4">
                          <p className="font-semibold text-destructive text-sm">{point.title}</p>
                          <p className="text-xs text-muted-foreground">{point.strategy}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-success/5 border-success/20">
                    <CardContent className="pt-6">
                      <p className="font-semibold text-success mb-2">DIAS BONS</p>
                      <p className="text-sm text-muted-foreground">
                        "Hoje, a disciplina e a paciência foram recompensadas. Cada trade executado conforme o plano me aproxima da liberdade financeira."
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-destructive/5 border-destructive/20">
                    <CardContent className="pt-6">
                      <p className="font-semibold text-destructive mb-2">DIAS RUINS</p>
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
            <LazyTab><AccountSelector /></LazyTab>
          </TabsContent>

          <TabsContent value="estrategia" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-foreground">Minha Estratégia</h2>
                <p className="text-sm text-muted-foreground">Smart Money Concepts — Modelo Operacional Completo</p>
              </div>
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="w-3 h-3" />
                ICT / SMC
              </Badge>
            </div>

            <Card>
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
                      com RR mínimo de 1:3.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm font-semibold">Checklist Operacional — 8 Passos</CardTitle>
                </div>
                <CardDescription className="text-xs">Seguir na ordem. Não pular etapas.</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {[
                  { step: 1, title: "CHoCH Válido em HTF", timeframe: "H4 / H2 / H1", desc: "Identificar mudança de caráter: um LOW ou HIGH protegido rompido com corpo de candle.", detail: "CHoCH = Change of Character. É a primeira confirmação de que o mercado pode estar mudando de direção.", tag: "Estrutura" },
                  { step: 2, title: "Caixa de Gann em M30", timeframe: "M30", desc: "Traçar do início do movimento até o fim do CHoCH. Usar regiões 0%, 50% e 100%.", detail: "A Caixa de Gann define a zona premium e discount. Só opero em zonas de desconto para compra e premium para venda.", tag: "Gann" },
                  { step: 3, title: "Order Blocks Descontados", timeframe: "50% da Gann", desc: "Apenas OBs abaixo de 50% (compra) ou acima de 50% (venda).", detail: "Order Blocks fora da zona de desconto têm menor probabilidade. A confluência com a Gann aumenta a taxa de acerto.", tag: "Desconto" },
                  { step: 4, title: "Order Blocks Válidos", timeframe: "H4 / H2 / H1 / M30", desc: "Se candle com muito pavio e pouco corpo → traçar o candle inteiro.", detail: "Um OB válido é o último candle de baixa antes de um impulso de alta (ou vice-versa).", tag: "OB" },
                  { step: 5, title: "Entrada no 50% do Order Block", timeframe: "M15 / M5", desc: "Identificar ineficiências de HTF e entrar sempre no 50% da região.", detail: "O 50% do OB é o ponto ótimo de entrada (OTE). Garante melhor RR e stop mais curto.", tag: "Entrada" },
                  { step: 6, title: "Stop Loss com Folga", timeframe: "M30+", desc: "Stop abaixo/acima do OB com folga. Nunca stop no extremo exato.", detail: "Adicionar 5-10 pips de folga além do OB.", tag: "Proteção" },
                  { step: 7, title: "Take Profit Mínimo 1:3", timeframe: "Obrigatório", desc: "RR mínimo de 1:3. Abaixo disso, não entrar.", detail: "Com 1:3, você pode errar 2 de cada 3 trades e ainda ficar positivo.", tag: "RR" },
                  { step: 8, title: "Confirmação em LTF", timeframe: "M15 / M5", desc: "Confirmar o setup no tempo gráfico operacional antes de executar.", detail: "Buscar CHoCH ou BOS em M15/M5 dentro do Order Block de HTF.", tag: "Execução" }
                  ].map((item, idx) =>
                  <details key={idx} className="group">
                      <summary className="flex items-center gap-2 md:gap-3 p-3 rounded-lg border border-border hover:border-primary/30 cursor-pointer transition-colors bg-card">
                        <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {item.step}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-xs md:text-sm text-foreground">{item.title}</span>
                            <Badge variant="secondary" className="text-[10px] h-5">{item.tag}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                        </div>
                        <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono flex-shrink-0">{item.timeframe}</span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180 flex-shrink-0" />
                      </summary>
                      <div className="mt-1 ml-10 mr-3 mb-2 p-3 rounded-lg bg-muted/50 border border-border">
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
                      </div>
                    </details>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
              { icon: <TrendingUp className="w-4 h-4" />, title: "CHoCH", desc: "Mudança de caráter — primeiro sinal de reversão" },
              { icon: <BarChart2 className="w-4 h-4" />, title: "BOS", desc: "Break of Structure — continuação de tendência" },
              { icon: <Layers className="w-4 h-4" />, title: "Order Block", desc: "Última vela contrária antes do impulso" },
              { icon: <Grid3X3 className="w-4 h-4" />, title: "Gann Box", desc: "Ferramenta de desconto — 0%, 50%, 100%" },
              { icon: <Droplets className="w-4 h-4" />, title: "Liquidez", desc: "Pools de ordens acima/abaixo de highs/lows" },
              { icon: <Zap className="w-4 h-4" />, title: "FVG / Imbalance", desc: "Gap de valor justo — região de ineficiência" }
              ].map((concept, idx) =>
              <Card key={idx} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        {concept.icon}
                      </div>
                      <span className="font-medium text-xs text-foreground">{concept.title}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{concept.desc}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-destructive" />
                  <CardTitle className="text-sm font-semibold">Gestão de Risco</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <p className="text-xl md:text-2xl font-bold text-destructive">3</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">Max Losses/Dia</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xl md:text-2xl font-bold text-primary">2</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">Meta Wins/Dia</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-warning/5 border border-warning/20">
                    <p className="text-xl md:text-2xl font-bold text-warning">1:3</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">RR Mínimo</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  {[
                  { rule: "Nunca arriscar mais de 1-2% do capital por trade", icon: "🛡️" },
                  { rule: "Se bater 3 losses, parar imediatamente", icon: "🛑" },
                  { rule: "Após 2 wins, considerar encerrar o dia positivo", icon: "✅" },
                  { rule: "Não operar por vingança ou FOMO", icon: "🧠" },
                  { rule: "DXY é referência — se o dólar diverge, cautela redobrada", icon: "💵" }
                  ].map((item, idx) =>
                  <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/50">
                      <span className="text-sm">{item.icon}</span>
                      <span className="text-xs text-muted-foreground">{item.rule}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-warning/20 bg-warning/5">
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
                      "Analisar à noite, operar de dia — separar emoção de execução"
                      ].map((tip, idx) =>
                      <p key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
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
            <LazyTab><Withdrawals /></LazyTab>
          </TabsContent>

          <TabsContent value="rotina" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Minha Rotina de Trading
                </CardTitle>
                <CardDescription>Rotina pessoal — Análise noturna + Operação diurna</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="pt-6">
                      <p className="font-semibold text-primary mb-4">📅 Calendário Semanal</p>
                      <div className="grid grid-cols-7 gap-1 md:gap-2">
                        {[
                        { day: "DOM", analysis: true, operation: false },
                        { day: "SEG", analysis: true, operation: true },
                        { day: "TER", analysis: true, operation: true },
                        { day: "QUA", analysis: true, operation: true },
                        { day: "QUI", analysis: true, operation: true },
                        { day: "SEX", analysis: false, operation: true },
                        { day: "SÁB", analysis: false, operation: false }
                        ].map((item) =>
                        <Card key={item.day} className="text-center">
                            <CardContent className="pt-2 pb-2 md:pt-3 md:pb-3 px-1">
                              <p className="font-semibold text-foreground text-[10px] md:text-sm">{item.day}</p>
                              <div className="mt-1 md:mt-2 space-y-1">
                                {item.analysis && <Badge variant="secondary" className="text-[8px] md:text-[10px] px-0.5 md:px-1 py-0 block">🌙</Badge>}
                                {item.operation && <Badge variant="secondary" className="text-[8px] md:text-[10px] px-0.5 md:px-1 py-0 block">📈</Badge>}
                                {!item.analysis && !item.operation && <Badge variant="secondary" className="text-[8px] md:text-[10px] px-0.5 md:px-1 py-0 block">😴</Badge>}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-4 text-xs text-muted-foreground">
                        <span>🌙 Noite de Análise</span>
                        <span>📈 Dia de Operação</span>
                        <span>😴 Folga</span>
                      </div>
                    </CardContent>
                  </Card>

                  {[
                  { period: "Noite (20h-20h30) — Análise", icon: "🌙", description: "Dom, Seg, Ter, Qua, Qui", tasks: ["Análise de mercado dos ativos que opero","Traçar regiões de interesse (Order Blocks, Gann, etc.)","Marcar zonas de liquidez e pontos de entrada","Definir cenários para o dia seguinte","Registrar análises na aba Análises"] },
                  { period: "Manhã (ao acordar) — Revisão", icon: "🌅", description: "Seg a Sex", tasks: ["Revisar as marcações feitas na noite anterior","Observar como o mercado se moveu durante a madrugada","Verificar se as regiões traçadas estão sendo respeitadas","Entender melhor o contexto sem a pressão de operar na hora","Ajustar cenários se necessário"] },
                  { period: "Dia — Operação", icon: "📈", description: "Seg a Sex", tasks: ["Operar baseado nas marcações da noite anterior","Aguardar o preço chegar nas regiões marcadas","Executar conforme o checklist operacional","Registrar trades no Diário com todos os checklists","Respeitar limites de perdas e ganhos diários"] }
                  ].map((item, idx) =>
                  <Card key={idx} className="border-l-4 border-l-primary">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3 md:gap-4">
                          <div className="text-2xl md:text-3xl">{item.icon}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-sm md:text-base">{item.period}</p>
                            <p className="text-xs text-muted-foreground mb-3">{item.description}</p>
                            <ul className="space-y-1.5">
                              {item.tasks.map((task, taskIdx) =>
                            <li key={taskIdx} className="flex items-start gap-2 text-xs text-muted-foreground">
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

                  <Card className="border-success/20 bg-success/5">
                    <CardContent className="pt-6">
                      <p className="font-semibold text-success mb-3">💡 Vantagem dessa Rotina</p>
                      <p className="text-sm text-muted-foreground">
                        Analisando à noite e operando pela manhã, o mercado já terá se movido durante a madrugada. 
                        Isso permite ver se as regiões traçadas estão sendo buscadas ou respeitadas.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-destructive/20 bg-destructive/5">
                    <CardContent className="pt-6">
                      <p className="font-semibold text-destructive mb-4">⚠️ Limites Diários Obrigatórios</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border-l-4 border-l-destructive">
                          <CardContent className="pt-4">
                            <p className="text-sm font-semibold text-destructive">Máximo de Perdas</p>
                            <p className="text-2xl font-bold text-destructive mt-2">3 Losses</p>
                            <p className="text-xs text-muted-foreground mt-1">Parar operações se atingir 3 perdas</p>
                          </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-success">
                          <CardContent className="pt-4">
                            <p className="text-sm font-semibold text-success">Máximo de Ganhos</p>
                            <p className="text-2xl font-bold text-success mt-2">2 Wins</p>
                            <p className="text-xs text-muted-foreground mt-1">Considerar parar após 2 vitórias</p>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-warning/20 bg-warning/5">
                    <CardContent className="pt-6">
                      <p className="font-semibold text-warning mb-3">🏆 Regra de Ouro</p>
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">Sexta e sábado à noite: NÃO analiso.</strong> Domingo à noite volto a analisar para preparar a semana.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alertas" className="space-y-6">
            <LazyTab><NewsAlerts /></LazyTab>
          </TabsContent>

          <TabsContent value="analises" className="space-y-6">
            <LazyTab><AnalysisHistory /></LazyTab>
          </TabsContent>

          <TabsContent value="calculadora" className="space-y-6">
            <LazyTab><TradingCalculator /></LazyTab>
          </TabsContent>

          <TabsContent value="diario" className="space-y-6">
            <LazyTab><TradeJournalEnhanced /></LazyTab>
          </TabsContent>

          <TabsContent value="calendario" className="space-y-6">
            <LazyTab><EconomicCalendar /></LazyTab>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <LazyTab>
              <PerformanceDashboard />
              <AssetPerformanceAnalysis />
            </LazyTab>
          </TabsContent>

          <TabsContent value="comparacao" className="space-y-6">
            <LazyTab><StrategyComparisonEnhanced trades={trades} /></LazyTab>
          </TabsContent>

          <TabsContent value="relatorio" className="space-y-6">
            <LazyTab><ReportExportEnhanced trades={trades} /></LazyTab>
          </TabsContent>

          <TabsContent value="validacao" className="space-y-6">
            <LazyTab><DailyValidation /></LazyTab>
          </TabsContent>

          <TabsContent value="disciplina" className="space-y-6">
            <LazyTab><DisciplineAnalysis /></LazyTab>
          </TabsContent>

            </motion.div>
          </AnimatePresence>
        </Tabs>

        {/* Summary Card */}
        <Card className="mt-8 md:mt-12 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Seu Operacional Estruturado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-foreground mb-3">Um plano completo e disciplinado</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Para trading no mercado financeiro. Todas as suas regras, estratégias e rotinas em um único lugar.
              </p>
              <Button onClick={() => setShowPlanDialog(true)}>
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Visualizar Plano
              </Button>
            </div>
            <Separator className="my-4" />
            <p className="text-sm text-muted-foreground">
              Este plano foi estruturado para garantir disciplina, consistência e gestão rigorosa de risco.
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
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Etapas do Plano</span>
                <Button variant="ghost" size="sm" onClick={() => setEditingPlan(true)} className="h-7 gap-1 text-xs">
                  <Pencil className="w-3 h-3" /> Editar
                </Button>
              </div>

              {planChecklist.items.map((item, idx) => {
                const parts = item.label.split("|");
                const title = parts[0];
                const desc = parts[1] || "";
                return (
                  <div key={item.key} className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                    <h3 className="font-semibold text-sm text-primary flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">{idx + 1}</span>
                      {title}
                    </h3>
                    {desc && (
                      <div className="flex items-start gap-2 ml-8">
                        <ArrowRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-sm text-muted-foreground">{desc}</p>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Regra de Ouro</span>
                <Button variant="ghost" size="sm" onClick={() => setEditingGoldenRule(true)} className="h-7 gap-1 text-xs">
                  <Pencil className="w-3 h-3" /> Editar
                </Button>
              </div>
              {goldenRuleChecklist.items.map((item) => {
                const parts = item.label.split("|");
                const title = parts[0];
                const desc = parts[1] || "";
                return (
                  <div key={item.key} className="rounded-lg border-2 border-primary/50 bg-primary/5 p-4">
                    <h3 className="font-semibold text-sm text-primary mb-2">{item.emoji} {title}</h3>
                    {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

        <ChecklistEditor
          items={planChecklist.items}
          onSave={planChecklist.saveItems}
          onReset={planChecklist.resetToDefaults}
          isCustomized={planChecklist.isCustomized}
          title="Plano Operacional"
          open={editingPlan}
          onOpenChange={setEditingPlan}
        />
        <ChecklistEditor
          items={goldenRuleChecklist.items}
          onSave={goldenRuleChecklist.saveItems}
          onReset={goldenRuleChecklist.resetToDefaults}
          isCustomized={goldenRuleChecklist.isCustomized}
          title="Regra de Ouro"
          open={editingGoldenRule}
          onOpenChange={setEditingGoldenRule}
        />
      </main>

      {isMobile && <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />}
    </div>
  );
}
