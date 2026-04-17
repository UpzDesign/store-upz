"use client";

import { useCartStore } from "@/store/cart-store";

export function AddToCart({ product }: any) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  return (
    <button
      onClick={() => {
        addItem({
          id: product.id,
          name: product.name,
          image: product.thumbnail_url,
          quantity: 1,
        });

        openCart();
      }}
      style={{
        marginTop: 20,
        padding: "12px 18px",
        background: "#DC353C",
        color: "#fff",
        border: "none",
        borderRadius: 8,
      }}
    >
      Add to Cart
    </button>
  );
}