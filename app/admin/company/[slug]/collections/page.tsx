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

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  heroImage: "",
  sortOrder: 0,
  active: true,
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AdminCollectionsPage() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const [company, setCompany] = useState<AdminCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

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

  function updateForm(field: keyof typeof emptyForm, value: string | number | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function createCollection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!slug) return;

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/companies/${slug}/collections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          slug: form.slug || slugify(form.name),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to create collection");
      }

      setForm(emptyForm);
      setMessage("Collection added.");
      loadCompany();
    } catch (error: any) {
      setMessage(error?.message || "Unable to create collection");
    } finally {
      setSaving(false);
    }
  }

  async function updateCollection(collection: AdminCollection, updates: Partial<AdminCollection>) {
    setMessage("");

    try {
      const response = await fetch(`/api/admin/collections/${collection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...collection, ...updates }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to update collection");
      }

      setCompany((current) => {
        if (!current) return current;
        return {
          ...current,
          collections: (current.collections || []).map((item) => (item.id === collection.id ? data : item)),
        };
      });
      setMessage("Collection updated.");
    } catch (error: any) {
      setMessage(error?.message || "Unable to update collection");
    }
  }

  async function deleteCollection(collection: AdminCollection) {
    const confirmed = window.confirm(`Delete collection ${collection.name}? Products assigned to this collection will keep their text label until changed.`);
    if (!confirmed) return;

    setMessage("");

    try {
      const response = await fetch(`/api/admin/collections/${collection.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to delete collection");
      }

      setCompany((current) => {
        if (!current) return current;
        return {
          ...current,
          collections: (current.collections || []).filter((item) => item.id !== collection.id),
        };
      });
      setMessage("Collection deleted.");
    } catch (error: any) {
      setMessage(error?.message || "Unable to delete collection");
    }
  }

  if (loading) {
    return (
      <main className="admin-page">
        <section className="admin-simple-state">
          <h1>Loading collections...</h1>
        </section>
      </main>
    );
  }

  if (!company) {
    return (
      <main className="admin-page">
        <section className="admin-simple-state">
          <Link href="/admin">← Back to Admin</Link>
          <h1>Company not found</h1>
          {message && <p>{message}</p>}
        </section>
      </main>
    );
  }

  const collections = company.collections || [];

  return (
    <main className="admin-page">
      <section className="admin-company-detail">
        <div className="admin-detail-topbar">
          <Link href={`/admin/company/${company.slug}`}>← Back to {company.name}</Link>
          <Link href={`/portal/${company.slug}`}>Open Portal</Link>
        </div>

        <header className="admin-detail-hero">
          <div className="admin-detail-logo" style={{ borderColor: company.primaryColor }}>
            <span>{company.shortName}</span>
          </div>
          <div>
            <div className="admin-eyebrow">Collection Management</div>
            <h1>{company.shortName} Collections</h1>
            <p>Create and manage collection buckets used to organize products in the client portal.</p>
          </div>
        </header>

        <section className="admin-section">
          <div className="admin-section-heading">
            <div>
              <span>Create Collection</span>
              <h2>Add new</h2>
            </div>
          </div>

          <form className="admin-settings-form" onSubmit={createCollection}>
            <label>
              Name
              <input
                value={form.name}
                onChange={(event) => {
                  updateForm("name", event.target.value);
                  if (!form.slug) updateForm("slug", slugify(event.target.value));
                }}
                placeholder="Closing Gifts"
                required
              />
            </label>

            <label>
              Slug
              <input value={form.slug} onChange={(event) => updateForm("slug", slugify(event.target.value))} placeholder="closing-gifts" />
            </label>

            <label>
              Sort Order
              <input type="number" value={form.sortOrder} onChange={(event) => updateForm("sortOrder", Number(event.target.value || 0))} />
            </label>

            <label className="admin-settings-toggle">
              <input type="checkbox" checked={form.active} onChange={(event) => updateForm("active", event.target.checked)} />
              Active
            </label>

            <label className="admin-settings-wide">
              Description
              <textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} />
            </label>

            <label className="admin-settings-wide">
              Hero Image URL
              <input value={form.heroImage} onChange={(event) => updateForm("heroImage", event.target.value)} />
            </label>

            <div className="admin-settings-actions">
              <button className="admin-primary-button" type="submit" disabled={saving}>{saving ? "Adding..." : "Add Collection"}</button>
              {message && <span>{message}</span>}
            </div>
          </form>
        </section>

        <section className="admin-section">
          <div className="admin-section-heading">
            <div>
              <span>Collections</span>
              <h2>{collections.length} total</h2>
            </div>
          </div>

          <div className="admin-collection-list">
            {collections.map((collection) => (
              <article key={collection.id} className="admin-collection-row">
                <div>
                  <strong>{collection.name}</strong>
                  <span>{collection.slug} · Sort {collection.sortOrder} · {collection.active ? "Active" : "Hidden"}</span>
                </div>
                <button onClick={() => updateCollection(collection, { active: !collection.active })}>{collection.active ? "Hide" : "Show"}</button>
                <button onClick={() => deleteCollection(collection)}>Delete</button>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
