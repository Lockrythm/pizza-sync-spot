import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { usePizzaCrusts, usePizzaAddons } from "@/hooks/useMenu";
import { cn } from "@/lib/utils";

interface PizzaCustomizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
  onAdd: (config: {
    size: string;
    crustId: string | null;
    crustName: string | null;
    crustExtra: number;
    addons: { id: string; name: string; price: number }[];
    unitPrice: number;
    specialInstructions: string | null;
  }) => void;
}

const sizes = [
  { value: "small", label: "Small", priceKey: "price_small" },
  { value: "medium", label: "Medium", priceKey: "price_medium" },
  { value: "large", label: "Large", priceKey: "price_large" },
] as const;

export default function PizzaCustomizeDialog({
  open,
  onOpenChange,
  item,
  onAdd,
}: PizzaCustomizeDialogProps) {
  const { data: crusts = [] } = usePizzaCrusts();
  const { data: addons = [] } = usePizzaAddons();
  const [size, setSize] = useState<string>("medium");
  const [crustId, setCrustId] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [instructions, setInstructions] = useState("");

  if (!item) return null;

  const sizeObj = sizes.find((s) => s.value === size)!;
  const basePrice = Number(item[sizeObj.priceKey] ?? 0);
  const crust = crusts.find((c) => c.id === crustId);
  const crustExtra = crust?.extra_price ?? 0;
  const addonTotal = addons
    .filter((a) => selectedAddons.includes(a.id))
    .reduce((s, a) => s + Number(a.price), 0);
  const lineTotal = basePrice + crustExtra + addonTotal;

  const handleAdd = () => {
    onAdd({
      size,
      crustId: crust?.id ?? null,
      crustName: crust?.name ?? null,
      crustExtra,
      addons: addons
        .filter((a) => selectedAddons.includes(a.id))
        .map((a) => ({ id: a.id, name: a.name, price: Number(a.price) })),
      unitPrice: basePrice,
      specialInstructions: instructions.trim() || null,
    });
    // reset
    setSize("medium");
    setCrustId(null);
    setSelectedAddons([]);
    setInstructions("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Size */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Size</Label>
            <div className="grid grid-cols-3 gap-2">
              {sizes.map((s) => {
                const p = Number(item[s.priceKey] ?? 0);
                return (
                  <button
                    key={s.value}
                    onClick={() => setSize(s.value)}
                    className={cn(
                      "rounded-lg border p-3 text-center transition-colors text-sm",
                      size === s.value
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "hover:border-muted-foreground"
                    )}
                  >
                    {s.label}
                    <br />
                    <span className="text-xs">£{p.toFixed(2)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Crust */}
          {crusts.length > 0 && (
            <div>
              <Label className="text-sm font-semibold mb-2 block">Crust</Label>
              <RadioGroup value={crustId ?? ""} onValueChange={(v) => setCrustId(v || null)}>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <RadioGroupItem value="" />
                    <span>Standard (included)</span>
                  </label>
                  {crusts.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <RadioGroupItem value={c.id} />
                      <span>{c.name}</span>
                      {Number(c.extra_price) > 0 && (
                        <span className="text-muted-foreground">+£{Number(c.extra_price).toFixed(2)}</span>
                      )}
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Add-ons */}
          {addons.length > 0 && (
            <div>
              <Label className="text-sm font-semibold mb-2 block">Add-ons</Label>
              <div className="space-y-1">
                {addons.map((a) => (
                  <label key={a.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={selectedAddons.includes(a.id)}
                      onCheckedChange={(checked) =>
                        setSelectedAddons((prev) =>
                          checked ? [...prev, a.id] : prev.filter((id) => id !== a.id)
                        )
                      }
                    />
                    <span>{a.name}</span>
                    <span className="text-muted-foreground">+£{Number(a.price).toFixed(2)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Special instructions */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Special Instructions</Label>
            <Textarea
              placeholder="No onions, extra spicy..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <span className="font-bold text-lg">£{lineTotal.toFixed(2)}</span>
            <Button onClick={handleAdd}>Add to Order</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
