import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import economicNews from "@/data/economicNews.json";

/**
 * Economic Calendar Component
 * Exibe notícias econômicas dos próximos 3 meses com filtros por ativo e importância
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

const IMPORTANCE_COLORS: Record<number, string> = {
  1: "bg-yellow-50 border-yellow-200",
  2: "bg-orange-50 border-orange-200",
  3: "bg-red-50 border-red-200",
};

const IMPORTANCE_LABELS: Record<number, string> = {
  1: "Baixo Impacto",
  2: "Médio Impacto",
  3: "Alto Impacto",
};

const IMPORTANCE_BADGE: Record<number, string> = {
  1: "bg-yellow-100 text-yellow-900",
  2: "bg-orange-100 text-orange-900",
  3: "bg-red-100 text-red-900",
};

// Função para converter horário GMT para Brasília (GMT-3)
const convertToBrasilia = (timeStr: string): string => {
  if (!timeStr) return 'N/A';
  const [hours, minutes] = timeStr.split(':').map(Number);
  let brasiliaHours = hours - 3; // GMT para GMT-3
  if (brasiliaHours < 0) brasiliaHours += 24;
  return `${String(brasiliaHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export default function EconomicCalendar() {
  const [selectedAssets, setSelectedAssets] = useState<string[]>(["GBP/USD", "USD/JPY", "XAU/USD"]);
  const [selectedImportance, setSelectedImportance] = useState<number[]>([1, 2, 3]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(economicNews.categories);

  // Toggle asset filter
  const toggleAsset = (asset: string) => {
    setSelectedAssets((prev) =>
      prev.includes(asset) ? prev.filter((a) => a !== asset) : [...prev, asset]
    );
  };

  // Toggle importance filter
  const toggleImportance = (importance: number) => {
    setSelectedImportance((prev) =>
      prev.includes(importance) ? prev.filter((i) => i !== importance) : [...prev, importance]
    );
  };

  // Toggle category filter
  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  // Filter news based on selected filters
  const filteredNews = useMemo(() => {
    return (economicNews.news as NewsItem[]).filter((news) => {
      const hasSelectedAsset = news.affectedAssets.some((asset) => selectedAssets.includes(asset));
      const hasSelectedImportance = selectedImportance.includes(news.importance);
      const hasSelectedCategory = selectedCategories.includes(news.category);

      return hasSelectedAsset && hasSelectedImportance && hasSelectedCategory;
    });
  }, [selectedAssets, selectedImportance, selectedCategories]);

  // Group news by date
  const groupedNews = useMemo(() => {
    const grouped: Record<string, NewsItem[]> = {};
    filteredNews.forEach((news) => {
      if (!grouped[news.date]) {
        grouped[news.date] = [];
      }
      grouped[news.date].push(news);
    });
    return grouped;
  }, [filteredNews]);

  const sortedDates = Object.keys(groupedNews).sort();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Calendário de Notícias Econômicas
        </CardTitle>
        <CardDescription>Próximos 3 meses (Março - Junho 2026)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="space-y-4 p-4 bg-secondary/30 rounded-lg border border-border">
          <h3 className="font-bold text-foreground">Filtros</h3>

          {/* Asset Filter */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Ativos</p>
            <div className="flex flex-wrap gap-2">
              {economicNews.assets.map((asset) => (
                <Button
                  key={asset}
                  variant={selectedAssets.includes(asset) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleAsset(asset)}
                  className="text-xs"
                >
                  {asset}
                </Button>
              ))}
            </div>
          </div>

          {/* Importance Filter */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Importância</p>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map((importance) => (
                <Button
                  key={importance}
                  variant={selectedImportance.includes(importance) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleImportance(importance)}
                  className="text-xs"
                >
                  {IMPORTANCE_LABELS[importance]}
                </Button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Categoria</p>
            <div className="flex flex-wrap gap-2">
              {economicNews.categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategories.includes(category) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleCategory(category)}
                  className="text-xs"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Reset Filters */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedAssets(["GBP/USD", "USD/JPY", "XAU/USD"]);
              setSelectedImportance([1, 2, 3]);
              setSelectedCategories(economicNews.categories);
            }}
            className="w-full"
          >
            Resetar Filtros
          </Button>
        </div>

        {/* News List */}
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {filteredNews.length} notícias encontradas
          </p>

          {sortedDates.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Nenhuma notícia encontrada com os filtros selecionados</p>
            </div>
          ) : (
            sortedDates.map((date) => (
              <div key={date} className="space-y-3">
                {/* Date Header */}
                <div className="flex items-center gap-3 pt-4 pb-2 border-b border-border">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <p className="font-bold text-foreground">
                    {new Date(date).toLocaleDateString("pt-BR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                {/* News Items for this date */}
                {groupedNews[date].map((news) => (
                  <div
                    key={news.id}
                    className={`p-4 rounded-lg border ${IMPORTANCE_COLORS[news.importance]} space-y-2`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-foreground text-sm">{news.title}</p>
                          <Badge className={IMPORTANCE_BADGE[news.importance]} variant="secondary">
                            {IMPORTANCE_LABELS[news.importance]}
                          </Badge>
                        </div>
                        <p className="text-xs text-foreground/70 mb-2">{news.time} GMT | {convertToBrasilia(news.time)} (Brasília)</p>
                        <p className="text-xs text-foreground/80 mb-3">{news.description}</p>

                        {/* Affected Assets */}
                        <div className="flex flex-wrap gap-1">
                          {news.affectedAssets.map((asset) => (
                            <Badge
                              key={asset}
                              variant="outline"
                              className="text-xs"
                            >
                              {asset}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Category Badge */}
                      <Badge className="bg-primary text-primary-foreground text-xs">
                        {news.category}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-2">
          <p className="font-bold text-blue-900 text-sm">📊 Resumo de Notícias</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-blue-900 font-medium">Alto Impacto</p>
              <p className="text-blue-700">{filteredNews.filter((n) => n.importance === 3).length}</p>
            </div>
            <div>
              <p className="text-blue-900 font-medium">Médio Impacto</p>
              <p className="text-blue-700">{filteredNews.filter((n) => n.importance === 2).length}</p>
            </div>
            <div>
              <p className="text-blue-900 font-medium">Baixo Impacto</p>
              <p className="text-blue-700">{filteredNews.filter((n) => n.importance === 1).length}</p>
            </div>
          </div>
        </div>

        {/* Tip */}
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-900">
            <strong>💡 Dica:</strong> Acompanhe estas notícias diariamente. Notícias de alto impacto podem causar movimentos significativos nos seus ativos. Considere evitar operar durante notícias de alto impacto se não tiver experiência.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
