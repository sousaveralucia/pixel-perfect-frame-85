import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Trading Dashboard</CardTitle>
          <CardDescription>Plano Operacional - HackTrading Plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground text-center">
            Faça login para acessar seu dashboard de trading e gerenciar seus trades com disciplina e estratégia.
          </p>

          <div className="space-y-3 pt-4">
            <Button onClick={() => navigate("/")} size="lg" className="w-full">
              Entrar no Dashboard
            </Button>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-sm">Funcionalidades:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Diário de trades com checklist operacional</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Análise de desempenho e relatórios PDF</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Gerenciamento de múltiplas contas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Calendário econômico e alertas</span>
              </li>
            </ul>
          </div>

          <div className="text-center text-sm pt-2">
            <span className="text-muted-foreground">Novo por aqui? </span>
            <button onClick={() => navigate("/register")} className="text-primary hover:underline font-semibold">
              Criar conta
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
