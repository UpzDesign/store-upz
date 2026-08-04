"use client";

import { useEffect,useMemo,useState } from "react";
import { AdminButton,AdminCard,AdminEmptyState,AdminField,AdminFormGrid,AdminHeader,AdminPage,AdminSection,AdminSectionHeader,AdminStats,AdminToolbar,StatCard } from "@/components/admin/AdminUI";

type Rule={id:string;label:string;sourceKey:string;matchType:"selected"|"equals"|"number_min";matchValue?:string;clientAmount:number;internalCost:number;active:boolean};
type ServicePricing={id:number;slug:string;name:string;description:string;fields:Array<{key:string;label:string;type:string;options?:unknown}>;pricing:{basePrice:number;baseCost:number;rules:Rule[]}};
const money=(value:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(value||0);

export default function BusinessRulesPage(){
 const[services,setServices]=useState<ServicePricing[]>([]),[active,setActive]=useState(""),[query,setQuery]=useState(""),[message,setMessage]=useState(""),[saving,setSaving]=useState(false),[loading,setLoading]=useState(true);
 useEffect(()=>{fetch("/api/admin/business-rules",{cache:"no-store"}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data?.error||"Unable to load pricing rules");setServices(data);setActive(data[0]?.slug||"")}).catch(error=>setMessage(error.message)).finally(()=>setLoading(false))},[]);
 const selected=services.find(service=>service.slug===active)||services[0];
 const filtered=useMemo(()=>services.filter(service=>`${service.name} ${service.description}`.toLowerCase().includes(query.toLowerCase())),[services,query]);
 const updateSelected=(patch:Partial<ServicePricing["pricing"]>)=>setServices(items=>items.map(item=>item.id===selected.id?{...item,pricing:{...item.pricing,...patch}}:item));
 const updateRule=(id:string,patch:Partial<Rule>)=>updateSelected({rules:selected.pricing.rules.map(rule=>rule.id===id?{...rule,...patch}:rule)});
 const addRule=()=>updateSelected({rules:[...selected.pricing.rules,{id:`rule-${Date.now()}`,label:"New pricing rule",sourceKey:selected.fields[0]?.key||"",matchType:"selected",matchValue:"",clientAmount:0,internalCost:0,active:true}]});
 const removeRule=(id:string)=>updateSelected({rules:selected.pricing.rules.filter(rule=>rule.id!==id)});
 async function save(){setSaving(true);setMessage("");try{const response=await fetch("/api/admin/business-rules",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(services)});const data=await response.json();if(!response.ok)throw new Error(data?.error||"Unable to save pricing rules");setServices(data);setMessage("Business rules saved.")}catch(error:any){setMessage(error.message||"Unable to save pricing rules")}finally{setSaving(false)}}
 if(loading)return <AdminPage><AdminEmptyState>Loading business rules...</AdminEmptyState></AdminPage>;
 const totalRules=services.reduce((sum,service)=>sum+service.pricing.rules.filter(rule=>rule.active).length,0),configured=services.filter(service=>service.pricing.basePrice>0||service.pricing.rules.length>0).length;
 return <AdminPage className="admin-standard-page business-rules-page">
  <AdminHeader eyebrow="System Settings" title="Business Rules" description="Configure private pricing and cost logic using the same service fields collected in project requests." actions={<AdminButton type="button" onClick={save} disabled={saving}>{saving?"Saving...":"Save Business Rules"}</AdminButton>}/>
  <AdminStats><StatCard label="Services" value={services.length}/><StatCard label="Configured" value={configured}/><StatCard label="Active rules" value={totalRules}/><StatCard label="Client visibility" value="Private"/></AdminStats>
  {message&&<div className="admin-ui-notice-inline">{message}</div>}
  <AdminSection>
   <AdminSectionHeader eyebrow="Rule Library" title="Choose a service"/>
   <AdminToolbar className="business-rules-standard-toolbar"><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search services..."/><select value={active} onChange={event=>setActive(event.target.value)}>{filtered.map(service=><option value={service.slug} key={service.slug}>{service.name} · {service.pricing.rules.length} rules</option>)}</select>{selected&&<AdminButton variant="outline" type="button" onClick={addRule}>Add Rule</AdminButton>}</AdminToolbar>
  </AdminSection>
  {selected&&<>
   <AdminSection>
    <AdminSectionHeader eyebrow="Selected Service" title={selected.name}/><p className="admin-ui-description">{selected.description}</p>
    <AdminFormGrid><AdminField label="Base client price"><input type="number" min="0" step="0.01" value={selected.pricing.basePrice} onChange={event=>updateSelected({basePrice:Number(event.target.value)})}/></AdminField><AdminField label="Base internal cost"><input type="number" min="0" step="0.01" value={selected.pricing.baseCost} onChange={event=>updateSelected({baseCost:Number(event.target.value)})}/></AdminField></AdminFormGrid>
    <div className="business-rule-summary"><AdminCard variant="highlight"><span>Base gross profit</span><strong>{money(selected.pricing.basePrice-selected.pricing.baseCost)}</strong></AdminCard><AdminCard variant="compact"><span>Base margin</span><strong>{selected.pricing.basePrice?`${Math.round((selected.pricing.basePrice-selected.pricing.baseCost)/selected.pricing.basePrice*100)}%`:"—"}</strong></AdminCard></div>
   </AdminSection>
   <AdminSection>
    <AdminSectionHeader eyebrow="Request Logic" title="Conditional pricing rules" actions={<AdminButton type="button" onClick={addRule}>Add Rule</AdminButton>}/>
    <p className="admin-ui-description">Each rule reads a structured answer from this service’s request section and adjusts the internal estimate.</p>
    <div className="business-rule-list">{selected.pricing.rules.map((rule,index)=><AdminCard className="business-rule-card" key={rule.id}><div className="business-rule-index"><span>Rule</span><strong>{index+1}</strong></div><AdminFormGrid><AdminField label="Rule label" className="wide"><input value={rule.label} onChange={event=>updateRule(rule.id,{label:event.target.value})}/></AdminField><AdminField label="Request field"><select value={rule.sourceKey} onChange={event=>updateRule(rule.id,{sourceKey:event.target.value})}><option value="">Choose field</option>{selected.fields.map(field=><option key={field.key} value={field.key}>{field.label}</option>)}</select></AdminField><AdminField label="Match logic"><select value={rule.matchType} onChange={event=>updateRule(rule.id,{matchType:event.target.value as Rule["matchType"]})}><option value="selected">Option selected</option><option value="equals">Value equals</option><option value="number_min">Number is at least</option></select></AdminField><AdminField label="Match value" className="wide"><input value={rule.matchValue||""} onChange={event=>updateRule(rule.id,{matchValue:event.target.value})} placeholder="Example: Exterior, Drone, 5000"/></AdminField><AdminField label="Add to client price"><input type="number" step="0.01" value={rule.clientAmount} onChange={event=>updateRule(rule.id,{clientAmount:Number(event.target.value)})}/></AdminField><AdminField label="Add to internal cost"><input type="number" step="0.01" value={rule.internalCost} onChange={event=>updateRule(rule.id,{internalCost:Number(event.target.value)})}/></AdminField><label className="business-rule-toggle"><input type="checkbox" checked={rule.active} onChange={event=>updateRule(rule.id,{active:event.target.checked})}/> Active rule</label></AdminFormGrid><AdminButton variant="danger" type="button" onClick={()=>removeRule(rule.id)}>Remove Rule</AdminButton></AdminCard>)}{!selected.pricing.rules.length&&<AdminEmptyState>No conditional rules yet. Add a rule when a selected request option should change price or cost.</AdminEmptyState>}</div>
   </AdminSection>
  </>}
 </AdminPage>;
}
