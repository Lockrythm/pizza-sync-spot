import { useState, useCallback } from "react";
import type { CartItem } from "./useOrders";

let nextId = 1;

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    setItems((prev) => [...prev, { ...item, id: `cart-${nextId++}` }]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const subtotal = items.reduce((sum, item) => {
    const lineTotal = (item.unitPrice + item.crustExtra + item.addons.reduce((a, ad) => a + ad.price, 0)) * item.quantity;
    return sum + lineTotal;
  }, 0);

  return { items, addItem, removeItem, updateQuantity, clearCart, subtotal };
}
