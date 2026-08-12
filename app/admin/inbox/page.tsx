"use client";

import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {AdminButton,AdminEmptyState,AdminHeader,AdminPage,AdminSection,AdminSectionHeader,AdminStats,AdminTabs,AdminToolbar,StatCard} from "@/components/admin/AdminUI";

type InboxItem={id:number;inboxKind?:"request"|"client_activity"|"operation";kind?:string;type:string;title:string;description?:string|null;priority:string;status:string;createdAt:string;actionLabel?:string;href?:string;company:{name:string;shortName:string;slug:string;logo?:string|null;primaryColor:string};project?:{id:number;status:string}|null};
const weight:Record<string,number>={urgent:0,high:1,normal:2,low:3};
function cleanDescription(value?:string|null){const raw=(value||"").split("__UPZ_CONTEXT__")[0].trim();return raw.replace(/\s*Attachments:\s*(?:files?|none|n\/a)?\s*/gi,"\n").replace(/\n{3,}/g,"\n\n").trim()||"Open the item to review details.";}
function itemLabel(item:InboxItem){if(item.kind==="overdue_stage")return"Overdue Stage";if(item.kind==="unassigned_stage")return"Unassigned Stage";if(item.kind==="blocked_stage")return"Blocked Workflow";if(item.kind==="waiting_client")return"Waiting Client";if(item.type==="client_revision_requested")return"Revision Requested";if(item.inboxKind==="client_activity")return"Client Response";return"Pending Request";}

export default function AdminInboxPage(){
 const[items,setItems]=useState<InboxItem[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[tab,setTab]=useState("all"),[query,setQuery]=useState("");
 useEffect(()=>{fetch("/api/admin/inbox",{cache:"no-store"}).then(res=>{if(!res.ok)throw new Error("Unable to load action center");return res.json()}).then(data=>setItems(Array.isArray(data)?data:[])).catch(err=>setError(err?.message||"Unable to load action center")).finally(()=>setLoading(false))},[]);
 const groups=useMemo(()=>({requests:items.filter(item=>item.inboxKind==="request"),clients:items.filter(item=>item.inboxKind==="client_activity"),operations:items.filter(item=>item.inboxKind==="operation"),urgent:items.filter(item=>item.priority==="urgent")}),[items]);
 const filtered=useMemo(()=>items.filter(item=>{const matchesTab=tab==="all"||(tab==="requests"&&item.inboxKind==="request")||(tab==="client"&&item.inboxKind==="client_activity")||(tab==="operations"&&item.inboxKind==="operation")||(tab==="urgent"&&item.priority==="urgent");const text=`${item.title} ${item.description||""} ${item.company.name} ${item.company.shortName} ${itemLabel(item)}`.toLowerCase();return matchesTab&&text.includes(query.trim().toLowerCase())}).sort((a,b)=>(weight[a.priority]??2)-(weight[b.priority]??2)||new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()),[items,tab,query]);
 return <AdminPage className="admin-inbox-page activity-center-page">
  <AdminHeader eyebrow="Operations" title="Action Center" description="One priority queue for requests, client responses, overdue stages, assignments, and blocked work." actions={<><AdminButton variant="outline" href="/admin/prototype">Prototype Flow</AdminButton><AdminButton href="/admin/operations">Open Work Management</AdminButton></>}/>
  <AdminStats><StatCard label="Urgent" value={groups.urgent.length}/><StatCard label="Requests" value={groups.requests.length}/><StatCard label="Client Responses" value={groups.clients.length}/><StatCard label="Operations" value={groups.operations.length}/></AdminStats>
  <AdminTabs className="activity-center-tabs">{[["all","All"],["urgent","Urgent"],["requests","Requests"],["client","Client Activity"],["operations","Work Management"]].map(([id,label])=><button type="button" key={id} className={tab===id?"active":""} onClick={()=>setTab(id)}>{label}</button>)}</AdminTabs>
  <AdminToolbar className="activity-center-toolbar"><div className="activity-center-controls"><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search projects, companies, stages, or activity..."/></div><span>{filtered.length} item{filtered.length===1?"":"s"}</span></AdminToolbar>
  <AdminSection className="activity-action-section"><AdminSectionHeader eyebrow="Priority Queue" title="Action required"/>
   {loading&&<p>Loading action center...</p>}{error&&<p className="admin-error">{error}</p>}
   {!loading&&!error&&!filtered.length&&<AdminEmptyState><h3>Queue clear</h3><p>No items match this view.</p></AdminEmptyState>}
   <div className="activity-center-feed activity-center-priority-feed">{filtered.map(item=><Link key={`${item.inboxKind}-${item.id}`} href={item.href||(item.project?`/admin/project/${item.project.id}`:`/admin/request/${item.id}`)} className={`activity-center-item kind-${item.kind||item.inboxKind||"request"}`} style={{"--activity-client":item.company.primaryColor} as React.CSSProperties}><span className="activity-center-marker"><i/></span><div className="activity-center-copy"><div className="activity-center-meta"><span>{item.company.shortName}</span><b>{itemLabel(item)}</b><em>{item.priority} priority</em></div><div className="activity-center-summary"><h2>{item.title}</h2><p>{cleanDescription(item.description)}</p></div><small>{new Date(item.createdAt).toLocaleString()}</small></div><div className="activity-center-action"><span>{item.actionLabel||"Open"}</span><small>{item.company.name}</small></div></Link>)}</div>
  </AdminSection>
 </AdminPage>;
}