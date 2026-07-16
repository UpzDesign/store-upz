"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type CatalogItem = { id: number; title: string; itemType: string; price?: number | null; thumbnail?: string | null; sourceVendor?: string | null };
type PackageItem = { id?: number; catalogItemId?: number | null; quantity: number; catalogItem?: CatalogItem | null };
type Package = { id: number; title: string; description?: string | null; featured: boolean; active: boolean; sortOrder: number; items: PackageItem[] };
type FormState = { id: number; title: string; description: string; featured: boolean; active: boolean; sortOrder: number; items: Array<{ catalogItemId: number; quantity: number }> };

const emptyForm: FormState = { id: 0, title: "", description: "", featured: false, active: true, sortOrder: 0, items: [] };

export default function PackagesPage() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const [packages, setPackages] = useState<Package[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    if (!slug) return;
    fetch(`/api/admin/companies/${slug}/packages`)
      .then((r) => r.json())
      .then((data) => {
        setPackages(Array.isArray(data?.packages) ? data.packages : []);
        setCatalogItems(Array.isArray(data?.catalogItems) ? data.catalogItems : []);
      })
      .catch(() => setMessage("Unable to load packages"));
  }

  useEffect(() => { load(); }, [slug]);

  function toggleItem(id: number) {
    setForm((current) => {
      const exists = current.items.some((item) => item.catalogItemId === id);
      return { ...current, items: exists ? current.items.filter((item) => item.catalogItemId !== id) : [...current.items, { catalogItemId: id, quantity: 1 }] };
    });
  }

  function updateQty(id: number, quantity: number) {
    setForm((current) => ({ ...current, items: current.items.map((item) => item.catalogItemId === id ? { ...item, quantity: Math.max(1, quantity || 1) } : item) }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!slug) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(form.id ? `/api/admin/packages/${form.id}` : `/api/admin/companies/${slug}/packages`, {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Unable to save package");
      setForm(emptyForm);
      setMessage("Package saved.");
      load();
    } catch (error: any) {
      setMessage(error?.message || "Unable to save package");
    } finally {
      setSaving(false);
    }
  }

  function editPackage(pkg: Package) {
    setForm({ id: pkg.id, title: pkg.title, description: pkg.description || "", featured: pkg.featured, active: pkg.active, sortOrder: pkg.sortOrder, items: pkg.items.filter((item) => item.catalogItemId).map((item) => ({ catalogItemId: Number(item.catalogItemId), quantity: item.quantity })) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removePackage(pkg: Package) {
    if (!window.confirm(`Delete ${pkg.title}?`)) return;
    const response = await fetch(`/api/admin/packages/${pkg.id}`, { method: "DELETE" });
    if (response.ok) load();
  }

  const estimatedTotal = form.items.reduce((sum, selected) => {
    const item = catalogItems.find((entry) => entry.id === selected.catalogItemId);
    return sum + Number(item?.price || 0) * selected.quantity;
  }, 0);

  return (
    <main className="admin-page"><section className="admin-company-detail">
      <div className="admin-detail-topbar"><Link href={`/admin/company/${slug}`}>← Back to Company</Link><Link href={`/portal/${slug}`}>Open Portal</Link></div>
      <header className="admin-detail-hero"><div className="admin-detail-logo"><span>PKG</span></div><div><div className="admin-eyebrow">Package Builder</div><h1>Packages</h1><p>Combine services, merchandise, and digital items into one client offer.</p></div></header>

      <section className="admin-section">
        <div className="admin-section-heading"><div><span>{form.id ? "Edit Package" : "Create Package"}</span><h2>{form.id ? "Update offer" : "Build a new offer"}</h2></div>{form.id > 0 && <button className="admin-muted-button" onClick={() => setForm(emptyForm)}>Cancel</button>}</div>
        <form className="admin-settings-form" onSubmit={save}>
          <label className="admin-settings-wide">Package Name<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
          <label className="admin-settings-wide">Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label>Sort Order<input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value || 0) })} /></label>
          <label className="admin-settings-toggle"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />Active</label>
          <label className="admin-settings-toggle"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />Featured</label>
          <div className="admin-settings-wide"><div className="admin-section-heading"><div><span>Included Items</span><h2>Choose catalog items</h2></div><strong>${estimatedTotal.toFixed(2)}</strong></div><div className="admin-package-item-grid">{catalogItems.map((item) => { const selected = form.items.find((entry) => entry.catalogItemId === item.id); return <article key={item.id} className={selected ? "is-selected" : ""}><label><input type="checkbox" checked={Boolean(selected)} onChange={() => toggleItem(item.id)} /><span><strong>{item.title}</strong><small>{item.itemType} · ${Number(item.price || 0).toFixed(2)}</small></span></label>{selected && <input type="number" min="1" value={selected.quantity} onChange={(e) => updateQty(item.id, Number(e.target.value))} />}</article>; })}</div></div>
          <div className="admin-settings-actions"><button className="admin-primary-button" disabled={saving}>{saving ? "Saving..." : form.id ? "Save Package" : "Create Package"}</button>{message && <span>{message}</span>}</div>
        </form>
      </section>

      <section className="admin-section"><div className="admin-section-heading"><div><span>Packages</span><h2>{packages.length} total</h2></div></div><div className="admin-package-list">{packages.map((pkg) => <article key={pkg.id}><div><strong>{pkg.title}</strong><span>{pkg.items.length} items · {pkg.featured ? "Featured" : "Standard"} · {pkg.active ? "Active" : "Hidden"}</span><p>{pkg.description}</p></div><button onClick={() => editPackage(pkg)}>Edit</button><button className="admin-danger-mini" onClick={() => removePackage(pkg)}>Delete</button></article>)}</div></section>
    </section></main>
  );
}
