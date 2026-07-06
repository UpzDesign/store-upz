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
