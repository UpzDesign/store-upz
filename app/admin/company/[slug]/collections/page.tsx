"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type AdminCollection = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  heroImage?: string | null;
  sortOrder: number;
  active: boolean;
};

type AdminCompany = {
  id: number;
  name: string;
  slug: string;
  shortName: string;
  primaryColor: string;
  collections?: AdminCollection[];
};

type CollectionForm = {
  id: number;
  name: string;
  slug: string;
  description: string;
  heroImage: string;
  sortOrder: number;
  active: boolean;
};

const emptyForm: CollectionForm = { id: 0, name: "", slug: "", description: "", heroImage: "", sortOrder: 0, active: true };

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function collectionToForm(collection: AdminCollection): CollectionForm {
  return {
    id: collection.id,
    name: collection.name,
    slug: collection.slug,
    description: collection.description || "",
    heroImage: collection.heroImage || "",
    sortOrder: collection.sortOrder || 0,
    active: collection.active,
  };
}

export default function AdminCollectionsPage() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const [company, setCompany] = useState<AdminCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<CollectionForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const isEditing = form.id > 0;

  function loadCompany() {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/admin/companies/${slug}`)
      .then((response) => {
        if (!response.ok) throw new Error("Company not found");
        return response.json();
      })
      .then((data) => setCompany(data))
      .catch((error) => setMessage(error?.message || "Unable to load collections"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCompany();
  }, [slug]);

  function updateForm(field: keyof CollectionForm, value: string | number | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setMessage("");
  }

  async function saveCollection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!slug) return;
    setSaving(true);
    setMessage("");

    const payload = { ...form, slug: form.slug || slugify(form.name) };

    try {
      const response = await fetch(isEditing ? `/api/admin/collections/${form.id}` : `/api/admin/companies/${slug}/collections`, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Unable to save collection");
      setMessage(isEditing ? "Collection updated." : "Collection added.");
      setForm(emptyForm);
      loadCompany();
    } catch (error: any) {
      setMessage(error?.message || "Unable to save collection");
    } finally {
      setSaving(false);
    }
  }

  async function quickUpdateCollection(collection: AdminCollection, updates: Partial<AdminCollection>) {
    setMessage("");
    try {
      const response = await fetch(`/api/admin/collections/${collection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...collection, ...updates }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Unable to update collection");
      setCompany((current) => current ? { ...current, collections: (current.collections || []).map((item) => item.id === collection.id ? data : item) } : current);
      setMessage("Collection updated.");
    } catch (error: any) {
      setMessage(error?.message || "Unable to update collection");
    }
  }

  async function deleteCollection(collection: AdminCollection) {
    if (!window.confirm(`Delete collection ${collection.name}? Items assigned to it will become unassigned.`)) return;
    setMessage("");
    try {
      const response = await fetch(`/api/admin/collections/${collection.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Unable to delete collection");
      setCompany((current) => current ? { ...current, collections: (current.collections || []).filter((item) => item.id !== collection.id) } : current);
      setMessage("Collection deleted.");
    } catch (error: any) {
      setMessage(error?.message || "Unable to delete collection");
    }
  }

  if (loading) return <main className="admin-page"><section className="admin-simple-state"><h1>Loading collections...</h1></section></main>;
  if (!company) return <main className="admin-page"><section className="admin-simple-state"><Link href="/admin">← Back to Admin</Link><h1>Company not found</h1>{message && <p>{message}</p>}</section></main>;

  const collections = company.collections || [];

  return (
    <main className="admin-page">
      <section className="admin-company-detail">
        <div className="admin-detail-topbar"><Link href={`/admin/company/${company.slug}`}>← Back to {company.name}</Link><Link href={`/portal/${company.slug}`}>Open Portal</Link></div>
        <header className="admin-detail-hero"><div className="admin-detail-logo" style={{ borderColor: company.primaryColor }}><span>{company.shortName}</span></div><div><div className="admin-eyebrow">Collection Management</div><h1>{company.shortName} Collections</h1><p>Create and manage the major portal sections clients use to browse products, services, downloads, and packages.</p></div></header>

        <section className="admin-section">
          <div className="admin-section-heading"><div><span>{isEditing ? "Edit Collection" : "Create Collection"}</span><h2>{isEditing ? "Update section" : "Add new"}</h2></div>{isEditing && <button type="button" className="admin-muted-button" onClick={resetForm}>Cancel Edit</button>}</div>
          <form className="admin-settings-form" onSubmit={saveCollection}>
            <label>Name<input value={form.name} onChange={(event) => { updateForm("name", event.target.value); if (!form.slug) updateForm("slug", slugify(event.target.value)); }} placeholder="Marketing Services" required /></label>
            <label>Slug<input value={form.slug} onChange={(event) => updateForm("slug", slugify(event.target.value))} placeholder="marketing-services" /></label>
            <label>Sort Order<input type="number" value={form.sortOrder} onChange={(event) => updateForm("sortOrder", Number(event.target.value || 0))} /></label>
            <label className="admin-settings-toggle"><input type="checkbox" checked={form.active} onChange={(event) => updateForm("active", event.target.checked)} />Active</label>
            <label className="admin-settings-wide">Description<textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} placeholder="Describe what this collection contains." /></label>
            <label className="admin-settings-wide">Hero Image URL<input value={form.heroImage} onChange={(event) => updateForm("heroImage", event.target.value)} placeholder="/collections/marketing.jpg" /></label>
            <div className="admin-settings-actions"><button className="admin-primary-button" type="submit" disabled={saving}>{saving ? "Saving..." : isEditing ? "Save Collection" : "Add Collection"}</button>{message && <span>{message}</span>}</div>
          </form>
        </section>

        <section className="admin-section">
          <div className="admin-section-heading"><div><span>Collections</span><h2>{collections.length} total</h2></div></div>
          <div className="admin-collection-list">
            {collections.map((collection) => <article key={collection.id} className="admin-collection-row"><div>{collection.heroImage && <img className="admin-collection-thumb" src={collection.heroImage} alt="" />}<strong>{collection.name}</strong><span>{collection.slug} · Sort {collection.sortOrder} · {collection.active ? "Active" : "Hidden"}</span>{collection.description && <p>{collection.description}</p>}</div><button onClick={() => setForm(collectionToForm(collection))}>Edit</button><button onClick={() => quickUpdateCollection(collection, { active: !collection.active })}>{collection.active ? "Hide" : "Show"}</button><button onClick={() => deleteCollection(collection)}>Delete</button></article>)}
          </div>
        </section>
      </section>
    </main>
  );
}
