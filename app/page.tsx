"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const crePackages = [
  {
    title: "Broker Starter Package",
    desc: "A clean starter set for new brokers, teams, and onboarding.",
    items: ["Apparel", "Office merch", "Presentation essentials"],
  },
  {
    title: "Open House Package",
    desc: "Client-facing essentials for tours, launches, and property events.",
    items: ["Branded giveaways", "Event-ready materials", "Team gear"],
  },
  {
    title: "Team Branding Package",
    desc: "A polished merch bundle for brokerage teams and CRE offices.",
    items: ["Multiple product types", "Consistent branding", "Bulk-ready setup"],
  },
];

function formatPrice(value?: number | string | null) {
  const amount = Number(value || 0);
  if (!amount) return "View pricing";
  return `$${amount.toFixed(2)}`;
}

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const featuredProducts = useMemo(() => products.slice(0, 8), [products]);

  return (
    <main>
      <section
        style={{
          padding: "96px 0 56px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="container">
          <div style={{ maxWidth: 850 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 11px",
                borderRadius: 999,
                border: "1px solid rgba(245,196,0,0.35)",
                color: "var(--upzyellow)",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 22,
              }}
            >
              UPZ Store · CRE Merchandise
            </div>

            <h1
              style={{
                fontSize: "clamp(42px, 7vw, 92px)",
                lineHeight: 0.96,
                letterSpacing: "-0.06em",
                marginBottom: 24,
              }}
            >
              Branded products for modern brokerage teams.
            </h1>

            <p
              style={{
                maxWidth: 620,
                fontSize: 18,
                lineHeight: 1.8,
                opacity: 0.76,
                marginBottom: 34,
              }}
            >
              Start with individual products, then build curated broker packages
              for onboarding, open houses, tenant pitches, and team branding.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="#products" className="button">
                Browse Products
              </a>
              <a href="#cre-packages" className="button outline">
                View CRE Packages
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="cre-packages" style={{ padding: "64px 0" }}>
        <div className="container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 24,
              alignItems: "end",
              flexWrap: "wrap",
              marginBottom: 24,
            }}
          >
            <div>
              <h2 style={{ marginBottom: 10 }}>CRE Packages</h2>
              <p style={{ maxWidth: 620, opacity: 0.7 }}>
                Package builder is coming next. These cards define the structure
                for broker-ready bundles that can add multiple products at once.
              </p>
            </div>
            <span style={{ color: "var(--upzyellow)", fontWeight: 800 }}>
              Coming next: Add Package
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 18,
            }}
          >
            {crePackages.map((pack) => (
              <article
                key={pack.title}
                style={{
                  padding: 24,
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.02))",
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 4,
                    background: "var(--upzyellow)",
                    borderRadius: 99,
                    marginBottom: 18,
                  }}
                />
                <h3 style={{ marginBottom: 10 }}>{pack.title}</h3>
                <p style={{ opacity: 0.72, marginBottom: 18 }}>{pack.desc}</p>
                <div style={{ display: "grid", gap: 8 }}>
                  {pack.items.map((item) => (
                    <span key={item} style={{ fontSize: 13, opacity: 0.82 }}>
                      ✓ {item}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="products" style={{ padding: "64px 0 96px" }}>
        <div className="container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 24,
              alignItems: "end",
              flexWrap: "wrap",
              marginBottom: 24,
            }}
          >
            <div>
              <h2 style={{ marginBottom: 10 }}>Products</h2>
              <p style={{ maxWidth: 620, opacity: 0.7 }}>
                Choose individual products now. Packages will use these products
                as bundled line items.
              </p>
            </div>
            <span style={{ opacity: 0.65 }}>
              {loading ? "Loading..." : `${products.length} products`}
            </span>
          </div>

          {loading && <p>Loading products...</p>}

          {!loading && products.length === 0 && (
            <p style={{ opacity: 0.7 }}>
              No Printful products found. Check your Printful token and synced
              store products.
            </p>
          )}

          <div
            style={{
              display: "grid",
              gap: 22,
              gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
            }}
          >
            {featuredProducts.map((p: any) => {
              const previewImages = [p.image, ...(p.images || [])].filter(Boolean);
              const uniquePreviews = Array.from(new Set(previewImages)).slice(0, 3);

              return (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <article
                    style={{
                      height: "100%",
                      borderRadius: 20,
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.035)",
                      transition: "transform 0.25s ease, border-color 0.25s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-6px)";
                      e.currentTarget.style.borderColor = "rgba(245,196,0,0.7)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    }}
                  >
                    <div style={{ position: "relative", background: "#f4f4f4" }}>
                      <img
                        src={p.image || "/placeholder.png"}
                        alt={p.name || "Product"}
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.png";
                        }}
                        style={{
                          width: "100%",
                          aspectRatio: "1 / 1",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />

                      {uniquePreviews.length > 1 && (
                        <div
                          style={{
                            position: "absolute",
                            left: 12,
                            bottom: 12,
                            display: "flex",
                            gap: 6,
                          }}
                        >
                          {uniquePreviews.map((img: any, index: number) => (
                            <span
                              key={`${img}-${index}`}
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                overflow: "hidden",
                                border: "1px solid rgba(0,0,0,0.12)",
                                background: "#fff",
                                display: "block",
                              }}
                            >
                              <img
                                src={img}
                                alt=""
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ padding: 16 }}>
                      <div
                        style={{
                          minHeight: 38,
                          fontSize: 13,
                          fontWeight: 800,
                          lineHeight: 1.45,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          marginBottom: 10,
                        }}
                      >
                        {p.name || "Untitled Product"}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <strong style={{ color: "var(--upzyellow)", fontSize: 18 }}>
                          {formatPrice(p.price)}
                        </strong>
                        <span style={{ fontSize: 12, opacity: 0.65 }}>View →</span>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
