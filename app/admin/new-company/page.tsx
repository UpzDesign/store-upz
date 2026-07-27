"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CompanyLogo from "@/components/CompanyLogo";

const initialForm = {
  name: "", shortName: "", slug: "", logo: "", logoType: "image", logoText: "", logoTextColor: "#010101", logoFontStyle: "sans",
  primaryColor: "#edbf2d", secondaryColor: "#010101", heroTitle: "", heroText: "", portalPassword: "", printfulTokenEnv: "", portalEnabled: true,
};

function slugify(value: string) { return value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""); }

export default function NewCompanyPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  function updateField(field: keyof typeof initialForm, value: string | boolean) { setForm((current) => ({ ...current, [field]: value })); }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage("");
    const slug = form.slug || slugify(form.name); const shortName = form.shortName || form.name;
    try {
      const response = await fetch("/api/admin/companies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, slug, shortName, logoText: form.logoText || shortName, portalPassword: form.portalPassword || `${slug}demo`, heroTitle: form.heroTitle || `${shortName} Brand Portal`, heroText: form.heroText || `Approved merchandise, marketing materials, and brand assets for the ${shortName} team.` }) });
      const data = await response.json(); if (!response.ok) throw new Error(data?.error || "Unable to create company");
      router.push(`/admin/company/${data.slug}`);
    } catch (err: any) { setMessage(err?.message || "Unable to create company"); } finally { setSaving(false); }
  }

  const previewCompany = { ...form, shortName: form.shortName || form.name || "NEW CLIENT", logoText: form.logoText || form.shortName || form.name || "NEW CLIENT", name: form.name || "New Client" };

  return <main className="admin-page"><section className="admin-company-detail"><div className="admin-detail-topbar"><Link href="/admin/companies">← Back to Companies</Link></div>
    <header className="admin-detail-hero"><div className="admin-detail-logo" style={{ borderColor: form.primaryColor }}><CompanyLogo company={previewCompany}/></div><div><div className="admin-eyebrow">Client Registration</div><h1>New Client</h1><p>Create the client profile, branding, portal access, and optional integrations from one form.</p></div></header>
    <section className="admin-section"><div className="admin-section-heading"><div><span>Step 1</span><h2>Company information</h2></div></div>
      <form className="admin-settings-form" onSubmit={handleSubmit}>
        <label>Company Name<input value={form.name} onChange={(e)=>{updateField("name",e.target.value);if(!form.slug)updateField("slug",slugify(e.target.value));}} required/></label>
        <label>Short Name<input value={form.shortName} onChange={(e)=>updateField("shortName",e.target.value)} placeholder="Used in compact areas"/></label>
        <label>Portal Slug / Username<input value={form.slug} onChange={(e)=>updateField("slug",slugify(e.target.value))} required/></label>
        <label>Portal Password<input value={form.portalPassword} onChange={(e)=>updateField("portalPassword",e.target.value)} placeholder="Auto-generated when blank"/></label>

        <div className="admin-settings-wide admin-section-heading"><div><span>Step 2</span><h2>Brand identity</h2></div></div>
        <label>Logo Type<select value={form.logoType} onChange={(e)=>updateField("logoType",e.target.value)}><option value="image">Image / File Path</option><option value="text">Text Wordmark</option><option value="none">No Logo</option></select></label>
        {form.logoType==="image"&&<label>Logo Path or URL<input value={form.logo} onChange={(e)=>updateField("logo",e.target.value)} placeholder="/client-logo.svg or https://..."/></label>}
        {form.logoType==="text"&&<><label>Logo Text<input value={form.logoText} onChange={(e)=>updateField("logoText",e.target.value)} placeholder={form.shortName||form.name||"Client Name"}/></label><label>Wordmark Style<select value={form.logoFontStyle} onChange={(e)=>updateField("logoFontStyle",e.target.value)}><option value="sans">Sans Bold</option><option value="serif">Serif</option><option value="light">Sans Light</option><option value="condensed">Condensed Bold</option></select></label><label>Wordmark Color<input type="color" value={form.logoTextColor} onChange={(e)=>updateField("logoTextColor",e.target.value)}/></label></>}
        <label>Primary Color<input type="color" value={form.primaryColor} onChange={(e)=>updateField("primaryColor",e.target.value)}/></label>
        <label>Secondary Color<input type="color" value={form.secondaryColor} onChange={(e)=>updateField("secondaryColor",e.target.value)}/></label>
        <label className="admin-settings-wide">Portal Title<input value={form.heroTitle} onChange={(e)=>updateField("heroTitle",e.target.value)} placeholder="Client Brand Portal"/></label>
        <label className="admin-settings-wide">Portal Description<textarea value={form.heroText} onChange={(e)=>updateField("heroText",e.target.value)}/></label>

        <div className="admin-settings-wide admin-section-heading"><div><span>Step 3</span><h2>Optional integration</h2></div></div>
        <label className="admin-settings-wide">Printful Token Environment Variable<input value={form.printfulTokenEnv} onChange={(e)=>updateField("printfulTokenEnv",e.target.value)} placeholder={`PRINTFUL_ACCESS_TOKEN_${(form.slug||"CLIENT").toUpperCase().replace(/[^A-Z0-9]/g,"_")}`}/><small>Add this environment variable in Vercel after creating the client. Printful is optional and can be connected later.</small></label>
        <label className="admin-settings-toggle"><input type="checkbox" checked={form.portalEnabled} onChange={(e)=>updateField("portalEnabled",e.target.checked)}/>Portal Enabled</label>
        <div className="admin-settings-actions"><button className="admin-primary-button" type="submit" disabled={saving}>{saving?"Creating Client...":"Create Client Portal"}</button>{message&&<span>{message}</span>}</div>
      </form>
    </section></section></main>;
}
