"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const initialForm = {
  name: "",
  shortName: "",
  slug: "",
  logo: "",
  primaryColor: "#edbf2d",
  secondaryColor: "#010101",
  heroTitle: "",
  heroText: "",
  portalPassword: "",
  printfulTokenEnv: "",
  portalEnabled: true,
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function NewCompanyPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function updateField(field: keyof typeof initialForm, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const slug = form.slug || slugify(form.name);
    const shortName = form.shortName || form.name;

    try {
      const response = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          slug,
          shortName,
          portalPassword: form.portalPassword || `${slug}demo`,
          heroTitle: form.heroTitle || `${shortName} Brand Portal`,
          heroText:
            form.heroText ||
            `Approved merchandise, marketing materials, and brand assets for the ${shortName} team.`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to create company");
      }

      router.push(`/admin/company/${data.slug}`);
    } catch (err: any) {
      setMessage(err?.message || "Unable to create company");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="admin-page">
      <section className="admin-company-detail">
        <div className="admin-detail-topbar">
          <Link href="/admin">← Back to Admin</Link>
        </div>

        <header className="admin-detail-hero">
          <div className="admin-detail-logo" style={{ borderColor: form.primaryColor }}>
            <img src={form.logo || "/upz-logo.svg"} alt="New company preview" />
          </div>
          <div>
            <div className="admin-eyebrow">Generate Portal</div>
            <h1>New Company</h1>
            <p>Create a branded company portal, login, default collections, and admin settings from one form.</p>
          </div>
        </header>

        <section className="admin-section">
          <div className="admin-section-heading">
            <div>
              <span>Company Generator</span>
              <h2>Portal setup</h2>
            </div>
          </div>

          <form className="admin-settings-form" onSubmit={handleSubmit}>
            <label>
              Company Name
              <input
                value={form.name}
                onChange={(event) => {
                  updateField("name", event.target.value);
                  if (!form.slug) updateField("slug", slugify(event.target.value));
                }}
                required
              />
            </label>

            <label>
              Short Name
              <input value={form.shortName} onChange={(event) => updateField("shortName", event.target.value)} />
            </label>

            <label>
              Slug / Username
              <input value={form.slug} onChange={(event) => updateField("slug", slugify(event.target.value))} required />
            </label>

            <label>
              Logo Path
              <input value={form.logo} onChange={(event) => updateField("logo", event.target.value)} placeholder="/client-logo.svg" />
            </label>

            <label>
              Primary Color
              <input value={form.primaryColor} onChange={(event) => updateField("primaryColor", event.target.value)} />
            </label>

            <label>
              Secondary Color
              <input value={form.secondaryColor} onChange={(event) => updateField("secondaryColor", event.target.value)} />
            </label>

            <label className="admin-settings-wide">
              Hero Title
              <input value={form.heroTitle} onChange={(event) => updateField("heroTitle", event.target.value)} placeholder="Client Brand Portal" />
            </label>

            <label className="admin-settings-wide">
              Hero Description
              <textarea value={form.heroText} onChange={(event) => updateField("heroText", event.target.value)} />
            </label>

            <label>
              Portal Password
              <input value={form.portalPassword} onChange={(event) => updateField("portalPassword", event.target.value)} placeholder="clientdemo" />
            </label>

            <label>
              Printful Token Env
              <input value={form.printfulTokenEnv} onChange={(event) => updateField("printfulTokenEnv", event.target.value)} placeholder="PRINTFUL_ACCESS_TOKEN_CLIENT" />
            </label>

            <label className="admin-settings-toggle">
              <input
                type="checkbox"
                checked={form.portalEnabled}
                onChange={(event) => updateField("portalEnabled", event.target.checked)}
              />
              Portal Enabled
            </label>

            <div className="admin-settings-actions">
              <button className="admin-primary-button" type="submit" disabled={saving}>
                {saving ? "Generating..." : "Generate Portal"}
              </button>
              {message && <span>{message}</span>}
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}
