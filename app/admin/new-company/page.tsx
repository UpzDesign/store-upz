"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CompanyLogo from "@/components/CompanyLogo";

const initialForm = {
  name: "", shortName: "", slug: "", logo: "", logoType: "image", logoText: "", logoTextColor: "#010101", logoFontStyle: "sans",
  primaryColor: "#edbf2d", secondaryColor: "#010101", heroTitle: "", heroText: "", portalPassword: "", portalEnabled: true,
  printfulCredential: "", printfulStoreId: "",
};
const LOGO_TYPES=["image/png","image/webp","image/svg+xml"];
const MAX_LOGO_BYTES=1_500_000;

function slugify(value: string) { return value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""); }
function safeTextColor(hex:string){const value=hex.replace("#","");if(value.length!==6)return"#ffffff";const r=parseInt(value.slice(0,2),16),g=parseInt(value.slice(2,4),16),b=parseInt(value.slice(4,6),16);return((r*299+g*587+b*114)/1000)>150?"#111111":"#ffffff"}
function fileToDataUrl(file:File){return new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||""));reader.onerror=()=>reject(new Error("Unable to read logo file"));reader.readAsDataURL(file)})}

export default function NewCompanyPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [logoMessage,setLogoMessage]=useState("");
  const [contrastMode,setContrastMode]=useState<"auto"|"light"|"dark"|"custom">("auto");
  function updateField(field: keyof typeof initialForm, value: string | boolean) { setForm((current) => ({ ...current, [field]: value })); }
  function updatePrimary(value:string){setForm(current=>({...current,primaryColor:value,logoTextColor:contrastMode==="auto"?safeTextColor(value):current.logoTextColor}))}
  function setContrast(mode:"auto"|"light"|"dark"|"custom"){setContrastMode(mode);if(mode==="auto")updateField("logoTextColor",safeTextColor(form.primaryColor));if(mode==="light")updateField("logoTextColor","#ffffff");if(mode==="dark")updateField("logoTextColor","#111111")}
  async function handleLogoFile(file?:File){if(!file)return;setLogoMessage("");if(!LOGO_TYPES.includes(file.type)){setLogoMessage("Use SVG, PNG, or WebP.");return}if(file.size>MAX_LOGO_BYTES){setLogoMessage("Logo must be 1.5 MB or smaller.");return}try{const dataUrl=await fileToDataUrl(file);setForm(current=>({...current,logoType:"image",logo:dataUrl}));setLogoMessage(`${file.name} ready to save.`)}catch(err:any){setLogoMessage(err?.message||"Unable to load logo")}}

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage("");
    const slug = form.slug || slugify(form.name); const shortName = form.shortName || form.name;
    try {
      const response = await fetch("/api/admin/companies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, slug, shortName, logoText: form.logoText || shortName, logoTextColor:contrastMode==="auto"?safeTextColor(form.primaryColor):form.logoTextColor, portalPassword: form.portalPassword || `${slug}demo`, heroTitle: form.heroTitle || `${shortName} Brand Portal`, heroText: form.heroText || `Approved merchandise, marketing materials, and brand assets for the ${shortName} team.` }) });
      const data = await response.json(); if (!response.ok) throw new Error(data?.error || "Unable to create company");

      if (form.printfulCredential.trim()) {
        setMessage("Client created. Connecting Printful...");
        const printfulResponse = await fetch(`/api/admin/companies/${data.slug}/printful-admin`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: form.printfulCredential, storeId: form.printfulStoreId }),
        });
        const printfulData = await printfulResponse.json();
        if (!printfulResponse.ok) throw new Error(`Client created, but Printful failed: ${printfulData?.error || "Unable to connect"}`);
      }

      router.push(`/admin/company/${data.slug}`);
    } catch (err: any) { setMessage(err?.message || "Unable to create company"); } finally { setSaving(false); }
  }

  const previewCompany = { ...form, logoTextColor:contrastMode==="auto"?safeTextColor(form.primaryColor):form.logoTextColor, shortName: form.shortName || form.name || "NEW CLIENT", logoText: form.logoText || form.shortName || form.name || "NEW CLIENT", name: form.name || "New Client" };

  return <main className="admin-page"><section className="admin-company-detail"><div className="admin-detail-topbar"><Link href="/admin/companies">← Back to Companies</Link></div>
    <header className="admin-detail-hero"><div className="admin-detail-logo" style={{ borderColor: form.primaryColor,background:form.primaryColor }}><CompanyLogo company={previewCompany}/></div><div><div className="admin-eyebrow">Client Registration</div><h1>New Client</h1><p>Create the client profile, branding, portal access, and optional integrations from one form.</p></div></header>
    <section className="admin-section"><div className="admin-section-heading"><div><span>Step 1</span><h2>Company information</h2></div></div>
      <form className="admin-settings-form" onSubmit={handleSubmit} autoComplete="off">
        <label>Company Name<input value={form.name} onChange={(e)=>{updateField("name",e.target.value);if(!form.slug)updateField("slug",slugify(e.target.value));}} required/></label>
        <label>Short Name<input value={form.shortName} onChange={(e)=>updateField("shortName",e.target.value)} placeholder="Used in compact areas"/></label>
        <label>Portal Slug / Username<input value={form.slug} onChange={(e)=>updateField("slug",slugify(e.target.value))} required/></label>
        <label>Portal Password<input type="text" name="portal-access-code" autoComplete="off" data-lpignore="true" data-1p-ignore="true" value={form.portalPassword} onChange={(e)=>updateField("portalPassword",e.target.value)} placeholder="Auto-generated when blank"/></label>

        <div className="admin-settings-wide admin-section-heading"><div><span>Step 2</span><h2>Brand identity</h2></div></div>
        <label>Logo Type<select value={form.logoType} onChange={(e)=>updateField("logoType",e.target.value)}><option value="image">Uploaded / Image Logo</option><option value="text">Text Wordmark</option><option value="none">No Logo</option></select></label>
        {form.logoType==="image"&&<div className="admin-settings-wide company-logo-upload"><label>Upload Logo<input type="file" accept=".svg,.png,.webp,image/svg+xml,image/png,image/webp" onChange={e=>handleLogoFile(e.target.files?.[0])}/><small>SVG, PNG, or WebP. Maximum 1.5 MB. Recommended: transparent background.</small></label><div className="company-logo-upload-preview" style={{background:form.primaryColor}}><CompanyLogo company={previewCompany}/></div>{form.logo&&<button type="button" className="admin-secondary-button" onClick={()=>{updateField("logo","");setLogoMessage("")}}>Remove uploaded logo</button>}{logoMessage&&<small>{logoMessage}</small>}<label>Or use Logo Path / URL<input value={form.logo.startsWith("data:")?"":form.logo} onChange={(e)=>updateField("logo",e.target.value)} placeholder="/client-logo.svg or https://..."/><small>Optional fallback when you prefer to host the logo elsewhere.</small></label></div>}
        {form.logoType==="text"&&<><label>Logo Text<input value={form.logoText} onChange={(e)=>updateField("logoText",e.target.value)} placeholder={form.shortName||form.name||"Client Name"}/></label><label>Wordmark Style<select value={form.logoFontStyle} onChange={(e)=>updateField("logoFontStyle",e.target.value)}><option value="sans">Sans Bold</option><option value="serif">Serif</option><option value="light">Sans Light</option><option value="condensed">Condensed Bold</option></select></label></>}
        <label>Primary Brand Color<input type="color" value={form.primaryColor} onChange={(e)=>updatePrimary(e.target.value)}/></label>
        <label>Secondary Color<input type="color" value={form.secondaryColor} onChange={(e)=>updateField("secondaryColor",e.target.value)}/></label>
        <div className="admin-settings-wide company-contrast-control"><strong>On-brand / Wordmark Color</strong><div><button type="button" className={contrastMode==="auto"?"active":""} onClick={()=>setContrast("auto")}>Auto Contrast</button><button type="button" className={contrastMode==="light"?"active":""} onClick={()=>setContrast("light")}>Light</button><button type="button" className={contrastMode==="dark"?"active":""} onClick={()=>setContrast("dark")}>Dark</button><button type="button" className={contrastMode==="custom"?"active":""} onClick={()=>setContrast("custom")}>Custom</button></div>{contrastMode==="custom"&&<input aria-label="Custom on-brand color" type="color" value={form.logoTextColor} onChange={e=>updateField("logoTextColor",e.target.value)}/>}<small>Used for wordmarks and text/buttons placed on the primary brand color. Auto chooses light or dark for safe contrast.</small></div>
        <label className="admin-settings-wide">Portal Title<input value={form.heroTitle} onChange={(e)=>updateField("heroTitle",e.target.value)} placeholder="Client Brand Portal"/></label>
        <label className="admin-settings-wide">Portal Description<textarea value={form.heroText} onChange={(e)=>updateField("heroText",e.target.value)}/></label>

        <div className="admin-settings-wide admin-section-heading"><div><span>Step 3</span><h2>Optional Printful integration</h2></div></div>
        <label className="admin-settings-wide">Printful Private Token<input type="text" name="printful-private-token" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} data-lpignore="true" data-1p-ignore="true" value={form.printfulCredential} onChange={(e)=>updateField("printfulCredential",e.target.value)} placeholder="Paste the Private Token value"/><small>Paste the token value itself. You may also paste “Bearer …” or an Authorization header; the admin will clean it automatically.</small></label>
        <label className="admin-settings-wide">Printful Store ID<input inputMode="numeric" name="printful-store-id" autoComplete="off" value={form.printfulStoreId} onChange={(e)=>updateField("printfulStoreId",e.target.value)} placeholder="Required for an account-level token"/><small>A store-level token does not need this. An account-level token must include the numeric Printful Store ID.</small></label>
        <div className="admin-settings-wide"><p>The token must be a Printful <strong>Private Token</strong> with <strong>Sync Products read</strong> access. It is tested immediately and then stored encrypted.</p></div>
        <label className="admin-settings-toggle"><input type="checkbox" checked={form.portalEnabled} onChange={(e)=>updateField("portalEnabled",e.target.checked)}/>Portal Enabled</label>
        <div className="admin-settings-actions"><button className="admin-primary-button" type="submit" disabled={saving}>{saving?"Creating Client...":"Create Client Portal"}</button>{message&&<span>{message}</span>}</div>
      </form>
    </section></section></main>;
}
