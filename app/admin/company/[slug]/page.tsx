"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type AdminProduct = { id:number; printfulId:string; name:string; thumbnail?:string|null; price?:number|null; collection?:string|null; featured:boolean; active:boolean };
type AdminRequest = { id:number; type:string; title:string; description?:string|null; priority:string; status:string; createdAt:string; updatedAt:string };
type AdminCompanyDetail = { id:number; name:string; slug:string; shortName:string; logo?:string|null; primaryColor:string; secondaryColor:string; heroTitle:string; heroText:string; portalPassword?:string; portalEnabled:boolean; printfulTokenEnv?:string|null; products?:AdminProduct[]; collections?:unknown[]; packages?:unknown[]; assets?:unknown[]; requests?:AdminRequest[]; orders?:unknown[] };

function formatPrice(value?: number | null) { return value ? `$${Number(value).toFixed(2)}` : "—"; }

export default function AdminCompanyPage() {
  const router = useRouter();
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const [company, setCompany] = useState<AdminCompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");

  function updateCompanyField<K extends keyof AdminCompanyDetail>(field: K, value: AdminCompanyDetail[K]) { setCompany((current) => current ? { ...current, [field]: value } : current); }
  function loadCompany() {
    if (!slug) return;
    setLoading(true); setError("");
    fetch(`/api/admin/companies/${slug}`, { cache: "no-store" })
      .then((response) => { if (!response.ok) throw new Error("Company not found"); return response.json(); })
      .then(setCompany)
      .catch((err) => setError(err?.message || "Unable to load company"))
      .finally(() => setLoading(false));
  }
  useEffect(() => { loadCompany(); }, [slug]);

  async function handleSaveCompany(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!company || !slug) return;
    setSaving(true); setSaveMessage("");
    try {
      const response = await fetch(`/api/admin/companies/${slug}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ name:company.name, slug:company.slug, shortName:company.shortName, logo:company.logo||"", primaryColor:company.primaryColor, secondaryColor:company.secondaryColor, heroTitle:company.heroTitle, heroText:company.heroText, portalPassword:company.portalPassword||"", printfulTokenEnv:company.printfulTokenEnv||"", portalEnabled:company.portalEnabled }) });
      const data = await response.json(); if (!response.ok) throw new Error(data?.error || "Unable to save company");
      setCompany((current) => current ? ({ ...current, ...data }) : current); setSaveMessage("Company settings saved.");
      if (data.slug && data.slug !== slug) router.replace(`/admin/company/${data.slug}`);
    } catch (err:any) { setSaveMessage(err?.message || "Unable to save company"); } finally { setSaving(false); }
  }

  async function handleDeleteCompany() {
    if (!company || !slug || !window.confirm(`Delete ${company.name}? This will remove this client and related data.`)) return;
    setDeleting(true); setDeleteMessage("");
    try { const response = await fetch(`/api/admin/companies/${slug}`, { method:"DELETE" }); const data = await response.json(); if (!response.ok) throw new Error(data?.error || "Unable to delete company"); router.push("/admin"); }
    catch (err:any) { setDeleteMessage(err?.message || "Unable to delete company"); } finally { setDeleting(false); }
  }

  async function handleSyncProducts() {
    if (!company) return; setSyncing(true); setSyncMessage("");
    try { const response = await fetch(`/api/admin/companies/${company.slug}/sync-products`, { method:"POST" }); const data = await response.json(); if (!response.ok) throw new Error(data?.error || "Unable to sync products"); setSyncMessage(`Synced ${data.synced || 0} products.`); loadCompany(); }
    catch (err:any) { setSyncMessage(err?.message || "Unable to sync products"); } finally { setSyncing(false); }
  }

  if (loading) return <main className="admin-page"><section className="admin-simple-state"><Link href="/admin">← Back to Admin</Link><h1>Loading company...</h1></section></main>;
  if (error || !company) return <main className="admin-page"><section className="admin-simple-state"><Link href="/admin">← Back to Admin</Link><h1>Company not found</h1>{error && <p>{error}</p>}</section></main>;

  const tokenEnv = company.printfulTokenEnv || `PRINTFUL_ACCESS_TOKEN_${company.slug.toUpperCase()}`;
  const products = company.products || [];
  const collections = company.collections || [];
  const packageCount = company.packages?.length || 0;
  const requests = company.requests || [];
  const openRequests = requests.filter((request) => !["complete","completed","cancelled","closed"].includes(request.status.toLowerCase()));
  const moduleLinks = [
    { label:"Requests", href:`/admin/company/${company.slug}/requests`, count:openRequests.length },
    { label:"General", href:`/admin/company/${company.slug}` },
    { label:"Catalog", href:`/admin/company/${company.slug}/catalog`, count:products.length },
    { label:"Collections", href:`/admin/company/${company.slug}/collections`, count:collections.length },
    { label:"Packages", href:`/admin/company/${company.slug}/packages`, count:packageCount },
  ];

  return (
    <main className="admin-page">
      <section className="admin-company-detail">
        <div className="admin-detail-topbar"><Link href="/admin">← Back to Admin</Link><Link href={`/portal/${company.slug}`}>Open Portal</Link></div>
        <header className="admin-detail-hero"><div className="admin-detail-logo" style={{borderColor:company.primaryColor}}><img src={company.logo || "/upz-logo.svg"} alt={`${company.name} logo`} /></div><div><div className="admin-eyebrow">Company Settings</div><h1>{company.name}</h1><p>{company.heroText}</p></div></header>
        <nav className="admin-module-tabs" aria-label="Company admin modules">{moduleLinks.map((item) => <Link key={item.label} href={item.href}><span>{item.label}</span>{typeof item.count === "number" && <strong>{item.count}</strong>}</Link>)}</nav>

        <section className="admin-stat-grid">{[["Open Requests",openRequests.length],["Products",products.length],["Collections",collections.length],["Packages",packageCount]].map(([label,value]) => <article key={String(label)} className="admin-stat-card"><span>{label}</span><strong>{value}</strong></article>)}</section>

        <section className="admin-detail-grid admin-company-summary-grid">
          <article className="admin-detail-card"><span>Brand</span><h2>Identity</h2><dl><div><dt>Company</dt><dd>{company.name}</dd></div><div><dt>Short Name</dt><dd>{company.shortName}</dd></div><div><dt>Slug</dt><dd>{company.slug}</dd></div><div><dt>Primary Color</dt><dd><code>{company.primaryColor}</code></dd></div><div><dt>Secondary Color</dt><dd><code>{company.secondaryColor}</code></dd></div><div><dt>Logo</dt><dd>{company.logo || "Default UPZ logo"}</dd></div></dl></article>
          <article className="admin-detail-card"><span>Access</span><h2>Portal Settings</h2><dl><div><dt>Login Username</dt><dd>{company.slug.toUpperCase()}</dd></div><div><dt>Portal URL</dt><dd>/portal/{company.slug}</dd></div><div><dt>Status</dt><dd>{company.portalEnabled ? "Active" : "Disabled"}</dd></div><div><dt>Product API</dt><dd><a href="https://www.printful.com/dashboard" target="_blank" rel="noreferrer">Open Printful Dashboard ↗</a></dd></div><div><dt>API Token</dt><dd><code>{tokenEnv}</code></dd></div></dl></article>
        </section>

        <section className="admin-section">
          <div className="admin-section-heading"><div><span>Editable Settings</span><h2>Company control</h2></div></div>
          <form className="admin-settings-form" onSubmit={handleSaveCompany}>
            <label>Company Name<input value={company.name} onChange={(e) => updateCompanyField("name", e.target.value)} /></label>
            <label>Short Name<input value={company.shortName} onChange={(e) => updateCompanyField("shortName", e.target.value)} /></label>
            <label>Slug / Username<input value={company.slug} onChange={(e) => updateCompanyField("slug", e.target.value)} /></label>
            <label>Logo Path<input value={company.logo || ""} onChange={(e) => updateCompanyField("logo", e.target.value)} placeholder="/rtl-logo.svg" /></label>
            <label>Primary Color<input value={company.primaryColor} onChange={(e) => updateCompanyField("primaryColor", e.target.value)} /></label>
            <label>Secondary Color<input value={company.secondaryColor} onChange={(e) => updateCompanyField("secondaryColor", e.target.value)} /></label>
            <label className="admin-settings-wide">Hero Title<input value={company.heroTitle} onChange={(e) => updateCompanyField("heroTitle", e.target.value)} /></label>
            <label className="admin-settings-wide">Hero Description<textarea value={company.heroText} onChange={(e) => updateCompanyField("heroText", e.target.value)} /></label>
            <label>Portal Password<input value={company.portalPassword || ""} onChange={(e) => updateCompanyField("portalPassword", e.target.value)} /></label>
            <label>Printful Token Env<input value={company.printfulTokenEnv || ""} onChange={(e) => updateCompanyField("printfulTokenEnv", e.target.value)} placeholder={tokenEnv} /></label>
            <label className="admin-settings-toggle"><input type="checkbox" checked={company.portalEnabled} onChange={(e) => updateCompanyField("portalEnabled", e.target.checked)} />Portal Enabled</label>
            <div className="admin-settings-actions"><button className="admin-primary-button" type="submit" disabled={saving}>{saving ? "Saving..." : "Save Company Settings"}</button>{saveMessage && <span>{saveMessage}</span>}</div>
          </form>
        </section>

        <section id="products" className="admin-section">
          <div className="admin-section-heading"><div><span>Products</span><h2>Synced product catalog</h2></div><div className="admin-heading-actions"><a className="admin-secondary-button" href="https://www.printful.com/dashboard" target="_blank" rel="noreferrer">Open Printful ↗</a><button className="admin-primary-button" onClick={handleSyncProducts} disabled={syncing}>{syncing ? "Syncing..." : "Sync Products"}</button></div></div>
          {syncMessage && <p>{syncMessage}</p>}
          {products.length === 0 ? <p>No products synced yet.</p> : <div className="admin-product-list">{products.slice(0,12).map((product) => <article key={product.id} className="admin-product-row"><img src={product.thumbnail || "/placeholder.png"} alt={product.name} /><div><strong>{product.name}</strong><span>{product.collection || "Merchandise"} · {formatPrice(product.price)} · Printful #{product.printfulId}</span><a className="admin-source-link" href="https://www.printful.com/dashboard/sync/products" target="_blank" rel="noreferrer">View source product ↗</a></div><small>{product.active ? "Active" : "Hidden"}</small><Link href={`/admin/product/${product.id}`}>Manage</Link></article>)}</div>}
        </section>

        <section className="admin-section admin-danger-zone"><div className="admin-section-heading"><div><span>Danger Zone</span><h2>Delete client</h2></div><button className="admin-danger-button" onClick={handleDeleteCompany} disabled={deleting}>{deleting ? "Deleting..." : "Delete Client"}</button></div><p>This permanently removes the client portal and related database records.</p>{deleteMessage && <p className="admin-error">{deleteMessage}</p>}</section>
      </section>
    </main>
  );
}
