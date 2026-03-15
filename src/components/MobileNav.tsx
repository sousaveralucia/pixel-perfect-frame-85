import { useState } from "react";
import { 
  Calendar, Wallet, User, Zap, ClipboardCheck, Clock, Bell, 
  BarChart3, Calculator, BookOpen, Globe, Lightbulb, GitCompare, 
  FileText, ArrowDownToLine, Menu, Shield
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const tabItems = [
  { value: "calendario-trading", label: "Calendário", icon: Calendar },
  { value: "contas", label: "Contas", icon: Wallet },
  { value: "autoconhecimento", label: "Pessoal", icon: User },
  { value: "estrategia", label: "Estratégia", icon: Zap },
  { value: "validacao", label: "Pré-Op", icon: ClipboardCheck },
  { value: "rotina", label: "Rotina", icon: Clock },
  { value: "alertas", label: "Alertas", icon: Bell },
  { value: "analises", label: "Análises", icon: BarChart3 },
  { value: "calculadora", label: "Calculadora", icon: Calculator },
  { value: "diario", label: "Diário", icon: BookOpen },
  { value: "calendario", label: "Cal. Econômico", icon: Globe },
  { value: "insights", label: "Insights", icon: Lightbulb },
  { value: "disciplina", label: "Disciplina", icon: Shield },
  { value: "comparacao", label: "Comparação", icon: GitCompare },
  { value: "relatorio", label: "Relatório", icon: FileText },
  { value: "saques", label: "Saques", icon: ArrowDownToLine },
];

interface MobileNavProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

export default function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-between px-2 py-1">
        {tabItems.slice(0, 4).map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.value;
          return (
            <button
              key={item.value}
              onClick={() => onTabChange(item.value)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors min-w-0 flex-1",
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium truncate">{item.label}</span>
            </button>
          );
        })}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-muted-foreground min-w-0 flex-1">
              <Menu className="w-5 h-5" />
              <span className="text-[10px] font-medium">Mais</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
            <SheetHeader>
              <SheetTitle className="text-left">Navegação</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-2 mt-4 overflow-y-auto pb-8">
              {tabItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.value;
                return (
                  <button
                    key={item.value}
                    onClick={() => { onTabChange(item.value); setOpen(false); }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
                      isActive 
                        ? "bg-primary/10 border-primary/30 text-primary" 
                        : "border-border text-muted-foreground hover:border-primary/20"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
