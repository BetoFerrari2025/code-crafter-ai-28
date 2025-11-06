import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, subscription_id, new_plan } = await req.json();

    if (!subscription_id) {
      throw new Error("Subscription ID is required");
    }

    let result;

    switch (action) {
      case "change_plan":
        if (!new_plan) {
          throw new Error("New plan name is required");
        }

        // Retrieve the current subscription
        const subscription = await stripe.subscriptions.retrieve(subscription_id);

        // Map plan names to Stripe price IDs
        // You'll need to replace these with your actual Stripe price IDs
        const priceMap: Record<string, string> = {
          "Start": Deno.env.get("STRIPE_START_PRICE_ID") || "",
          "Pró": Deno.env.get("STRIPE_PRO_PRICE_ID") || "",
          "Premium": Deno.env.get("STRIPE_PREMIUM_PRICE_ID") || "",
        };

        const newPriceId = priceMap[new_plan];
        if (!newPriceId) {
          throw new Error(`Invalid plan name: ${new_plan}`);
        }

        // Update the subscription with the new price
        result = await stripe.subscriptions.update(subscription_id, {
          items: [
            {
              id: subscription.items.data[0].id,
              price: newPriceId,
            },
          ],
          proration_behavior: "create_prorations",
        });

        break;

      case "cancel":
        // Cancel the subscription at period end
        result = await stripe.subscriptions.update(subscription_id, {
          cancel_at_period_end: true,
        });

        break;

      default:
        throw new Error(`Invalid action: ${action}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error managing subscription:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unknown error occurred",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
