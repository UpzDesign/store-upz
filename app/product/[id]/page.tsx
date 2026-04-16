import { getProductById } from "@/lib/printful";

export default async function ProductPage({ params }: any) {
  const product = await getProductById(params.id);

  if (!product) {
    return <div style={{ padding: 40 }}>Product not found</div>;
  }

  return (
    <main style={{ padding: 40 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>
        {product.name}
      </h1>

      <div style={{ display: "flex", gap: 40, marginTop: 30 }}>
        {/* Image */}
        <div style={{ flex: 1 }}>
          {product.thumbnail_url && (
            <img
              src={product.thumbnail_url}
              alt={product.name}
              style={{ width: "100%", borderRadius: 12 }}
            />
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <p style={{ color: "#666" }}>
            Product ID: {product.id}
          </p>

          <button
            style={{
              marginTop: 20,
              padding: "12px 20px",
              background: "#DC353C",
              color: "#fff",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
            }}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </main>
  );
}