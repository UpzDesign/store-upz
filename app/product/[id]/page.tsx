"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import {
  findVariant,
  formatPrice,
  getCategory,
  getColorOptions,
  getSizeOptions,
  slugifyCategory,
} from "@/lib/catalog";

function getStatusLabel(stock?: string | null) {
  if (!stock) return "Available";
  if (["active", "in_stock", "available"].includes(stock)) return "In Stock";
  return stock.replaceAll("_", " ");
}

export default function ProductPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [product, setProduct] = useState<any>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(false);

    Promise.all([
      fetch(`/api/products/${id}`).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch product");
        return res.json();
      }),
      fetch("/api/products").then((res) => res.json()).catch(() => []),
    ])
      .then(([data, productList]) => {
        if (data?.error) {
          setError(true);
          setProduct(null);
          setSelectedVariant(null);
          return;
        }

        const firstVariant = data?.variants?.[0] || null;
        setProduct(data);
        setSelectedVariant(firstVariant);
        setSelectedColor(firstVariant?.color || null);
        setSelectedSize(firstVariant?.size || null);
        setAllProducts(Array.isArray(productList) ? productList : []);
      })
      .catch((err) => {
        console.error(err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const colorOptions = useMemo(() => getColorOptions(product?.variants || []), [product]);
  const sizeOptions = useMemo(() => getSizeOptions(product?.variants || []), [product]);
  const productCategory = product ? getCategory(product) : "Accessories";

  useEffect(() => {
    if (!product?.variants?.length) return;
    const nextVariant = findVariant({
      variants: product.variants,
      color: selectedColor,
      size: selectedSize,
    });

    if (nextVariant) {
      setSelectedVariant(nextVariant);
      setActiveImage(0);
    }
  }, [product, selectedColor, selectedSize]);

  const gallery = useMemo(() => {
    if (!product) return [];

    const variantImages = selectedVariant?.images || [];
    const productImages = product.images || [];
    const fallback = product.thumbnail || product.image;

    const images = [...variantImages, ...productImages, fallback].filter(Boolean);
    return Array.from(new Set(images));
  }, [product, selectedVariant]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return allProducts
      .filter((item) => String(item.id) !== String(product.id) && getCategory(item) === productCategory)
      .slice(0, 4);
  }, [allProducts, product, productCategory]);

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
          Back to products
        </Link>
        <h1 style={{ marginTop: 20 }}>Product not found</h1>
        <p style={{ opacity: 0.7 }}>This product may no longer be available in Printful.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "56px 0 104px" }}>
      <div className="container">
        <div style={{ marginBottom: 28, fontSize: 13, opacity: 0.75 }}>
          <Link href="/" style={{ color: "var(--secondary-color)", textDecoration: "none" }}>Home</Link>
          {" / "}
          <Link href={`/collections/${slugifyCategory(productCategory)}`} style={{ color: "var(--secondary-color)", textDecoration: "none" }}>{productCategory}</Link>
          {" / "}
          <span>{product.name}</span>
        </div>

        <div style={{ display: "grid", gap: 56, gridTemplateColumns: "minmax(320px, 1.12fr) minmax(300px, 0.88fr)", alignItems: "start" }}>
          <div>
            <div style={{ borderRadius: 28, overflow: "hidden", background: "#f5f5f5", border: "1px solid rgba(255,255,255,0.1)" }}>
              <img
                src={gallery[activeImage] || "/placeholder.png"}
                alt={product.name}
                onError={(e) => { e.currentTarget.src = "/placeholder.png"; }}
                style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "contain", display: "block", padding: 18 }}
              />
            </div>

            {gallery.length > 1 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(92px, 1fr))", gap: 12, marginTop: 14 }}>
                {gallery.map((img: string, index: number) => (
                  <button
                    key={`${img}-${index}`}
                    onClick={() => setActiveImage(index)}
                    style={{
                      borderRadius: 16,
                      overflow: "hidden",
                      border: activeImage === index ? "2px solid var(--upzyellow)" : "1px solid rgba(255,255,255,0.12)",
                      padding: 0,
                      background: "#f5f5f5",
                      cursor: "pointer",
                    }}
                  >
                    <img src={img} alt={`${product.name} thumbnail ${index + 1}`} style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", display: "block" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <section style={{ position: "sticky", top: 102 }}>
            <div className="eyebrow">{productCategory} · UPZ Store</div>
            <h1 style={{ fontSize: "clamp(38px, 5vw, 68px)", lineHeight: 0.94, letterSpacing: "-0.06em", marginBottom: 18 }}>
              {product.name}
            </h1>

            <div style={{ fontSize: 32, fontWeight: 900, color: "var(--upzyellow)", marginBottom: 22 }}>
              {formatPrice(selectedVariant?.price || product.price)}
            </div>

            <p className="lead" style={{ marginBottom: 28 }}>
              {product.description || "Premium branded merchandise for modern brokerage teams, events, and commercial real estate marketing."}
            </p>

            {colorOptions.length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <h3 style={{ marginBottom: 12 }}>Color</h3>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "9px 12px",
                        borderRadius: 999,
                        border: selectedColor === color ? "1px solid var(--upzyellow)" : "1px solid rgba(255,255,255,0.16)",
                        background: selectedColor === color ? "rgba(237,191,45,0.12)" : "transparent",
                        color: selectedColor === color ? "var(--upzyellow)" : "var(--font-color)",
                        cursor: "pointer",
                        fontWeight: 800,
                      }}
                    >
                      <span style={{ width: 14, height: 14, borderRadius: "50%", background: color.toLowerCase(), border: "1px solid rgba(255,255,255,0.4)" }} />
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sizeOptions.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 12 }}>Size</h3>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {sizeOptions.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      style={{
                        minWidth: 48,
                        padding: "10px 14px",
                        borderRadius: 999,
                        border: selectedSize === size ? "1px solid var(--upzyellow)" : "1px solid rgba(255,255,255,0.16)",
                        background: selectedSize === size ? "var(--upzyellow)" : "transparent",
                        color: selectedSize === size ? "var(--upzblack)" : "var(--font-color)",
                        cursor: "pointer",
                        fontWeight: 900,
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.variants?.length > 0 && !colorOptions.length && !sizeOptions.length && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 12 }}>Options</h3>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {product.variants.map((variant: any) => (
                    <button
                      key={variant.id}
                      onClick={() => { setSelectedVariant(variant); setActiveImage(0); }}
                      style={{ padding: "10px 14px", borderRadius: 999, border: selectedVariant?.id === variant.id ? "1px solid var(--upzyellow)" : "1px solid rgba(255,255,255,0.14)", background: selectedVariant?.id === variant.id ? "rgba(237,191,45,0.12)" : "transparent", color: selectedVariant?.id === variant.id ? "var(--upzyellow)" : "var(--font-color)", cursor: "pointer" }}
                    >
                      {variant.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 14, marginBottom: 18, padding: 18, borderRadius: 18, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.035)" }}>
              <div><div style={{ fontSize: 11, opacity: 0.55, textTransform: "uppercase" }}>Status</div><strong>{getStatusLabel(selectedVariant?.stock)}</strong></div>
              <div><div style={{ fontSize: 11, opacity: 0.55, textTransform: "uppercase" }}>Variant</div><strong>{selectedVariant?.name || "Default"}</strong></div>
              <div><div style={{ fontSize: 11, opacity: 0.55, textTransform: "uppercase" }}>SKU</div><strong>{selectedVariant?.sku || "-"}</strong></div>
            </div>

            <AddToCartButton product={{ ...product, selectedVariant }} />
          </section>
        </div>

        {relatedProducts.length > 0 && (
          <section style={{ paddingTop: 82 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "end", marginBottom: 24 }}>
              <div>
                <div className="eyebrow">Related products</div>
                <h2 style={{ marginBottom: 0 }}>More in {productCategory}</h2>
              </div>
              <Link href={`/collections/${slugifyCategory(productCategory)}`} style={{ color: "var(--upzyellow)", fontWeight: 900 }}>View collection</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
              {relatedProducts.map((item) => (
                <Link key={item.id} href={`/product/${item.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                  <article style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.035)" }}>
                    <img src={item.image || "/placeholder.png"} alt={item.name} style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", background: "#f4f4f4", display: "block" }} />
                    <div style={{ padding: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", lineHeight: 1.4, minHeight: 34 }}>{item.name}</div>
                      <strong style={{ color: "var(--upzyellow)" }}>{formatPrice(item.price)}</strong>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
