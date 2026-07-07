"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { categoryFromSlug, formatPrice, getCategory } from "@/lib/catalog";

export default function CollectionPage() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const category = categoryFromSlug(String(slug || ""));
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const collectionProducts = useMemo(() => {
    if (!category) return [];
    return products.filter((product) => getCategory(product) === category);
  }, [products, category]);

  if (!category) {
    return (
      <main style={{ padding: "80px 0" }}>
        <div className="container">
          <div className="eyebrow">Collection</div>
          <h1>Collection not found.</h1>
          <Link href="/" className="button">Back to Store</Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      <section style={{ padding: "80px 0 42px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="container">
          <div className="eyebrow">UPZ Collection</div>
          <h1 style={{ fontSize: "clamp(44px, 7vw, 92px)", lineHeight: 0.94, letterSpacing: "-0.07em", marginBottom: 18 }}>
            {category}
          </h1>
          <p className="lead" style={{ maxWidth: 680 }}>
            Curated branded products for commercial real estate teams and brokerage marketing.
          </p>
        </div>
      </section>

      <section style={{ padding: "54px 0 96px" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center", marginBottom: 24 }}>
            <Link href="/#products" style={{ color: "var(--upzyellow)", fontWeight: 900 }}>Back to all products</Link>
            <span style={{ opacity: 0.65 }}>{loading ? "Loading..." : `${collectionProducts.length} products`}</span>
          </div>

          {!loading && collectionProducts.length === 0 && (
            <p style={{ opacity: 0.7 }}>No products found in this collection yet.</p>
          )}

          <div style={{ display: "grid", gap: 22, gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))" }}>
            {collectionProducts.map((p) => (
              <Link key={p.id} href={`/product/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <article style={{ height: "100%", borderRadius: 22, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.035)" }}>
                  <div style={{ position: "relative", background: "#f4f4f4" }}>
                    <img src={p.image || "/placeholder.png"} alt={p.name || "Product"} style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", display: "block" }} />
                    <span style={{ position: "absolute", top: 12, left: 12, padding: "6px 9px", borderRadius: 999, background: "rgba(1,1,1,0.86)", color: "var(--upzyellow)", fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>{category}</span>
                  </div>
                  <div style={{ padding: 16 }}>
                    <div style={{ minHeight: 38, fontSize: 13, fontWeight: 900, lineHeight: 1.45, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 10 }}>{p.name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                      <strong style={{ color: "var(--upzyellow)", fontSize: 18 }}>{formatPrice(p.price)}</strong>
                      <span style={{ fontSize: 12, opacity: 0.65 }}>View</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
