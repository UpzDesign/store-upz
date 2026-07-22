"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type InboxItem = {
  id:number; type:string; title:string; description?:string|null; priority:string; status:string; createdAt:string;
  company:{name:string;shortName:string;slug:string;logo?:string|null;primaryColor:string};
  project?:{id:number;status:string}|null;
};

const weight:Record<string,number>={urgent:0,high:1,normal:2,low:3};

export default function AdminInboxPage(){
  const [items,setItems]=useState<InboxItem[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  useEffect(()=>{fetch("/api/admin/inbox").then((res)=>{if(!res.ok)throw new Error("Unable to load inbox");return res.json();}).then((data)=>setItems(Array.isArray(data)?data:[])).catch((err)=>setError(err?.message||"Unable to load inbox")).finally(()=>setLoading(false));},[]);

  const groups=useMemo(()=>({
    new:items.filter((item)=>!item.project||item.project.status.toLowerCase()==="new"),
    active:items.filter((item)=>item.project&&item.project.status.toLowerCase()!=="new"),
  }),[items]);

  return <main className="admin-page"><section className="admin-company-detail admin-inbox-page">
    <div className="admin-detail-topbar"><Link href="/admin">← Back to Admin</Link><span>{items.length} items need attention</span></div>
    <header className="admin-detail-hero"><div className="admin-detail-logo admin-inbox-icon">!</div><div><div className="admin-eyebrow">Action Center</div><h1>Admin Inbox</h1><p>New requests, urgent work, and active client items are prioritized here in one operational queue.</p></div></header>
    <section className="admin-stat-grid">{[["New Requests",groups.new.length],["Urgent",items.filter(i=>i.priority==="urgent").length],["High Priority",items.filter(i=>i.priority==="high").length],["Active",groups.active.length]].map(([label,value])=><article className="admin-stat-card" key={String(label)}><span>{label}</span><strong>{value}</strong></article>)}</section>
    <section className="admin-section admin-inbox-section"><div className="admin-section-heading"><div><span>Priority Queue</span><h2>Action required</h2></div></div>
      {loading&&<p>Loading inbox...</p>}{error&&<p className="admin-error">{error}</p>}
      {!loading&&!error&&items.length===0&&<div className="admin-empty-inbox"><h3>Inbox clear</h3><p>There are no open requests requiring attention.</p></div>}
      <div className="admin-inbox-list">{items.sort((a,b)=>(weight[a.priority]??2)-(weight[b.priority]??2)).map((item)=>{
        const isNew=!item.project||item.project.status.toLowerCase()==="new";
        return <article key={item.id} className={`admin-inbox-row ${isNew?"is-new":""} priority-${item.priority}`}>
          <div className="admin-inbox-company"><div className="admin-company-logo" style={{borderColor:item.company.primaryColor}}><img src={item.company.logo||"/upz-logo.svg"} alt=""/></div><div><strong>{item.company.shortName}</strong><span>{item.company.name}</span></div></div>
          <div className="admin-inbox-copy"><div className="admin-inbox-tags"><b>{isNew?"New Request":item.project?.status}</b><em>{item.priority} priority</em><span>{item.type}</span></div><h3>{item.title}</h3><p>{item.description||"No additional description provided."}</p><small>Submitted {new Date(item.createdAt).toLocaleString()}</small></div>
          <div className="admin-inbox-actions"><Link className="admin-primary-button" href={`/admin/company/${item.company.slug}/requests?request=${item.id}`}>Review Request</Link>{item.project&&<Link className="admin-secondary-button" href={`/admin/project/${item.project.id}`}>Open Project</Link>}</div>
        </article>;
      })}</div>
    </section>
  </section></main>;
}
