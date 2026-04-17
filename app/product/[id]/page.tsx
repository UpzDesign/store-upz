"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <p style={{ padding: 40 }}>Loading...</p>;
  if (!product) return <p style={{ padding: 40 }}>Product not found</p>;

  return (
    <main style={{ padding: 40 }}>
      <h1>{product.name}</h1>

      <img
        src={product.thumbnail_url}
        style={{ width: 300, borderRadius: 12 }}
      />

      <AddToCartButton product={product} />
    </main>
  );
}