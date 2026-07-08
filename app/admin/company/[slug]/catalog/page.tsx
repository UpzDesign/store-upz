"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type CatalogItem = {
  id: number;
  title: string;
  itemType: string;
  sourceVendor?: string | null;
  sourceProductId?: string | null;
  thumbnail?: string | null;
  price?: number | null;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  collection?: {
    name: string;
    slug: string;
  } | null;
  product?: {
    id: number;
  } | null;
};

const emptyForm = {
  title: "",
  itemType: "service",
  description: "",
  thumbnail: "",
  price: "",
  sku: "",
  sortOrder: 0,
  active: true,
  featured: false,
};

function formatPrice(value?: number | null) {
  if (!value) return "—";
  return `$${Number(value).toFixed(2)}`;
}

export default function AdminCatalogPage() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function loadItems() {
    if (!slug) return;

    setLoading(true);
    fetch(`/api/admin/companies/${slug}/catalog-items`)
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load catalog items");
        return response.json();
      })
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((error) => setMessage(error?.message || "Unable to load catalog items"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadItems();
  }, [slug]);

  function updateForm(field: keyof typeof emptyForm, value: string | number | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function createManualItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!slug) return;

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/companies/${slug}/catalog-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to create catalog item");
      }

      setForm(emptyForm);
      setMessage("Catalog item added.");
      loadItems();
    } catch (error: any) {
      setMessage(error?.message || "Unable to create catalog item");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="admin-page">
      <section className="admin-company-detail">
        <div className="admin-detail-topbar">
          <Link href={`/admin/company/${slug}`}>← Back to Company</Link>
          <Link href={`/portal/${slug}`}>Open Portal</Link>
        </div>

        <header className="admin-detail-hero">
          <div className="admin-detail-logo">
            <span>CAT</span>
          </div>
          <div>
            <div className="admin-eyebrow">Unified Catalog</div>
            <h1>Catalog Items</h1>
            <p>Vendor-agnostic items for products, services, digital files, manual offers, and future API integrations.</p>
          </div>
        </header>

        <section className="admin-section">
          <div className="admin-section-heading">
            <div>
              <span>Manual Item</span>
              <h2>Add service or custom item</h2>
            </div>
          </div>

          <form className="admin-settings-form" onSubmit={createManualItem}>
            <label className="admin-settings-wide">
              Title
              <input value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="Property Photography" required />
            </label>

            <label>
              Type
              <select value={form.itemType} onChange={(event) => updateForm("itemType", event.target.value)}>
                <option value="service">Service</option>
                <option value="product">Product</option>
                <option value="digital">Digital</option>
                <option value="asset">Asset</option>
                <option value="custom">Custom</option>
              </select>
            </label>

            <label>
              Price
              <input type="number" step="0.01" value={form.price} onChange={(event) => updateForm("price", event.target.value)} placeholder="450" />
            </label>

            <label>
              SKU / Code
              <input value={form.sku} onChange={(event) => updateForm("sku", event.target.value)} placeholder="PHOTO-001" />
            </label>

            <label>
              Sort Order
              <input type="number" value={form.sortOrder} onChange={(event) => updateForm("sortOrder", Number(event.target.value || 0))} />
            </label>

            <label className="admin-settings-wide">
              Thumbnail URL
              <input value={form.thumbnail} onChange={(event) => updateForm("thumbnail", event.target.value)} placeholder="/services/photo.jpg" />
            </label>

            <label className="admin-settings-wide">
              Description
              <textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} />
            </label>

            <label className="admin-settings-toggle">
              <input type="checkbox" checked={form.active} onChange={(event) => updateForm("active", event.target.checked)} />
              Active
            </label>

            <label className="admin-settings-toggle">
              <input type="checkbox" checked={form.featured} onChange={(event) => updateForm("featured", event.target.checked)} />
              Featured
            </label>

            <div className="admin-settings-actions">
              <button className="admin-primary-button" type="submit" disabled={saving}>{saving ? "Adding..." : "Add Catalog Item"}</button>
              {message && <span>{message}</span>}
            </div>
          </form>
        </section>

        <section className="admin-section">
          <div className="admin-section-heading">
            <div>
              <span>Catalog Items</span>
              <h2>{loading ? "Loading" : `${items.length} total`}</h2>
            </div>
          </div>

          {message && <p className="admin-error">{message}</p>}

          <div className="admin-product-list">
            {items.map((item) => (
              <article key={item.id} className="admin-product-row">
                <img src={item.thumbnail || "/placeholder.png"} alt={item.title} />
                <div>
                  <strong>{item.title}</strong>
                  <span>
                    {item.itemType} · {item.collection?.name || "Unassigned"} · {formatPrice(item.price)} · {item.sourceVendor || "manual"}
                  </span>
                </div>
                <small>{item.active ? "Active" : "Hidden"}</small>
                {item.product?.id ? <Link href={`/admin/product/${item.product.id}`}>Manage</Link> : <span>Manual</span>}
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
