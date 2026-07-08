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

  useEffect(() => {
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
  }, [slug]);

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
