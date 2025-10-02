import { Monitor, Smartphone, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type ViewMode = "desktop" | "tablet" | "mobile";

const CodePreview = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");

  const getPreviewWidth = () => {
    switch (viewMode) {
      case "mobile":
        return "max-w-[375px]";
      case "tablet":
        return "max-w-[768px]";
      default:
        return "w-full";
    }
  };

  return (
    <div className="flex-1 h-full bg-muted/30 flex flex-col">
      <div className="h-14 border-b border-border bg-background/50 backdrop-blur-sm flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <Button
              variant={viewMode === "desktop" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("desktop")}
              className="h-8 px-3"
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "tablet" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("tablet")}
              className="h-8 px-3"
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "mobile" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("mobile")}
              className="h-8 px-3"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">Preview ao vivo</div>
      </div>

      <div className="flex-1 overflow-auto p-8 flex justify-center">
        <div className={`${getPreviewWidth()} h-full transition-all duration-300`}>
          <div className="w-full h-full bg-background rounded-xl shadow-medium border border-border overflow-hidden">
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center space-y-4 animate-fade-in">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-hero flex items-center justify-center shadow-soft">
                  <Monitor className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold">Seu App Aqui</h3>
                <p className="text-muted-foreground max-w-md">
                  O código gerado pela IA aparecerá aqui em tempo real. Comece descrevendo o que você quer criar no chat.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodePreview;
