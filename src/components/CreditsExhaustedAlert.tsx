import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface CreditsExhaustedAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
}

const CreditsExhaustedAlert = ({ open, onOpenChange, message }: CreditsExhaustedAlertProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-xl">{t("credits.exhausted")}</DialogTitle>
          </div>
          <DialogDescription className="text-base">{message}</DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-4 my-4">
          <p className="text-sm text-muted-foreground">{t("credits.resetInfo")}</p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => {
              onOpenChange(false);
              navigate("/dashboard");
              setTimeout(() => { window.dispatchEvent(new CustomEvent('open-pricing')); }, 500);
            }}
            className="w-full gap-2"
          >
            <Zap className="h-4 w-4" />
            {t("credits.viewPlans")}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            {t("credits.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreditsExhaustedAlert;
