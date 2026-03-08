import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, AlertTriangle, Clock, ChevronLeft, ChevronRight, Flame, TrendingUp, Zap, Filter, Eye, EyeOff } from "lucide-react";
import economicNews from "@/data/economicNews.json";

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

const CATEGORY_ICONS: Record<string, string> = {
  "Emprego": "👷",
  "Inflação": "📈",
  "Banco Central": "🏛️",
  "Atividade Econômica": "🏭",
};

const convertToBrasilia = (timeStr: string): string => {
  if (!timeStr) return "N/A";
  const [hours, minutes] = timeStr.split(":").map(Number);
  let brasiliaHours = hours - 3;
  if (brasiliaHours < 0) brasiliaHours += 24;
  return `${String(brasiliaHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const getWeekNumber = (date: Date): string => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const weekNum = Math.ceil(((date.getDate() - 1) + start.getDay() + 1) / 7);
  return `S${weekNum}`;
};

const isThisWeek = (dateStr: string): boolean => {
  const today = new Date();
  const date = new Date(dateStr + "T00:00:00");
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return date >= startOfWeek && date <= endOfWeek;
};

const isToday = (dateStr: string): boolean => {
  const today = new Date().toISOString().split("T")[0];
  return dateStr === today;
};

const isPast = (dateStr: string): boolean => {
  const today = new Date().toISOString().split("T")[0];
  return dateStr < today;
};

const MONTHS = [
  { label: "Mar 2026", value: "2026-03" },
  { label: "Abr 2026", value: "2026-04" },
  { label: "Mai 2026", value: "2026-05" },
  { label: "Jun 2026", value: "2026-06" },
  { label: "Jul 2026", value: "2026-07" },
  { label: "Ago 2026", value: "2026-08" },
];

export default function EconomicCalendar() {
  const [selectedAssets, setSelectedAssets] = useState<string[]>(economicNews.assets);
  const [selectedImportance, setSelectedImportance] = useState<number[]>([2, 3]);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return MONTHS.find((m) => m.value === key)?.value || MONTHS[0].value;
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(economicNews.categories);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  const toggleAsset = (asset: string) => {
    setSelectedAssets((prev) =>
      prev.includes(asset) ? prev.filter((a) => a !== asset) : [...prev, asset]
    );
  };

  const toggleImportance = (importance: number) => {
    setSelectedImportance((prev) =>
      prev.includes(importance) ? prev.filter((i) => i !== importance) : [...prev, importance]
    );
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const allNews = economicNews.news as NewsItem[];

  const filteredNews = useMemo(() => {
    return allNews.filter((news) => {
      const matchAsset = news.affectedAssets.some((a) => selectedAssets.includes(a));
      const matchImportance = selectedImportance.includes(news.importance);
      const matchCategory = selectedCategories.includes(news.category);
      const matchMonth = news.date.startsWith(selectedMonth);
      return matchAsset && matchImportance && matchCategory && matchMonth;
    });
  }, [selectedAssets, selectedImportance, selectedCategories, selectedMonth, allNews]);

  // This week's events (across all months)
  const thisWeekEvents = useMemo(() => {
    return allNews.filter((n) => isThisWeek(n.date) && n.affectedAssets.some((a) => selectedAssets.includes(a)));
  }, [allNews, selectedAssets]);

  // Next upcoming event
  const nextEvent = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return allNews
      .filter((n) => n.date >= today && n.importance === 3)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))[0];
  }, [allNews]);

  // Group by week
  const groupedByWeek = useMemo(() => {
    const weeks: Record<string, { weekLabel: string; startDate: string; events: NewsItem[] }> = {};
    filteredNews.forEach((news) => {
      const d = new Date(news.date + "T00:00:00");
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const key = monday.toISOString().split("T")[0];
      if (!weeks[key]) {
        const friday = new Date(monday);
        friday.setDate(monday.getDate() + 4);
        weeks[key] = {
          weekLabel: `${monday.getDate()}/${monday.getMonth() + 1} - ${friday.getDate()}/${friday.getMonth() + 1}`,
          startDate: key,
          events: [],
        };
      }
      weeks[key].events.push(news);
    });
    return Object.values(weeks).sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [filteredNews]);

  // Monthly stats
  const monthStats = useMemo(() => {
    const high = filteredNews.filter((n) => n.importance === 3).length;
    const medium = filteredNews.filter((n) => n.importance === 2).length;
    const byCategory: Record<string, number> = {};
    filteredNews.forEach((n) => {
      byCategory[n.category] = (byCategory[n.category] || 0) + 1;
    });
    // Most dangerous week
    const weekDanger: Record<string, number> = {};
    filteredNews.forEach((n) => {
      const d = new Date(n.date + "T00:00:00");
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const key = monday.toISOString().split("T")[0];
      weekDanger[key] = (weekDanger[key] || 0) + (n.importance === 3 ? 2 : 1);
    });
    const hotWeek = Object.entries(weekDanger).sort((a, b) => b[1] - a[1])[0];
    return { high, medium, total: filteredNews.length, byCategory, hotWeek };
  }, [filteredNews]);

  const monthIdx = MONTHS.findIndex((m) => m.value === selectedMonth);

  const getDangerLevel = (events: NewsItem[]): "low" | "medium" | "high" => {
    const highCount = events.filter((e) => e.importance === 3).length;
    if (highCount >= 3) return "high";
    if (highCount >= 1) return "medium";
    return "low";
  };

  return (
    <div className="space-y-4">
      {/* Header com próximo evento */}
      {nextEvent && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Zap className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">PRÓXIMO EVENTO DE ALTO IMPACTO</p>
                  <p className="font-bold text-foreground">{nextEvent.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(nextEvent.date + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })}
                    {" · "}{convertToBrasilia(nextEvent.time)} (Brasília)
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {nextEvent.affectedAssets.map((a) => (
                  <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* This week summary */}
      {thisWeekEvents.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-primary" />
              <p className="font-bold text-sm text-foreground">ESTA SEMANA</p>
              <Badge variant="secondary" className="text-xs">{thisWeekEvents.length} eventos</Badge>
              <Badge className="text-xs bg-destructive text-destructive-foreground">
                {thisWeekEvents.filter((e) => e.importance === 3).length} alto impacto
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {thisWeekEvents.map((ev) => (
                <div
                  key={ev.id}
                  className={`text-xs px-2 py-1 rounded-md border ${
                    ev.importance === 3
                      ? "bg-destructive/10 border-destructive/30 text-destructive"
                      : "bg-muted border-border text-muted-foreground"
                  }`}
                >
                  <span className="font-medium">
                    {new Date(ev.date + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "short" })}
                  </span>
                  {" "}{convertToBrasilia(ev.time)} — {ev.title.length > 30 ? ev.title.slice(0, 30) + "…" : ev.title}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Calendar Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-primary" />
              Calendário Econômico
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="text-xs gap-1"
              >
                {showFilters ? <EyeOff className="w-3.5 h-3.5" /> : <Filter className="w-3.5 h-3.5" />}
                Filtros
              </Button>
              <div className="flex bg-muted rounded-md p-0.5">
                <Button
                  variant={viewMode === "month" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("month")}
                  className="text-xs h-7 px-2"
                >
                  Mês
                </Button>
                <Button
                  variant={viewMode === "week" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("week")}
                  className="text-xs h-7 px-2"
                >
                  Semana
                </Button>
              </div>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between mt-3">
            <Button
              variant="ghost"
              size="sm"
              disabled={monthIdx <= 0}
              onClick={() => setSelectedMonth(MONTHS[monthIdx - 1]?.value)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex gap-1 flex-wrap justify-center">
              {MONTHS.map((m) => (
                <Button
                  key={m.value}
                  variant={selectedMonth === m.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedMonth(m.value)}
                  className="text-xs h-7 px-3"
                >
                  {m.label}
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={monthIdx >= MONTHS.length - 1}
              onClick={() => setSelectedMonth(MONTHS[monthIdx + 1]?.value)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters (collapsible) */}
          {showFilters && (
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg border border-border animate-in fade-in-0 slide-in-from-top-1 duration-200">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Ativos</p>
                <div className="flex flex-wrap gap-1.5">
                  {economicNews.assets.map((asset) => (
                    <Button
                      key={asset}
                      variant={selectedAssets.includes(asset) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleAsset(asset)}
                      className="text-xs h-7"
                    >
                      {asset}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Impacto</p>
                <div className="flex gap-1.5">
                  <Button
                    variant={selectedImportance.includes(2) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleImportance(2)}
                    className="text-xs h-7 gap-1"
                  >
                    🟡 Médio
                  </Button>
                  <Button
                    variant={selectedImportance.includes(3) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleImportance(3)}
                    className="text-xs h-7 gap-1"
                  >
                    🔴 Alto
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Categoria</p>
                <div className="flex flex-wrap gap-1.5">
                  {economicNews.categories.map((cat) => (
                    <Button
                      key={cat}
                      variant={selectedCategories.includes(cat) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleCategory(cat)}
                      className="text-xs h-7"
                    >
                      {CATEGORY_ICONS[cat]} {cat}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Month Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-lg bg-muted/50 border border-border text-center">
              <p className="text-lg font-bold text-foreground">{monthStats.total}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
            </div>
            <div className="p-2.5 rounded-lg bg-destructive/5 border border-destructive/20 text-center">
              <p className="text-lg font-bold text-destructive">{monthStats.high}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Alto Impacto</p>
            </div>
            <div className="p-2.5 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-center">
              <p className="text-lg font-bold text-yellow-600">{monthStats.medium}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Médio Impacto</p>
            </div>
            <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-center">
              <p className="text-lg font-bold text-primary">
                {monthStats.hotWeek
                  ? (() => {
                      const d = new Date(monthStats.hotWeek[0] + "T00:00:00");
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    })()
                  : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Semana Quente</p>
            </div>
          </div>

          {/* Events */}
          {groupedByWeek.length === 0 ? (
            <div className="text-center py-10">
              <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Nenhum evento encontrado com os filtros selecionados</p>
            </div>
          ) : (
            groupedByWeek.map((week) => {
              const danger = getDangerLevel(week.events);
              const weekHasThisWeek = week.events.some((e) => isThisWeek(e.date));
              // Group events by date within the week
              const byDate: Record<string, NewsItem[]> = {};
              week.events.forEach((e) => {
                if (!byDate[e.date]) byDate[e.date] = [];
                byDate[e.date].push(e);
              });
              const sortedDates = Object.keys(byDate).sort();

              return (
                <div
                  key={week.startDate}
                  className={`rounded-lg border overflow-hidden ${
                    weekHasThisWeek
                      ? "border-primary/40 ring-1 ring-primary/20"
                      : danger === "high"
                      ? "border-destructive/30"
                      : "border-border"
                  }`}
                >
                  {/* Week Header */}
                  <div
                    className={`px-4 py-2.5 flex items-center justify-between ${
                      weekHasThisWeek
                        ? "bg-primary/10"
                        : danger === "high"
                        ? "bg-destructive/5"
                        : "bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {weekHasThisWeek && (
                        <Badge className="text-[10px] bg-primary text-primary-foreground">AGORA</Badge>
                      )}
                      <p className="font-bold text-sm text-foreground">📅 Semana {week.weekLabel}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {danger === "high" && (
                        <Badge variant="destructive" className="text-[10px] gap-0.5">
                          <Flame className="w-3 h-3" /> SEMANA QUENTE
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[10px]">
                        {week.events.length} evento{week.events.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </div>

                  {/* Events by date */}
                  <div className="divide-y divide-border">
                    {sortedDates.map((date) => {
                      const dayEvents = byDate[date];
                      const dateObj = new Date(date + "T00:00:00");
                      const todayFlag = isToday(date);
                      const pastFlag = isPast(date);

                      return (
                        <div key={date} className={`${todayFlag ? "bg-primary/5" : pastFlag ? "opacity-50" : ""}`}>
                          {/* Day header */}
                          <div className="px-4 py-2 flex items-center gap-2 border-b border-border/50">
                            <span className={`text-xs font-bold uppercase ${todayFlag ? "text-primary" : "text-muted-foreground"}`}>
                              {dateObj.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })}
                            </span>
                            {todayFlag && <Badge className="text-[10px] bg-primary text-primary-foreground">HOJE</Badge>}
                          </div>

                          {/* Day events */}
                          {dayEvents
                            .sort((a, b) => a.time.localeCompare(b.time))
                            .map((ev) => (
                              <div
                                key={ev.id}
                                className="px-4 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors"
                              >
                                {/* Time */}
                                <div className="flex-shrink-0 text-center w-14">
                                  <p className="text-xs font-mono font-bold text-foreground">{convertToBrasilia(ev.time)}</p>
                                  <p className="text-[10px] text-muted-foreground">{ev.time} GMT</p>
                                </div>

                                {/* Importance indicator */}
                                <div
                                  className={`flex-shrink-0 w-1 self-stretch rounded-full ${
                                    ev.importance === 3 ? "bg-destructive" : "bg-yellow-500"
                                  }`}
                                />

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="font-semibold text-sm text-foreground leading-tight">
                                        {CATEGORY_ICONS[ev.category]} {ev.title}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ev.description}</p>
                                    </div>
                                    <Badge
                                      className={`flex-shrink-0 text-[10px] ${
                                        ev.importance === 3
                                          ? "bg-destructive/10 text-destructive border-destructive/30"
                                          : "bg-yellow-500/10 text-yellow-700 border-yellow-500/30"
                                      }`}
                                      variant="outline"
                                    >
                                      {ev.importance === 3 ? "🔴 ALTO" : "🟡 MÉDIO"}
                                    </Badge>
                                  </div>

                                  {/* Assets tags */}
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {ev.affectedAssets.map((a) => (
                                      <span
                                        key={a}
                                        className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium ${
                                          selectedAssets.includes(a)
                                            ? "bg-primary/10 text-primary border border-primary/20"
                                            : "bg-muted text-muted-foreground"
                                        }`}
                                      >
                                        {a}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          {/* Tip */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">💡 Dica:</strong> Nos dias de 🔴 Alto Impacto (NFP, CPI, FOMC), considere reduzir o tamanho das posições ou evitar operar nos 30min antes/depois do evento. Semanas marcadas como "QUENTE" possuem múltiplos eventos de alto impacto — opere com cautela extra.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
