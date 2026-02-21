import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem } from "@/hooks/useOrders";

interface CartPanelProps {
  items: CartItem[];
  subtotal: number;
  taxPercent: number;
  discountAmount: number;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onPlaceOrder: () => void;
  isSubmitting: boolean;
}

export default function CartPanel({
  items,
  subtotal,
  taxPercent,
  discountAmount,
  onUpdateQuantity,
  onRemove,
  onPlaceOrder,
  isSubmitting,
}: CartPanelProps) {
  const taxAmount = Math.round(subtotal * taxPercent) / 100;
  const total = subtotal + taxAmount - discountAmount;

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border">
      <div className="px-4 py-3 border-b">
        <h3 className="font-semibold text-card-foreground">Current Order</h3>
        <p className="text-xs text-muted-foreground">{items.length} item(s)</p>
      </div>

      <ScrollArea className="flex-1 px-4 py-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Tap menu items to add
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const linePrice =
                (item.unitPrice + item.crustExtra + item.addons.reduce((a, ad) => a + ad.price, 0)) *
                item.quantity;
              return (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      {item.isPizza && item.size && (
                        <p className="text-xs text-muted-foreground capitalize">
                          {item.size}
                          {item.crustName ? ` · ${item.crustName}` : ""}
                        </p>
                      )}
                      {item.addons.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          +{item.addons.map((a) => a.name).join(", ")}
                        </p>
                      )}
                      {item.specialInstructions && (
                        <p className="text-xs text-info italic">"{item.specialInstructions}"</p>
                      )}
                    </div>
                    <span className="text-sm font-semibold whitespace-nowrap">
                      £{linePrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive ml-auto"
                      onClick={() => onRemove(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <div className="border-t px-4 py-3 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>£{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax ({taxPercent}%)</span>
          <span>£{taxAmount.toFixed(2)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-destructive">
            <span>Discount</span>
            <span>-£{discountAmount.toFixed(2)}</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>£{total.toFixed(2)}</span>
        </div>
        <Button
          className="w-full mt-2"
          size="lg"
          disabled={items.length === 0 || isSubmitting}
          onClick={onPlaceOrder}
        >
          {isSubmitting ? "Placing..." : "Place Order"}
        </Button>
      </div>
    </div>
  );
}
