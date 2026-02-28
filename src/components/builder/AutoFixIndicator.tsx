import { useState, useEffect } from "react";
import { Loader2, CheckCircle, XCircle, Wrench, Sparkles } from "lucide-react";
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

const AutoFixIndicator = ({ attempt, maxAttempts, isActive, isExhausted }: AutoFixIndicatorProps) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [dots, setDots] = useState("");

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
