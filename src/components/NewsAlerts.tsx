import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flame,
  Zap,
  Filter,
  EyeOff,
  Shield,
  X,
} from "lucide-react";
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
  Emprego: "👷",
  Inflação: "📈",
  "Banco Central": "🏛️",
  "Atividade Econômica": "🏭",
};

const OPERATED_ASSETS = ["EUR/USD", "USDJPY", "XAUUSD", "NASDAQ", "BTC USD"];

const convertToBrasilia = (timeStr: string): string => {
  if (!timeStr) return "N/A";
  const [hours, minutes] = timeStr.split(":").map(Number);
  let brasiliaHours = hours - 3;
  if (brasiliaHours < 0) brasiliaHours += 24;
  return `${String(brasiliaHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
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
  return dateStr === new Date().toISOString().split("T")[0];
};

const isPast = (dateStr: string): boolean => {
  return dateStr < new Date().toISOString().split("T")[0];
};

const MONTHS = [
  { label: "Mar 2026", value: "2026-03" },
  { label: "Abr 2026", value: "2026-04" },
  { label: "Mai 2026", value: "2026-05" },
  { label: "Jun 2026", value: "2026-06" },
  { label: "Jul 2026", value: "2026-07" },
  { label: "Ago 2026", value: "2026-08" },
];

export default function NewsAlerts() {
  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>(OPERATED_ASSETS);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return MONTHS.find((m) => m.value === key)?.value || MONTHS[0].value;
  });

  const allNews = economicNews.news as NewsItem[];

  const toggleAsset = (asset: string) => {
    setSelectedAssets((prev) =>
      prev.includes(asset) ? prev.filter((a) => a !== asset) : [...prev, asset]
    );
  };

  const dismissAlert = (id: number) => {
    setDismissedAlerts((prev) => [...prev, id]);
  };

  // Only high impact news for alerts
  const filteredNews = useMemo(() => {
    return allNews.filter((news) => {
      const matchAsset = news.affectedAssets.some((a) => selectedAssets.includes(a));
      const matchMonth = news.date.startsWith(selectedMonth);
      return news.importance === 3 && matchAsset && matchMonth && !dismissedAlerts.includes(news.id);
    });
  }, [selectedAssets, selectedMonth, allNews, dismissedAlerts]);

  // This week alerts
  const thisWeekAlerts = useMemo(() => {
    return allNews.filter(
      (n) =>
        isThisWeek(n.date) &&
        n.importance === 3 &&
        n.affectedAssets.some((a) => selectedAssets.includes(a))
    );
  }, [allNews, selectedAssets]);

  // Next upcoming high impact
  const nextAlert = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return allNews
      .filter(
        (n) =>
          n.date >= today &&
          n.importance === 3 &&
          n.affectedAssets.some((a) => OPERATED_ASSETS.includes(a))
      )
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))[0];
  }, [allNews]);

  // Days until
  const daysUntil = (dateStr: string): string => {
    const today = new Date();
    const d = new Date(dateStr + "T00:00:00");
    const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Hoje";
    if (diff === 1) return "Amanhã";
    if (diff < 0) return "Passou";
    return `Em ${diff} dias`;
  };

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

  // Month stats
  const monthStats = useMemo(() => {
    const total = filteredNews.length;
    const byAsset: Record<string, number> = {};
    filteredNews.forEach((n) => {
      n.affectedAssets.forEach((a) => {
        if (selectedAssets.includes(a)) byAsset[a] = (byAsset[a] || 0) + 1;
      });
    });
    const mostAffected = Object.entries(byAsset).sort((a, b) => b[1] - a[1])[0];
    // Danger weeks
    const weekDanger: Record<string, number> = {};
    filteredNews.forEach((n) => {
      const d = new Date(n.date + "T00:00:00");
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const key = monday.toISOString().split("T")[0];
      weekDanger[key] = (weekDanger[key] || 0) + 1;
    });
    const dangerWeeks = Object.entries(weekDanger).filter(([, count]) => count >= 3).length;
    return { total, byAsset, mostAffected, dangerWeeks };
  }, [filteredNews, selectedAssets]);

  const monthIdx = MONTHS.findIndex((m) => m.value === selectedMonth);

  return (
    <div className="space-y-4">
      {/* Next alert banner */}
      {nextAlert && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Zap className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">⚡ PRÓXIMO ALERTA DE ALTO IMPACTO</p>
                  <p className="font-bold text-foreground">{nextAlert.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(nextAlert.date + "T00:00:00").toLocaleDateString("pt-BR", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                    {" · "}
                    {convertToBrasilia(nextAlert.time)} (Brasília)
                    {" · "}
                    <span className="font-semibold text-destructive">{daysUntil(nextAlert.date)}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {nextAlert.affectedAssets.map((a) => (
                  <Badge key={a} variant="outline" className="text-xs">
                    {a}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* This week */}
      {thisWeekAlerts.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-primary" />
              <p className="font-bold text-sm text-foreground">ALERTAS DESTA SEMANA</p>
              <Badge className="text-xs bg-destructive text-destructive-foreground">
                {thisWeekAlerts.length} alerta{thisWeekAlerts.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {thisWeekAlerts.map((ev) => (
                <div
                  key={ev.id}
                  className="text-xs px-2 py-1 rounded-md border bg-destructive/10 border-destructive/30 text-destructive"
                >
                  <span className="font-medium">
                    {new Date(ev.date + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "short" })}
                  </span>{" "}
                  {convertToBrasilia(ev.time)} — {ev.title.length > 35 ? ev.title.slice(0, 35) + "…" : ev.title}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Alerts Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="w-5 h-5 text-destructive" />
              Alertas de Notícias
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="text-xs gap-1"
            >
              {showFilters ? <EyeOff className="w-3.5 h-3.5" /> : <Filter className="w-3.5 h-3.5" />}
              Filtros
            </Button>
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
          {/* Filters */}
          {showFilters && (
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg border border-border animate-in fade-in-0 slide-in-from-top-1 duration-200">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                  Ativos
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {OPERATED_ASSETS.map((asset) => (
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
            </div>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-lg bg-destructive/5 border border-destructive/20 text-center">
              <p className="text-lg font-bold text-destructive">{monthStats.total}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Alertas</p>
            </div>
            <div className="p-2.5 rounded-lg bg-warning/5 border border-warning/20 text-center">
              <p className="text-lg font-bold text-warning">{monthStats.dangerWeeks}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Semanas Quentes</p>
            </div>
            <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-center">
              <p className="text-lg font-bold text-primary">{monthStats.mostAffected?.[0] || "—"}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Mais Afetado</p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/50 border border-border text-center">
              <p className="text-lg font-bold text-foreground">
                {Object.keys(monthStats.byAsset).length}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ativos Impactados</p>
            </div>
          </div>

          {/* Alerts grouped by week */}
          {groupedByWeek.length === 0 ? (
            <div className="text-center py-10">
              <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                Nenhum alerta de alto impacto neste mês — mês tranquilo para operar! 🟢
              </p>
            </div>
          ) : (
            groupedByWeek.map((week) => {
              const weekHasThisWeek = week.events.some((e) => isThisWeek(e.date));
              const isHot = week.events.length >= 3;

              // Group by date
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
                      : isHot
                      ? "border-destructive/30"
                      : "border-border"
                  }`}
                >
                  {/* Week Header */}
                  <div
                    className={`px-4 py-2.5 flex items-center justify-between ${
                      weekHasThisWeek
                        ? "bg-primary/10"
                        : isHot
                        ? "bg-destructive/5"
                        : "bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {weekHasThisWeek && (
                        <Badge className="text-[10px] bg-primary text-primary-foreground">AGORA</Badge>
                      )}
                      <p className="font-bold text-sm text-foreground">🔔 Semana {week.weekLabel}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isHot && (
                        <Badge variant="destructive" className="text-[10px] gap-0.5">
                          <Flame className="w-3 h-3" /> PERIGOSA
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[10px]">
                        {week.events.length} alerta{week.events.length !== 1 ? "s" : ""}
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
                          <div className="px-4 py-2 flex items-center gap-2 border-b border-border/50">
                            <span
                              className={`text-xs font-bold uppercase ${
                                todayFlag ? "text-primary" : "text-muted-foreground"
                              }`}
                            >
                              {dateObj.toLocaleDateString("pt-BR", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                            {todayFlag && (
                              <Badge className="text-[10px] bg-primary text-primary-foreground">HOJE</Badge>
                            )}
                            <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">
                              {daysUntil(date)}
                            </Badge>
                          </div>

                          {dayEvents
                            .sort((a, b) => a.time.localeCompare(b.time))
                            .map((ev) => (
                              <div
                                key={ev.id}
                                className="px-4 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors"
                              >
                                {/* Time */}
                                <div className="flex-shrink-0 text-center w-14">
                                  <p className="text-xs font-mono font-bold text-foreground">
                                    {convertToBrasilia(ev.time)}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">{ev.time} GMT</p>
                                </div>

                                {/* Importance bar */}
                                <div className="flex-shrink-0 w-1 self-stretch rounded-full bg-destructive" />

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="font-semibold text-sm text-foreground leading-tight">
                                        {CATEGORY_ICONS[ev.category]} {ev.title}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                        {ev.description}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Badge
                                        className="flex-shrink-0 text-[10px] bg-destructive/10 text-destructive border-destructive/30"
                                        variant="outline"
                                      >
                                        🔴 ALTO
                                      </Badge>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => dismissAlert(ev.id)}
                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>

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

          {/* Trading routine tip */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">💡 Baseado na sua rotina:</strong> Nos dias com alertas 🔴, 
              revise com atenção extra durante sua análise noturna (20h-20h30). Pela manhã, verifique se o mercado 
              já reagiu ao evento antes de operar. Em semanas marcadas como "PERIGOSA", considere reduzir posições 
              ou aguardar o evento passar.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
