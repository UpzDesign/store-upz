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
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }
      setLoading(false);
    })
    .catch(() => {
      setProducts([]);
      setLoading(false);
    });
}, []);

  return (
    <main style={{ padding: 40 }}>
      <h1>UPZ Store</h1>

      {loading && <p>Loading products...</p>}

      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
        {Array.isArray(products) &&
          products.map((p: any) => (
          <Link key={p.id} href={`/product/${p.id}`}>
            <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 10 }}>
              <img src={p.thumbnail_url} style={{ width: "100%" }} />
              <p>{p.name}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}