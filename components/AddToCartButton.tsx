"use client";

import { useCartStore } from "@/store/cart-store";

export default function AddToCartButton({ product }: any) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const selectedVariant = product?.selectedVariant || product?.variants?.[0];

  if (!selectedVariant) {
    return <p style={{ opacity: 0.7 }}>Please select an option.</p>;
  }

  const price = Number(selectedVariant.price || product.price || 0);

  return (
    <button
      onClick={() => {
        addItem({
          id: String(selectedVariant.id),
          productId: String(product.id),
          name: product.name,
          variant: selectedVariant.name,
          image:
            selectedVariant.images?.[0] ||
            product.thumbnail ||
            product.image ||
            "/placeholder.png",
          price,
          quantity: 1,
        });

        openCart();
      }}
      style={{
        marginTop: 20,
        padding: "14px 20px",
        background: "#DC353C",
        color: "#fff",
        border: "none",
        borderRadius: 10,
        cursor: "pointer",
        fontWeight: 700,
        width: "100%",
      }}
    >
      Add to Cart — ${price.toFixed(2)}
    </button>
  );
}
