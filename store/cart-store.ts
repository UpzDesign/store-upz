import { create } from "zustand";

export type CartItem = {
  id: string;
  productId?: string;
  name: string;
  variant?: string;
  image: string;
  price?: number;
  quantity: number;
  packageId?: string;
  packageName?: string;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;

  addItem: (item: CartItem) => void;
  addItems: (items: CartItem[]) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;

  openCart: () => void;
  closeCart: () => void;

  hydrate: () => void;
};

const saveCart = (items: CartItem[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("cart", JSON.stringify(items));
  }
};

const normalizeItem = (item: CartItem): CartItem => ({
  ...item,
  id: String(item.id),
  price: Number(item.price || 0),
  quantity: Math.max(1, Number(item.quantity || 1)),
});

const mergeItems = (currentItems: CartItem[], newItems: CartItem[]) => {
  return newItems.reduce((items, item) => {
    const safeItem = normalizeItem(item);
    const existing = items.find((i) => i.id === safeItem.id);

    if (existing) {
      return items.map((i) =>
        i.id === safeItem.id
          ? { ...i, quantity: i.quantity + safeItem.quantity }
          : i
      );
    }

    return [...items, safeItem];
  }, currentItems);
};

export const useCartStore = create<CartState>((set) => ({
  items: [],
  isOpen: false,

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),

  addItem: (item) =>
    set((state) => {
      const updated = mergeItems(state.items, [item]);
      saveCart(updated);
      return { items: updated };
    }),

  addItems: (items) =>
    set((state) => {
      const updated = mergeItems(state.items, items);
      saveCart(updated);
      return { items: updated, isOpen: true };
    }),

  removeItem: (id) =>
    set((state) => {
      const updated = state.items.filter((i) => i.id !== id);
      saveCart(updated);
      return { items: updated };
    }),

  clearCart: () => {
    if (typeof window !== "undefined") localStorage.removeItem("cart");
    set({ items: [] });
  },

  hydrate: () => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem("cart");
      if (stored) set({ items: JSON.parse(stored) });
    } catch {
      localStorage.removeItem("cart");
    }
  },
}));
