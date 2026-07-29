"use client";

import { useEffect, useMemo, useState } from "react";
import { INTAKE_FORMS, type IntakeDefinition, type IntakeFieldType } from "@/lib/intake-forms";
import { AdminButton, AdminCard, AdminField, AdminFormGrid, AdminHeader, AdminPage, AdminSection, AdminSectionHeader, AdminTabs, AdminToolbar } from "@/components/admin/AdminUI";

const TYPES:IntakeFieldType[]=["text","email","number","date","textarea","select","checkbox"];
const defaults=()=>Object.values(INTAKE_FORMS).map((service)=>({...service,fields:service.fields.map((field)=>({...field}))}));

export default function AdminServicesPage(){
  const [services,setServices]=useState<IntakeDefinition[]>(defaults); const [active,setActive]=useState(services[0]?.slug||""); const [query,setQuery]=useState(""); const [message,setMessage]=useState(""); const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false);
  useEffect(()=>{fetch("/api/admin/services",{cache:"no-store"}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data?.error||"Unable to load services");if(Array.isArray(data)&&data.length){setServices(data);setActive(data[0].slug);}}).catch(error=>setMessage(error?.message||"Unable to load services")).finally(()=>setLoading(false));},[]);
  const selected=services.find(service=>service.slug===active)||services[0]; const filtered=useMemo(()=>services.filter(service=>`${service.name} ${service.description}`.toLowerCase().includes(query.toLowerCase())),[services,query]);
  const updateService=(patch:Partial<IntakeDefinition>)=>setServices(items=>items.map(item=>item.slug===selected.slug?{...item,...patch}:item));
  const addService=()=>{const slug=`new-service-${Date.now()}`;setServices(items=>[...items,{slug,name:"New Service",description:"Add a service description.",imageUrl:"/service-placeholders/general.svg",fields:[]}]);setActive(slug);};
  const addField=()=>updateService({fields:[...selected.fields,{key:`field_${Date.now()}`,label:"New Field",type:"text"}]}); const updateField=(index:number,patch:Record<string,unknown>)=>updateService({fields:selected.fields.map((field,i)=>i===index?{...field,...patch}:field)}); const removeField=(index:number)=>updateService({fields:selected.fields.filter((_,i)=>i!==index)});
  const saveLibrary=async()=>{setSaving(true);setMessage("");try{const response=await fetch("/api/admin/services",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(services)});const data=await response.json();if(!response.ok)throw new Error(data?.error||"Unable to save services");setServices(data);setMessage("Service library saved.");window.setTimeout(()=>setMessage(""),2400);}catch(error:any){setMessage(error?.message||"Unable to save services");}finally{setSaving(false);}};

  return <AdminPage className="admin-service-editor-page">
    <AdminHeader eyebrow="Service Platform" title="Service Library" description="Manage reusable services, card images, and concise client intake forms." actions={<AdminButton href="/admin/inbox">Open Requests</AdminButton>}/>
    <AdminSection className="service-editor-shell">
      <aside className="service-editor-list">
        <AdminSectionHeader eyebrow="Library" title="Services" actions={<AdminButton type="button" onClick={addService}>+ Add</AdminButton>}/>
        <input className="service-library-search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search services..."/>
        <AdminTabs className="service-editor-nav">{filtered.map(service=><button type="button" key={service.slug} className={selected?.slug===service.slug?"active":""} onClick={()=>setActive(service.slug)}><strong>{service.name}</strong></button>)}</AdminTabs>
      </aside>
      {selected&&<div className="service-editor-workspace">
        <AdminToolbar className="service-editor-toolbar"><div><span className="admin-ui-eyebrow">Editing Service</span><h2>{selected.name}</h2></div><div className="service-editor-actions"><AdminButton variant="outline" href={`/portal/rtl/request/${selected.slug}`}>Preview Form</AdminButton><AdminButton type="button" onClick={saveLibrary} disabled={saving}>{saving?"Saving...":"Save Changes"}</AdminButton></div></AdminToolbar>
        {message&&<div className="service-editor-message">{message}</div>}
        <AdminFormGrid className="service-definition-form"><AdminField label="Service Name"><input value={selected.name} onChange={event=>updateService({name:event.target.value})}/></AdminField><AdminField label="Slug"><input value={selected.slug} readOnly/></AdminField><AdminField label="Card Image URL" className="wide"><input value={selected.imageUrl||""} onChange={event=>updateService({imageUrl:event.target.value})} placeholder="/service-placeholders/photography.svg or https://..."/></AdminField><AdminField label="Description" className="wide"><textarea value={selected.description} onChange={event=>updateService({description:event.target.value})}/></AdminField></AdminFormGrid>
        <AdminSectionHeader eyebrow="Client Intake" title="Form fields" actions={<AdminButton type="button" onClick={addField}>+ Add Field</AdminButton>}/>
        <div className="form-builder-list">{selected.fields.map((field,index)=><AdminCard className="form-builder-card" key={`${field.key}-${index}`}><AdminFormGrid className="form-builder-grid"><AdminField label="Label"><input value={field.label} onChange={event=>updateField(index,{label:event.target.value})}/></AdminField><AdminField label="Field Key"><input value={field.key} onChange={event=>updateField(index,{key:event.target.value})}/></AdminField><AdminField label="Type"><select value={field.type} onChange={event=>updateField(index,{type:event.target.value})}>{TYPES.map(type=><option key={type}>{type}</option>)}</select></AdminField><AdminField label="Placeholder"><input value={field.placeholder||""} onChange={event=>updateField(index,{placeholder:event.target.value})}/></AdminField><div className="form-builder-toggles"><label><input type="checkbox" checked={Boolean(field.required)} onChange={event=>updateField(index,{required:event.target.checked})}/>Required</label><label><input type="checkbox" checked={Boolean(field.wide)} onChange={event=>updateField(index,{wide:event.target.checked})}/>Full width</label></div></AdminFormGrid><AdminButton variant="danger" type="button" onClick={()=>removeField(index)}>Remove</AdminButton></AdminCard>)}</div>
      </div>}
      {loading&&<p>Loading services...</p>}
    </AdminSection>
  </AdminPage>;
}