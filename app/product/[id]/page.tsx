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

const BLACK = "#010101";
const YELLOW = "#edbf2d";
const WHITE = "#ffffff";

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
    const nextVariant = findVariant({ variants: product.variants, color: selectedColor, size: selectedSize });
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
    return Array.from(new Set([...variantImages, ...productImages, fallback].filter(Boolean)));
  }, [product, selectedVariant]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return allProducts
      .filter((item) => String(item.id) !== String(product.id) && getCategory(item) === productCategory)
      .slice(0, 4);
  }, [allProducts, product, productCategory]);

  if (loading) {
    return (
      <main style={{ background: WHITE, color: BLACK, padding: "64px 0 92px" }}>
        <div style={{ width: "min(1180px, calc(100vw - 48px))", margin: "0 auto" }}>
          <p style={{ color: "rgba(1,1,1,.62)", fontSize: 14 }}>Loading product...</p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main style={{ background: WHITE, color: BLACK, padding: "64px 0 92px" }}>
        <div style={{ width: "min(1180px, calc(100vw - 48px))", margin: "0 auto" }}>
          <Link href="/" style={{ color: YELLOW, fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>Back to products</Link>
          <h1 style={{ color: BLACK, marginTop: 18, fontSize: "clamp(32px, 4vw, 48px)", letterSpacing: "-.04em" }}>Product not found</h1>
          <p style={{ color: "rgba(1,1,1,.62)", fontSize: 14 }}>This product may no longer be available in Printful.</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ background: WHITE, color: BLACK, padding: "46px 0 90px" }}>
      <div style={{ width: "min(1180px, calc(100vw - 48px))", margin: "0 auto" }}>
        <div style={{ marginBottom: 24, fontSize: 12, color: "rgba(1,1,1,.55)", fontWeight: 700 }}>
          <Link href="/" style={{ color: BLACK, textDecoration: "none" }}>Home</Link>
          {" / "}
          <Link href={`/collections/${slugifyCategory(productCategory)}`} style={{ color: BLACK, textDecoration: "none" }}>{productCategory}</Link>
          {" / "}
          <span>{product.name}</span>
        </div>

        <div style={{ display: "grid", gap: 48, gridTemplateColumns: "minmax(320px, 1.05fr) minmax(300px, 0.95fr)", alignItems: "start" }}>
          <div>
            <div style={{ borderRadius: 8, overflow: "hidden", background: "#f5f5f5", border: "1px solid rgba(1,1,1,0.08)" }}>
              <img
                src={gallery[activeImage] || "/placeholder.png"}
                alt={product.name}
                onError={(e) => { e.currentTarget.src = "/placeholder.png"; }}
                style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "contain", display: "block", padding: 16 }}
              />
            </div>

            {gallery.length > 1 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(74px, 1fr))", gap: 10, marginTop: 12 }}>
                {gallery.map((img: string, index: number) => (
                  <button
                    key={`${img}-${index}`}
                    onClick={() => setActiveImage(index)}
                    style={{ borderRadius: 6, overflow: "hidden", border: activeImage === index ? `2px solid ${YELLOW}` : "1px solid rgba(1,1,1,0.12)", padding: 0, background: "#f5f5f5", cursor: "pointer" }}
                  >
                    <img src={img} alt={`${product.name} thumbnail ${index + 1}`} style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", display: "block" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <section style={{ position: "sticky", top: 92 }}>
            <div style={{ color: YELLOW, fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>{productCategory} · UPZ Store</div>
            <h1 style={{ color: BLACK, fontSize: "clamp(32px, 4.3vw, 52px)", lineHeight: 1, letterSpacing: "-.052em", marginBottom: 16 }}>
              {product.name}
            </h1>

            <div style={{ fontSize: 26, fontWeight: 900, color: BLACK, marginBottom: 20 }}>
              {formatPrice(selectedVariant?.price || product.price)}
            </div>

            <p style={{ color: "rgba(1,1,1,.62)", fontSize: 14, lineHeight: 1.75, marginBottom: 24 }}>
              {product.description || "Premium branded merchandise for modern brokerage teams, events, and commercial real estate marketing."}
            </p>

            {colorOptions.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ color: BLACK, fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>Color</h3>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 11px", borderRadius: 999, border: selectedColor === color ? `1px solid ${YELLOW}` : "1px solid rgba(1,1,1,0.14)", background: selectedColor === color ? "rgba(237,191,45,0.12)" : WHITE, color: BLACK, cursor: "pointer", fontSize: 12, fontWeight: 800 }}
                    >
                      <span style={{ width: 12, height: 12, borderRadius: "50%", background: color.toLowerCase(), border: "1px solid rgba(1,1,1,0.25)" }} />
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sizeOptions.length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <h3 style={{ color: BLACK, fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>Size</h3>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {sizeOptions.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      style={{ minWidth: 42, padding: "8px 12px", borderRadius: 5, border: selectedSize === size ? `1px solid ${YELLOW}` : "1px solid rgba(1,1,1,0.14)", background: selectedSize === size ? YELLOW : WHITE, color: BLACK, cursor: "pointer", fontSize: 12, fontWeight: 900 }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.variants?.length > 0 && !colorOptions.length && !sizeOptions.length && (
              <div style={{ marginBottom: 22 }}>
                <h3 style={{ color: BLACK, fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>Options</h3>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {product.variants.map((variant: any) => (
                    <button
                      key={variant.id}
                      onClick={() => { setSelectedVariant(variant); setActiveImage(0); }}
                      style={{ padding: "8px 12px", borderRadius: 5, border: selectedVariant?.id === variant.id ? `1px solid ${YELLOW}` : "1px solid rgba(1,1,1,0.14)", background: selectedVariant?.id === variant.id ? "rgba(237,191,45,0.12)" : WHITE, color: BLACK, cursor: "pointer", fontSize: 12, fontWeight: 800 }}
                    >
                      {variant.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10, marginBottom: 18, padding: 15, borderRadius: 8, border: "1px solid rgba(1,1,1,0.08)", background: "#f7f7f7" }}>
              <div><div style={{ fontSize: 10, color: "rgba(1,1,1,.5)", textTransform: "uppercase", letterSpacing: ".08em" }}>Status</div><strong style={{ color: BLACK, fontSize: 13 }}>{getStatusLabel(selectedVariant?.stock)}</strong></div>
              <div><div style={{ fontSize: 10, color: "rgba(1,1,1,.5)", textTransform: "uppercase", letterSpacing: ".08em" }}>Variant</div><strong style={{ color: BLACK, fontSize: 13 }}>{selectedVariant?.name || "Default"}</strong></div>
              <div><div style={{ fontSize: 10, color: "rgba(1,1,1,.5)", textTransform: "uppercase", letterSpacing: ".08em" }}>SKU</div><strong style={{ color: BLACK, fontSize: 13 }}>{selectedVariant?.sku || "-"}</strong></div>
            </div>

            <AddToCartButton product={{ ...product, selectedVariant }} />
          </section>
        </div>

        {relatedProducts.length > 0 && (
          <section style={{ paddingTop: 76 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "end", marginBottom: 22 }}>
              <div>
                <div style={{ color: YELLOW, fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>Related products</div>
                <h2 style={{ color: BLACK, fontSize: "clamp(28px, 3.3vw, 44px)", lineHeight: 1, letterSpacing: "-.045em", marginBottom: 0 }}>More in {productCategory}</h2>
              </div>
              <Link href={`/collections/${slugifyCategory(productCategory)}`} style={{ color: BLACK, fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".04em" }}>View collection</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 18 }}>
              {relatedProducts.map((item) => (
                <Link key={item.id} href={`/product/${item.id}`} style={{ color: BLACK, textDecoration: "none" }}>
                  <article style={{ borderRadius: 8, overflow: "hidden", border: "1px solid rgba(1,1,1,0.08)", background: WHITE, boxShadow: "0 16px 42px rgba(0,0,0,.07)" }}>
                    <img src={item.image || "/placeholder.png"} alt={item.name} style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", background: "#f4f4f4", display: "block" }} />
                    <div style={{ padding: 14 }}>
                      <div style={{ color: BLACK, fontSize: 12, fontWeight: 900, textTransform: "uppercase", lineHeight: 1.4, minHeight: 34 }}>{item.name}</div>
                      <strong style={{ color: BLACK, fontSize: 16 }}>{formatPrice(item.price)}</strong>
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
