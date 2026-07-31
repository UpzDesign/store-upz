"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminButton, AdminEmptyState, AdminHeader, AdminPage, AdminStats, AdminTabs, StatCard } from "@/components/admin/AdminUI";

type ActivityItem = {
  id:string;
  kind:string;
  category:string;
  title:string;
  message:string;
  status?:string;
  priority?:string;
  createdAt:string;
  company:{name:string;shortName:string;slug:string;primaryColor?:string|null};
  portfolio?:{id:number;name:string}|null;
  actor?:string|null;
  href:string;
  actionable:boolean;
};
type ActivityData={items:ActivityItem[];counts:{total:number;requests:number;attention:number;client:number;production:number}};

const FILTERS=["All","Requests","Attention","Client Activity","Production"];

export default function ActivityCenterPage(){
 const[data,setData]=useState<ActivityData|null>(null);
 const[filter,setFilter]=useState("All");
 const[query,setQuery]=useState("");
 useEffect(()=>{fetch("/api/admin/activity-center",{cache:"no-store"}).then(response=>response.json()).then(setData)},[]);
 const items=useMemo(()=>!data?[]:data.items.filter(item=>(filter==="All"||item.category===filter)&&`${item.title} ${item.message} ${item.company.name} ${item.portfolio?.name||""}`.toLowerCase().includes(query.toLowerCase())),[data,filter,query]);
 if(!data)return <AdminPage><AdminEmptyState>Loading activity center...</AdminEmptyState></AdminPage>;
 return <AdminPage className="activity-center-page">
  <AdminHeader eyebrow="UPZ Workspace" title="Activity Center" description="Review requests, client responses, overdue work, assignments, approvals, and production activity from one chronological feed." actions={<AdminButton href="/admin/operations">Open Work Management</AdminButton>}/>
  <AdminStats><StatCard label="Open requests" value={data.counts.requests}/><StatCard label="Needs attention" value={data.counts.attention}/><StatCard label="Client activity" value={data.counts.client}/><StatCard label="Production events" value={data.counts.production}/></AdminStats>
  <AdminTabs className="activity-center-tabs">{FILTERS.map(value=><button type="button" key={value} className={filter===value?"active":""} onClick={()=>setFilter(value)}>{value}</button>)}</AdminTabs>
  <div className="activity-center-toolbar"><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search activity, companies, portfolios, or work orders..."/><span>{items.length} item{items.length===1?"":"s"}</span></div>
  <section className="activity-center-feed">
   {items.map(item=><Link href={item.href} key={item.id} className={`activity-center-item kind-${item.kind} priority-${item.priority||"normal"}`} style={{"--activity-client":item.company.primaryColor||"#edbf2d"} as React.CSSProperties}>
    <div className="activity-center-marker"><i/></div>
    <div className="activity-center-copy"><div className="activity-center-meta"><span>{item.category}</span><b>{item.company.shortName}</b>{item.portfolio&&<em>{item.portfolio.name}</em>}</div><h2>{item.title}</h2><p>{item.message}</p><small>{item.actor?`${item.actor} · `:""}{new Date(item.createdAt).toLocaleString()}</small></div>
    <div className="activity-center-action"><span>{item.actionable?"Review":"Open"}</span><small>{String(item.status||"").replaceAll("_"," ")}</small></div>
   </Link>)}
   {items.length===0&&<AdminEmptyState>No activity matches the current filters.</AdminEmptyState>}
  </section>
 </AdminPage>;
}
