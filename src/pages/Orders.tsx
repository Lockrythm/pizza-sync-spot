import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, ClipboardList } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MenuGrid from "@/components/orders/MenuGrid";
import CartPanel from "@/components/orders/CartPanel";
import OrderTypeBar from "@/components/orders/OrderTypeBar";
import PizzaCustomizeDialog from "@/components/orders/PizzaCustomizeDialog";
import ActiveOrdersList from "@/components/orders/ActiveOrdersList";
import { useCart } from "@/hooks/useCart";
import { useCreateOrder } from "@/hooks/useOrders";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { autoPrint } from "@/lib/printReceipt";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type OrderType = Database["public"]["Enums"]["order_type"];

export default function Orders() {
  const cart = useCart();
  const createOrder = useCreateOrder();
  const { data: settings = {} } = useBusinessSettings();
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [tableNumber, setTableNumber] = useState<number | null>(1);
  const [pizzaItem, setPizzaItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("new");
  const taxPercent = 20;

  const handleSelectItem = (item: any) => {
    if (item.is_pizza) {
      setPizzaItem(item);
    } else {
      cart.addItem({
        menuItemId: item.id,
        name: item.name,
        quantity: 1,
        unitPrice: Number(item.price ?? 0),
        size: null,
        crustId: null,
        crustName: null,
        crustExtra: 0,
        addons: [],
        specialInstructions: null,
        isPizza: false,
      });
    }
  };

  const handlePizzaAdd = (config: any) => {
    cart.addItem({
      menuItemId: pizzaItem.id,
      name: pizzaItem.name,
      quantity: 1,
      unitPrice: config.unitPrice,
      size: config.size,
      crustId: config.crustId,
      crustName: config.crustName,
      crustExtra: config.crustExtra,
      addons: config.addons,
      specialInstructions: config.specialInstructions,
      isPizza: true,
    });
  };

  const handlePlaceOrder = async () => {
    if (orderType === "dine_in" && !tableNumber) {
      toast.error("Please select a table number");
      return;
    }
    try {
      const order = await createOrder.mutateAsync({
        orderType,
        tableNumber: orderType === "dine_in" ? tableNumber : null,
        specialNotes: null,
        items: cart.items,
        taxPercent,
        discountAmount: 0,
      });
      toast.success(`Order #${order.order_number} created!`);

      // Auto-print kitchen slip
      autoPrint({
        businessName: settings.business_name ?? "LiveSync Pizza",
        address: settings.address ?? "",
        contact: settings.contact ?? "",
        orderNumber: order.order_number,
        orderType,
        tableNumber: orderType === "dine_in" ? tableNumber : null,
        date: format(new Date(), "dd/MM/yyyy HH:mm"),
        items: cart.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          size: item.size,
          crustName: item.crustName,
          addons: item.addons.map((a) => a.name),
          unitPrice: item.unitPrice,
          lineTotal: (item.unitPrice + item.crustExtra + item.addons.reduce((a, ad) => a + ad.price, 0)) * item.quantity,
        })),
        subtotal: 0,
        taxPercent: 0,
        taxAmount: 0,
        discountAmount: 0,
        total: 0,
        paymentMethod: "",
      }, "kitchen");

      cart.clearCart();
      setActiveTab("active");
    } catch (err: any) {
      toast.error(err.message || "Failed to create order");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] md:h-[calc(100vh-3rem)]">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <TabsList className="w-fit mb-4">
          <TabsTrigger value="new" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            New Order
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Active Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="flex-1 flex flex-col gap-4 mt-0 min-h-0">
          <OrderTypeBar
            orderType={orderType}
            tableNumber={tableNumber}
            onOrderTypeChange={setOrderType}
            onTableNumberChange={setTableNumber}
          />
          <div className="flex-1 flex gap-4 min-h-0">
            <div className="flex-1 min-w-0">
              <MenuGrid onSelectItem={handleSelectItem} />
            </div>
            <div className="w-80 flex-shrink-0 hidden md:flex">
              <CartPanel
                items={cart.items}
                subtotal={cart.subtotal}
                taxPercent={taxPercent}
                discountAmount={0}
                onUpdateQuantity={cart.updateQuantity}
                onRemove={cart.removeItem}
                onPlaceOrder={handlePlaceOrder}
                isSubmitting={createOrder.isPending}
              />
            </div>
          </div>

          {/* Mobile floating cart button */}
          <div className="md:hidden fixed bottom-4 right-4 z-40">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="lg" className="rounded-full h-14 w-14 shadow-lg relative">
                  <ShoppingCart className="h-6 w-6" />
                  {cart.items.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                      {cart.items.length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[75vh] p-0 rounded-t-xl">
                <SheetTitle className="sr-only">Cart</SheetTitle>
                <CartPanel
                  items={cart.items}
                  subtotal={cart.subtotal}
                  taxPercent={taxPercent}
                  discountAmount={0}
                  onUpdateQuantity={cart.updateQuantity}
                  onRemove={cart.removeItem}
                  onPlaceOrder={handlePlaceOrder}
                  isSubmitting={createOrder.isPending}
                />
              </SheetContent>
            </Sheet>
          </div>
        </TabsContent>

        <TabsContent value="active" className="flex-1 overflow-auto mt-0">
          <ActiveOrdersList />
        </TabsContent>
      </Tabs>

      <PizzaCustomizeDialog
        open={!!pizzaItem}
        onOpenChange={(open) => !open && setPizzaItem(null)}
        item={pizzaItem}
        onAdd={handlePizzaAdd}
      />
    </div>
  );
}
