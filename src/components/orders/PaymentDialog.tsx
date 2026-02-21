import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Banknote, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type PaymentMethod = Database["public"]["Enums"]["payment_method"];

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    order_number: number;
    subtotal: number;
    tax_percent: number;
    tax_amount: number;
    discount_amount: number;
    total: number;
  } | null;
  onConfirmPayment: (orderId: string, method: PaymentMethod, discount: number) => void;
  isProcessing: boolean;
}

export default function PaymentDialog({
  open,
  onOpenChange,
  order,
  onConfirmPayment,
  isProcessing,
}: PaymentDialogProps) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");
  const [discountInput, setDiscountInput] = useState("");

  if (!order) return null;

  const discountValue = Number(discountInput) || 0;
  const discountAmount =
    discountType === "percent"
      ? Math.round(order.subtotal * discountValue) / 100
      : discountValue;
  const taxAmount = Math.round(order.subtotal * order.tax_percent) / 100;
  const total = order.subtotal + taxAmount - discountAmount;

  const handleConfirm = () => {
    onConfirmPayment(order.id, method, discountAmount);
    setDiscountInput("");
    setDiscountType("fixed");
    setMethod("cash");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Payment — Order #{order.order_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>£{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({order.tax_percent}%)</span>
              <span>£{taxAmount.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Discount</span>
                <span>-£{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>£{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Discount */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Discount (optional)</Label>
            <div className="flex gap-2">
              <div className="flex rounded-md border overflow-hidden">
                <button
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium transition-colors",
                    discountType === "fixed" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                  onClick={() => setDiscountType("fixed")}
                >
                  £
                </button>
                <button
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium transition-colors",
                    discountType === "percent" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                  onClick={() => setDiscountType("percent")}
                >
                  %
                </button>
              </div>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                className="w-24"
              />
            </div>
          </div>

          {/* Payment method */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Payment Method</Label>
            <RadioGroup value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors",
                    method === "cash" ? "border-primary bg-primary/5" : "hover:border-muted-foreground"
                  )}
                >
                  <RadioGroupItem value="cash" />
                  <Banknote className="h-4 w-4" />
                  <span className="text-sm font-medium">Cash</span>
                </label>
                <label
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors",
                    method === "card" ? "border-primary bg-primary/5" : "hover:border-muted-foreground"
                  )}
                >
                  <RadioGroupItem value="card" />
                  <CreditCard className="h-4 w-4" />
                  <span className="text-sm font-medium">Card</span>
                </label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button className="w-full" size="lg" onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</>
            ) : (
              `Confirm Payment — £${total.toFixed(2)}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
