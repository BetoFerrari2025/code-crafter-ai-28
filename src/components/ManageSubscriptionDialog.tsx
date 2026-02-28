import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ManageSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: string;
  subscriptionId: string;
  onSuccess: () => void;
}

const PLANS = [
  { name: "Premium", price: "$1.99/mo", features: ["Créditos ilimitados", "Projetos ilimitados", "Nuvem baseada em uso", "Domínios personalizados", "Suporte dedicado"] },
];

export default function ManageSubscriptionDialog({
  open,
  onOpenChange,
  currentPlan,
  subscriptionId,
  onSuccess,
}: ManageSubscriptionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleUpgradeDowngrade = async (newPlan: string) => {
    if (newPlan === currentPlan) {
      toast({
        title: "Same Plan",
        description: "You're already on this plan",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("manage-subscription", {
        body: {
          action: "change_plan",
          subscription_id: subscriptionId,
          new_plan: newPlan,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Successfully changed to ${newPlan} plan`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error changing plan:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to change plan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("manage-subscription", {
        body: {
          action: "cancel",
          subscription_id: subscriptionId,
        },
      });

      if (error) throw error;

      toast({
        title: "Subscription Canceled",
        description: "Your subscription will remain active until the end of the billing period",
      });
      onSuccess();
      onOpenChange(false);
      setShowCancelConfirm(false);
    } catch (error: any) {
      console.error("Error canceling subscription:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Subscription</DialogTitle>
            <DialogDescription>
              Current plan: <span className="font-semibold">{currentPlan}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`border rounded-lg p-4 ${
                    plan.name === currentPlan ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      <p className="text-muted-foreground">{plan.price}</p>
                    </div>
                    {plan.name === currentPlan ? (
                      <span className="text-sm font-medium text-primary">Current Plan</span>
                    ) : (
                      <Button
                        onClick={() => handleUpgradeDowngrade(plan.name)}
                        disabled={loading}
                        size="sm"
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {PLANS.findIndex((p) => p.name === plan.name) >
                        PLANS.findIndex((p) => p.name === currentPlan)
                          ? "Upgrade"
                          : "Downgrade"}
                      </Button>
                    )}
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx}>• {feature}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 mt-6">
              <Button
                variant="destructive"
                onClick={() => setShowCancelConfirm(true)}
                disabled={loading}
                className="w-full"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Cancel Subscription
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel your subscription. You'll continue to have access until the end of
              your current billing period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
