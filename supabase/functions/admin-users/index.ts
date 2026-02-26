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

    const { action, target_user_id, new_plan } = await req.json();

    switch (action) {
      case "list": {
        const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        if (error) throw error;

        // Get subscriptions and profiles
        const { data: subs } = await supabase.from("subscriptions").select("*");
        const { data: profiles } = await supabase.from("profiles").select("*");
        const { data: roles } = await supabase.from("user_roles").select("*");

        const enriched = users.map((u: any) => {
          const sub = subs?.find((s: any) => s.user_id === u.id && s.status === "active");
          const profile = profiles?.find((p: any) => p.user_id === u.id);
          const userRoles = roles?.filter((r: any) => r.user_id === u.id).map((r: any) => r.role) || [];
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
          };
        });

        return new Response(JSON.stringify({ users: enriched }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "block": {
        if (!target_user_id) throw new Error("target_user_id required");
        const { error } = await supabase.auth.admin.updateUserById(target_user_id, {
          ban_duration: "876000h", // ~100 years
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
        
        // Upsert subscription
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
