import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

export interface KitchenOrder {
  id: string;
  order_number: number;
  order_type: string;
  table_number: number | null;
  status: OrderStatus;
  special_notes: string | null;
  created_at: string;
  items: {
    id: string;
    quantity: number;
    size: string | null;
    special_instructions: string | null;
    menu_item: { name: string };
    crust: { name: string } | null;
    addons: { addon: { name: string } }[];
  }[];
}

export function useKitchenOrders() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["kitchen_orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, order_number, order_type, table_number, status, special_notes, created_at,
          order_items (
            id, quantity, size, special_instructions,
            menu_items:menu_item_id ( name ),
            pizza_crusts:crust_id ( name ),
            order_item_addons ( pizza_addons:addon_id ( name ) )
          )
        `)
        .in("status", ["new", "preparing", "ready"])
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data ?? []).map((o: any) => ({
        ...o,
        items: (o.order_items ?? []).map((i: any) => ({
          id: i.id,
          quantity: i.quantity,
          size: i.size,
          special_instructions: i.special_instructions,
          menu_item: i.menu_items,
          crust: i.pizza_crusts,
          addons: (i.order_item_addons ?? []).map((a: any) => ({ addon: a.pizza_addons })),
        })),
      })) as KitchenOrder[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("kitchen-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          qc.invalidateQueries({ queryKey: ["kitchen_orders"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        () => {
          qc.invalidateQueries({ queryKey: ["kitchen_orders"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return query;
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kitchen_orders"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
