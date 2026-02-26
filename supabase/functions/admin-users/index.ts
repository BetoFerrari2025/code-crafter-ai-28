import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { data: roleCheck } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleCheck) throw new Error("Forbidden: Admin only");

    const { action, target_user_id, new_plan, credits_amount } = await req.json();

    switch (action) {
      case "list": {
        const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        if (error) throw error;

        const { data: subs } = await supabase.from("subscriptions").select("*");
        const { data: profiles } = await supabase.from("profiles").select("*");
        const { data: roles } = await supabase.from("user_roles").select("*");
        const { data: credits } = await supabase
          .from("user_daily_credits")
          .select("*")
          .eq("usage_date", new Date().toISOString().split("T")[0]);

        const enriched = users.map((u: any) => {
          const sub = subs?.find((s: any) => s.user_id === u.id && s.status === "active");
          const profile = profiles?.find((p: any) => p.user_id === u.id);
          const userRoles = roles?.filter((r: any) => r.user_id === u.id).map((r: any) => r.role) || [];
          const userCredits = credits?.find((c: any) => c.user_id === u.id);
          return {
            id: u.id,
            email: u.email,
            display_name: profile?.display_name || u.email?.split("@")[0],
            phone: u.phone || null,
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at,
            banned: u.banned_until ? true : false,
            plan: sub?.plan_name || "free",
            subscription_id: sub?.id || null,
            stripe_subscription_id: sub?.stripe_subscription_id || null,
            roles: userRoles,
            credits_used: userCredits?.credits_used || 0,
            max_credits: userCredits?.max_credits || 5,
          };
        });

        // Plan stats
        const planStats = {
          free: enriched.filter((u: any) => u.plan === "free").length,
          start: enriched.filter((u: any) => u.plan === "start").length,
          pro: enriched.filter((u: any) => u.plan === "pro").length,
          premium: enriched.filter((u: any) => u.plan === "premium").length,
          total: enriched.length,
        };

        return new Response(JSON.stringify({ users: enriched, planStats }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "block": {
        if (!target_user_id) throw new Error("target_user_id required");
        const { error } = await supabase.auth.admin.updateUserById(target_user_id, {
          ban_duration: "876000h",
        });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "unblock": {
        if (!target_user_id) throw new Error("target_user_id required");
        const { error } = await supabase.auth.admin.updateUserById(target_user_id, {
          ban_duration: "none",
        });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete": {
        if (!target_user_id) throw new Error("target_user_id required");
        const { error } = await supabase.auth.admin.deleteUser(target_user_id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "change_plan": {
        if (!target_user_id || !new_plan) throw new Error("target_user_id and new_plan required");
        
        const { data: existing } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", target_user_id)
          .eq("status", "active")
          .maybeSingle();

        if (existing) {
          await supabase
            .from("subscriptions")
            .update({ plan_name: new_plan, updated_at: new Date().toISOString() })
            .eq("id", existing.id);
        } else {
          await supabase.from("subscriptions").insert({
            user_id: target_user_id,
            plan_name: new_plan,
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "add_credits": {
        if (!target_user_id || credits_amount === undefined) throw new Error("target_user_id and credits_amount required");
        
        const today = new Date().toISOString().split("T")[0];
        
        // Check if record exists for today
        const { data: existing } = await supabase
          .from("user_daily_credits")
          .select("*")
          .eq("user_id", target_user_id)
          .eq("usage_date", today)
          .maybeSingle();

        if (existing) {
          // Increase max_credits
          await supabase
            .from("user_daily_credits")
            .update({ max_credits: existing.max_credits + credits_amount, updated_at: new Date().toISOString() })
            .eq("id", existing.id);
        } else {
          await supabase.from("user_daily_credits").insert({
            user_id: target_user_id,
            usage_date: today,
            credits_used: 0,
            max_credits: 5 + credits_amount,
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
