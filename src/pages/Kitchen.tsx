import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChefHat, Clock, ArrowRight, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useKitchenOrders, useUpdateOrderStatus } from "@/hooks/useKitchenOrders";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type OrderStatus = Database["public"]["Enums"]["order_status"];

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: "New", color: "bg-info text-info-foreground", icon: <AlertCircle className="h-4 w-4" /> },
  preparing: { label: "Preparing", color: "bg-warning text-warning-foreground", icon: <ChefHat className="h-4 w-4" /> },
  ready: { label: "Ready", color: "bg-success text-success-foreground", icon: <CheckCircle2 className="h-4 w-4" /> },
};

const orderTypeLabels: Record<string, string> = {
  dine_in: "Dine In",
  takeaway: "Takeaway",
  delivery: "Delivery",
};

function nextStatus(current: OrderStatus): OrderStatus | null {
  if (current === "new") return "preparing";
  if (current === "preparing") return "ready";
  return null;
}

function nextLabel(current: OrderStatus): string {
  if (current === "new") return "Start Preparing";
  if (current === "preparing") return "Mark Ready";
  return "";
}

function OrderCard({ order, updateStatus }: { order: any; updateStatus: any }) {
  const next = nextStatus(order.status);
  return (
    <Card className={cn(
      "transition-all",
      order.status === "new" && "border-info/50 animate-pulse-once"
    )}>
      <CardHeader className="pb-2 px-3 sm:px-4 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">#{order.order_number}</span>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {orderTypeLabels[order.order_type] ?? order.order_type}
          </Badge>
          {order.table_number && (
            <Badge variant="secondary" className="text-xs">
              Table {order.table_number}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 pb-3 space-y-2">
        <Separator />
        {order.items.map((item: any) => (
          <div key={item.id} className="text-sm">
            <div className="flex gap-2">
              <span className="font-semibold text-primary min-w-[1.5rem]">{item.quantity}×</span>
              <div className="flex-1 min-w-0">
                <span className="font-medium">{item.menu_item?.name}</span>
                {item.size && (
                  <span className="text-muted-foreground capitalize"> ({item.size}{item.crust ? `, ${item.crust.name}` : ""})</span>
                )}
                {item.addons.length > 0 && (
                  <p className="text-xs text-muted-foreground truncate">+{item.addons.map((a: any) => a.addon?.name).join(", ")}</p>
                )}
                {item.special_instructions && (
                  <p className="text-xs text-warning font-medium italic">⚠ {item.special_instructions}</p>
                )}
              </div>
            </div>
          </div>
        ))}
        {order.special_notes && (
          <>
            <Separator />
            <p className="text-xs text-warning font-medium">📝 {order.special_notes}</p>
          </>
        )}
        {next && (
          <>
            <Separator />
            <Button
              className="w-full"
              size="sm"
              variant={order.status === "new" ? "default" : "secondary"}
              disabled={updateStatus.isPending}
              onClick={() => updateStatus.mutate({ id: order.id, status: next })}
            >
              {nextLabel(order.status)}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Kitchen() {
  const { data: orders = [], isLoading } = useKitchenOrders();
  const updateStatus = useUpdateOrderStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const newOrders = orders.filter((o) => o.status === "new");
  const preparing = orders.filter((o) => o.status === "preparing");
  const ready = orders.filter((o) => o.status === "ready");

  const columns = [
    { title: "New Orders", orders: newOrders, status: "new" as const },
    { title: "Preparing", orders: preparing, status: "preparing" as const },
    { title: "Ready", orders: ready, status: "ready" as const },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] md:h-[calc(100vh-3rem)] gap-4">
      <div className="flex items-center gap-3">
        <ChefHat className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold">Kitchen Display</h1>
        <Badge variant="outline" className="ml-auto">
          {orders.length} active
        </Badge>
      </div>

      {/* Desktop: 3-column grid */}
      <div className="hidden md:grid flex-1 grid-cols-3 gap-4 min-h-0 overflow-hidden">
        {columns.map((col) => (
          <div key={col.status} className="flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-3">
              <div className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", statusConfig[col.status].color)}>
                {statusConfig[col.status].icon}
                {col.title}
              </div>
              <span className="text-sm text-muted-foreground">({col.orders.length})</span>
            </div>
            <div className="flex-1 overflow-auto space-y-3 pr-1">
              {col.orders.map((order) => (
                <OrderCard key={order.id} order={order} updateStatus={updateStatus} />
              ))}
              {col.orders.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No orders</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: Tabs */}
      <div className="md:hidden flex-1 min-h-0 flex flex-col">
        <Tabs defaultValue="new" className="flex flex-col flex-1 min-h-0">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="new" className="text-xs gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              New ({newOrders.length})
            </TabsTrigger>
            <TabsTrigger value="preparing" className="text-xs gap-1">
              <ChefHat className="h-3.5 w-3.5" />
              Prep ({preparing.length})
            </TabsTrigger>
            <TabsTrigger value="ready" className="text-xs gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Ready ({ready.length})
            </TabsTrigger>
          </TabsList>
          {columns.map((col) => (
            <TabsContent key={col.status} value={col.status} className="flex-1 overflow-auto mt-3 space-y-3">
              {col.orders.map((order) => (
                <OrderCard key={order.id} order={order} updateStatus={updateStatus} />
              ))}
              {col.orders.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No orders</p>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
