import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Settings, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ManageSubscriptionDialog from "@/components/ManageSubscriptionDialog";
import ProjectConnections from "@/components/ProjectConnections";

interface Subscription {
  id: string;
  plan_name: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [maxCredits, setMaxCredits] = useState(5);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      setUserEmail(user.email || "");
      setUserId(user.id);
      await Promise.all([fetchSubscription(user.id), fetchCredits(user.id)]);
    } catch (error) {
      console.error("Auth check error:", error);
      toast({
        title: "Error",
        description: "Failed to verify authentication",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscription = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      toast({
        title: "Error",
        description: "Failed to load subscription details",
        variant: "destructive",
      });
    }
  };

  const fetchCredits = async (uid: string) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("user_daily_credits")
        .select("credits_used, max_credits")
        .eq("user_id", uid)
        .eq("usage_date", today)
        .maybeSingle();
      if (data) {
        setCreditsUsed(data.credits_used);
        setMaxCredits(data.max_credits);
      }
    } catch (e) {
      console.error("Error fetching credits:", e);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "default";
      case "canceled":
        return "destructive";
      case "inactive":
        return "secondary";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">{userEmail}</p>
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>

      <div className="grid gap-6">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Créditos Diários
            </CardTitle>
            <CardDescription>Seus créditos de geração de código restantes para hoje</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold text-primary">{maxCredits - creditsUsed}</span>
              <span className="text-sm text-muted-foreground">{creditsUsed}/{maxCredits} usados</span>
            </div>
            <Progress value={(creditsUsed / maxCredits) * 100} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              Os créditos reiniciam todos os dias à meia-noite.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>Your current subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Plan</span>
                  <span className="text-lg font-semibold">{subscription.plan_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant={getStatusColor(subscription.status)}>
                    {subscription.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Period Start</span>
                  <span className="text-sm">{formatDate(subscription.current_period_start)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Period End</span>
                  <span className="text-sm">{formatDate(subscription.current_period_end)}</span>
                </div>
                {subscription.status === "active" && (
                  <div className="pt-4 border-t">
                    <Button
                      onClick={() => setShowManageDialog(true)}
                      className="w-full"
                      variant="outline"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Manage Subscription
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No active subscription found</p>
                <Button onClick={() => navigate("/")}>View Plans</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {subscription && (
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>Manage your billing details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Customer ID</span>
                <span className="text-sm font-mono">{subscription.stripe_customer_id || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Subscription ID</span>
                <span className="text-sm font-mono">{subscription.stripe_subscription_id || "N/A"}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <ProjectConnections />
      </div>

      {subscription && subscription.stripe_subscription_id && (
        <ManageSubscriptionDialog
          open={showManageDialog}
          onOpenChange={setShowManageDialog}
          currentPlan={subscription.plan_name}
          subscriptionId={subscription.stripe_subscription_id}
          onSuccess={() => {
            if (userId) {
              fetchSubscription(userId);
            }
          }}
        />
      )}
    </div>
  );
}
