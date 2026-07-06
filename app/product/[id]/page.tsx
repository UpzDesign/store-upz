"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";

function formatPrice(value?: number | string | null) {
  const amount = Number(value || 0);
  if (!amount) return "Price unavailable";
  return `$${amount.toFixed(2)}`;
}

function getStatusLabel(stock?: string | null) {
  if (!stock) return "Available";
  if (["active", "in_stock", "available"].includes(stock)) return "In Stock";
  return stock.replaceAll("_", " ");
}

export default function ProductPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(false);

    fetch(`/api/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch product");
        return res.json();
      })
      .then((data) => {
        if (data?.error) {
          setError(true);
          setProduct(null);
          setSelectedVariant(null);
        } else {
          setProduct(data);
          setSelectedVariant(data?.variants?.[0] || null);
        }
      })
      .catch((err) => {
        console.error(err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const gallery = useMemo(() => {
    if (!product) return [];

    const variantImages = selectedVariant?.images || [];
    const productImages = product.images || [];
    const fallback = product.thumbnail || product.image;

    const images = [...variantImages, ...productImages, fallback].filter(Boolean);
    return Array.from(new Set(images));
  }, [product, selectedVariant]);

  if (loading) {
    return (
      <main style={{ padding: 40, maxWidth: 1100, margin: "0 auto" }}>
        <p>Loading product...</p>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main style={{ padding: 40, maxWidth: 1100, margin: "0 auto" }}>
        <Link href="/" style={{ color: "var(--secondary-color)" }}>
          ← Back to products
        </Link>
        <h1 style={{ marginTop: 20 }}>Product not found</h1>
        <p style={{ opacity: 0.7 }}>
          This product may no longer be available in Printful.
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: "64px 0 96px" }}>
      <div className="container">
        <div style={{ marginBottom: 24, fontSize: 13, opacity: 0.75 }}>
          <Link href="/" style={{ color: "var(--secondary-color)", textDecoration: "none" }}>
            Home
          </Link>{" "}
          / <span>{product.name}</span>
        </div>

        <div
          style={{
            display: "grid",
            gap: 48,
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            alignItems: "start",
          }}
        >
          <div>
            <div
              style={{
                borderRadius: 22,
                overflow: "hidden",
                background: "#f5f5f5",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <img
                src={gallery[activeImage] || "/placeholder.png"}
                alt={product.name}
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.png";
                }}
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  objectFit: "contain",
                  display: "block",
                  padding: 24,
                }}
              />
            </div>

            {gallery.length > 1 && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                {gallery.map((img: string, index: number) => (
                  <button
                    key={`${img}-${index}`}
                    onClick={() => setActiveImage(index)}
                    style={{
                      width: 76,
                      height: 76,
                      borderRadius: 12,
                      overflow: "hidden",
                      border:
                        activeImage === index
                          ? "2px solid var(--upzyellow)"
                          : "1px solid rgba(255,255,255,0.12)",
                      padding: 0,
                      background: "#f5f5f5",
                      cursor: "pointer",
                    }}
                  >
                    <img
                      src={img}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <section>
            <div
              style={{
                display: "inline-block",
                marginBottom: 14,
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(245,196,0,0.45)",
                color: "var(--upzyellow)",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Printful Product
            </div>

            <h1
              style={{
                fontSize: "clamp(34px, 5vw, 64px)",
                lineHeight: 1,
                letterSpacing: "-0.04em",
                marginBottom: 16,
              }}
            >
              {product.name}
            </h1>

            <div
              style={{
                fontSize: 30,
                fontWeight: 900,
                color: "var(--upzyellow)",
                marginBottom: 22,
              }}
            >
              {formatPrice(selectedVariant?.price || product.price)}
            </div>

            <p style={{ opacity: 0.75, lineHeight: 1.8, marginBottom: 28 }}>
              {product.description ||
                "Premium CRE merchandise designed for modern brokerage teams."}
            </p>

            {product.variants?.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 12 }}>Options</h3>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {product.variants.map((variant: any) => (
                    <button
                      key={variant.id}
                      onClick={() => {
                        setSelectedVariant(variant);
                        setActiveImage(0);
                      }}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 999,
                        border:
                          selectedVariant?.id === variant.id
                            ? "1px solid var(--upzyellow)"
                            : "1px solid rgba(255,255,255,0.14)",
                        background:
                          selectedVariant?.id === variant.id
                            ? "rgba(245,196,0,0.12)"
                            : "transparent",
                        color:
                          selectedVariant?.id === variant.id
                            ? "var(--upzyellow)"
                            : "var(--font-color)",
                        cursor: "pointer",
                      }}
                    >
                      {variant.size || variant.color || variant.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: 16,
                marginBottom: 18,
                padding: 18,
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.035)",
              }}
            >
              <div>
                <div style={{ fontSize: 11, opacity: 0.55, textTransform: "uppercase" }}>
                  Status
                </div>
                <strong>{getStatusLabel(selectedVariant?.stock)}</strong>
              </div>
              <div>
                <div style={{ fontSize: 11, opacity: 0.55, textTransform: "uppercase" }}>
                  Variant
                </div>
                <strong>{selectedVariant?.name || "Default"}</strong>
              </div>
              <div>
                <div style={{ fontSize: 11, opacity: 0.55, textTransform: "uppercase" }}>
                  SKU
                </div>
                <strong>{selectedVariant?.sku || "—"}</strong>
              </div>
            </div>

            <AddToCartButton product={{ ...product, selectedVariant }} />
          </section>
        </div>
      </div>
    </main>
  );
}
