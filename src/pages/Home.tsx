import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, TrendingUp, Target, Clock, Zap, Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAccountManager } from "@/hooks/useAccountManager";
import { useTradeJournalUnified } from "@/hooks/useTradeJournalUnified";
import RiskCalculator from "@/components/RiskCalculator";
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
import { TradingCalendar } from "@/components/TradingCalendar";
import CalculationHistory from "@/components/CalculationHistory";
import { EquityAndPerformanceCharts } from "@/components/EquityAndPerformanceCharts";
import { CalendarAccountSelector } from "@/components/CalendarAccountSelector";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full"
      title={`Alternar para tema ${theme === "light" ? "escuro" : "claro"}`}
    >
      {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Button>
  );
}

export default function Home() {
  const { activeAccountId } = useAccountManager();
  const { trades } = useTradeJournalUnified(activeAccountId);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background sticky top-0 z-10">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Trading Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Plano Operacional - HackTrading Plan</p>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Badge className="bg-primary text-primary-foreground">Ativo</Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        <Tabs defaultValue="calendario-trading" className="w-full">
          <TabsList className="flex w-full mb-8 overflow-x-auto gap-1 bg-secondary/30 p-1 rounded-lg border border-border">
            <TabsTrigger value="calendario-trading" className="text-xs whitespace-nowrap">Calendário</TabsTrigger>
            <TabsTrigger value="contas" className="text-xs whitespace-nowrap">Contas</TabsTrigger>
            <TabsTrigger value="autoconhecimento" className="text-xs whitespace-nowrap">Pessoal</TabsTrigger>
            <TabsTrigger value="ativos" className="text-xs whitespace-nowrap">Ativos</TabsTrigger>
            <TabsTrigger value="estrategia" className="text-xs whitespace-nowrap">Estratégia</TabsTrigger>
            <TabsTrigger value="gestao" className="text-xs whitespace-nowrap">Gestão</TabsTrigger>
            <TabsTrigger value="rotina" className="text-xs whitespace-nowrap">Rotina</TabsTrigger>
            <TabsTrigger value="alertas" className="text-xs whitespace-nowrap">Alertas</TabsTrigger>
            <TabsTrigger value="analises" className="text-xs whitespace-nowrap">Análises</TabsTrigger>
            <TabsTrigger value="calculadora" className="text-xs whitespace-nowrap">Calculadora</TabsTrigger>
            <TabsTrigger value="diario" className="text-xs whitespace-nowrap">Diário</TabsTrigger>
            <TabsTrigger value="calendario" className="text-xs whitespace-nowrap">Cal. Econômico</TabsTrigger>
            <TabsTrigger value="insights" className="text-xs whitespace-nowrap">Insights</TabsTrigger>
            <TabsTrigger value="comparacao" className="text-xs whitespace-nowrap">Comparação</TabsTrigger>
            <TabsTrigger value="relatorio" className="text-xs whitespace-nowrap">Relatório</TabsTrigger>
            <TabsTrigger value="validacao" className="text-xs whitespace-nowrap">Validação</TabsTrigger>
          </TabsList>

          <TabsContent value="calendario-trading" className="space-y-6">
            <CalendarAccountSelector />
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
                      { title: "Paciência", desc: "Esperar pelas melhores oportunidades" },
                    ].map((point, idx) => (
                      <Card key={idx} className="bg-success/5 border-success/20">
                        <CardContent className="pt-4">
                          <p className="font-bold text-success">{point.title}</p>
                          <p className="text-sm text-muted-foreground">{point.desc}</p>
                        </CardContent>
                      </Card>
                    ))}
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
                      { title: "Sair do plano", strategy: "Pausa forçada após cada desvio" },
                    ].map((point, idx) => (
                      <Card key={idx} className="bg-destructive/5 border-destructive/20">
                        <CardContent className="pt-4">
                          <p className="font-bold text-destructive">{point.title}</p>
                          <p className="text-sm text-muted-foreground">{point.strategy}</p>
                        </CardContent>
                      </Card>
                    ))}
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
                    { symbol: "BTC USD", type: "Criptomoeda", session: "24 horas" },
                  ].map((asset) => (
                    <Card key={asset.symbol} className="border-l-4 border-l-primary">
                      <CardContent className="pt-6">
                        <p className="text-2xl font-bold text-primary">{asset.symbol}</p>
                        <p className="text-sm text-muted-foreground">{asset.type}</p>
                        <p className="text-xs text-muted-foreground mt-2">{asset.session}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estrategia" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Checklist Operacional
                </CardTitle>
                <CardDescription>8 Regras Essenciais para Operação Disciplinada</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { number: "1", title: "CHoCH Válido em HTF (H4, H2 ou H1)", desc: "Um CHoCH válido é quando um LOW ou HIGH protegido é rompido.", color: "border-l-primary" },
                    { number: "2", title: "Caixa de Gann em M30", desc: "Traçada do início do movimento até o fim do CHoCH válido. Utilizar apenas as regiões 0%, 50% e 100%.", color: "border-l-chart-3" },
                    { number: "3", title: "Orderblocks Descontados (50% da Gann)", desc: "Apenas orderblocks abaixo da linha de 50% da Gann para compra, ou acima do 50% para venda.", color: "border-l-success" },
                    { number: "4", title: "Order Blocks Válidos (H4, H2, H1 ou M30)", desc: "Se o candle tiver muito pavil e pouco corpo, traçar o candle todo.", color: "border-l-warning" },
                    { number: "5", title: "Entrada Sempre no 50% do Order Block", desc: "Identificar ineficiências de HTF e entrar sempre no 50% da região.", color: "border-l-destructive" },
                    { number: "6", title: "Stop Loss com Folga", desc: "Stop abaixo ou acima do Order Block no mínimo M30 com um pouco de folga.", color: "border-l-chart-2" },
                    { number: "7", title: "Take Profit Mínimo 1:3", desc: "Take profit sempre em 1:3 no mínimo. Relação risco-retorno obrigatória.", color: "border-l-chart-4" },
                    { number: "8", title: "Tempo Gráfico Operacional em M15 ou M5", desc: "Confirmar o tempo gráfico operacional antes de executar a operação.", color: "border-l-ring" },
                  ].map((item, idx) => (
                    <Card key={idx} className={`border-l-4 ${item.color}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                            {item.number}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-foreground">{item.title}</p>
                            <p className="text-sm text-foreground/80 mt-2">{item.desc}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gestao" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Gestão de Risco
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="border-l-4 border-l-primary">
                    <CardContent className="pt-6">
                      <p className="text-3xl font-bold text-primary">1:3</p>
                      <p className="text-sm text-muted-foreground">R:R Mínimo</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-destructive">
                    <CardContent className="pt-6">
                      <p className="text-3xl font-bold text-destructive">2</p>
                      <p className="text-sm text-muted-foreground">Stops para Parar</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-success">
                    <CardContent className="pt-6">
                      <p className="text-3xl font-bold text-success">5</p>
                      <p className="text-sm text-muted-foreground">Ativos Monitorados</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rotina" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Rotina Diária de Operação
                </CardTitle>
                <CardDescription>Segunda a Sexta-feira - Regime de Meio Período</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    {
                      period: "Manhã (6h-12h)", icon: "🌅",
                      tasks: ["Verificar configuração do ambiente", "Avaliar prontidão mental e emocional", "Análise HTF (H4, H2, H1) dos 5 ativos", "Identificar CHoCH válidos em HTF", "Traçar Caixas de Gann em M30", "Planejamento do dia"]
                    },
                    {
                      period: "Tarde (12h-18h)", icon: "☀️",
                      tasks: ["Operações principais conforme setups", "Monitoramento contínuo dos 5 ativos", "Identificação de Order Blocks descontados", "Execução de entradas no 50% do OB", "Gerenciamento de posições abertas", "Respeito rígido ao checklist"]
                    },
                    {
                      period: "Noite (18h-22h)", icon: "🌙",
                      tasks: ["Fechamento de posições abertas", "Revisão detalhada de todos os trades", "Análise de erros e regras violadas", "Registrar trades no Diário", "Cálculo de P&L do dia", "Planejamento para o próximo dia"]
                    },
                  ].map((item, idx) => (
                    <Card key={idx} className="border-l-4 border-l-primary">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="text-3xl">{item.icon}</div>
                          <div className="flex-1">
                            <p className="font-bold text-foreground text-lg">{item.period}</p>
                            <ul className="mt-4 space-y-2">
                              {item.tasks.map((task, taskIdx) => (
                                <li key={taskIdx} className="flex items-start gap-2 text-sm text-foreground/80">
                                  <span className="text-primary font-bold mt-0.5">•</span>
                                  <span>{task}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

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

                  <Card className="border-2 border-primary/30 bg-primary/5">
                    <CardContent className="pt-6">
                      <p className="font-bold text-primary mb-4">📅 Dias de Operação</p>
                      <div className="flex flex-wrap gap-2">
                        {["Segunda", "Terça", "Quarta", "Quinta", "Sexta"].map((day) => (
                          <span key={day} className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-bold">
                            {day}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-4">Fim de semana: Descanso, análise e planejamento</p>
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
            <RiskCalculator />
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
              <Button onClick={() => {
                const el = document.querySelector("[role='tablist']")?.parentElement;
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}>Visualizar Plano</Button>
            </div>
            <Separator className="my-6" />
            <p className="text-sm text-foreground/80">
              Este plano foi estruturado para garantir disciplina, consistência e gestão rigorosa de risco. Cada trade deve seguir este plano de ação para que a vantagem lucrativa se concretize.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
