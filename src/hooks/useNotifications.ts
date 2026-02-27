import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useNotifications() {
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    const result = await Notification.requestPermission();
    return result === "granted";
  }, []);

  const notify = useCallback((title: string, body: string) => {
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "order-ready",
      });
    }
  }, []);

  useEffect(() => {
    requestPermission();

    const channel = supabase
      .channel("order-notifications")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: "status=eq.ready",
        },
        (payload) => {
          const order = payload.new as { order_number: number; order_type: string };
          notify(
            "🍕 Order Ready!",
            `Order #${order.order_number} (${order.order_type}) is ready for pickup!`
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [notify, requestPermission]);

  return { requestPermission, notify };
}
