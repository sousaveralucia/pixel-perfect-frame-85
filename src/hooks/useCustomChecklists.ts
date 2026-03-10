import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ChecklistItem {
  key: string;
  emoji: string;
  label: string;
}

// Default checklist items for each group
const DEFAULTS: Record<string, ChecklistItem[]> = {
  operational: [
    { key: "chochValidoHTF", emoji: "📊", label: "CHoCH válido em HTF (H4, H2 ou H1): Identificar um Change of Character válido em timeframes superiores" },
    { key: "caixaGannTracada", emoji: "📦", label: "Caixa de Gann em M30: Traçar do início do show até o fim do CHoCH" },
    { key: "regiaoDescontada50", emoji: "📉", label: "Order Blocks abaixo da Gann (50% para compra) ou acima (50% para venda)" },
    { key: "orderBlockIdentificado", emoji: "🎯", label: "Order Blocks de HTF (H4, H2, H1 ou M30): Identificar Order Blocks válidos" },
    { key: "entrada50OB", emoji: "💰", label: "Entrada nos 50% do Order Block de HTF" },
    { key: "stopRiskManagement", emoji: "🛑", label: "Stop Loss e Take Profit 1:3: Stop abaixo/acima do Order Block de HTF" },
    { key: "tempoGraficoOperacional", emoji: "⏱️", label: "Tempo Gráfico Operacional em M15 ou M5: Confirmar entrada em timeframe operacional" },
  ],
  emotional: [
    { key: "hydration", emoji: "❓", label: "Estou mentalmente preparado para fazer este trade?" },
    { key: "breathing", emoji: "❓", label: "Estou emocionalmente estável neste momento?" },
    { key: "mentalClarity", emoji: "❓", label: "Tenho confiança no meu plano de trading?" },
  ],
  routine: [
    { key: "nightAnalysis", emoji: "🌙", label: "Fiz análise de mercado na noite anterior (20h-20h30)" },
    { key: "morningReview", emoji: "🌅", label: "Revisei as marcações da noite ao acordar" },
    { key: "regionsValidated", emoji: "🎯", label: "Verifiquei se as regiões traçadas estão sendo buscadas/respeitadas" },
    { key: "sleep", emoji: "😴", label: "Dormi bem e estou descansado" },
  ],
  rational: [
    { key: "analysisConfirmed", emoji: "✅", label: "Confirmei a análise técnica" },
    { key: "planRespected", emoji: "📋", label: "Respeitei o plano operacional" },
    { key: "riskManaged", emoji: "🛡️", label: "Gerenciei o risco corretamente" },
  ],
  plan: [
    { key: "step1", emoji: "1️⃣", label: "Confirmação de Estrutura (HTF)|CHoCH (Change of Character) validado em timeframe maior" },
    { key: "step2", emoji: "2️⃣", label: "Caixa de Gann Traçada|Desenhar a Gann Box no movimento principal para identificar níveis" },
    { key: "step3", emoji: "3️⃣", label: "Região Descontada (50%)|Preço está na região de desconto (abaixo de 50% da Gann Box)" },
    { key: "step4", emoji: "4️⃣", label: "Order Block Identificado|Identificar o Order Block (OB) na zona de interesse" },
    { key: "step5", emoji: "5️⃣", label: "Entrada nos 50% do OB|Posicionar entrada nos 50% do Order Block para melhor R:R" },
    { key: "step6", emoji: "6️⃣", label: "Stop & Risk Management|Stop loss posicionado corretamente, risco controlado (máx 1-2% do capital)" },
    { key: "step7", emoji: "7️⃣", label: "Tempo Gráfico Operacional|Confirmação no timeframe operacional antes de executar" },
  ],
  goldenRule: [
    { key: "goldenRule", emoji: "⚡", label: "Regra de Ouro|Somente execute se todos os itens estiverem confirmados. Setup incompleto = sem entrada. Alvo mínimo de R:R 1:3." },
  ],
};

export function getDefaultItems(group: string): ChecklistItem[] {
  return DEFAULTS[group] || [];
}

export function useCustomChecklists(group: string) {
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>(DEFAULTS[group] || []);
  const [isLoading, setIsLoading] = useState(true);
  const [isCustomized, setIsCustomized] = useState(false);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    supabase
      .from("custom_checklists" as any)
      .select("items")
      .eq("user_id", user.id)
      .eq("checklist_group", group)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
          setItems(data.items);
          setIsCustomized(true);
        } else {
          setItems(DEFAULTS[group] || []);
          setIsCustomized(false);
        }
        setIsLoading(false);
      });
  }, [user, group]);

  const saveItems = useCallback(async (newItems: ChecklistItem[]) => {
    if (!user) return;
    setItems(newItems);
    setIsCustomized(true);
    await supabase
      .from("custom_checklists" as any)
      .upsert({
        user_id: user.id,
        checklist_group: group,
        items: newItems,
      } as any, { onConflict: "user_id,checklist_group" });
  }, [user, group]);

  const resetToDefaults = useCallback(async () => {
    if (!user) return;
    const defaults = DEFAULTS[group] || [];
    setItems(defaults);
    setIsCustomized(false);
    await supabase
      .from("custom_checklists" as any)
      .delete()
      .eq("user_id", user.id)
      .eq("checklist_group", group);
  }, [user, group]);

  return { items, isLoading, isCustomized, saveItems, resetToDefaults };
}
