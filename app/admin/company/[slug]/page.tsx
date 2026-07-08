"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type AdminProduct = {
  id: number;
  printfulId: string;
  name: string;
  thumbnail?: string | null;
  price?: number | null;
  collection?: string | null;
  featured: boolean;
  active: boolean;
};

type AdminCompanyDetail = {
  id: number;
  name: string;
  slug: string;
  shortName: string;
  logo?: string | null;
  primaryColor: string;
  secondaryColor: string;
  heroTitle: string;
  heroText: string;
  portalEnabled: boolean;
  printfulTokenEnv?: string | null;
  products?: AdminProduct[];
  collections?: unknown[];
  packages?: unknown[];
  assets?: unknown[];
  requests?: unknown[];
  orders?: unknown[];
};

const defaultModules = [
  "Order Merchandise",
  "Broker Packages",
  "Business Cards",
  "Marketing Materials",
  "Brand Assets",
  "Request Services",
];

function formatPrice(value?: number | null) {
  if (!value) return "—";
  return `$${Number(value).toFixed(2)}`;
}

export default function AdminCompanyPage() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const [company, setCompany] = useState<AdminCompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  function loadCompany() {
    if (!slug) return;

    setLoading(true);
    setError("");

    fetch(`/api/admin/companies/${slug}`)
      .then((response) => {
        if (!response.ok) throw new Error("Company not found");
        return response.json();
      })
      .then((data) => setCompany(data))
      .catch((err) => setError(err?.message || "Unable to load company"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCompany();
  }, [slug]);

  async function handleSyncProducts() {
    if (!company) return;

    setSyncing(true);
    setSyncMessage("");

    try {
      const response = await fetch(`/api/admin/companies/${company.slug}/sync-products`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to sync products");
      }

      setSyncMessage(`Synced ${data.synced || 0} products from Printful.`);
      loadCompany();
    } catch (err: any) {
      setSyncMessage(err?.message || "Unable to sync products");
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <main className="admin-page">
        <section className="admin-simple-state">
          <Link href="/admin">← Back to Admin</Link>
          <h1>Loading company...</h1>
        </section>
      </main>
    );
  }

  if (error || !company) {
    return (
      <main className="admin-page">
        <section className="admin-simple-state">
          <Link href="/admin">← Back to Admin</Link>
          <h1>Company not found</h1>
          {error && <p>{error}</p>}
        </section>
      </main>
    );
  }

  const tokenEnv = company.printfulTokenEnv || `PRINTFUL_ACCESS_TOKEN_${company.slug.toUpperCase()}`;
  const products = company.products || [];

  return (
    <main className="admin-page">
      <section className="admin-company-detail">
        <div className="admin-detail-topbar">
          <Link href="/admin">← Back to Admin</Link>
          <Link href={`/portal/${company.slug}`}>Open Portal</Link>
        </div>

        <header className="admin-detail-hero">
          <div className="admin-detail-logo" style={{ borderColor: company.primaryColor }}>
            <img src={company.logo || "/upz-logo.svg"} alt={`${company.name} logo`} />
          </div>
          <div>
            <div className="admin-eyebrow">Company Settings</div>
            <h1>{company.name}</h1>
            <p>{company.heroText}</p>
          </div>
        </header>

        <section className="admin-stat-grid">
          {[
            ["Products", products.length],
            ["Packages", company.packages?.length || 0],
            ["Assets", company.assets?.length || 0],
            ["Requests", company.requests?.length || 0],
          ].map(([label, value]) => (
            <article key={String(label)} className="admin-stat-card">
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </section>

        <section className="admin-detail-grid">
          <article className="admin-detail-card">
            <span>Brand</span>
            <h2>Identity</h2>
            <dl>
              <div><dt>Company</dt><dd>{company.name}</dd></div>
              <div><dt>Short Name</dt><dd>{company.shortName}</dd></div>
              <div><dt>Slug</dt><dd>{company.slug}</dd></div>
              <div><dt>Primary Color</dt><dd><code>{company.primaryColor}</code></dd></div>
              <div><dt>Secondary Color</dt><dd><code>{company.secondaryColor}</code></dd></div>
              <div><dt>Logo</dt><dd>{company.logo || "Default UPZ logo"}</dd></div>
            </dl>
          </article>

          <article className="admin-detail-card">
            <span>Access</span>
            <h2>Portal</h2>
            <dl>
              <div><dt>Login Username</dt><dd>{company.slug.toUpperCase()}</dd></div>
              <div><dt>Password</dt><dd>Stored in database settings</dd></div>
              <div><dt>Portal URL</dt><dd>/portal/{company.slug}</dd></div>
              <div><dt>Printful Token</dt><dd><code>{tokenEnv}</code></dd></div>
              <div><dt>Status</dt><dd>{company.portalEnabled ? "Active" : "Disabled"}</dd></div>
            </dl>
          </article>

          <article className="admin-detail-card admin-detail-wide">
            <span>Portal Content</span>
            <h2>Modules</h2>
            <div className="admin-chip-grid">
              {defaultModules.map((module) => <div key={module}>{module}</div>)}
            </div>
          </article>
        </section>

        <section className="admin-section">
          <div className="admin-section-heading">
            <div>
              <span>Products</span>
              <h2>Synced product catalog</h2>
            </div>
            <button className="admin-primary-button" onClick={handleSyncProducts} disabled={syncing}>
              {syncing ? "Syncing..." : "Sync Printful Products"}
            </button>
          </div>

          {syncMessage && <p>{syncMessage}</p>}

          {products.length === 0 ? (
            <p>No products synced yet. Use the sync button to pull this company’s Printful catalog into the database.</p>
          ) : (
            <div className="admin-product-list">
              {products.slice(0, 12).map((product) => (
                <article key={product.id} className="admin-product-row">
                  <img src={product.thumbnail || "/placeholder.png"} alt={product.name} />
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.collection || "Merchandise"} · {formatPrice(product.price)} · Printful #{product.printfulId}</span>
                  </div>
                  <small>{product.active ? "Active" : "Hidden"}</small>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="admin-next-grid">
          {[
            ["Packages", "Build company-specific broker kits and onboarding packages from synced products."],
            ["Assets", "Upload logos, brand guides, templates, email signatures, and client downloads."],
            ["Requests", "View and manage project requests submitted from this client portal."],
          ].map(([title, text]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
              <button>Build Next</button>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
