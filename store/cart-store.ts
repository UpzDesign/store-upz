import { create } from "zustand";

type CartItem = {
  id: string;
  name: string;
  image: string;
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

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isOpen: false,

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);

      const updated = existing
        ? state.items.map((i) =>
            i.id === item.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          )
        : [...state.items, item];

      localStorage.setItem("cart", JSON.stringify(updated));

      return { items: updated };
    }),

  removeItem: (id) =>
    set((state) => {
      const updated = state.items.filter((i) => i.id !== id);
      localStorage.setItem("cart", JSON.stringify(updated));
      return { items: updated };
    }),

  clearCart: () => {
    localStorage.removeItem("cart");
    set({ items: [] });
  },

  hydrate: () => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("cart");
    if (stored) {
      set({ items: JSON.parse(stored) });
    }
  },
}));