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

  const plans = language === "pt"
    ? [
        {
          name: "Start",
          description: "Projetado para equipes dinâmicas que constroem juntas em tempo real.",
          price: "10,00",
          currency: "R$",
          period: t("pricing.perMonth"),
          subtitle: t("pricing.shared"),
          features: [
            "100 créditos mensais",
            "5 créditos diários (até 150/mês)",
            "Nuvem baseada em uso",
            "Renovações de crédito",
            "Domínios personalizados",
            "Remove o emblema adorável",
            "Projetos privados",
            "Funções e permissões do usuário",
          ],
          buttonVariant: "default" as const,
          link: "https://pay.lowify.com.br/checkout.php?product_id=FmnrzU",
        },
        {
          name: "Pró",
          description: "Controles avançados e recursos avançados para departamentos em crescimento",
          price: "37,00",
          currency: "R$",
          period: t("pricing.perMonth"),
          subtitle: t("pricing.shared"),
          features: [
            "500 créditos mensais",
            "SSO",
            "Projetos Pessoais",
            "Desativar o treinamento de dados",
            "Modelos de design",
          ],
          buttonVariant: "outline" as const,
          link: "https://pay.lowify.com.br/go.php?offer=jm91bzv",
        },
        {
          name: "Premium",
          description: "Criado para grandes organizações que precisam de flexibilidade, escala e governança.",
          price: "97,00",
          currency: "R$",
          period: t("pricing.flexBilling"),
          subtitle: t("pricing.customPlans"),
          features: [
            "Ilimitado",
            "Suporte dedicado",
            "Serviços de integração",
            "Conexões personalizadas",
            "Controle de acesso baseado em grupo",
            "Sistemas de design personalizados",
          ],
          buttonVariant: "outline" as const,
          link: "https://pay.lowify.com.br/go.php?offer=t6f7eij",
        },
      ]
    : [
        {
          name: "Start",
          description: "Designed for dynamic teams building together in real time.",
          price: "1.99",
          currency: "$",
          period: t("pricing.perMonth"),
          subtitle: t("pricing.shared"),
          features: [
            "100 monthly credits",
            "5 daily credits (up to 150/month)",
            "Usage-based cloud",
            "Credit renewals",
            "Custom domains",
            "Remove Lovable badge",
            "Private projects",
            "User roles & permissions",
          ],
          buttonVariant: "default" as const,
          link: "https://adsroi.com.br/checkout/5IMn7I?offer=offer-1772128000363&aff=[ID_AFILIADO]",
        },
        {
          name: "Pro",
          description: "Advanced controls and features for growing departments",
          price: "9.90",
          currency: "$",
          period: t("pricing.perMonth"),
          subtitle: t("pricing.shared"),
          features: [
            "500 monthly credits",
            "SSO",
            "Personal Projects",
            "Disable data training",
            "Design templates",
          ],
          buttonVariant: "outline" as const,
          link: "https://adsroi.com.br/checkout/5IMn7I?offer=offer-1772127879604&aff=[ID_AFILIADO]",
        },
        {
          name: "Premium",
          description: "Built for large organizations that need flexibility, scale, and governance.",
          price: "19.90",
          currency: "$",
          period: t("pricing.flexBilling"),
          subtitle: t("pricing.customPlans"),
          features: [
            "Unlimited",
            "Dedicated support",
            "Integration services",
            "Custom connections",
            "Group-based access control",
            "Custom design systems",
          ],
          buttonVariant: "outline" as const,
          link: "https://adsroi.com.br/checkout/5IMn7I?offer=offer-1772128044563&aff=[ID_AFILIADO]",
        },
      ];

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {plans.map((plan, idx) => (
            <div
              key={plan.name}
              className="border border-border rounded-2xl p-6 bg-card hover:shadow-lg transition-smooth flex flex-col"
            >
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-6 min-h-[60px]">
                  {plan.description}
                </p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.currency} {plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{plan.subtitle}</p>
                </div>

                <a href={plan.link} target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button variant={plan.buttonVariant} className="w-full mb-6">
                    {t("pricing.upgrade")}
                  </Button>
                </a>

                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-3">
                    {idx === 0 ? t("pricing.freePlus") : `${language === "pt" ? "Tudo em" : "Everything in"} ${plans[idx - 1]?.name}, ${language === "pt" ? "mais" : "plus"}:`}
                  </p>
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
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
