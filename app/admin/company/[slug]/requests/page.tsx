"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import CompanyLogo from "@/components/CompanyLogo";
import { AdminButton, AdminEmptyState, AdminHeader, AdminPage, AdminSection, AdminSectionHeader, AdminStats, StatCard } from "@/components/admin/AdminUI";

type MarketingRequest={id:number;type:string;title:string;description?:string|null;priority:string;status:string;createdAt:string;updatedAt:string;project?:{id:number;status:string}|null};
type Company={name:string;slug:string;shortName:string;logo?:string|null;logoType?:string|null;logoText?:string|null;logoTextColor?:string|null;logoFontStyle?:string|null;primaryColor:string;requests?:MarketingRequest[]};
const priorityWeight:Record<string,number>={urgent:0,high:1,normal:2};
const pending=(request:MarketingRequest)=>!["approved","declined","cancelled","complete","completed","closed"].includes(request.status.toLowerCase())&&!request.project;
function preview(value?:string|null){return(value||"").split("__UPZ_CONTEXT__")[0].trim()||"Open the request to review all submitted details.";}

export default function AdminRequestsPage(){
 const params=useParams();const searchParams=useSearchParams();const slug=Array.isArray(params?.slug)?params.slug[0]:params?.slug;const focusedId=Number(searchParams.get("request")||0);
 const[company,setCompany]=useState<Company|null>(null);const[message,setMessage]=useState("");const[loading,setLoading]=useState(true);
 useEffect(()=>{if(!slug)return;setLoading(true);fetch(`/api/admin/companies/${slug}`,{cache:"no-store"}).then(r=>{if(!r.ok)throw new Error("Company not found");return r.json()}).then(setCompany).catch(e=>setMessage(e?.message||"Unable to load requests")).finally(()=>setLoading(false))},[slug]);
 if(loading)return <AdminPage><AdminEmptyState>Loading requests...</AdminEmptyState></AdminPage>;
 if(!company)return <AdminPage><AdminEmptyState>Company not found</AdminEmptyState></AdminPage>;
 const requests=[...(company.requests||[])].sort((a,b)=>Number(pending(b))-Number(pending(a))||((priorityWeight[a.priority]??2)-(priorityWeight[b.priority]??2))||new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
 const pendingCount=requests.filter(pending).length;const approvedCount=requests.filter(request=>Boolean(request.project)||request.status.toLowerCase()==="approved").length;const declinedCount=requests.filter(request=>request.status.toLowerCase()==="declined").length;
 const logo=<div className="admin-company-header-logo" style={{borderColor:company.primaryColor}}><CompanyLogo company={company}/></div>;
 return <AdminPage className="company-requests-page">
  <AdminHeader eyebrow={`${company.shortName} Workspace`} title="Project Requests" description={`Review submissions from ${company.name}, approve them into work orders, or decline them with a client-visible reason.`} actions={<>{logo}<AdminButton variant="outline" href={`/admin/company/${company.slug}`}>Company Workspace</AdminButton><AdminButton href="/admin/inbox">Admin Inbox</AdminButton></>}/>
  <AdminStats><StatCard label="Pending review" value={pendingCount}/><StatCard label="Approved" value={approvedCount}/><StatCard label="Declined" value={declinedCount}/><StatCard label="Total requests" value={requests.length}/></AdminStats>
  {pendingCount>0&&<section className="admin-request-alert"><div><span>Action required</span><h2>{pendingCount} request{pendingCount===1?"":"s"} awaiting review</h2><p>Open each request to confirm ownership, schedule, workflow stages, and client visibility.</p></div><AdminButton href="/admin/inbox">View Inbox</AdminButton></section>}
  <AdminSection><AdminSectionHeader eyebrow="Request History" title={`${requests.length} total requests`}/>{message&&<p className="admin-error">{message}</p>}<div className="admin-request-list">{!requests.length?<AdminEmptyState>No project requests have been submitted yet.</AdminEmptyState>:requests.map(request=><article id={`request-${request.id}`} key={request.id} className={`admin-request-card ${pending(request)?"is-new":""} priority-${request.priority} ${focusedId===request.id?"is-focused":""}`}><div className="admin-request-card-head"><div><div className="admin-request-flags"><b>{pending(request)?"Pending Review":request.status.replaceAll("_"," ")}</b><em>{request.priority} priority</em><span>{request.type}</span></div><h3>{request.title}</h3></div><small>{new Date(request.createdAt).toLocaleString()}</small></div><p className="admin-request-preview">{preview(request.description)}</p><div className="admin-request-controls">{request.project?<AdminButton href={`/admin/operations?project=${request.project.id}`}>Open Work Order</AdminButton>:<AdminButton href={`/admin/request/${request.id}`}>{pending(request)?"Review Request":"View Decision"}</AdminButton>}</div></article>)}</div></AdminSection>
 </AdminPage>;
}
