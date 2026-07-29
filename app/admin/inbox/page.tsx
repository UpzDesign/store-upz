"use client";

import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {AdminEmptyState,AdminHeader,AdminPage,AdminSection,AdminSectionHeader,AdminStats,StatCard} from "@/components/admin/AdminUI";

type InboxItem={id:number;inboxKind?:"request"|"client_activity";type:string;title:string;description?:string|null;priority:string;status:string;createdAt:string;company:{name:string;shortName:string;slug:string;logo?:string|null;primaryColor:string};project?:{id:number;status:string}|null};
const weight:Record<string,number>={urgent:0,high:1,normal:2,low:3};
function cleanDescription(value?:string|null){const raw=(value||"").split("__UPZ_CONTEXT__")[0].trim();return raw.replace(/\s*Attachments:\s*(?:files?|none|n\/a)?\s*/gi,"\n").replace(/\n{3,}/g,"\n\n").trim()||"Open the item to review details.";}
function activityLabel(type:string){if(type==="client_approved")return"Client approved";if(type==="client_revision_requested")return"Revision requested";if(type==="client_reply")return"Client replied";return"Client activity";}

export default function AdminInboxPage(){
  const[items,setItems]=useState<InboxItem[]>([]);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState("");
  useEffect(()=>{fetch("/api/admin/inbox",{cache:"no-store"}).then(res=>{if(!res.ok)throw new Error("Unable to load inbox");return res.json()}).then(data=>setItems(Array.isArray(data)?data:[])).catch(err=>setError(err?.message||"Unable to load inbox")).finally(()=>setLoading(false))},[]);
  const groups=useMemo(()=>({requests:items.filter(item=>item.inboxKind!=="client_activity"),activity:items.filter(item=>item.inboxKind==="client_activity")}),[items]);
  return <AdminPage className="admin-inbox-page">
    <AdminHeader eyebrow="Action Center" title="Admin Inbox" description="Review new requests, client replies, approvals, and revision requests." actions={<span className="admin-inbox-envelope" aria-label="Inbox"/>}/>
    <AdminStats>
      <StatCard label="Pending Requests" value={groups.requests.length}/>
      <StatCard label="Client Activity" value={groups.activity.length}/>
      <StatCard label="Revision Requests" value={items.filter(i=>i.type==="client_revision_requested").length}/>
      <StatCard label="Total" value={items.length}/>
    </AdminStats>
    <AdminSection className="admin-inbox-section">
      <AdminSectionHeader eyebrow="Priority Queue" title="Action required"/>
      {loading&&<p>Loading inbox...</p>}
      {error&&<p className="admin-error">{error}</p>}
      {!loading&&!error&&!items.length&&<AdminEmptyState><h3>Inbox clear</h3><p>There are no open items requiring attention.</p></AdminEmptyState>}
      <div className="admin-inbox-list">{[...items].sort((a,b)=>(weight[a.priority]??2)-(weight[b.priority]??2)).map(item=>{const clientActivity=item.inboxKind==="client_activity";return <article key={item.id} className={`admin-inbox-row ${clientActivity?"is-client-activity":"is-new"} priority-${item.priority}`}><div className="admin-inbox-company"><div className="admin-company-logo" style={{borderColor:item.company.primaryColor}}><img src={item.company.logo||"/upz-logo.svg"} alt=""/></div><div><strong>{item.company.shortName}</strong><span>{item.company.name}</span></div></div><div className="admin-inbox-copy"><div className="admin-inbox-tags"><b>{clientActivity?activityLabel(item.type):"Pending Review"}</b><em>{item.priority} priority</em></div><h3>{item.title}</h3><p>{cleanDescription(item.description)}</p><small>{new Date(item.createdAt).toLocaleString()}</small></div><div className="admin-inbox-actions">{clientActivity&&item.project?<Link className="admin-primary-button" href={`/admin/operations?project=${item.project.id}`}>Open Project</Link>:<Link className="admin-primary-button" href={`/admin/request/${item.id}`}>Review Request</Link>}</div></article>})}</div>
    </AdminSection>
  </AdminPage>;
}