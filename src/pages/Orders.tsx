import { useState } from "react";
import { toast } from "sonner";
import MenuGrid from "@/components/orders/MenuGrid";
import CartPanel from "@/components/orders/CartPanel";
import OrderTypeBar from "@/components/orders/OrderTypeBar";
import PizzaCustomizeDialog from "@/components/orders/PizzaCustomizeDialog";
import { useCart } from "@/hooks/useCart";
import { useCreateOrder } from "@/hooks/useOrders";
import type { Database } from "@/integrations/supabase/types";

type OrderType = Database["public"]["Enums"]["order_type"];

export default function Orders() {
  const cart = useCart();
  const createOrder = useCreateOrder();
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [tableNumber, setTableNumber] = useState<number | null>(1);
  const [pizzaItem, setPizzaItem] = useState<any>(null);
  const taxPercent = 20; // from business settings

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
      cart.clearCart();
    } catch (err: any) {
      toast.error(err.message || "Failed to create order");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] md:h-[calc(100vh-3rem)] gap-4">
      <OrderTypeBar
        orderType={orderType}
        tableNumber={tableNumber}
        onOrderTypeChange={setOrderType}
        onTableNumberChange={setTableNumber}
      />

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Menu grid */}
        <div className="flex-1 min-w-0">
          <MenuGrid onSelectItem={handleSelectItem} />
        </div>

        {/* Cart panel */}
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

      {/* Pizza customization dialog */}
      <PizzaCustomizeDialog
        open={!!pizzaItem}
        onOpenChange={(open) => !open && setPizzaItem(null)}
        item={pizzaItem}
        onAdd={handlePizzaAdd}
      />
    </div>
  );
}
