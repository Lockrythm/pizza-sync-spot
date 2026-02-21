import { ShoppingCart } from "lucide-react";

export default function Orders() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
      <ShoppingCart className="h-12 w-12" />
      <h2 className="text-xl font-semibold text-foreground">Order Entry</h2>
      <p>Order creation screen coming in Phase 3</p>
    </div>
  );
}
