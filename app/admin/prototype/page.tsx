"use client";

import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {AdminButton,AdminCard,AdminEmptyState,AdminHeader,AdminPage,AdminSection,AdminSectionHeader,AdminStats,StatCard} from "@/components/admin/AdminUI";

type InboxItem={id:number;inboxKind?:string;kind?:string;title:string;status:string;priority:string;href?:string;company?:{name:string;shortName:string}};
type Engagement={id:number;name:string;status?:string;projects?:unknown[];workOrders?:unknown[]};
type Operations={engagements?:Engagement[];team?:unknown[]};

const lifecycle=[
 {step:"01",title:"Client Intake",copy:"Property-first, multi-service request with guided selections and a cart-style final summary.",href:"/admin/inbox",action:"Review Requests"},
 {step:"02",title:"Scope + Quote",copy:"Admin validates scope, connects the property, reviews pricing rules, margin, dates, and ownership.",href:"/admin/business-rules",action:"Pricing Rules"},
 {step:"03",title:"Workflow Launch",copy:"Approval converts each service into a work order using the matching workflow template and intake checklist.",href:"/admin/templates",action:"Workflow Templates"},
 {step:"04",title:"Project Management",copy:"Stages, owners, dependencies, client updates, files, approvals, and progress live in one workspace.",href:"/admin/operations",action:"Work Management"},
 {step:"05",title:"Delivery + Approval",copy:"Client-visible stages, deliverables, feedback, revisions, and final files stay connected to the work order.",href:"/admin/deliverables",action:"Deliverables"},
 {step:"06",title:"Marketing Expansion",copy:"Structured property and service data becomes the source for AI-assisted content and next-service recommendations.",href:"/admin/services",action:"Service Library"},
];

const expansion=[
 {trigger:"Photography completed",suggest:"Brochure + listing campaign",generated:"Property overview, photo captions, highlights, social copy, email teaser"},
 {trigger:"Signage approved",suggest:"Launch marketing package",generated:"Installation announcement, social graphics copy, tenant-facing messaging"},
 {trigger:"Branding completed",suggest:"Website + collateral",generated:"Brand voice, website starter copy, brochure language, presentation narrative"},
 {trigger:"Website launched",suggest:"Ongoing campaign",generated:"SEO page briefs, email campaigns, social posts, quarterly property updates"},
];

export default function PrototypeOverview(){
 const[items,setItems]=useState<InboxItem[]>([]),[operations,setOperations]=useState<Operations>({}),[loading,setLoading]=useState(true);
 useEffect(()=>{Promise.all([fetch("/api/admin/inbox",{cache:"no-store"}).then(r=>r.ok?r.json():[]),fetch("/api/admin/operations",{cache:"no-store"}).then(r=>r.ok?r.json():{})]).then(([inbox,ops])=>{setItems(Array.isArray(inbox)?inbox:[]);setOperations(ops||{})}).finally(()=>setLoading(false))},[]);
 const stats=useMemo(()=>({requests:items.filter(item=>item.inboxKind==="request").length,attention:items.length,properties:Array.isArray(operations.engagements)?operations.engagements.length:0,team:Array.isArray(operations.team)?operations.team.length:0}),[items,operations]);
 const recentRequests=items.filter(item=>item.inboxKind==="request").slice(0,5);
 return <AdminPage className="prototype-overview-page">
  <AdminHeader eyebrow="Prototype Foundation" title="End-to-End Operations Flow" description="A connected demo path from client intake through quoting, workflow generation, project execution, delivery, and AI-ready marketing expansion." actions={<><AdminButton href="/admin/inbox">Open Action Center</AdminButton><AdminButton variant="outline" href="/admin/operations">Work Management</AdminButton></>}/>
  <AdminStats><StatCard label="Pending Requests" value={stats.requests}/><StatCard label="Attention Items" value={stats.attention}/><StatCard label="Projects / Properties" value={stats.properties}/><StatCard label="Team Members" value={stats.team}/></AdminStats>
  <AdminSection><AdminSectionHeader eyebrow="Core Lifecycle" title="Prototype operating model"/><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:14}}>{lifecycle.map(item=><AdminCard key={item.step}><span>{item.step}</span><h3>{item.title}</h3><p>{item.copy}</p><Link href={item.href}>{item.action} →</Link></AdminCard>)}</div></AdminSection>
  <AdminSection><AdminSectionHeader eyebrow="Live Intake" title="Requests entering the workflow" actions={<AdminButton variant="outline" href="/admin/inbox">View All</AdminButton>}/>{loading?<p>Loading live workflow...</p>:recentRequests.length?<div style={{display:"grid",gap:10}}>{recentRequests.map(item=><Link key={item.id} href={item.href||`/admin/request/${item.id}`} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:12,padding:14,border:"1px solid rgba(0,0,0,.1)",borderRadius:12,textDecoration:"none",color:"inherit"}}><div><strong>{item.title}</strong><p style={{margin:"4px 0 0",fontSize:12}}>{item.company?.name||"Client"} · {item.priority} priority</p></div><span>Scope → Quote → Launch</span></Link>)}</div>:<AdminEmptyState><h3>No pending requests</h3><p>Submit a client request to demonstrate the full lifecycle.</p></AdminEmptyState>}</AdminSection>
  <AdminSection><AdminSectionHeader eyebrow="AI-Ready Expansion" title="Next-service and generated-content logic"/><p>The prototype does not need autonomous AI decisions yet. The important foundation is that intake answers, property context, deliverables, and completed work can drive suggested marketing outputs and services.</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:12}}>{expansion.map(item=><AdminCard key={item.trigger} variant="compact"><span>When</span><strong>{item.trigger}</strong><p><b>Suggest:</b> {item.suggest}</p><p><b>Generate:</b> {item.generated}</p></AdminCard>)}</div></AdminSection>
  <AdminSection><AdminSectionHeader eyebrow="Demo Story" title="What we should be able to show"/><ol style={{display:"grid",gap:10,paddingLeft:20}}><li>Client creates one property request and selects multiple services.</li><li>Action Center receives the coordinated request and admin reviews one service scope.</li><li>Pricing engine suggests a quote; admin can override cost, price, schedule, and owner.</li><li>Approval generates the service workflow and work order under the property.</li><li>Operations and Project Workspace manage tasks, files, client approvals, and progress.</li><li>Completion exposes expansion opportunities and AI-ready marketing-content prompts using the same structured project data.</li></ol></AdminSection>
 </AdminPage>;
}
