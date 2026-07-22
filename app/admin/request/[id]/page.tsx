"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type RequestDetail={id:number;type:string;title:string;description?:string|null;priority:string;status:string;createdAt:string;company:{name:string;shortName:string;slug:string;logo?:string|null;primaryColor:string};project?:{id:number}|null};

export default function RequestReviewPage(){
  const params=useParams();const router=useRouter();const id=Array.isArray(params?.id)?params.id[0]:params?.id;
  const [item,setItem]=useState<RequestDetail|null>(null);const [loading,setLoading]=useState(true);const [message,setMessage]=useState("");const [converting,setConverting]=useState(false);const [assignedTo,setAssignedTo]=useState("");const [dueDate,setDueDate]=useState("");
  useEffect(()=>{if(!id)return;fetch(`/api/admin/requests/${id}`).then((res)=>{if(!res.ok)throw new Error("Unable to load request");return res.json();}).then(setItem).catch((err)=>setMessage(err?.message||"Unable to load request")).finally(()=>setLoading(false));},[id]);
  async function convert(){if(!item)return;setConverting(true);setMessage("");try{const response=await fetch(`/api/admin/requests/${item.id}/convert`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:item.title,priority:item.priority,assignedTo,dueDate})});const data=await response.json();if(!response.ok)throw new Error(data?.error||"Unable to create project");router.push(`/admin/project/${data.id}`);}catch(error:any){setMessage(error?.message||"Unable to create project");}finally{setConverting(false);}}
  if(loading)return <main className="admin-page"><section className="admin-simple-state"><h1>Loading request...</h1></section></main>;
  if(!item)return <main className="admin-page"><section className="admin-simple-state"><Link href="/admin/inbox">← Back to Inbox</Link><h1>Request not found</h1>{message&&<p className="admin-error">{message}</p>}</section></main>;
  return <main className="admin-page"><section className="admin-company-detail request-review-page">
    <div className="admin-detail-topbar"><Link href="/admin/inbox">← Back to Inbox</Link><Link href={`/admin/company/${item.company.slug}/requests`}>All {item.company.shortName} Requests</Link></div>
    <header className="admin-detail-hero"><div className="admin-detail-logo" style={{borderColor:item.company.primaryColor}}><img src={item.company.logo||"/upz-logo.svg"} alt=""/></div><div><div className="admin-eyebrow">New Request Review</div><h1>{item.title}</h1><p>{item.company.name} · {item.type} · submitted {new Date(item.createdAt).toLocaleString()}</p></div></header>
    <section className="admin-detail-grid"><article className="admin-detail-card"><span>Request Details</span><h2>Client Intake</h2><div className="request-detail-badges"><b>{item.status}</b><em>{item.priority} priority</em></div><pre className="request-detail-pre">{item.description||"No additional description provided."}</pre></article>
      <article className="admin-detail-card"><span>Project Setup</span><h2>Convert to Project</h2>{item.project?<><p>This request already has an active project.</p><Link className="admin-primary-button" href={`/admin/project/${item.project.id}`}>Open Project Workspace</Link></>:<div className="project-convert-form"><label>Assigned To<input value={assignedTo} onChange={(event)=>setAssignedTo(event.target.value)} placeholder="Team member or vendor"/></label><label>Due Date<input type="date" value={dueDate} onChange={(event)=>setDueDate(event.target.value)}/></label><button className="admin-primary-button" onClick={convert} disabled={converting}>{converting?"Creating Project...":"Convert to Active Project"}</button>{message&&<p className="admin-error">{message}</p>}</div>}</article>
    </section>
  </section></main>;
}
