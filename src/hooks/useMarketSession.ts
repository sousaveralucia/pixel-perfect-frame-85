import { useMemo } from "react";

export type MarketSession = "NY" | "Londres" | "Ásia" | "Sobreposição" | "Fechado";
export type TimeOfDay = "Manhã" | "Tarde" | "Noite";

interface SessionInfo {
  marketSession: MarketSession;
  timeOfDay: TimeOfDay;
  description: string;
}

/**
 * Hook para detectar a sessão de mercado baseado no horário de Brasília
 * e o ativo operado.
 *
 * Horários das sessões (em Brasília - BRT):
 * - Ásia: 23:00 (dia anterior) - 08:00
 * - Londres: 03:00 - 12:00
 * - NY: 08:00 - 17:00
 * - Sobreposição Londres-NY: 08:00 - 12:00
 * - Sobreposição Ásia-Londres: 23:00 (dia anterior) - 08:00
 */
export function useMarketSession(
  asset: string,
  entryHourBrasilia: number,
  entryMinuteBrasilia: number = 0
): SessionInfo {
  return useMemo(() => {
    const totalMinutes = entryHourBrasilia * 60 + entryMinuteBrasilia;

    // Determinar a sessão de mercado baseado no ativo e horário
    let marketSession: MarketSession = "Fechado";
    let description = "";

    // Horários em minutos desde 00:00
    const asia_start = 23 * 60; // 23:00 (dia anterior)
    const asia_end = 8 * 60; // 08:00
    const london_start = 3 * 60; // 03:00
    const london_end = 12 * 60; // 12:00
    const ny_start = 8 * 60; // 08:00
    const ny_end = 17 * 60; // 17:00

    // Verificar se é Forex (EUR/USD, USDJPY, etc)
    const isForex = ["EUR/USD", "USDJPY"].includes(asset);
    const isGold = asset === "XAUUSD";
    const isCrypto = asset === "BTC USD";
    const isIndices = asset === "NASDAQ";

    if (isForex || isGold) {
      // Forex e Ouro operam 24h, mas com diferentes liquidez nas sessões
      if (totalMinutes >= asia_start || totalMinutes < asia_end) {
        marketSession = "Ásia";
        description = "Sessão Asiática (Tóquio, Hong Kong, Singapura)";
      } else if (totalMinutes >= london_start && totalMinutes < london_end) {
        marketSession = "Londres";
        description = "Sessão de Londres";
      } else if (totalMinutes >= ny_start && totalMinutes < ny_end) {
        marketSession = "NY";
        description = "Sessão de Nova York";
      } else if (
        totalMinutes >= london_start &&
        totalMinutes < ny_end &&
        totalMinutes >= ny_start
      ) {
        // Sobreposição Londres-NY (08:00 - 12:00)
        if (totalMinutes >= ny_start && totalMinutes < london_end) {
          marketSession = "Sobreposição";
          description = "Sobreposição Londres-NY (maior liquidez)";
        }
      }

      // Se não caiu em nenhuma das acima, é Ásia ou Sobreposição Ásia-Londres
      if (marketSession === "Fechado") {
        if (totalMinutes >= asia_start || totalMinutes < london_start) {
          marketSession = "Ásia";
          description = "Sessão Asiática";
        } else {
          marketSession = "Sobreposição";
          description = "Sobreposição Ásia-Londres";
        }
      }
    } else if (isCrypto) {
      // Cripto opera 24h, mas com picos de volume em horários específicos
      if (totalMinutes >= ny_start && totalMinutes < ny_end) {
        marketSession = "NY";
        description = "Horário de pico (NY ativo)";
      } else if (totalMinutes >= london_start && totalMinutes < london_end) {
        marketSession = "Londres";
        description = "Horário de pico (Londres ativo)";
      } else if (totalMinutes >= asia_start || totalMinutes < asia_end) {
        marketSession = "Ásia";
        description = "Horário de pico (Ásia ativa)";
      } else {
        marketSession = "Fechado";
        description = "Cripto 24h (volume baixo)";
      }
    } else if (isIndices) {
      // NASDAQ abre 09:30 NY = 10:30 Brasília
      const nasdaq_start = 10 * 60 + 30; // 10:30
      const nasdaq_end = 17 * 60; // 17:00

      if (totalMinutes >= nasdaq_start && totalMinutes < nasdaq_end) {
        marketSession = "NY";
        description = "NASDAQ em operação (NY)";
      } else {
        marketSession = "Fechado";
        description = "NASDAQ fechado";
      }
    }

    // Determinar o período do dia em Brasília
    let timeOfDay: TimeOfDay = "Manhã";
    if (entryHourBrasilia >= 12 && entryHourBrasilia < 18) {
      timeOfDay = "Tarde";
    } else if (entryHourBrasilia >= 18 || entryHourBrasilia < 6) {
      timeOfDay = "Noite";
    }

    return {
      marketSession,
      timeOfDay,
      description,
    };
  }, [asset, entryHourBrasilia, entryMinuteBrasilia]);
}

/**
 * Função auxiliar para converter hora em string para objeto de sessão
 */
export function parseTimeString(timeStr: string): {
  hour: number;
  minute: number;
} {
  const [hour, minute] = timeStr.split(":").map(Number);
  return { hour, minute: minute || 0 };
}

/**
 * Função para formatar a sessão de mercado para exibição
 */
export function formatMarketSession(session: MarketSession): string {
  const sessionMap: Record<MarketSession, string> = {
    NY: "🗽 NY",
    Londres: "🇬🇧 Londres",
    Ásia: "🌏 Ásia",
    Sobreposição: "🔄 Sobreposição",
    Fechado: "❌ Fechado",
  };
  return sessionMap[session];
}
