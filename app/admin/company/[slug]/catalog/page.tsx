"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Collection = {
  id: number;
  name: string;
  slug: string;
  active: boolean;
};

type CatalogItem = {
  id: number;
  title: string;
  description?: string | null;
  itemType: string;
  sourceVendor?: string | null;
  sourceProductId?: string | null;
  thumbnail?: string | null;
  price?: number | null;
  sku?: string | null;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  collectionId?: number | null;
  collection?: Collection | null;
  product?: {
    id: number;
  } | null;
};

const emptyForm = {
  id: 0,
  title: "",
  itemType: "service",
  collectionId: "",
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

function itemToForm(item: CatalogItem) {
  return {
    id: item.id,
    title: item.title || "",
    itemType: item.itemType || "service",
    collectionId: item.collectionId ? String(item.collectionId) : item.collection?.id ? String(item.collection.id) : "",
    description: item.description || "",
    thumbnail: item.thumbnail || "",
    price: item.price === null || item.price === undefined ? "" : String(item.price),
    sku: item.sku || "",
    sortOrder: item.sortOrder || 0,
    active: item.active,
    featured: item.featured,
  };
}

function itemPayload(item: CatalogItem, updates: Partial<CatalogItem>) {
  return {
    title: item.title,
    itemType: item.itemType,
    collectionId: item.collectionId || item.collection?.id || "",
    description: item.description || "",
    thumbnail: item.thumbnail || "",
    price: item.price ?? "",
    sku: item.sku || "",
    sortOrder: item.sortOrder,
    active: item.active,
    featured: item.featured,
    ...updates,
  };
}

export default function AdminCatalogPage() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [collectionFilter, setCollectionFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkCollectionId, setBulkCollectionId] = useState("");

  const isEditing = form.id > 0;

  function loadItems() {
    if (!slug) return;

    setLoading(true);
    Promise.all([
      fetch(`/api/admin/companies/${slug}/catalog-items`).then((response) => {
        if (!response.ok) throw new Error("Unable to load catalog items");
        return response.json();
      }),
      fetch(`/api/admin/companies/${slug}`).then((response) => {
        if (!response.ok) throw new Error("Unable to load company collections");
        return response.json();
      }),
    ])
      .then(([catalogItems, company]) => {
        setItems(Array.isArray(catalogItems) ? catalogItems : []);
        setCollections(Array.isArray(company?.collections) ? company.collections : []);
      })
      .catch((error) => setMessage(error?.message || "Unable to load catalog items"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadItems();
  }, [slug]);

  function updateForm(field: keyof typeof emptyForm, value: string | number | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setMessage("");
  }

  async function saveItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!slug) return;

    setSaving(true);
    setMessage("");

    const payload = {
      title: form.title,
      itemType: form.itemType,
      collectionId: form.collectionId,
      description: form.description,
      thumbnail: form.thumbnail,
      price: form.price,
      sku: form.sku,
      sortOrder: form.sortOrder,
      active: form.active,
      featured: form.featured,
    };

    try {
      const response = await fetch(
        isEditing ? `/api/admin/catalog-items/${form.id}` : `/api/admin/companies/${slug}/catalog-items`,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();

      if (!response.ok) throw new Error(data?.error || "Unable to save catalog item");

      setMessage(isEditing ? "Catalog item updated." : "Catalog item added.");
      resetForm();
      loadItems();
    } catch (error: any) {
      setMessage(error?.message || "Unable to save catalog item");
    } finally {
      setSaving(false);
    }
  }

  async function patchItem(item: CatalogItem, updates: Partial<CatalogItem>) {
    setMessage("");

    try {
      const response = await fetch(`/api/admin/catalog-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemPayload(item, updates)),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data?.error || "Unable to update catalog item");

      setItems((current) => current.map((entry) => (entry.id === item.id ? data : entry)));
      setMessage("Catalog item updated.");
    } catch (error: any) {
      setMessage(error?.message || "Unable to update catalog item");
    }
  }

  async function deleteItem(item: CatalogItem) {
    const confirmed = window.confirm(`Delete ${item.title}? This removes the item from the catalog and any packages that use it.`);
    if (!confirmed) return;

    setMessage("");

    try {
      const response = await fetch(`/api/admin/catalog-items/${item.id}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) throw new Error(data?.error || "Unable to delete catalog item");

      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setSelectedIds((current) => current.filter((id) => id !== item.id));
      setMessage("Catalog item deleted.");
    } catch (error: any) {
      setMessage(error?.message || "Unable to delete catalog item");
    }
  }

  async function duplicateItem(item: CatalogItem) {
    if (!slug) return;

    setMessage("");

    try {
      const response = await fetch(`/api/admin/companies/${slug}/catalog-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${item.title} Copy`,
          itemType: item.itemType,
          collectionId: item.collectionId || item.collection?.id || "",
          description: item.description || "",
          thumbnail: item.thumbnail || "",
          price: item.price ?? "",
          sku: item.sku ? `${item.sku}-COPY` : "",
          sortOrder: item.sortOrder + 1,
          active: false,
          featured: false,
        }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data?.error || "Unable to duplicate catalog item");

      setItems((current) => [...current, data]);
      setMessage("Catalog item duplicated as hidden.");
    } catch (error: any) {
      setMessage(error?.message || "Unable to duplicate catalog item");
    }
  }

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesQuery = !normalizedQuery || [item.title, item.description, item.sku, item.sourceVendor, item.collection?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
      const matchesType = typeFilter === "all" || item.itemType === typeFilter;
      const itemCollection = item.collectionId || item.collection?.id || "unassigned";
      const matchesCollection = collectionFilter === "all" || String(itemCollection) === collectionFilter;
      return matchesQuery && matchesType && matchesCollection;
    });
  }, [items, query, typeFilter, collectionFilter]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(item.id)),
    [items, selectedIds]
  );

  function toggleSelected(id: number) {
    setSelectedIds((current) => current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]);
  }

  function selectVisibleItems() {
    setSelectedIds(filteredItems.map((item) => item.id));
  }

  async function bulkPatch(updates: Partial<CatalogItem>, successMessage: string) {
    if (selectedItems.length === 0) return;

    setSaving(true);
    setMessage("");

    try {
      await Promise.all(
        selectedItems.map((item) =>
          fetch(`/api/admin/catalog-items/${item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(itemPayload(item, updates)),
          }).then(async (response) => {
            if (!response.ok) {
              const data = await response.json().catch(() => null);
              throw new Error(data?.error || "Unable to update catalog items");
            }
            return response.json();
          })
        )
      );

      setMessage(successMessage);
      setSelectedIds([]);
      loadItems();
    } catch (error: any) {
      setMessage(error?.message || "Unable to update catalog items");
    } finally {
      setSaving(false);
    }
  }

  async function bulkDelete() {
    if (selectedItems.length === 0) return;

    const confirmed = window.confirm(`Delete ${selectedItems.length} selected catalog items?`);
    if (!confirmed) return;

    setSaving(true);
    setMessage("");

    try {
      await Promise.all(
        selectedItems.map((item) =>
          fetch(`/api/admin/catalog-items/${item.id}`, { method: "DELETE" }).then(async (response) => {
            if (!response.ok) {
              const data = await response.json().catch(() => null);
              throw new Error(data?.error || "Unable to delete catalog items");
            }
            return response.json();
          })
        )
      );

      setMessage("Selected catalog items deleted.");
      setSelectedIds([]);
      loadItems();
    } catch (error: any) {
      setMessage(error?.message || "Unable to delete catalog items");
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
            <h1>Catalog Manager</h1>
            <p>Manage products, services, digital files, manual offers, and future API integrations in one place.</p>
          </div>
        </header>

        <section className="admin-section">
          <div className="admin-section-heading">
            <div>
              <span>{isEditing ? "Edit Item" : "Manual Item"}</span>
              <h2>{isEditing ? "Update catalog item" : "Add service or custom item"}</h2>
            </div>
            {isEditing && <button className="admin-muted-button" onClick={resetForm}>Cancel Edit</button>}
          </div>

          <form className="admin-settings-form" onSubmit={saveItem}>
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
              Collection
              <select value={form.collectionId} onChange={(event) => updateForm("collectionId", event.target.value)}>
                <option value="">Unassigned</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>{collection.name}</option>
                ))}
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
              <button className="admin-primary-button" type="submit" disabled={saving}>{saving ? "Saving..." : isEditing ? "Save Catalog Item" : "Add Catalog Item"}</button>
              {message && <span>{message}</span>}
            </div>
          </form>
        </section>

        <section className="admin-section">
          <div className="admin-section-heading">
            <div>
              <span>Catalog Items</span>
              <h2>{loading ? "Loading" : `${filteredItems.length} of ${items.length}`}</h2>
            </div>
          </div>

          <div className="admin-catalog-toolbar">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search catalog..." />
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="all">All Types</option>
              <option value="service">Services</option>
              <option value="product">Products</option>
              <option value="digital">Digital</option>
              <option value="asset">Assets</option>
              <option value="custom">Custom</option>
            </select>
            <select value={collectionFilter} onChange={(event) => setCollectionFilter(event.target.value)}>
              <option value="all">All Collections</option>
              <option value="unassigned">Unassigned</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>{collection.name}</option>
              ))}
            </select>
          </div>

          <div className="admin-bulk-toolbar">
            <button onClick={selectVisibleItems}>Select Visible</button>
            <button onClick={() => setSelectedIds([])}>Clear</button>
            <span>{selectedItems.length} selected</span>
            <button disabled={!selectedItems.length || saving} onClick={() => bulkPatch({ active: true }, "Selected items shown.")}>Show</button>
            <button disabled={!selectedItems.length || saving} onClick={() => bulkPatch({ active: false }, "Selected items hidden.")}>Hide</button>
            <button disabled={!selectedItems.length || saving} onClick={() => bulkPatch({ featured: true }, "Selected items featured.")}>Feature</button>
            <button disabled={!selectedItems.length || saving} onClick={() => bulkPatch({ featured: false }, "Selected items unfeatured.")}>Unfeature</button>
            <select value={bulkCollectionId} onChange={(event) => setBulkCollectionId(event.target.value)}>
              <option value="">Bulk Collection</option>
              <option value="none">Unassigned</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>{collection.name}</option>
              ))}
            </select>
            <button disabled={!selectedItems.length || saving || !bulkCollectionId} onClick={() => bulkPatch({ collectionId: bulkCollectionId === "none" ? null : Number(bulkCollectionId) }, "Selected items reassigned.")}>Apply Collection</button>
            <button className="admin-danger-mini" disabled={!selectedItems.length || saving} onClick={bulkDelete}>Delete</button>
          </div>

          {message && <p className="admin-error">{message}</p>}

          <div className="admin-product-list">
            {filteredItems.map((item) => (
              <article key={item.id} className="admin-catalog-row">
                <label className="admin-row-check">
                  <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelected(item.id)} />
                </label>
                <img src={item.thumbnail || "/placeholder.png"} alt={item.title} />
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.itemType} · {item.collection?.name || "Unassigned"} · {formatPrice(item.price)} · {item.sourceVendor || "manual"}</span>
                  <em>{item.featured ? "Featured" : "Not featured"} · Sort {item.sortOrder}</em>
                </div>
                <select value={item.collectionId || item.collection?.id || ""} onChange={(event) => patchItem(item, { collectionId: event.target.value ? Number(event.target.value) : null })}>
                  <option value="">Unassigned</option>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>{collection.name}</option>
                  ))}
                </select>
                <button onClick={() => patchItem(item, { active: !item.active })}>{item.active ? "Hide" : "Show"}</button>
                <button onClick={() => patchItem(item, { featured: !item.featured })}>{item.featured ? "Unfeature" : "Feature"}</button>
                <button onClick={() => setForm(itemToForm(item))}>Edit</button>
                <button onClick={() => duplicateItem(item)}>Duplicate</button>
                <button className="admin-danger-mini" onClick={() => deleteItem(item)}>Delete</button>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
