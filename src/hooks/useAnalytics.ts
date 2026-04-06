import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/contexts/BranchContext";
import { startOfDay, endOfDay, format } from "date-fns";

export interface AnalyticsFilters {
  from: Date;
  to: Date;
}

interface OrderRow {
  id: string;
  total: number;
  subtotal: number;
  created_at: string;
  status: string;
  order_type: string;
  payment_method: string | null;
  branch_id: string | null;
}

interface OrderItemRow {
  quantity: number;
  unit_price: number;
  menu_item_id: string;
  menu_items: { name: string; cost_price: number; is_pizza: boolean } | null;
}

export function useAnalytics(filters: AnalyticsFilters) {
  const { activeBranchId, isSuperAdmin } = useBranch();
  const isAll = isSuperAdmin && activeBranchId === "all";

  return useQuery({
    queryKey: ["analytics", filters.from.toISOString(), filters.to.toISOString(), activeBranchId],
    queryFn: async () => {
      const fromISO = startOfDay(filters.from).toISOString();
      const toISO = endOfDay(filters.to).toISOString();

      let q = supabase
        .from("orders")
        .select("id, total, subtotal, created_at, status, order_type, payment_method, branch_id")
        .eq("status", "completed")
        .gte("created_at", fromISO)
        .lte("created_at", toISO)
        .order("created_at", { ascending: true });

      if (!isAll && activeBranchId) q = q.eq("branch_id", activeBranchId);

      const { data: orders, error: oErr } = await q;
      if (oErr) throw oErr;

      const orderIds = (orders ?? []).map((o) => o.id);

      let items: OrderItemRow[] = [];
      if (orderIds.length > 0) {
        const { data, error: iErr } = await supabase
          .from("order_items")
          .select("quantity, unit_price, menu_item_id, menu_items(name, cost_price, is_pizza)")
          .in("order_id", orderIds);
        if (iErr) throw iErr;
        items = (data ?? []) as unknown as OrderItemRow[];
      }

      return buildAnalytics(orders ?? [], items);
    },
  });
}

function buildAnalytics(orders: OrderRow[], items: OrderItemRow[]) {
  const totalSales = orders.reduce((s, o) => s + Number(o.total), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  let totalRevenue = 0;
  let totalCost = 0;
  const itemSales: Record<string, { name: string; qty: number; revenue: number; cost: number; isPizza: boolean }> = {};

  for (const item of items) {
    const mi = item.menu_items;
    const name = mi?.name ?? "Unknown";
    const costPrice = Number(mi?.cost_price ?? 0);
    const isPizza = mi?.is_pizza ?? false;
    const rev = Number(item.unit_price) * item.quantity;
    const cost = costPrice * item.quantity;
    totalRevenue += rev;
    totalCost += cost;

    if (!itemSales[item.menu_item_id]) {
      itemSales[item.menu_item_id] = { name, qty: 0, revenue: 0, cost: 0, isPizza };
    }
    itemSales[item.menu_item_id].qty += item.quantity;
    itemSales[item.menu_item_id].revenue += rev;
    itemSales[item.menu_item_id].cost += cost;
  }

  const totalProfit = totalRevenue - totalCost;
  const sortedByQty = Object.values(itemSales).sort((a, b) => b.qty - a.qty);
  const topPizza = sortedByQty.find((i) => i.isPizza) ?? null;
  const mostProfitable = Object.values(itemSales).sort((a, b) => (b.revenue - b.cost) - (a.revenue - a.cost))[0] ?? null;

  const dailyMap: Record<string, number> = {};
  for (const o of orders) {
    const day = format(new Date(o.created_at), "yyyy-MM-dd");
    dailyMap[day] = (dailyMap[day] ?? 0) + Number(o.total);
  }
  const dailySales = Object.entries(dailyMap).map(([date, sales]) => ({ date, sales: Math.round(sales * 100) / 100 }));

  const hourlyMap: Record<number, number> = {};
  for (const o of orders) {
    const hour = new Date(o.created_at).getHours();
    hourlyMap[hour] = (hourlyMap[hour] ?? 0) + Number(o.total);
  }
  const hourlySales = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h.toString().padStart(2, "0")}:00`,
    sales: Math.round((hourlyMap[h] ?? 0) * 100) / 100,
  }));

  const pizzaItems = Object.values(itemSales)
    .filter((i) => i.isPizza)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8)
    .map((p) => ({ name: p.name, qty: p.qty }));

  return {
    totalSales: Math.round(totalSales * 100) / 100,
    totalOrders,
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    totalProfit: Math.round(totalProfit * 100) / 100,
    topPizza,
    mostProfitable,
    dailySales,
    hourlySales,
    pizzaItems,
    orders,
    items: Object.values(itemSales),
  };
}

export function exportCSV(orders: OrderRow[]) {
  const header = "Order ID,Date,Type,Payment,Subtotal,Total,Status\n";
  const rows = orders.map((o) =>
    `${o.id},${o.created_at},${o.order_type},${o.payment_method ?? ""},${o.subtotal},${o.total},${o.status}`
  ).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sales-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
