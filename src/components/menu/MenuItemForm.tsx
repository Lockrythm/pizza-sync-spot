import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/hooks/useMenu";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

interface MenuItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  initialData?: {
    id: string;
    name: string;
    description: string | null;
    category_id: string;
    is_pizza: boolean;
    price: number | null;
    price_small: number | null;
    price_medium: number | null;
    price_large: number | null;
    cost_price: number;
    is_enabled: boolean;
  };
  onSubmit: (data: TablesInsert<"menu_items"> | (TablesUpdate<"menu_items"> & { id: string })) => void;
  loading?: boolean;
}

export function MenuItemForm({ open, onOpenChange, categories, initialData, onSubmit, loading }: MenuItemFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [categoryId, setCategoryId] = useState(initialData?.category_id ?? "");
  const [isPizza, setIsPizza] = useState(initialData?.is_pizza ?? false);
  const [price, setPrice] = useState(initialData?.price?.toString() ?? "");
  const [priceSmall, setPriceSmall] = useState(initialData?.price_small?.toString() ?? "");
  const [priceMedium, setPriceMedium] = useState(initialData?.price_medium?.toString() ?? "");
  const [priceLarge, setPriceLarge] = useState(initialData?.price_large?.toString() ?? "");
  const [costPrice, setCostPrice] = useState(initialData?.cost_price?.toString() ?? "0");
  const [isEnabled, setIsEnabled] = useState(initialData?.is_enabled ?? true);

  const pizzaCategory = categories.find((c) => c.name === "Pizza");

  const handleCategoryChange = (val: string) => {
    setCategoryId(val);
    if (pizzaCategory && val === pizzaCategory.id) {
      setIsPizza(true);
    } else {
      setIsPizza(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const base = {
      name,
      description: description || null,
      category_id: categoryId,
      is_pizza: isPizza,
      price: isPizza ? null : parseFloat(price) || 0,
      price_small: isPizza ? parseFloat(priceSmall) || 0 : null,
      price_medium: isPizza ? parseFloat(priceMedium) || 0 : null,
      price_large: isPizza ? parseFloat(priceLarge) || 0 : null,
      cost_price: parseFloat(costPrice) || 0,
      is_enabled: isEnabled,
    };

    if (initialData) {
      onSubmit({ id: initialData.id, ...base });
    } else {
      onSubmit(base);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={handleCategoryChange} required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isPizza ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Small (£)</Label>
                <Input type="number" step="0.01" value={priceSmall} onChange={(e) => setPriceSmall(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Medium (£)</Label>
                <Input type="number" step="0.01" value={priceMedium} onChange={(e) => setPriceMedium(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Large (£)</Label>
                <Input type="number" step="0.01" value={priceLarge} onChange={(e) => setPriceLarge(e.target.value)} required />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Price (£)</Label>
              <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
          )}

          <div className="space-y-2">
            <Label>Cost Price (£)</Label>
            <Input type="number" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} required />
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
            <Label>Enabled</Label>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {initialData ? "Update Item" : "Add Item"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
