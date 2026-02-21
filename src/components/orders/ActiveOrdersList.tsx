import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, CreditCard, Clock, XCircle } from "lucide-react";
import { useActiveOrders, useCompleteOrder } from "@/hooks/useActiveOrders";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useUpdateOrderStatus } from "@/hooks/useKitchenOrders";
import PaymentDialog from "./PaymentDialog";
import ReceiptDialog from "./ReceiptDialog";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type PaymentMethod = Database["public"]["Enums"]["payment_method"];

const statusColors: Record<string, string> = {
  new: "bg-info text-info-foreground",
  preparing: "bg-warning text-warning-foreground",
  ready: "bg-success text-success-foreground",
};

const orderTypeLabels: Record<string, string> = {
  dine_in: "Dine In",
  takeaway: "Takeaway",
  delivery: "Delivery",
};

export default function ActiveOrdersList() {
  const { data: orders = [], isLoading } = useActiveOrders();
  const { data: settings = {} } = useBusinessSettings();
  const completeOrder = useCompleteOrder();
  const cancelOrder = useUpdateOrderStatus();
  const [paymentOrder, setPaymentOrder] = useState<any>(null);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [receiptType, setReceiptType] = useState<"customer" | "kitchen">("customer");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleConfirmPayment = async (orderId: string, method: PaymentMethod, discount: number) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const taxAmount = Math.round(order.subtotal * order.tax_percent) / 100;
    const total = order.subtotal + taxAmount - discount;

    try {
      await completeOrder.mutateAsync({
        id: orderId,
        paymentMethod: method,
        discountAmount: discount,
        total,
        taxAmount,
      });
      setPaymentOrder(null);

      // Show receipt
      setReceiptData({
        businessName: settings.business_name ?? "LiveSync Pizza",
        address: settings.address ?? "",
        contact: settings.contact ?? "",
        orderNumber: order.order_number,
        orderType: order.order_type,
        tableNumber: order.table_number,
        date: format(new Date(), "dd/MM/yyyy HH:mm"),
        items: order.items.map((item) => ({
          name: item.menu_item?.name ?? "Item",
          quantity: item.quantity,
          size: item.size,
          crustName: item.crust?.name ?? null,
          addons: item.addons.map((a) => a.name),
          unitPrice: item.unit_price,
          lineTotal: item.unit_price * item.quantity,
        })),
        subtotal: order.subtotal,
        taxPercent: order.tax_percent,
        taxAmount,
        discountAmount: discount,
        total,
        paymentMethod: method,
      });
      setReceiptType("customer");
      toast.success(`Order #${order.order_number} completed!`);
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelOrder.mutateAsync({ id, status: "cancelled" });
      toast.success("Order cancelled");
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel");
    }
  };

  return (
    <div className="space-y-3">
      {orders.length === 0 ? (
        <p className="text-center text-muted-foreground py-12 text-sm">No active orders</p>
      ) : (
        orders.map((order) => (
          <Card key={order.id}>
            <CardHeader className="pb-2 px-4 pt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">#{order.order_number}</span>
                  <Badge className={statusColors[order.status] ?? ""}>
                    {order.status}
                  </Badge>
                  <Badge variant="outline">{orderTypeLabels[order.order_type]}</Badge>
                  {order.table_number && <Badge variant="secondary">Table {order.table_number}</Badge>}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="space-y-1 text-sm mb-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>
                      {item.quantity}× {item.menu_item?.name}
                      {item.size ? ` (${item.size})` : ""}
                    </span>
                    <span className="text-muted-foreground">
                      £{(item.unit_price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <Separator className="mb-3" />
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg">£{Number(order.total).toFixed(2)}</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleCancel(order.id)}
                    disabled={cancelOrder.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  {order.status === "ready" && (
                    <Button size="sm" onClick={() => setPaymentOrder(order)}>
                      <CreditCard className="h-4 w-4 mr-1" />
                      Payment
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <PaymentDialog
        open={!!paymentOrder}
        onOpenChange={(open) => !open && setPaymentOrder(null)}
        order={paymentOrder}
        onConfirmPayment={handleConfirmPayment}
        isProcessing={completeOrder.isPending}
      />

      <ReceiptDialog
        open={!!receiptData}
        onOpenChange={(open) => !open && setReceiptData(null)}
        data={receiptData}
        type={receiptType}
      />
    </div>
  );
}
