import { create } from "zustand";

export type CartItem = {
  id: string;
  itemType?: "merch" | "service_request";
  productId?: string;
  name: string;
  variant?: string;
  image: string;
  price?: number;
  quantity: number;
  packageId?: string;
  packageName?: string;
  companySlug?: string;
  companyName?: string;
  projectName?: string;
  address?: string;
  serviceSlug?: string;
  requestSummary?: string;
  requestHref?: string;
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
  clearRequestItems: (companySlug?: string) => void;
  openCart: () => void;
  closeCart: () => void;
  hydrate: () => void;
};

const saveCart = (items: CartItem[]) => {
  if (typeof window !== "undefined") localStorage.setItem("cart", JSON.stringify(items));
};

const normalizeItem = (item: CartItem): CartItem => ({
  ...item,
  id: String(item.id),
  itemType: item.itemType || "merch",
  price: Number(item.price || 0),
  quantity: item.itemType === "service_request" ? 1 : Math.max(1, Number(item.quantity || 1)),
  companySlug: item.companySlug ? String(item.companySlug).toLowerCase() : undefined,
  companyName: item.companyName ? String(item.companyName) : undefined,
});

const mergeItems = (currentItems: CartItem[], newItems: CartItem[]) => newItems.reduce<CartItem[]>((items, item) => {
  const safeItem = normalizeItem(item);
  const existing = items.find(i => i.id === safeItem.id && (i.companySlug || "") === (safeItem.companySlug || ""));
  if (existing) return items.map(i => i.id === safeItem.id && (i.companySlug || "") === (safeItem.companySlug || "") ? (safeItem.itemType === "service_request" ? safeItem : { ...i, quantity: i.quantity + safeItem.quantity }) : i);
  return [...items, safeItem];
}, currentItems);

const updateAndSave = (items: CartItem[]) => { saveCart(items); return { items }; };

export const useCartStore = create<CartState>((set) => ({
  items: [], isOpen: false,
  openCart: () => set({ isOpen: true }), closeCart: () => set({ isOpen: false }),
  addItem: item => set(state => { const updated = mergeItems(state.items, [item]); saveCart(updated); return { items: updated }; }),
  addItems: items => set(state => { const updated = mergeItems(state.items, items); saveCart(updated); return { items: updated, isOpen: true }; }),
  updateQuantity: (id, quantity) => set(state => updateAndSave(state.items.map(item => item.id === id ? { ...item, quantity: Math.max(0, Number(quantity || 0)) } : item).filter(item => item.quantity > 0))),
  increaseQuantity: id => set(state => updateAndSave(state.items.map(item => item.id === id && item.itemType !== "service_request" ? { ...item, quantity: item.quantity + 1 } : item))),
  decreaseQuantity: id => set(state => updateAndSave(state.items.map(item => item.id === id && item.itemType !== "service_request" ? { ...item, quantity: item.quantity - 1 } : item).filter(item => item.quantity > 0))),
  removeItem: id => set(state => updateAndSave(state.items.filter(item => item.id !== id))),
  removePackage: packageId => set(state => updateAndSave(state.items.filter(item => item.packageId !== packageId))),
  clearCart: () => { if (typeof window !== "undefined") localStorage.removeItem("cart"); set({ items: [] }); },
  clearRequestItems: companySlug => set(state => updateAndSave(state.items.filter(item => item.itemType !== "service_request" || (companySlug && item.companySlug !== companySlug)))),
  hydrate: () => { if (typeof window === "undefined") return; try { const stored = localStorage.getItem("cart"); if (stored) set({ items: JSON.parse(stored).map(normalizeItem) }); } catch { localStorage.removeItem("cart"); } },
}));
