import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import TrackingScripts from "@/components/TrackingScripts";

interface PricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PricingDialog = ({ open, onOpenChange }: PricingDialogProps) => {
  const { language, t } = useLanguage();

  const plan = language === "pt"
    ? {
        name: "Premium",
        description: "Acesso ilimitado a todos os recursos da plataforma.",
        price: "10,00",
        currency: "R$",
        period: t("pricing.perMonth"),
        features: [
          "Créditos ilimitados",
          "Projetos ilimitados",
          "Nuvem baseada em uso",
          "Domínios personalizados",
          "Remove o emblema",
          "Projetos privados",
          "Suporte dedicado",
          "Modelos de design",
        ],
        link: "https://pay.lowify.com.br/checkout.php?product_id=FmnrzU",
      }
    : {
        name: "Premium",
        description: "Unlimited access to all platform features.",
        price: "1.99",
        currency: "$",
        period: t("pricing.perMonth"),
        features: [
          "Unlimited credits",
          "Unlimited projects",
          "Usage-based cloud",
          "Custom domains",
          "Remove badge",
          "Private projects",
          "Dedicated support",
          "Design templates",
        ],
        link: "https://adsroi.com.br/checkout/5IMn7I?offer=offer-1772128000363&aff=[ID_AFILIADO]",
      };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <TrackingScripts />
        <DialogHeader>
          <DialogTitle className="text-2xl">{t("pricing.title")}</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {t("pricing.current")} <span className="font-semibold">{t("pricing.free")}</span>.
          </p>
        </DialogHeader>

        <div className="max-w-md mx-auto mt-6">
          <div className="border border-primary rounded-2xl p-6 bg-card hover:shadow-lg transition-smooth flex flex-col">
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-6 min-h-[40px]">
                {plan.description}
              </p>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.currency} {plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </div>

              <a href={plan.link} target="_blank" rel="noopener noreferrer" className="w-full" onClick={() => {
                if (typeof (window as any).fbq === 'function') {
                  (window as any).fbq('track', 'Lead');
                }
              }}>
                <Button className="w-full mb-6">
                  {t("pricing.upgrade")}
                </Button>
              </a>

              <div className="space-y-3">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2">{t("pricing.student")}</h4>
          <p className="text-sm text-muted-foreground">{t("pricing.studentDesc")}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PricingDialog;
