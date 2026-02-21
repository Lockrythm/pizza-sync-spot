import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { Database } from "@/integrations/supabase/types";

type OrderType = Database["public"]["Enums"]["order_type"];

interface OrderTypeBarProps {
  orderType: OrderType;
  tableNumber: number | null;
  onOrderTypeChange: (type: OrderType) => void;
  onTableNumberChange: (num: number | null) => void;
}

const orderTypes: { value: OrderType; label: string }[] = [
  { value: "dine_in", label: "Dine In" },
  { value: "takeaway", label: "Takeaway" },
  { value: "delivery", label: "Delivery" },
];

export default function OrderTypeBar({
  orderType,
  tableNumber,
  onOrderTypeChange,
  onTableNumberChange,
}: OrderTypeBarProps) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium whitespace-nowrap">Type:</Label>
        <Select value={orderType} onValueChange={(v) => onOrderTypeChange(v as OrderType)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {orderTypes.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {orderType === "dine_in" && (
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium whitespace-nowrap">Table:</Label>
          <Select
            value={tableNumber?.toString() ?? ""}
            onValueChange={(v) => onTableNumberChange(v ? Number(v) : null)}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="#" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
