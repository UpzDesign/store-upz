"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Engagement = {
  id:number; name:string; type:string; status:string; address?:string|null; city?:string|null; state?:string|null;
  progress:number; totalBudget:number; cost:number; activeOrders:number; assetCount:number;
  company:{name:string;shortName:string;logo?:string|null;primaryColor:string};
  workOrders:Array<{id:number;title:string;status:string;priority:string;dueDate?:string|null}>;
};

function money(value:number){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(value||0)}

export default function AdminEngagementsPage(){
  const [items,setItems]=useState<Engagement[]>([]);const [loading,setLoading]=useState(true);const [query,setQuery]=useState("");const [status,setStatus]=useState("all");
  useEffect(()=>{fetch("/api/admin/engagements",{cache:"no-store"}).then((r)=>{if(!r.ok)throw new Error();return r.json()}).then((data)=>setItems(Array.isArray(data)?data:[])).finally(()=>setLoading(false));},[]);
  const filtered=useMemo(()=>items.filter((item)=>{const matchesStatus=status==="all"||item.status===status;const haystack=`${item.name} ${item.company.name} ${item.address||""}`.toLowerCase();return matchesStatus&&haystack.includes(query.toLowerCase())}),[items,query,status]);
  const active=items.filter((item)=>item.activeOrders>0).length;const budget=items.reduce((sum,item)=>sum+item.totalBudget,0);const margin=items.reduce((sum,item)=>sum+item.totalBudget-item.cost,0);
  return <main className="admin-engagement-page"><section className="admin-engagement-shell"><header className="admin-engagement-hero"><div><span>UPZ Workspace</span><h1>Engagements</h1><p>Manage every property, campaign, work order, asset, deadline, and budget from one operational view.</p></div><Link href="/admin">← Admin Dashboard</Link></header>
  <section className="admin-engagement-stats"><article><span>Total engagements</span><strong>{items.length}</strong></article><article><span>Active workspaces</span><strong>{active}</strong></article><article><span>Tracked budget</span><strong>{money(budget)}</strong></article><article><span>Projected margin</span><strong>{money(margin)}</strong></article></section>
  <div className="admin-engagement-toolbar"><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search property, campaign, or company"/><select value={status} onChange={(e)=>setStatus(e.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="complete">Complete</option><option value="archived">Archived</option></select></div>
  {loading?<p>Loading engagement workspaces...</p>:<section className="admin-engagement-grid">{filtered.map((item)=><Link href={`/admin/engagements/${item.id}`} key={item.id} className="admin-engagement-card"><div className="admin-engagement-card-top"><div><span>{item.company.shortName} · {item.type}</span><h2>{item.name}</h2><p>{[item.address,item.city,item.state].filter(Boolean).join(", ")||"Campaign workspace"}</p></div><em>{item.status}</em></div><div className="admin-engagement-progress"><div><strong>Overall progress</strong><span>{item.progress}%</span></div><i><b style={{width:`${item.progress}%`}}/></i></div><div className="admin-engagement-card-metrics"><div><small>Active orders</small><strong>{item.activeOrders}</strong></div><div><small>Assets</small><strong>{item.assetCount}</strong></div><div><small>Budget</small><strong>{money(item.totalBudget)}</strong></div><div><small>Cost</small><strong>{money(item.cost)}</strong></div></div><div className="admin-engagement-orders">{item.workOrders.slice(0,4).map((order)=><span key={order.id}>{order.title}<b>{order.status.replaceAll("_"," ")}</b></span>)}{item.workOrders.length===0&&<span>No work orders yet</span>}</div><footer>Open workspace <b>→</b></footer></Link>)}</section>}</section></main>;
}
