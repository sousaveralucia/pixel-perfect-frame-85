import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAccountManager } from '@/hooks/useAccountManager';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface DailyValidation {
  date: string;
  environment: boolean;
  mental: boolean;
  emotional: boolean;
  objective: boolean;
  completed: boolean;
  completedAt: string;
}

export default function DailyValidationHistory() {
  const { activeAccountId } = useAccountManager();
  const { user } = useAuth();
  const [validations, setValidations] = useState<DailyValidation[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("daily_validations").select("*").eq("user_id", user.id).eq("account_key", activeAccountId).order("date").then(({ data }) => {
      if (data) {
        setValidations(data.map((v: any) => ({
          date: v.date,
          environment: v.environment || false,
          mental: v.mental_ready === "yes",
          emotional: v.emotional_ready === "yes",
          objective: v.objective || false,
          completed: v.validated_at !== null,
          completedAt: v.validated_at || "",
        })));
      }
    });
  }, [user, activeAccountId]);

  const stats = useMemo(() => {
    const last30Days = validations.slice(-30);
    const completedCount = last30Days.filter((v) => v.completed).length;
    const completionRate = last30Days.length > 0 ? (completedCount / last30Days.length) * 100 : 0;

    return {
      totalDays: last30Days.length,
      completedDays: completedCount,
      completionRate: completionRate.toFixed(1),
      currentStreak: calculateStreak(last30Days),
    };
  }, [validations]);

  const chartData = useMemo(() => {
    return validations.slice(-30).map((v) => ({
      date: new Date(v.date).toLocaleDateString('pt-BR', { month: '2-digit', day: '2-digit' }),
      completed: v.completed ? 1 : 0,
      environment: v.environment ? 1 : 0,
      mental: v.mental ? 1 : 0,
      emotional: v.emotional ? 1 : 0,
      objective: v.objective ? 1 : 0,
    }));
  }, [validations]);

  function calculateStreak(validationList: DailyValidation[]): number {
    let streak = 0;
    for (let i = validationList.length - 1; i >= 0; i--) {
      if (validationList[i].completed) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  if (validations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Nenhuma validação registrada ainda. Complete o checklist pré-operação diariamente!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Dias Monitorados</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalDays}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Validações Completas</p>
            <p className="text-3xl font-bold text-green-600">{stats.completedDays}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Taxa de Consistência</p>
            <p className="text-3xl font-bold text-purple-600">{stats.completionRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Sequência Atual</p>
            <p className="text-3xl font-bold text-orange-600">{stats.currentStreak} dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Completion Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Validação (Últimos 30 dias)</CardTitle>
          <CardDescription>Visualize sua consistência diária com o checklist pré-operação</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#10b981" name="Validação Completa" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Checklist Items Completion */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução dos Itens do Checklist</CardTitle>
          <CardDescription>Taxa de conclusão de cada item do checklist pré-operação</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
              <YAxis domain={[0, 1]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="environment" stroke="#3b82f6" name="Ambiente Configurado" strokeWidth={2} />
              <Line type="monotone" dataKey="mental" stroke="#8b5cf6" name="Prontidão Mental" strokeWidth={2} />
              <Line type="monotone" dataKey="emotional" stroke="#ec4899" name="Prontidão Emocional" strokeWidth={2} />
              <Line type="monotone" dataKey="objective" stroke="#f59e0b" name="Objetivo Claro" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Validations */}
      <Card>
        <CardHeader>
          <CardTitle>Validações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {validations.slice(-10).reverse().map((v) => (
              <div key={v.date} className={`p-3 rounded border ${v.completed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{new Date(v.date).toLocaleDateString('pt-BR', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                    <p className="text-sm text-muted-foreground">
                      {v.environment ? '✓' : '✗'} Ambiente • {v.mental ? '✓' : '✗'} Mental • {v.emotional ? '✓' : '✗'} Emocional • {v.objective ? '✓' : '✗'} Objetivo
                    </p>
                  </div>
                  <div className="text-right">
                    {v.completed && <p className="text-sm font-semibold text-green-600">Completo às {v.completedAt}</p>}
                    {!v.completed && <p className="text-sm font-semibold text-red-600">Incompleto</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
