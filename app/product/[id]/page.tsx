import { getProducts } from "@/lib/printful";
import AddToCartButton from "@/components/AddToCartButton";

export default async function ProductPage({ params }: any) {
  const { id } = await params;

  const products = await getProducts();

  const product = products.find(
    (p: any) =>
      String(p.id) === String(id) ||
      String(p.external_id) === String(id)
  );

  if (!product) {
    return <div style={{ padding: 40 }}>Product not found</div>;
  }

  return (
    <main style={{ padding: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
      <div>
        <img
          src={product.thumbnail_url}
          style={{ width: "100%", borderRadius: 12 }}
        />
      </div>

      <div>
        <h1>{product.name}</h1>

        <p style={{ color: "#666" }}>
          ID: {product.id}
        </p>

        {/* ✅ THIS IS YOUR MISSING BUTTON */}
        <AddToCartButton product={product} />
      </div>
    </main>
  );
}