import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ChecklistItem {
  key: string;
  emoji: string;
  label: string;
}

// Default checklist items for each group
// NOTE: Items with key starting in "_section_" are treated as visual headers,
// not counted in progress/score. See src/lib/executionScore.ts
const DEFAULTS: Record<string, ChecklistItem[]> = {
  operational: [
    // 1 — CONTEXTO HTF / MTF
    { key: "_section_htf", emoji: "🧠", label: "1 — CONTEXTO (HTF / MTF)" },
    { key: "structureClear", emoji: "📊", label: "Mercado com estrutura clara (HH/HL ou LL/LH)" },
    { key: "highsLowsIdentified", emoji: "📌", label: "Identifiquei Highs e Lows relevantes" },
    { key: "htfZoneMarked", emoji: "📦", label: "Existe zona HTF/MTF válida (OB, FVG ou Ineficiência — H1/H2/M30/M15)" },
    { key: "htfZoneInteraction", emoji: "🎯", label: "Preço tocou/interagiu com essa zona (CRÍTICO)" },
    { key: "liquidityNearby", emoji: "💧", label: "Existe liquidez próxima" },
    { key: "liquiditySwept", emoji: "🌊", label: "Liquidez já liquidada antes da reação" },
    { key: "noProtectedExtreme", emoji: "🛡️", label: "Não estou entrando em topo/fundo protegido" },

    // 2 — CONFIRMAÇÃO EXTERNA (FOCO PRINCIPAL)
    { key: "_section_external", emoji: "🔄", label: "2 — CONFIRMAÇÃO EXTERNA (FOCO PRINCIPAL)" },
    { key: "chochExterno", emoji: "🔁", label: "Houve CHOCH externo (H1/H2/M30/M15) — CRÍTICO" },
    { key: "bosExterno", emoji: "💥", label: "Houve BOS externo após o CHOCH — CRÍTICO" },
    { key: "externalSameSequence", emoji: "🔗", label: "CHOCH + BOS no mesmo movimento ou sequência válida" },
    { key: "noFalseBreak", emoji: "✋", label: "Não é falso rompimento" },
    { key: "structureChanged", emoji: "🔀", label: "A estrutura realmente mudou (não é ruído)" },

    // 3 — TRANSIÇÃO PARA LTF
    { key: "_section_transition", emoji: "⚡", label: "3 — TRANSIÇÃO PARA LTF" },
    { key: "movedToLTF", emoji: "🔬", label: "Após confirmação externa, desci para LTF (M5/M1)" },
    { key: "noAnticipation", emoji: "🙅", label: "NÃO antecipei entrada" },
    { key: "waitChochInterno", emoji: "⏳", label: "Aguardando confirmação interna" },

    // 4 — CONFIRMAÇÃO INTERNA (EDGE)
    { key: "_section_internal", emoji: "🎯", label: "4 — CONFIRMAÇÃO INTERNA (SEU EDGE)" },
    { key: "chochInterno", emoji: "🔁", label: "Houve CHOCH interno (M5 ou M1) — CRÍTICO" },
    { key: "bosInterno", emoji: "💥", label: "Houve BOS interno após o CHOCH — CRÍTICO" },
    { key: "noFalseBreakInternal", emoji: "✋", label: "Movimento interno não é falso rompimento" },
    { key: "internalConfirmsExternal", emoji: "🤝", label: "Estrutura interna confirma o movimento externo" },

    // 5 — EXECUÇÃO
    { key: "_section_execution", emoji: "💰", label: "5 — EXECUÇÃO" },
    { key: "waitedCorrection", emoji: "⏱️", label: "Esperei a correção após o CHOCH interno" },
    { key: "validZone", emoji: "🎯", label: "Identifiquei zona válida (Order Block ou FVG/Ineficiência)" },
    { key: "zoneAligned", emoji: "🧭", label: "Zona alinhada com o movimento" },
    { key: "gannTraced", emoji: "📦", label: "Tracei a Caixa de Gann" },
    { key: "gannSideAligned", emoji: "⚖️", label: "Entrada no lado correto da Gann (abaixo 50% = Compra / acima 50% = Venda)" },

    // 6 — PRECISÃO
    { key: "_section_precision", emoji: "🎯", label: "6 — PRECISÃO" },
    { key: "discountedRegion", emoji: "📉", label: "Entrada em região descontada" },
    { key: "noMidMove", emoji: "🚫", label: "Não estou entrando no meio do movimento" },
    { key: "alignedAll", emoji: "✅", label: "Entrada alinhada com Estrutura, Liquidez e Execução" },

    // 7 — GESTÃO
    { key: "_section_management", emoji: "🛑", label: "7 — GESTÃO" },
    { key: "stopCorrect", emoji: "🛑", label: "Stop Loss correto (com folga)" },
    { key: "stopProtected", emoji: "🛡️", label: "Protegido contra liquidez" },
    { key: "rrMin", emoji: "🎯", label: "R:R mínimo = 1:3" },
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
