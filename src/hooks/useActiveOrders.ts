import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];
type PaymentMethod = Database["public"]["Enums"]["payment_method"];

export interface ActiveOrder {
  id: string;
  order_number: number;
  order_type: string;
  table_number: number | null;
  status: OrderStatus;
  subtotal: number;
  tax_percent: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  payment_method: PaymentMethod | null;
  special_notes: string | null;
  created_at: string;
  paid_at: string | null;
  items: {
    id: string;
    quantity: number;
    unit_price: number;
    size: string | null;
    special_instructions: string | null;
    menu_item: { name: string };
    crust: { name: string } | null;
    addons: { name: string; price: number }[];
  }[];
}

export function useActiveOrders() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["active_orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, order_number, order_type, table_number, status, subtotal,
          tax_percent, tax_amount, discount_amount, total, payment_method,
          special_notes, created_at, paid_at,
          order_items (
            id, quantity, unit_price, size, special_instructions,
            menu_items:menu_item_id ( name ),
            pizza_crusts:crust_id ( name ),
            order_item_addons ( price, pizza_addons:addon_id ( name ) )
          )
        `)
        .in("status", ["new", "preparing", "ready"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((o: any) => ({
        ...o,
        items: (o.order_items ?? []).map((i: any) => ({
          id: i.id,
          quantity: i.quantity,
          unit_price: Number(i.unit_price),
          size: i.size,
          special_instructions: i.special_instructions,
          menu_item: i.menu_items,
          crust: i.pizza_crusts,
          addons: (i.order_item_addons ?? []).map((a: any) => ({
            name: a.pizza_addons?.name ?? "",
            price: Number(a.price),
          })),
        })),
      })) as ActiveOrder[];
    },
  });

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("active-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        qc.invalidateQueries({ queryKey: ["active_orders"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return query;
}

export function useCompleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      paymentMethod,
      discountAmount,
      total,
      taxAmount,
    }: {
      id: string;
      paymentMethod: PaymentMethod;
      discountAmount: number;
      total: number;
      taxAmount: number;
    }) => {
      const { data, error } = await supabase
        .from("orders")
        .update({
          status: "completed" as OrderStatus,
          payment_method: paymentMethod,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          total,
          paid_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["active_orders"] });
      qc.invalidateQueries({ queryKey: ["kitchen_orders"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
