import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function usePresenceTracker() {
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setup = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      channel = supabase.channel("admin-presence", {
        config: { presence: { key: "admin-tracker" } },
      });

      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel!.track({
            user_id: session.user.id,
            online_at: new Date().toISOString(),
          });
        }
      });
    };

    setup();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);
}
