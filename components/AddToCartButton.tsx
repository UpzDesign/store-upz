"use client";

import { useCartStore } from "@/store/cart-store";

export default function AddToCartButton({ product }: any) {
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

        openCart?.(); // safe optional call if exists
      }}
      style={{
        marginTop: 20,
        padding: "12px 18px",
        background: "#DC353C",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
      }}
    >
      Add to Cart
    </button>
  );
}