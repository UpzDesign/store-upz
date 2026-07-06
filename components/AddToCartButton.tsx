"use client";

import { useCartStore } from "@/store/cart-store";

export default function AddToCartButton({ product }: any) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const selectedVariant = product?.selectedVariant || product?.variants?.[0] || product;
  const price = Number(selectedVariant?.price || product?.price || 0);

  return (
    <button
      onClick={() => {
        addItem({
          id: String(selectedVariant?.id || product.id),
          productId: String(product.id),
          name: product.name,
          variant: selectedVariant?.name,
          image:
            selectedVariant?.images?.[0] ||
            product.thumbnail ||
            product.image ||
            product.thumbnail_url ||
            "/placeholder.png",
          price,
          quantity: 1,
        });

        openCart?.();
      }}
      style={{
        marginTop: 20,
        width: "100%",
        padding: "15px 20px",
        background: "var(--upzyellow)",
        color: "var(--upzblack)",
        border: "1px solid var(--upzyellow)",
        borderRadius: 999,
        cursor: "pointer",
        fontWeight: 900,
        letterSpacing: "-0.01em",
      }}
    >
      Add to Cart{price ? ` — $${price.toFixed(2)}` : ""}
    </button>
  );
}
