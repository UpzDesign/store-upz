"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.result;
        setProducts(list || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main style={{ padding: 40 }}>
      <h1>UPZ Store</h1>

      {loading && <p>Loading products...</p>}

      <div
        style={{
          display: "grid",
          gap: 24,
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        }}
      >
        {products?.map((p: any) => (
          <Link key={p.id} href={`/product/${p.id}`}>
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                overflow: "hidden",
                border: "1px solid #eee",
                cursor: "pointer",
              }}
            >
              <img
                src={p.thumbnail_url}
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  objectFit: "cover",
                }}
              />

              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {p.name}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}