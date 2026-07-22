"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { INTAKE_FORMS, type IntakeDefinition, type IntakeFieldType } from "@/lib/intake-forms";

const TYPES:IntakeFieldType[]=["text","email","number","date","textarea","select","checkbox"];
const defaults=()=>Object.values(INTAKE_FORMS).map((service)=>({...service,fields:service.fields.map((field)=>({...field}))}));

export default function AdminServicesPage(){
  const [services,setServices]=useState<IntakeDefinition[]>(defaults);
  const [active,setActive]=useState(services[0]?.slug||"");
  const [query,setQuery]=useState("");
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  useEffect(()=>{fetch("/api/admin/services",{cache:"no-store"}).then(async(response)=>{const data=await response.json();if(!response.ok)throw new Error(data?.error||"Unable to load services");if(Array.isArray(data)&&data.length){setServices(data);setActive(data[0].slug);}}).catch((error)=>setMessage(error?.message||"Unable to load services")).finally(()=>setLoading(false));},[]);
  const selected=services.find((service)=>service.slug===active)||services[0];
  const filtered=useMemo(()=>services.filter((service)=>`${service.name} ${service.description}`.toLowerCase().includes(query.toLowerCase())),[services,query]);
  const updateService=(patch:Partial<IntakeDefinition>)=>setServices((items)=>items.map((item)=>item.slug===selected.slug?{...item,...patch}:item));
  const addService=()=>{const slug=`new-service-${Date.now()}`;setServices((items)=>[...items,{slug,name:"New Service",description:"Add a service description.",fields:[]}]);setActive(slug);};
  const addField=()=>updateService({fields:[...selected.fields,{key:`field_${Date.now()}`,label:"New Field",type:"text"}]});
  const updateField=(index:number,patch:Record<string,unknown>)=>updateService({fields:selected.fields.map((field,i)=>i===index?{...field,...patch}:field)});
  const removeField=(index:number)=>updateService({fields:selected.fields.filter((_,i)=>i!==index)});
  const saveLibrary=async()=>{setSaving(true);setMessage("");try{const response=await fetch("/api/admin/services",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(services)});const data=await response.json();if(!response.ok)throw new Error(data?.error||"Unable to save services");setServices(data);setMessage("Service library saved to the database.");window.setTimeout(()=>setMessage(""),2400);}catch(error:any){setMessage(error?.message||"Unable to save services");}finally{setSaving(false);}};

  return <main className="admin-page"><section className="admin-company-detail admin-service-editor-page">
    <div className="admin-detail-topbar"><Link href="/admin">← Back to Admin</Link><Link href="/admin/inbox">Open Inbox</Link></div>
    <header className="admin-detail-hero"><div className="admin-detail-logo"><span>UPZ</span></div><div><div className="admin-eyebrow">Service Platform</div><h1>Service Library</h1><p>Add and edit reusable services and build the exact intake form clients complete.</p></div></header>
    <section className="admin-stat-grid">{[["Services",services.length],["Form Fields",services.reduce((sum,item)=>sum+item.fields.length,0)],["Storage","Postgres"],["Status",loading?"Loading":"Live"]].map(([label,value])=><article className="admin-stat-card" key={String(label)}><span>{label}</span><strong>{value}</strong></article>)}</section>
    <section className="admin-section service-editor-shell">
      <aside className="service-editor-list"><div className="service-editor-list-head"><div><span>Library</span><h2>Services</h2></div><button className="admin-primary-button" type="button" onClick={addService}>+ Add</button></div><input className="service-library-search" value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search services..."/><div className="service-editor-nav">{filtered.map((service)=><button type="button" key={service.slug} className={selected?.slug===service.slug?"active":""} onClick={()=>setActive(service.slug)}><strong>{service.name}</strong><span>{service.fields.length} fields</span></button>)}</div></aside>
      {selected&&<div className="service-editor-workspace"><div className="service-editor-toolbar"><div><span>Editing Service</span><h2>{selected.name}</h2></div><div className="service-editor-actions"><Link className="admin-secondary-button" href={`/portal/rtl/request/${selected.slug}`}>Preview Form</Link><button className="admin-primary-button" type="button" onClick={saveLibrary} disabled={saving}>{saving?"Saving...":"Save Changes"}</button></div></div>{message&&<div className="service-editor-message">{message}</div>}
        <div className="service-definition-form"><label>Service Name<input value={selected.name} onChange={(event)=>updateService({name:event.target.value})}/></label><label>Slug<input value={selected.slug} readOnly/></label><label className="wide">Description<textarea value={selected.description} onChange={(event)=>updateService({description:event.target.value})}/></label></div>
        <div className="form-builder-heading"><div><span>Intake Form</span><h2>{selected.fields.length} fields</h2></div><button className="admin-primary-button" type="button" onClick={addField}>+ Add Field</button></div>
        <div className="form-builder-list">{selected.fields.map((field,index)=><article className="form-builder-card" key={`${field.key}-${index}`}><div className="form-builder-grid"><label>Label<input value={field.label} onChange={(event)=>updateField(index,{label:event.target.value})}/></label><label>Field Key<input value={field.key} onChange={(event)=>updateField(index,{key:event.target.value})}/></label><label>Type<select value={field.type} onChange={(event)=>updateField(index,{type:event.target.value})}>{TYPES.map((type)=><option key={type}>{type}</option>)}</select></label><label>Placeholder<input value={field.placeholder||""} onChange={(event)=>updateField(index,{placeholder:event.target.value})}/></label><div className="form-builder-toggles"><label><input type="checkbox" checked={Boolean(field.required)} onChange={(event)=>updateField(index,{required:event.target.checked})}/>Required</label><label><input type="checkbox" checked={Boolean(field.wide)} onChange={(event)=>updateField(index,{wide:event.target.checked})}/>Full width</label></div></div><button className="form-builder-remove" type="button" onClick={()=>removeField(index)}>Remove</button></article>)}</div>
      </div>}
    </section>
  </section></main>;
}
