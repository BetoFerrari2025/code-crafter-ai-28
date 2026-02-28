import { useState, useEffect, useRef } from "react";
import { CheckCircle, XCircle, Wrench, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AutoFixIndicatorProps {
  attempt: number;
  maxAttempts: number;
  isActive: boolean;
  isExhausted: boolean;
}

const STATUS_MESSAGES = [
  "Analisando o erro...",
  "Identificando causa raiz...",
  "Reescrevendo código...",
  "Aplicando correção...",
  "Validando resultado...",
];

const playSound = (type: 'success' | 'error') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === 'success') {
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.frequency.setValueAtTime(330, ctx.currentTime);
      osc.frequency.setValueAtTime(220, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    }
    setTimeout(() => ctx.close(), 500);
  } catch {}
};

const vibrate = (pattern: number | number[]) => {
  try { navigator.vibrate?.(pattern); } catch {}
};

const AutoFixIndicator = ({ attempt, maxAttempts, isActive, isExhausted }: AutoFixIndicatorProps) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [dots, setDots] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const prevActiveRef = useRef(isActive);
  const prevExhaustedRef = useRef(isExhausted);

  useEffect(() => {
    if (!isActive) {
      setMessageIndex(0);
      setDots("");
      return;
    }
    const msgInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2200);
    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => {
      clearInterval(msgInterval);
      clearInterval(dotInterval);
    };
  }, [isActive]);

  // Detect success/failure transitions
  useEffect(() => {
    const wasActive = prevActiveRef.current;
    const wasExhausted = prevExhaustedRef.current;

    if (wasActive && !isActive && !isExhausted) {
      playSound('success');
      vibrate(100);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    }

    if (!wasExhausted && isExhausted) {
      playSound('error');
      vibrate([100, 50, 100]);
    }

    prevActiveRef.current = isActive;
    prevExhaustedRef.current = isExhausted;
  }, [isActive, isExhausted]);

  if (showSuccess) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 animate-fade-in">
        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
        <span className="text-[11px] font-medium text-emerald-500">Corrigido com sucesso! ✨</span>
      </div>
    );
  }

  if (!isActive && !isExhausted) return null;

  const progress = isExhausted ? 100 : Math.min(((attempt - 1) / maxAttempts) * 100 + (messageIndex / STATUS_MESSAGES.length) * (100 / maxAttempts), 95);

  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-primary/5 border border-primary/20 animate-fade-in">
      {isExhausted ? (
        <>
          <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
          <span className="text-[11px] font-medium text-destructive">
            Auto-correção esgotada ({maxAttempts}/{maxAttempts})
          </span>
        </>
      ) : (
        <>
          <div className="relative shrink-0">
            <Wrench className="h-3.5 w-3.5 text-primary animate-spin" style={{ animationDuration: "3s" }} />
            <Sparkles className="h-2 w-2 text-primary absolute -top-0.5 -right-0.5 animate-pulse" />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-primary whitespace-nowrap">
                Tentativa {attempt}/{maxAttempts}
              </span>
              <Progress value={progress} className="h-1 w-16 bg-primary/10 [&>div]:bg-primary" />
            </div>
            <span className="text-[10px] text-muted-foreground truncate">
              {STATUS_MESSAGES[messageIndex]}{dots}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default AutoFixIndicator;
