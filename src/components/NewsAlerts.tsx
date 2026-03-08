import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Bell, X } from "lucide-react";
import economicNews from "@/data/economicNews.json";

/**
 * News Alerts Component
 * Alertas visuais para notícias econômicas de alto impacto próximas
 */

interface NewsItem {
  id: number;
  date: string;
  time: string;
  title: string;
  importance: number;
  affectedAssets: string[];
  category: string;
  description: string;
}

// Função para converter horário GMT para Brasília (GMT-3)
const convertToBrasilia = (timeStr: string): string => {
  if (!timeStr) return 'N/A';
  const [hours, minutes] = timeStr.split(':').map(Number);
  let brasiliaHours = hours - 3; // GMT para GMT-3
  if (brasiliaHours < 0) brasiliaHours += 24;
  return `${String(brasiliaHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export default function NewsAlerts() {
  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>([]);

  // Obter notícias de alto impacto dos próximos 6 meses (180 dias)
  const upcomingHighImpactNews = useMemo(() => {
    const today = new Date();
    const sixMonthsLater = new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000);
    const operatedAssets = ["EUR/USD", "USDJPY", "XAUUSD", "NASDAQ", "BTC USD"];

    return (economicNews.news as NewsItem[])
      .filter((news) => {
        const newsDate = new Date(news.date);
        const hasOperatedAsset = news.affectedAssets.some(asset => operatedAssets.includes(asset));
        return (
          news.importance === 3 &&
          newsDate >= today &&
          newsDate <= sixMonthsLater &&
          hasOperatedAsset &&
          !dismissedAlerts.includes(news.id)
        );
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [dismissedAlerts]);

  const dismissAlert = (id: number) => {
    setDismissedAlerts([...dismissedAlerts, id]);
  };

  // Calcular dias até a notícia
  const daysUntil = (dateStr: string): string => {
    const today = new Date();
    const newsDate = new Date(dateStr);
    const diffTime = newsDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Amanhã";
    return `Em ${diffDays} dias`;
  };

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-red-600" />
          Alertas de Notícias
        </CardTitle>
        <CardDescription>Notícias de alto impacto dos próximos 6 meses para seus ativos (EUR/USD, USDJPY, XAUUSD, NASDAQ, BTC USD)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingHighImpactNews.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-foreground/70">Nenhuma notícia de alto impacto nos próximos 3 meses</p>
          </div>
        ) : (
          upcomingHighImpactNews.map((news) => (
            <div
              key={news.id}
              className="bg-white p-4 rounded-lg border-l-4 border-red-500 flex items-start justify-between gap-4 hover:shadow-md transition-shadow"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="font-bold text-foreground text-sm">{news.title}</p>
                </div>
                <p className="text-xs text-foreground/70 mb-2">{news.time} GMT | {convertToBrasilia(news.time)} (Brasília)</p>
                <p className="text-xs text-foreground/80 mb-2">{news.description}</p>
                <div className="flex flex-wrap gap-1">
                  {news.affectedAssets.map((asset) => (
                    <Badge key={asset} variant="outline" className="text-xs bg-red-100 text-red-900 border-red-300">
                      {asset}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <Badge className="bg-red-600 text-white text-xs">{daysUntil(news.date)}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissAlert(news.id)}
                  className="text-foreground/60 hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}

        {upcomingHighImpactNews.length > 0 && (
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-xs text-yellow-900 mt-4">
            <strong>⚠️ Aviso:</strong> Notícias de alto impacto podem causar movimentos significativos. Considere evitar operar durante esses períodos se não tiver experiência.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
