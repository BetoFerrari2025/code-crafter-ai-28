import { Clock, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CodeVersion {
  id: string;
  code: string;
  timestamp: Date;
  description: string;
}

interface VersionHistoryPanelProps {
  history: CodeVersion[];
  currentIndex: number;
  onRestore: (index: number) => void;
  onClose: () => void;
}

const VersionHistoryPanel = ({ history, currentIndex, onRestore, onClose }: VersionHistoryPanelProps) => {
  if (history.length === 0) {
    return (
      <div className="w-72 h-full border-l border-border bg-background flex flex-col">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Histórico</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-muted-foreground text-center">Nenhuma versão salva ainda.</p>
        </div>
      </div>
    );
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="w-72 h-full border-l border-border bg-background flex flex-col">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Histórico ({history.length})</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {[...history].reverse().map((version, reversedIdx) => {
            const originalIdx = history.length - 1 - reversedIdx;
            const isCurrent = originalIdx === currentIndex;
            return (
              <div
                key={version.id}
                className={`p-3 rounded-lg text-sm cursor-pointer transition-colors ${
                  isCurrent
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-muted/50 border border-transparent"
                }`}
                onClick={() => !isCurrent && onRestore(originalIdx)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-medium truncate ${isCurrent ? "text-primary" : "text-foreground"}`}>
                    {isCurrent ? "● Atual" : `v${originalIdx + 1}`}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatTime(version.timestamp)}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{version.description}</p>
                {!isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 h-6 text-xs gap-1 px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestore(originalIdx);
                    }}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restaurar
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default VersionHistoryPanel;
