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
  updateQuantity: (id: string, quantity: number) => void;
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  removeItem: (id: string) => void;
  removePackage: (packageId: string) => void;
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
  return newItems.reduce<CartItem[]>((items, item) => {
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

const updateAndSave = (items: CartItem[]) => {
  saveCart(items);
  return { items };
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

  updateQuantity: (id, quantity) =>
    set((state) => {
      const safeQuantity = Math.max(0, Number(quantity || 0));
      const updated = state.items
        .map((item) =>
          item.id === id ? { ...item, quantity: safeQuantity } : item
        )
        .filter((item) => item.quantity > 0);

      return updateAndSave(updated);
    }),

  increaseQuantity: (id) =>
    set((state) => {
      const updated = state.items.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      );

      return updateAndSave(updated);
    }),

  decreaseQuantity: (id) =>
    set((state) => {
      const updated = state.items
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0);

      return updateAndSave(updated);
    }),

  removeItem: (id) =>
    set((state) => {
      const updated = state.items.filter((i) => i.id !== id);
      return updateAndSave(updated);
    }),

  removePackage: (packageId) =>
    set((state) => {
      const updated = state.items.filter((item) => item.packageId !== packageId);
      return updateAndSave(updated);
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
