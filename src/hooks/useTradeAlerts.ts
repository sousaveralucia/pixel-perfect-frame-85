import { useEffect, useCallback } from "react";
import { toast } from "sonner";

interface TradeWithChecklist {
  id: string;
  date: string;
  asset: string;
  entryPrice: string;
  exitPrice: string;
  result: "WIN" | "LOSS" | "BREAK_EVEN" | "ONGOING";
  notes: string;
  emotional: Record<string, boolean>;
  rational: Record<string, boolean>;
  createdAt: number;
}

const ALERT_SOUND_URL = "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==";

export function useTradeAlerts(trades: TradeWithChecklist[], activeAccountId: string) {
  const playAlertSound = useCallback(() => {
    try {
      const audio = new Audio(ALERT_SOUND_URL);
      audio.play().catch(() => {
        // Fallback: usar Web Audio API
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = "sine";
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      });
    } catch (error) {
      console.error("Erro ao tocar som de alerta:", error);
    }
  }, []);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      });
    }
  }, []);

  const checkDailyLimits = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    const todaysTrades = trades.filter(t => t.date === today);
    
    const losses = todaysTrades.filter(t => t.result === "LOSS").length;
    const wins = todaysTrades.filter(t => t.result === "WIN").length;
    
    const MAX_LOSSES = 3;
    const TARGET_WINS = 2;

    // Verificar se atingiu limite de losses
    if (losses >= MAX_LOSSES) {
      const alertKey = `loss_alert_${today}_${activeAccountId}`;
      if (!sessionStorage.getItem(alertKey)) {
        sessionStorage.setItem(alertKey, "true");
        
        playAlertSound();
        sendNotification("⚠️ Limite de Losses Atingido!", {
          body: `Você atingiu ${losses} losses hoje. Pare de operar!`,
          tag: "loss-alert",
          requireInteraction: true,
        });
        
        toast.error(`🛑 Limite de ${MAX_LOSSES} losses atingido! Pare de operar hoje.`, {
          duration: 10000,
        });
      }
    }

    // Verificar se atingiu target de wins
    if (wins >= TARGET_WINS) {
      const alertKey = `win_alert_${today}_${activeAccountId}`;
      if (!sessionStorage.getItem(alertKey)) {
        sessionStorage.setItem(alertKey, "true");
        
        playAlertSound();
        sendNotification("🎉 Target de Wins Atingido!", {
          body: `Você atingiu ${wins} wins hoje. Parabéns!`,
          tag: "win-alert",
          requireInteraction: false,
        });
        
        toast.success(`✅ Você atingiu ${TARGET_WINS} wins! Alvo do dia alcançado!`, {
          duration: 10000,
        });
      }
    }
  }, [trades, activeAccountId, playAlertSound, sendNotification]);

  // Verificar limites quando trades mudam
  useEffect(() => {
    checkDailyLimits();
  }, [trades, checkDailyLimits]);

  // Solicitar permissão para notificações
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Limpar sessionStorage à meia-noite
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const timeUntilMidnight = tomorrow.getTime() - now.getTime();
      
      const timeout = setTimeout(() => {
        sessionStorage.removeItem(`loss_alert_${new Date().toISOString().split("T")[0]}_${activeAccountId}`);
        sessionStorage.removeItem(`win_alert_${new Date().toISOString().split("T")[0]}_${activeAccountId}`);
      }, timeUntilMidnight);
      
      return () => clearTimeout(timeout);
    };
    
    return checkMidnight();
  }, [activeAccountId]);
}
