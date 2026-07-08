"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type AdminProductDetail = {
  id: number;
  printfulId: string;
  name: string;
  thumbnail?: string | null;
  price?: number | null;
  collection?: string | null;
  featured: boolean;
  active: boolean;
  sortOrder: number;
  company: {
    slug: string;
    name: string;
    primaryColor: string;
  };
};

export default function AdminProductPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [product, setProduct] = useState<AdminProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function updateField<K extends keyof AdminProductDetail>(field: K, value: AdminProductDetail[K]) {
    setProduct((current) => (current ? { ...current, [field]: value } : current));
  }

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    fetch(`/api/admin/products/${id}`)
      .then((response) => {
        if (!response.ok) throw new Error("Product not found");
        return response.json();
      })
      .then((data) => setProduct(data))
      .catch((error) => setMessage(error?.message || "Unable to load product"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product) return;

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: product.name,
          thumbnail: product.thumbnail || "",
          price: product.price ?? "",
          collection: product.collection || "",
          featured: product.featured,
          active: product.active,
          sortOrder: product.sortOrder,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to save product");
      }

      setProduct(data);
      setMessage("Product settings saved.");
    } catch (error: any) {
      setMessage(error?.message || "Unable to save product");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="admin-page">
        <section className="admin-simple-state">
          <h1>Loading product...</h1>
        </section>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="admin-page">
        <section className="admin-simple-state">
          <Link href="/admin">← Back to Admin</Link>
          <h1>Product not found</h1>
          {message && <p>{message}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <section className="admin-company-detail">
        <div className="admin-detail-topbar">
          <Link href={`/admin/company/${product.company.slug}`}>← Back to {product.company.name}</Link>
        </div>

        <header className="admin-detail-hero">
          <div className="admin-detail-logo" style={{ borderColor: product.company.primaryColor }}>
            <img src={product.thumbnail || "/placeholder.png"} alt={product.name} />
          </div>
          <div>
            <div className="admin-eyebrow">Product Settings</div>
            <h1>{product.name}</h1>
            <p>Control storefront visibility, featured status, collection assignment, pricing, and display order.</p>
          </div>
        </header>

        <section className="admin-section">
          <div className="admin-section-heading">
            <div>
              <span>Catalog Control</span>
              <h2>Product settings</h2>
            </div>
          </div>

          <form className="admin-settings-form" onSubmit={handleSubmit}>
            <label className="admin-settings-wide">
              Product Name
              <input value={product.name} onChange={(event) => updateField("name", event.target.value)} />
            </label>

            <label className="admin-settings-wide">
              Thumbnail URL
              <input value={product.thumbnail || ""} onChange={(event) => updateField("thumbnail", event.target.value)} />
            </label>

            <label>
              Price
              <input
                type="number"
                step="0.01"
                value={product.price ?? ""}
                onChange={(event) => updateField("price", event.target.value === "" ? null : Number(event.target.value))}
              />
            </label>

            <label>
              Collection
              <input value={product.collection || ""} onChange={(event) => updateField("collection", event.target.value)} placeholder="Apparel" />
            </label>

            <label>
              Sort Order
              <input
                type="number"
                value={product.sortOrder}
                onChange={(event) => updateField("sortOrder", Number(event.target.value || 0))}
              />
            </label>

            <label>
              Printful ID
              <input value={product.printfulId} disabled />
            </label>

            <label className="admin-settings-toggle">
              <input
                type="checkbox"
                checked={product.active}
                onChange={(event) => updateField("active", event.target.checked)}
              />
              Visible in Portal
            </label>

            <label className="admin-settings-toggle">
              <input
                type="checkbox"
                checked={product.featured}
                onChange={(event) => updateField("featured", event.target.checked)}
              />
              Featured Product
            </label>

            <div className="admin-settings-actions">
              <button className="admin-primary-button" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Product"}
              </button>
              {message && <span>{message}</span>}
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}
