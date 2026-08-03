"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminCard, AdminEmptyState, AdminGrid, AdminHeader, AdminPage, AdminSection, AdminSectionHeader, AdminStats, AdminTabs, AdminToolbar, StatCard } from "@/components/admin/AdminUI";

type Property={id:number;name:string;type:string;status:string;address?:string|null;city?:string|null;state?:string|null;progress:number;activeOrders:number;assetCount:number;company:{name:string;shortName:string;primaryColor:string};workOrders:Array<{id:number;title:string;status:string}>};
const complete=(value:string)=>["complete","completed","closed"].includes(value.toLowerCase());

export default function PropertiesPage(){
 const[items,setItems]=useState<Property[]>([]),[loading,setLoading]=useState(true),[query,setQuery]=useState(""),[status,setStatus]=useState("active");
 useEffect(()=>{fetch("/api/admin/engagements",{cache:"no-store"}).then(r=>r.ok?r.json():[]).then(data=>setItems(Array.isArray(data)?data:[])).finally(()=>setLoading(false))},[]);
 const filtered=useMemo(()=>items.filter(item=>{const finished=complete(item.status)||Boolean(item.workOrders.length)&&item.workOrders.every(order=>complete(order.status));const match=status==="all"||status==="active"?!finished&&item.status!=="archived":status==="complete"?finished:item.status===status;return match&&`${item.name} ${item.company.name} ${item.address||""} ${item.city||""}`.toLowerCase().includes(query.toLowerCase())}),[items,query,status]);
 const active=items.filter(item=>item.status!=="archived"&&!complete(item.status)).length,assets=items.reduce((sum,item)=>sum+item.assetCount,0),orders=items.reduce((sum,item)=>sum+item.workOrders.length,0);
 return <AdminPage className="property-intelligence-directory"><AdminHeader eyebrow="Property Intelligence" title="Properties" description="Permanent CRE records that connect property information, requests, work orders, reusable assets, pricing context, and future generated content."/>
 <AdminStats><StatCard label="Properties" value={items.length}/><StatCard label="Active" value={active}/><StatCard label="Work orders" value={orders}/><StatCard label="Reusable assets" value={assets}/></AdminStats>
 <AdminTabs>{[["active","Active"],["complete","Completed"],["archived","Archived"],["all","All Properties"]].map(([value,label])=><button type="button" key={value} className={status===value?"active":""} onClick={()=>setStatus(value)}>{label}</button>)}</AdminTabs>
 <AdminToolbar><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search address, property, or client..."/><span>{filtered.length} propert{filtered.length===1?"y":"ies"}</span></AdminToolbar>
 <AdminSection><AdminSectionHeader eyebrow="Intelligence Directory" title="Property records"/>{loading?<p>Loading properties...</p>:!filtered.length?<AdminEmptyState>No properties match this view.</AdminEmptyState>:<AdminGrid columns={2}>{filtered.map(item=><AdminCard key={item.id} className="property-intelligence-card"><Link href={`/admin/properties/${item.id}`}><span className="admin-ui-eyebrow">{item.company.shortName} · {item.type}</span><h2>{item.name}</h2><p>{[item.address,item.city,item.state].filter(Boolean).join(", ")||"Property information pending"}</p><div className="property-intelligence-metrics"><span><small>Progress</small><strong>{item.progress}%</strong></span><span><small>Active work</small><strong>{item.activeOrders}</strong></span><span><small>Assets</small><strong>{item.assetCount}</strong></span></div><footer>Open Property Intelligence <b>→</b></footer></Link></AdminCard>)}</AdminGrid>}</AdminSection></AdminPage>
}
