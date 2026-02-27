import { useEffect } from "react";

const TRACKING_UID = "5dc6c9d3-84b2-41b6-af96-b2ffb9d68364";
const TRACK_URL = "https://zwylxoajyyjflvvcwpvz.supabase.co/functions/v1/track-visitor";
const UTM_SCRIPT_SRC = "https://zwylxoajyyjflvvcwpvz.supabase.co/functions/v1/utms/latest.js";

const TrackingScripts = () => {
  useEffect(() => {
    // 1. UTM Script
    if (!document.querySelector(`script[src="${UTM_SCRIPT_SRC}"]`)) {
      const utmScript = document.createElement("script");
      utmScript.src = UTM_SCRIPT_SRC;
      utmScript.async = true;
      utmScript.defer = true;
      utmScript.setAttribute("data-gerenciaroi-prevent-xcod-sck", "");
      utmScript.setAttribute("data-gerenciaroi-prevent-subids", "");
      document.head.appendChild(utmScript);
    }

    // 2. Live tracking
    const sid = Math.random().toString(36).substr(2, 12) + Date.now().toString(36);

    function send(action: string) {
      const data = JSON.stringify({
        user_id: TRACKING_UID,
        session_id: sid,
        page_url: location.href,
        action,
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(TRACK_URL, data);
      } else {
        fetch(TRACK_URL, {
          method: "POST",
          body: data,
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        });
      }
    }

    send("heartbeat");
    const interval = setInterval(() => send("heartbeat"), 15000);

    const handleUnload = () => send("leave");
    const handleVisibility = () => {
      if (document.hidden) send("leave");
      else send("heartbeat");
    };

    window.addEventListener("beforeunload", handleUnload);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleUnload);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return null;
};

export default TrackingScripts;
