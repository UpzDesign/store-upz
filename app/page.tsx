"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

  return (
    <>
      <section
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 40,
          marginBottom: 60,
          flexWrap: "wrap",
        }}
      >
        <div style={{ maxWidth: 600, flex: "1 1 320px" }}>
          <h1
            style={{
              fontSize: "clamp(36px, 5vw, 64px)",
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            CRE Tools for Modern Brokerage Teams
          </h1>

          <p style={{ marginTop: 16, opacity: 0.7, fontSize: 16 }}>
            Curated office kits, marketing materials, and branded essentials built
            for commercial real estate teams.
          </p>

          <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a
              href="#products"
              style={{
                background: "var(--upzyellow)",
                color: "#111",
                border: "none",
                padding: "12px 18px",
                borderRadius: 10,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              View Products
            </a>
          </div>
        </div>

        <div
          style={{
            flex: "1 1 280px",
            minHeight: 280,
            borderRadius: 20,
            background:
              "linear-gradient(135deg, var(--upzyellow), var(--secondary-color))",
            opacity: 0.15,
          }}
        />
      </section>

      <section style={{ marginBottom: 60 }}>
        <h2 style={{ marginBottom: 20 }}>Featured CRE Kits</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
          }}
        >
          {[
            {
              title: "Broker Starter Kit",
              desc: "Everything a new broker needs to look established.",
            },
            {
              title: "Open House Kit",
              desc: "Signage, merch, and client-facing materials.",
            },
            {
              title: "Tenant Pitch Kit",
              desc: "Win deals with premium presentation tools.",
            },
          ].map((kit, i) => (
            <div
              key={i}
              style={{
                padding: 20,
                borderRadius: 16,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "var(--bg-color)",
              }}
            >
              <div
                style={{
                  height: 3,
                  width: "40%",
                  background: "var(--upzyellow)",
                  marginBottom: 12,
                }}
              />

              <h3 style={{ margin: 0 }}>{kit.title}</h3>
              <p style={{ opacity: 0.7, fontSize: 14 }}>{kit.desc}</p>

              <button
                style={{
                  marginTop: 10,
                  background: "var(--secondary-color)",
                  color: "#fff",
                  border: "none",
                  padding: "10px 14px",
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              >
                Coming Soon
              </button>
            </div>
          ))}
        </div>
      </section>

      <section id="products" style={{ padding: "40px 0" }}>
        <h2 style={{ marginBottom: 20 }}>Products</h2>

        {loading && <p>Loading products...</p>}

        {!loading && products.length === 0 && (
          <p style={{ opacity: 0.7 }}>No Printful products found yet.</p>
        )}

        <div
          style={{
            display: "grid",
            gap: 24,
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          }}
        >
          {products.map((p: any) => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <article
                style={{
                  background: "var(--bg-color)",
                  borderRadius: 14,
                  overflow: "hidden",
                  border: "1px solid rgba(0,0,0,0.08)",
                  boxShadow: "var(--shadow)",
                  transition: "transform 0.25s ease",
                  height: "100%",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-6px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0px)")
                }
              >
                <div
                  style={{
                    height: 3,
                    background: "var(--upzyellow)",
                    width: "100%",
                  }}
                />

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
                    background: "#f5f5f5",
                    display: "block",
                  }}
                />

                <div style={{ padding: 14 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      color: "var(--secondary-color)",
                      marginBottom: 8,
                    }}
                  >
                    {p.name || "Untitled Product"}
                  </div>

                  <div style={{ fontWeight: 800, color: "var(--font-color)" }}>
                    {formatPrice(p.price)}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
