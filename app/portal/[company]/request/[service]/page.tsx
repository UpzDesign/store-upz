"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getIntakeForm, type IntakeDefinition, type IntakeField } from "@/lib/intake-forms";

type PortalCompany = { name:string; shortName:string; logo?:string|null; primaryColor:string; secondaryColor:string };
type EngagementOption = { id:number; name:string; address?:string|null; type:string };

function initialValues(fields: IntakeField[]) {
  return fields.reduce<Record<string, string | boolean>>((values, field) => {
    values[field.key] = field.type === "checkbox" ? false : field.key === "priority" ? "normal" : "";
    return values;
  }, {});
}

export default function ProjectRequestPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const companySlug = Array.isArray(params?.company) ? params.company[0] : params?.company;
  const serviceSlug = Array.isArray(params?.service) ? params.service[0] : params?.service;
  const fallback=getIntakeForm(serviceSlug);
  const [definition,setDefinition]=useState<IntakeDefinition>(fallback);
  const [availableServices,setAvailableServices]=useState<IntakeDefinition[]>([]);
  const [engagements,setEngagements]=useState<EngagementOption[]>([]);
  const [engagementId,setEngagementId]=useState(searchParams.get("engagementId")||"");
  const [engagementName,setEngagementName]=useState(searchParams.get("engagementName")||"");
  const [company, setCompany] = useState<PortalCompany | null>(null);
  const [brandLoading, setBrandLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<Record<string, string | boolean>>(() => initialValues(fallback.fields));

  useEffect(() => {
    if (!companySlug) return;
    const savedSlug = window.localStorage.getItem("upz_company_slug");
    if (savedSlug !== companySlug) { router.push("/login"); return; }
    setBrandLoading(true);
    Promise.all([
      fetch(`/api/portal/companies/${companySlug}`).then(async(response)=>{const data=await response.json();if(!response.ok)throw new Error("Unable to load company branding");return data;}),
      fetch(`/api/portal/companies/${companySlug}/services`,{cache:"no-store"}).then((response)=>response.ok?response.json():[]),
      fetch(`/api/portal/companies/${companySlug}/projects`,{cache:"no-store"}).then((response)=>response.ok?response.json():[]),
    ]).then(([companyData,serviceData,engagementData])=>{
      setCompany(companyData);
      const list=Array.isArray(serviceData)?serviceData:[];
      setAvailableServices(list);
      setEngagements(Array.isArray(engagementData)?engagementData.map((item:EngagementOption)=>({id:item.id,name:item.name,address:item.address,type:item.type})):[]);
      const selected=list.find((item:IntakeDefinition)=>item.slug===serviceSlug)||getIntakeForm(serviceSlug);
      setDefinition(selected);
      setForm(initialValues(selected.fields));
    }).catch(()=>setCompany(null)).finally(()=>setBrandLoading(false));
  }, [companySlug, serviceSlug, router]);

  useEffect(() => { setSubmitted(false); setToast(null); }, [definition]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 5000); return () => window.clearTimeout(timer); }, [toast]);

  function updateForm(field: string, value: string | boolean) { setForm((current) => ({ ...current, [field]: value })); }
  function selectEngagement(value:string){
    setEngagementId(value);
    if(value){const selected=engagements.find((item)=>String(item.id)===value);if(selected)setEngagementName(selected.name);}
  }

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!companySlug) return; setSaving(true); setToast(null);
    try {
      const propertyAddress=String(form.propertyAddress||form.address||"").trim();
      const resolvedName=engagementName.trim()||String(form.projectTitle||propertyAddress||definition.name).trim();
      const response = await fetch(`/api/portal/companies/${companySlug}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: definition.name, serviceSlug: definition.slug, engagementId: engagementId||undefined, engagementName: resolvedName, workOrderTitle: `${definition.name} — ${resolvedName}`, projectTitle: form.projectTitle, propertyAddress, priority: form.priority || "normal", answers: form })
      });
      const data = await response.json(); if (!response.ok) throw new Error(data?.error || "Unable to submit service request");
      setSubmitted(true); setToast({ type: "success", message: `${definition.name} was submitted for review.` });
    } catch (error: unknown) { setToast({ type: "error", message: error instanceof Error ? error.message : "Unable to submit service request" }); }
    finally { setSaving(false); }
  }

  function renderField(field: IntakeField) {
    const value = form[field.key] ?? ""; const className = field.wide ? "portal-request-wide" : undefined;
    if (field.type === "textarea") return <label key={field.key} className={className}>{field.label}<textarea value={String(value)} onChange={(event) => updateForm(field.key, event.target.value)} placeholder={field.placeholder} required={field.required} /></label>;
    if (field.type === "select") return <label key={field.key} className={className}>{field.label}<select value={String(value)} onChange={(event) => updateForm(field.key, event.target.value)} required={field.required}><option value="">Select an option</option>{field.options?.map((option) => <option key={option} value={option.toLowerCase()}>{option}</option>)}</select></label>;
    if (field.type === "checkbox") return <label key={field.key} className={`portal-request-checkbox ${className || ""}`}><input type="checkbox" checked={Boolean(value)} onChange={(event) => updateForm(field.key, event.target.checked)} /><span>{field.label}</span></label>;
    return <label key={field.key} className={className}>{field.label}<input type={field.type} value={String(value)} onChange={(event) => updateForm(field.key, event.target.value)} placeholder={field.placeholder} required={field.required} /></label>;
  }

  if (brandLoading) return <main className="portal-page portal-request-page request-brand-loading" aria-busy="true"><div className="request-brand-loading-mark" /></main>;
  if (!company) return <main className="portal-page portal-request-page"><section className="portal-request-success"><span>Portal unavailable</span><h1>Unable to load branding.</h1><p>Please return to the portal and try again.</p><div className="portal-request-success-actions"><Link href={`/portal/${companySlug}`}>Return to Portal</Link></div></section></main>;

  const brandStyle = { "--company-primary": company.primaryColor, "--company-secondary": company.secondaryColor } as React.CSSProperties;

  if (submitted) return <main className="portal-page portal-request-page branded-request-page" style={brandStyle}>
    {toast && <div className={`upz-toast ${toast.type}`} role="status"><strong>{toast.type === "success" ? "✓" : "!"}</strong><span>{toast.message}</span></div>}
    <section className="portal-request-success">{company.logo && <img className="request-company-logo" src={company.logo} alt={`${company.name} logo`} />}<span>Request submitted</span><h1>Pending UPZ review.</h1><p>Your {definition.name.toLowerCase()} request is now in the review queue. Once approved, it will appear in Projects &amp; Campaigns with its live production stage and schedule.</p><div className="portal-request-success-actions"><Link href={`/portal/${companySlug}`}>Return to Portal</Link><button type="button" onClick={() => { setForm(initialValues(definition.fields)); setSubmitted(false); }}>Submit Another Request</button></div></section>
  </main>;

  return <main className="portal-page portal-request-page branded-request-page" style={brandStyle}>
    {toast && <div className={`upz-toast ${toast.type}`} role="alert"><strong>{toast.type === "success" ? "✓" : "!"}</strong><span>{toast.message}</span></div>}
    <section className="portal-request-wrap">
      <div className="portal-request-intro"><Link href={`/portal/${companySlug}`}>← Back to Portal</Link>{company.logo && <img className="request-company-logo" src={company.logo} alt={`${company.name} logo`} />}<span>{company.shortName} · Submit a Request</span><h1>{definition.name}</h1><p>{definition.description}</p><nav className="portal-project-type-list" aria-label="Project types">{availableServices.map((item) => <Link key={item.slug} className={item.slug === definition.slug ? "active" : ""} href={`/portal/${companySlug}/request/${item.slug}${engagementId?`?engagementId=${engagementId}&engagementName=${encodeURIComponent(engagementName)}`:""}`}>{item.name}</Link>)}</nav></div>
      <form className="portal-request-form" onSubmit={submitRequest}>
        <div className="portal-request-form-heading portal-request-wide"><span>{company.name}</span><h2>{definition.name} intake</h2><p>Submit this service for review and connect it to an existing project or campaign when applicable.</p></div>
        <div className="engagement-request-selector portal-request-wide">
          <label>Existing project or campaign<select value={engagementId} onChange={(event)=>selectEngagement(event.target.value)}><option value="">New project or campaign</option>{engagements.map((item)=><option key={item.id} value={item.id}>{item.name}{item.address?` — ${item.address}`:""}</option>)}</select></label>
          {!engagementId&&<label>New project or campaign name<input value={engagementName} onChange={(event)=>setEngagementName(event.target.value)} placeholder="Example: 645 Madison Avenue" required /></label>}
        </div>
        {definition.fields.map(renderField)}
        <div className="portal-request-actions"><button type="submit" disabled={saving}>{saving ? "Submitting Request..." : "Submit for Review"}</button></div>
      </form>
    </section>
  </main>;
}
