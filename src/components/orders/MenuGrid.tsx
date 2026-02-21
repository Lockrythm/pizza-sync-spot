import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useCategories, useMenuItems } from "@/hooks/useMenu";
import { cn } from "@/lib/utils";

interface MenuGridProps {
  onSelectItem: (item: any) => void;
}

export default function MenuGrid({ onSelectItem }: MenuGridProps) {
  const { data: categories = [] } = useCategories();
  const { data: menuItems = [] } = useMenuItems();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = menuItems.filter((item) => {
    if (!item.is_enabled) return false;
    if (activeCategory && item.category_id !== activeCategory) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search menu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap">
        <Badge
          variant={activeCategory === null ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setActiveCategory(null)}
        >
          All
        </Badge>
        {categories.map((cat) => (
          <Badge
            key={cat.id}
            variant={activeCategory === cat.id ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.name}
          </Badge>
        ))}
      </div>

      {/* Item grid */}
      <div className="flex-1 overflow-auto">
        <div className="pos-grid">
          {filtered.map((item) => {
            const displayPrice = item.is_pizza
              ? item.price_small
              : item.price;
            return (
              <button
                key={item.id}
                onClick={() => onSelectItem(item)}
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg border p-3 text-center transition-colors",
                  "hover:border-primary hover:bg-primary/5 active:scale-[0.97]",
                  "bg-card text-card-foreground min-h-[100px]"
                )}
              >
                <span className="text-sm font-medium leading-tight">{item.name}</span>
                {item.is_pizza && (
                  <span className="text-[10px] text-muted-foreground mt-0.5">Pizza</span>
                )}
                <span className="text-xs font-semibold text-primary mt-1">
                  {item.is_pizza ? `from £${Number(displayPrice ?? 0).toFixed(2)}` : `£${Number(displayPrice ?? 0).toFixed(2)}`}
                </span>
              </button>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8 text-sm">No items found</p>
        )}
      </div>
    </div>
  );
}
