import { create } from "zustand";
import { persist } from "zustand/middleware";
import { sumMacros, type MacroTotals } from "@/lib/kitchen/calories";
import type { MenuItem } from "@/lib/kitchen/types";

export type CartLine = {
  item: MenuItem;
  qty: number;
};

type CartState = {
  lines: CartLine[];
  add: (item: MenuItem, qty?: number) => void;
  setQty: (id: number, qty: number) => void;
  remove: (id: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (item, qty = 1) => {
        const lines = [...get().lines];
        const idx = lines.findIndex((l) => l.item.id === item.id);
        if (idx >= 0) lines[idx] = { ...lines[idx], qty: lines[idx].qty + qty };
        else lines.push({ item, qty });
        set({ lines });
      },
      setQty: (id, qty) => {
        if (qty <= 0) {
          set({ lines: get().lines.filter((l) => l.item.id !== id) });
          return;
        }
        set({
          lines: get().lines.map((l) => (l.item.id === id ? { ...l, qty } : l)),
        });
      },
      remove: (id) => set({ lines: get().lines.filter((l) => l.item.id !== id) }),
      clear: () => set({ lines: [] }),
    }),
    { name: "trendgrove.cart" },
  ),
);

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.qty, 0);
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.item.price_paise * l.qty, 0);
}

export function cartMacros(lines: CartLine[]): MacroTotals {
  return sumMacros(
    lines.map((l) => ({
      calories: l.item.calories,
      protein_g: l.item.protein_g,
      carbs_g: l.item.carbs_g,
      fat_g: l.item.fat_g,
      qty: l.qty,
    })),
  );
}
