"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

type MarketingRequest = { id:number; type:string; title:string; description?:string|null; priority:string; status:string; createdAt:string; updatedAt:string; project?:{id:number;status:string}|null };
type Company = { name:string; slug:string; shortName:string; primaryColor:string; requests?:MarketingRequest[] };

const STATUS_OPTIONS=["open","reviewing","quoted","approved","in-progress","proofing","complete","cancelled"];
const PRIORITY_OPTIONS=["normal","high","urgent"];
const priorityWeight:Record<string,number>={urgent:0,high:1,normal:2};
const isNew=(request:MarketingRequest)=>!["complete","completed","cancelled","closed"].includes(request.status.toLowerCase())&&(!request.project||request.project.status.toLowerCase()==="new");

export default function AdminRequestsPage(){
  const params=useParams();
  const searchParams=useSearchParams();
  const slug=Array.isArray(params?.slug)?params.slug[0]:params?.slug;
  const focusedId=Number(searchParams.get("request")||0);
  const [company,setCompany]=useState<Company|null>(null);
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(true);

  function loadCompany(){if(!slug)return;setLoading(true);fetch(`/api/admin/companies/${slug}`).then((response)=>{if(!response.ok)throw new Error("Company not found");return response.json();}).then(setCompany).catch((error)=>setMessage(error?.message||"Unable to load requests")).finally(()=>setLoading(false));}
  useEffect(()=>{loadCompany();},[slug]);

  async function updateRequest(request:MarketingRequest,updates:Partial<MarketingRequest>){setMessage("");try{const response=await fetch(`/api/admin/requests/${request.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({...request,...updates})});const data=await response.json();if(!response.ok)throw new Error(data?.error||"Unable to update request");setCompany((current)=>current?{...current,requests:(current.requests||[]).map((item)=>item.id===request.id?{...item,...data}:item)}:current);setMessage("Request updated.");}catch(error:any){setMessage(error?.message||"Unable to update request");}}
  async function deleteRequest(request:MarketingRequest){if(!window.confirm(`Delete request ${request.title}?`))return;setMessage("");try{const response=await fetch(`/api/admin/requests/${request.id}`,{method:"DELETE"});const data=await response.json();if(!response.ok)throw new Error(data?.error||"Unable to delete request");setCompany((current)=>current?{...current,requests:(current.requests||[]).filter((item)=>item.id!==request.id)}:current);setMessage("Request deleted.");}catch(error:any){setMessage(error?.message||"Unable to delete request");}}

  if(loading)return <main className="admin-page"><section className="admin-simple-state"><h1>Loading requests...</h1></section></main>;
  if(!company)return <main className="admin-page"><section className="admin-simple-state"><Link href="/admin">← Back to Admin</Link><h1>Company not found</h1></section></main>;

  const requests=[...(company.requests||[])].sort((a,b)=>{const newDiff=Number(isNew(b))-Number(isNew(a));if(newDiff)return newDiff;const priorityDiff=(priorityWeight[a.priority]??2)-(priorityWeight[b.priority]??2);if(priorityDiff)return priorityDiff;return new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime();});
  const newCount=requests.filter(isNew).length;

  return <main className="admin-page"><section className="admin-company-detail">
    <div className="admin-detail-topbar"><Link href={`/admin/company/${company.slug}`}>← Back to {company.name}</Link><div><Link href="/admin/inbox">Open Inbox</Link> · <Link href={`/portal/${company.slug}`}>Open Portal</Link></div></div>
    <header className="admin-detail-hero"><div className="admin-detail-logo" style={{borderColor:company.primaryColor}}><span>{company.shortName}</span></div><div><div className="admin-eyebrow">Project Requests</div><h1>{company.shortName} Requests</h1><p>New and urgent requests are automatically moved to the top until their status advances or a project is created.</p></div></header>
    <section className="admin-stat-grid">{[["New",newCount],["Urgent",requests.filter(r=>r.priority==="urgent"&&isNew(r)).length],["High",requests.filter(r=>r.priority==="high"&&isNew(r)).length],["Total",requests.length]].map(([label,value])=><article className="admin-stat-card" key={String(label)}><span>{label}</span><strong>{value}</strong></article>)}</section>
    {newCount>0&&<section className="admin-request-alert"><div><span>Action Required</span><h2>{newCount} new request{newCount===1?"":"s"} awaiting review</h2><p>Review priority, update the workflow status, or convert the request into an active project.</p></div><Link href="/admin/inbox">View Admin Inbox</Link></section>}
    <section className="admin-section"><div className="admin-section-heading"><div><span>Priority Queue</span><h2>{requests.length} total</h2></div></div>{message&&<p className="admin-error">{message}</p>}
      <div className="admin-request-list">{requests.length===0?<p>No project requests have been submitted yet.</p>:requests.map((request)=><article id={`request-${request.id}`} key={request.id} className={`admin-request-card ${isNew(request)?"is-new":""} priority-${request.priority} ${focusedId===request.id?"is-focused":""}`}>
        <div className="admin-request-card-head"><div><div className="admin-request-flags">{isNew(request)&&<b>New Request</b>}<em>{request.priority} priority</em><span>{request.type}</span></div><h3>{request.title}</h3></div><small>{new Date(request.createdAt).toLocaleString()}</small></div>
        {request.description&&<pre>{request.description}</pre>}
        <div className="admin-request-controls"><label>Status<select value={request.status} onChange={(event)=>updateRequest(request,{status:event.target.value})}>{STATUS_OPTIONS.map((status)=><option key={status} value={status}>{status}</option>)}</select></label><label>Priority<select value={request.priority} onChange={(event)=>updateRequest(request,{priority:event.target.value})}>{PRIORITY_OPTIONS.map((priority)=><option key={priority} value={priority}>{priority[0].toUpperCase()+priority.slice(1)}</option>)}</select></label>{request.project?<Link className="admin-primary-button" href={`/admin/project/${request.project.id}`}>Open Project</Link>:<Link className="admin-primary-button" href={`/admin/request/${request.id}`}>Review & Convert</Link>}<button onClick={()=>deleteRequest(request)}>Delete</button></div>
      </article>)}</div>
    </section>
  </section></main>;
}
