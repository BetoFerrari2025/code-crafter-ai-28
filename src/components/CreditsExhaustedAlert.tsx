import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Zap } from "lucide-react";

interface CreditsExhaustedAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
}

const CreditsExhaustedAlert = ({ open, onOpenChange, message }: CreditsExhaustedAlertProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-xl">Créditos Esgotados</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {message}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-4 my-4">
          <p className="text-sm text-muted-foreground">
            Seus créditos diários reiniciam automaticamente todos os dias à meia-noite (00:00). 
            Para ter mais créditos, faça upgrade do seu plano.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => {
              onOpenChange(false);
              navigate("/dashboard");
              // Small delay to let navigation complete, then trigger pricing dialog
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('open-pricing'));
              }, 500);
            }}
            className="w-full gap-2"
          >
            <Zap className="h-4 w-4" />
            Ver Planos e Preços
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreditsExhaustedAlert;
