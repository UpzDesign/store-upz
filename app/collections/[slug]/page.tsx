"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { categoryFromSlug, formatPrice, getCategory } from "@/lib/catalog";

const BLACK = "#010101";
const YELLOW = "#edbf2d";
const WHITE = "#ffffff";

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
      <main style={{ background: WHITE, color: BLACK, padding: "64px 0 92px" }}>
        <div style={{ width: "min(1180px, calc(100vw - 48px))", margin: "0 auto" }}>
          <div style={{ color: YELLOW, fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>Collection</div>
          <h1 style={{ color: BLACK, fontSize: "clamp(32px, 4vw, 48px)", lineHeight: 1, letterSpacing: "-.04em", marginBottom: 22 }}>Collection not found.</h1>
          <Link href="/" style={{ display: "inline-flex", padding: "12px 18px", background: YELLOW, color: BLACK, borderRadius: 5, fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".04em" }}>Back to Store</Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ background: WHITE, color: BLACK }}>
      <section style={{ padding: "66px 0 42px", borderBottom: "1px solid rgba(1,1,1,0.08)" }}>
        <div style={{ width: "min(1180px, calc(100vw - 48px))", margin: "0 auto" }}>
          <div style={{ color: YELLOW, fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>UPZ Collection</div>
          <h1 style={{ color: BLACK, fontSize: "clamp(34px, 5vw, 56px)", lineHeight: 1, letterSpacing: "-.05em", marginBottom: 16, textTransform: "uppercase" }}>
            {category}
          </h1>
          <p style={{ color: "rgba(1,1,1,.62)", maxWidth: 620, fontSize: 14, lineHeight: 1.75, margin: 0 }}>
            Curated branded products for commercial real estate teams, broker packages, and office marketing.
          </p>
        </div>
      </section>

      <section style={{ padding: "44px 0 88px" }}>
        <div style={{ width: "min(1180px, calc(100vw - 48px))", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center", marginBottom: 24, flexWrap: "wrap" }}>
            <Link href="/#products" style={{ color: BLACK, fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".04em" }}>Back to all products</Link>
            <span style={{ color: "rgba(1,1,1,.52)", fontSize: 12, fontWeight: 700 }}>{loading ? "Loading..." : `${collectionProducts.length} products`}</span>
          </div>

          {!loading && collectionProducts.length === 0 && (
            <p style={{ color: "rgba(1,1,1,.62)", fontSize: 14 }}>No products found in this collection yet.</p>
          )}

          <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
            {collectionProducts.map((p) => (
              <Link key={p.id} href={`/product/${p.id}`} style={{ textDecoration: "none", color: BLACK }}>
                <article style={{ height: "100%", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(1,1,1,0.08)", background: WHITE, boxShadow: "0 16px 42px rgba(0,0,0,.07)" }}>
                  <div style={{ position: "relative", background: "#f4f4f4" }}>
                    <img src={p.image || "/placeholder.png"} alt={p.name || "Product"} style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", display: "block" }} />
                    <span style={{ position: "absolute", top: 12, left: 12, padding: "6px 9px", borderRadius: 999, background: BLACK, color: YELLOW, fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".06em" }}>{category}</span>
                  </div>
                  <div style={{ padding: 15 }}>
                    <div style={{ minHeight: 34, fontSize: 12, fontWeight: 900, lineHeight: 1.4, letterSpacing: ".02em", textTransform: "uppercase", marginBottom: 10 }}>{p.name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                      <strong style={{ color: BLACK, fontSize: 17 }}>{formatPrice(p.price)}</strong>
                      <span style={{ color: YELLOW, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>View</span>
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
