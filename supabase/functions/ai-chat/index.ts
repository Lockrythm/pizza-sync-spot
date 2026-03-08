import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Gather system context
    const [ordersRes, menuRes, usersRes, categoriesRes, settingsRes] = await Promise.all([
      supabase.from("orders").select("id, total, subtotal, status, order_type, payment_method, created_at, order_number, table_number, discount_amount, tax_amount").order("created_at", { ascending: false }).limit(200),
      supabase.from("menu_items").select("id, name, price, price_small, price_medium, price_large, cost_price, is_pizza, is_enabled, category_id, description"),
      supabase.from("profiles").select("id, user_id, display_name").then(async (profilesRes) => {
        const roles = await supabase.from("user_roles").select("user_id, role");
        return { profiles: profilesRes.data ?? [], roles: roles.data ?? [] };
      }),
      supabase.from("categories").select("id, name, sort_order"),
      supabase.from("business_settings").select("key, value"),
    ]);

    // Top selling items
    const orderIds = (ordersRes.data ?? []).filter(o => o.status === "completed").map(o => o.id);
    let topItems: any[] = [];
    if (orderIds.length > 0) {
      const { data: items } = await supabase
        .from("order_items")
        .select("quantity, unit_price, menu_item_id, menu_items(name)")
        .in("order_id", orderIds);
      
      const salesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
      for (const item of (items ?? []) as any[]) {
        const id = item.menu_item_id;
        const name = item.menu_items?.name ?? "Unknown";
        if (!salesMap[id]) salesMap[id] = { name, qty: 0, revenue: 0 };
        salesMap[id].qty += item.quantity;
        salesMap[id].revenue += item.quantity * Number(item.unit_price);
      }
      topItems = Object.values(salesMap).sort((a, b) => b.qty - a.qty).slice(0, 15);
    }

    const orders = ordersRes.data ?? [];
    const completedOrders = orders.filter(o => o.status === "completed");
    const totalRevenue = completedOrders.reduce((s, o) => s + Number(o.total), 0);
    const totalOrders = completedOrders.length;

    const users = (usersRes as any).profiles.map((p: any) => {
      const role = (usersRes as any).roles.find((r: any) => r.user_id === p.user_id);
      return { display_name: p.display_name, role: role?.role ?? "unknown" };
    });

    const systemContext = `
You are an AI assistant for "LiveSync POS", a pizza restaurant point-of-sale system. You have access to real-time system data. Answer questions about the business, analytics, users, menu, and provide improvement suggestions.

CURRENT SYSTEM DATA:
- Total completed orders (recent 200): ${totalOrders}
- Total revenue: $${totalRevenue.toFixed(2)}
- Average order value: $${totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : "0.00"}
- Pending/Active orders: ${orders.filter(o => ["new", "preparing", "ready"].includes(o.status)).length}
- Cancelled orders: ${orders.filter(o => o.status === "cancelled").length}

ORDER BREAKDOWN BY TYPE:
- Dine-in: ${completedOrders.filter(o => o.order_type === "dine_in").length}
- Takeaway: ${completedOrders.filter(o => o.order_type === "takeaway").length}
- Delivery: ${completedOrders.filter(o => o.order_type === "delivery").length}

PAYMENT METHODS:
- Cash: ${completedOrders.filter(o => o.payment_method === "cash").length}
- Card: ${completedOrders.filter(o => o.payment_method === "card").length}

TOP SELLING ITEMS:
${topItems.map((i, idx) => `${idx + 1}. ${i.name} - ${i.qty} sold ($${i.revenue.toFixed(2)} revenue)`).join("\n")}

MENU ITEMS (${(menuRes.data ?? []).length} total, ${(menuRes.data ?? []).filter((m: any) => m.is_enabled).length} enabled):
${(menuRes.data ?? []).map((m: any) => `- ${m.name} (${m.is_pizza ? "Pizza" : "Non-pizza"}, Price: $${m.price ?? m.price_medium ?? "varies"}, Cost: $${m.cost_price}, Enabled: ${m.is_enabled})`).join("\n")}

CATEGORIES: ${(categoriesRes.data ?? []).map((c: any) => c.name).join(", ")}

STAFF (${users.length} users):
${users.map((u: any) => `- ${u.display_name} (${u.role})`).join("\n")}

BUSINESS SETTINGS:
${(settingsRes.data ?? []).map((s: any) => `- ${s.key}: ${s.value}`).join("\n") || "No custom settings configured"}

Be helpful, specific, and data-driven. When suggesting improvements, base them on the actual data. Format responses with markdown.
`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContext },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
