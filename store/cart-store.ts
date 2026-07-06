import { create } from "zustand";

export type CartItem = {
  id: string;
  productId?: string;
  name: string;
  variant?: string;
  image: string;
  price?: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;

  addItem: (item: CartItem) => void;
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

export const useCartStore = create<CartState>((set) => ({
  items: [],
  isOpen: false,

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),

  addItem: (item) =>
    set((state) => {
      const safeItem = {
        ...item,
        price: Number(item.price || 0),
      };

      const existing = state.items.find((i) => i.id === safeItem.id);

      const updated = existing
        ? state.items.map((i) =>
            i.id === safeItem.id ? { ...i, quantity: i.quantity + 1 } : i
          )
        : [...state.items, safeItem];

      saveCart(updated);
      return { items: updated };
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
