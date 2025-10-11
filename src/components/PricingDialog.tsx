import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface PricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PricingDialog = ({ open, onOpenChange }: PricingDialogProps) => {
  const plans = [
    {
      name: "Pró",
      description: "Projetado para equipes dinâmicas que constroem juntas em tempo real.",
      price: "25",
      period: "por mês",
      subtitle: "compartilhado entre usuários ilimitados",
      features: [
        "100 créditos mensais",
        "5 créditos diários (até 150/mês)",
        "Nuvem baseada em uso",
        "Renovações de crédito",
        "Domínios personalizados",
        "Remove o emblema adorável",
        "Projetos privados",
        "Funções e permissões do usuário"
      ],
      buttonVariant: "default" as const
    },
    {
      name: "Negócios",
      description: "Controles avançados e recursos avançados para departamentos em crescimento",
      price: "50",
      period: "por mês",
      subtitle: "compartilhado entre usuários ilimitados",
      features: [
        "100 créditos mensais",
        "SSO",
        "Projetos Pessoais",
        "Desativar o treinamento de dados",
        "Modelos de design"
      ],
      buttonVariant: "outline" as const
    },
    {
      name: "Empresa",
      description: "Criado para grandes organizações que precisam de flexibilidade, escala e governança.",
      price: null,
      period: "Faturamento flexível",
      subtitle: "Planos personalizados",
      features: [
        "Suporte dedicado",
        "Serviços de integração",
        "Conexões personalizadas",
        "Controle de acesso baseado em grupo",
        "Sistemas de design personalizados"
      ],
      buttonVariant: "outline" as const,
      customAction: true
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Planos e Faturamento</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            No momento, você está no plano: <span className="font-semibold">Gratuito</span>.{" "}
            <a href="#" className="text-primary hover:underline">
              Gerencie suas preferências de pagamento e visualize faturas anteriores
            </a>{" "}
            ou altere seu plano abaixo.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {plans.map((plan) => (
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
                  {plan.price ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">$ {plan.price}</span>
                        <span className="text-muted-foreground">{plan.period}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{plan.subtitle}</p>
                    </>
                  ) : (
                    <>
                      <div className="text-lg font-semibold mb-1">{plan.period}</div>
                      <p className="text-xs text-muted-foreground">{plan.subtitle}</p>
                    </>
                  )}
                </div>

                {plan.customAction ? (
                  <Button variant="outline" className="w-full mb-6">
                    Agende uma demonstração
                  </Button>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        type="radio"
                        name={`billing-${plan.name}`}
                        value="annual"
                        className="w-4 h-4"
                      />
                      <label className="text-sm">Anual</label>
                    </div>
                    <Button
                      variant={plan.buttonVariant}
                      className="w-full mb-6"
                    >
                      Atualizar
                    </Button>
                  </>
                )}

                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-3">
                    {plan.price ? "Tudo de graça, mais:" : `Tudo em ${plans[plans.indexOf(plan) - 1]?.name}, mais:`}
                  </p>
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
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
          <h4 className="font-semibold mb-2">Desconto para estudantes</h4>
          <p className="text-sm text-muted-foreground">
            Verifique o status de estudante e tenha acesso a até 50% de desconto no Lovable Pro.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PricingDialog;
