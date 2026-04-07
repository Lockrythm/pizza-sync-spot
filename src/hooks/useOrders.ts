import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/contexts/BranchContext";
import type { Database } from "@/integrations/supabase/types";

type OrderType = Database["public"]["Enums"]["order_type"];
type PaymentMethod = Database["public"]["Enums"]["payment_method"];

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  size: string | null;
  crustId: string | null;
  crustName: string | null;
  crustExtra: number;
  addons: { id: string; name: string; price: number }[];
  specialInstructions: string | null;
  isPizza: boolean;
}

export interface CreateOrderPayload {
  orderType: OrderType;
  tableNumber: number | null;
  specialNotes: string | null;
  items: CartItem[];
  taxPercent: number;
  discountAmount: number;
}

export function useCreateOrder() {
  const qc = useQueryClient();
  const { activeBranchId } = useBranch();

  return useMutation({
    mutationFn: async (payload: CreateOrderPayload) => {
      if (!activeBranchId || activeBranchId === "all") {
        throw new Error("Please select a specific branch before creating an order");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const subtotal = payload.items.reduce((sum, item) => {
        const itemTotal = (item.unitPrice + item.crustExtra + item.addons.reduce((a, ad) => a + ad.price, 0)) * item.quantity;
        return sum + itemTotal;
      }, 0);

      const taxAmount = Math.round(subtotal * payload.taxPercent) / 100;
      const total = subtotal + taxAmount - payload.discountAmount;

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          created_by: user.id,
          order_type: payload.orderType,
          table_number: payload.tableNumber,
          special_notes: payload.specialNotes,
          subtotal,
          tax_percent: payload.taxPercent,
          tax_amount: taxAmount,
          discount_amount: payload.discountAmount,
          total,
          status: "new",
          branch_id: activeBranchId,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      for (const item of payload.items) {
        const linePrice = item.unitPrice + item.crustExtra + item.addons.reduce((a, ad) => a + ad.price, 0);

        const { data: orderItem, error: itemError } = await supabase
          .from("order_items")
          .insert({
            order_id: order.id,
            menu_item_id: item.menuItemId,
            quantity: item.quantity,
            unit_price: linePrice,
            size: item.size,
            crust_id: item.crustId,
            special_instructions: item.specialInstructions,
          })
          .select()
          .single();

        if (itemError) throw itemError;

        if (item.addons.length > 0) {
          const { error: addonError } = await supabase
            .from("order_item_addons")
            .insert(
              item.addons.map((a) => ({
                order_item_id: orderItem.id,
                addon_id: a.id,
                price: a.price,
              }))
            );
          if (addonError) throw addonError;
        }
      }

      return order;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
