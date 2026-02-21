import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay } from "date-fns";

export interface HistoryFilters {
  from: Date | null;
  to: Date | null;
  orderNumber: string;
  paymentMethod: string;
  orderType: string;
}

export function useOrderHistory(filters: HistoryFilters, page: number, pageSize = 20) {
  return useQuery({
    queryKey: ["order_history", filters, page],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select("*, order_items(*, menu_items(name))", { count: "exact" })
        .in("status", ["completed", "cancelled"])
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (filters.from) {
        query = query.gte("created_at", startOfDay(filters.from).toISOString());
      }
      if (filters.to) {
        query = query.lte("created_at", endOfDay(filters.to).toISOString());
      }
      if (filters.orderNumber) {
        query = query.eq("order_number", parseInt(filters.orderNumber, 10));
      }
      if (filters.paymentMethod) {
        query = query.eq("payment_method", filters.paymentMethod as "cash" | "card");
      }
      if (filters.orderType) {
        query = query.eq("order_type", filters.orderType as "dine_in" | "takeaway" | "delivery");
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { orders: data ?? [], total: count ?? 0 };
    },
  });
}
