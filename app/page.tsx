import { getProducts } from "@/lib/printful";
import Link from "next/link";

export default async function Home() {
  const products = await getProducts();

  return (
    <main style={{ padding: 40 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>UPZ Store</h1>

      <div
        style={{
          display: "grid",
          gap: 20,
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          marginTop: 30,
        }}
      >
        {products?.map((p: any) => (
          <Link
            key={p.id}
            href={`/product/${p.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              style={{
                border: "1px solid #eee",
                borderRadius: 12,
                overflow: "hidden",
                background: "#fff",
                transition: "0.2s ease",
                cursor: "pointer",
              }}
            >
              <div style={{ aspectRatio: "1 / 1", background: "#f6f6f6" }}>
                {p.thumbnail_url && (
                  <img
                    src={p.thumbnail_url}
                    alt={p.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}
              </div>

              <div style={{ padding: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600 }}>
                  {p.name}
                </h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}