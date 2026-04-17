"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";

export default function ProductPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(false);

    fetch(`/api/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (data?.error) {
          setError(true);
          setProduct(null);
        } else {
          setProduct(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <p style={{ padding: 40 }}>Loading product...</p>;
  }

  if (error || !product) {
    return <p style={{ padding: 40 }}>Product not found</p>;
  }

  return (
    <main style={{ padding: 40, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "grid", gap: 40, gridTemplateColumns: "1fr 1fr" }}>
        
        {/* IMAGE */}
        <img
          src={product.image || "/placeholder.png"}
          style={{
            width: "100%",
            maxWidth: 500,
            borderRadius: 16,
            objectFit: "contain",
            background: "#f5f5f5",
            padding: 20,
          }}
        />

        {/* INFO */}
        <div>
          <h1
            style={{
              fontSize: "clamp(28px, 3vw, 40px)",
              marginBottom: 12,
            }}
          >
            {product.name}
          </h1>

          <p style={{ opacity: 0.7, marginBottom: 24 }}>
            Premium CRE merchandise item designed for brokerage teams.
          </p>

          <AddToCartButton product={product} />
        </div>
      </div>
    </main>
  );
}