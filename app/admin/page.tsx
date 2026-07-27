"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const ADMIN_PASSWORD = "upzadmin";
type AdminCompany = { id:number; portalEnabled:boolean };
type InboxItem = { id:number; type:string; title:string; priority:string; status:string; createdAt:string; company:{name:string;shortName:string;slug:string;primaryColor:string}; project?:{id:number;status:string}|null };

export default function AdminPage() {
  const [password,setPassword]=useState("");
  const [authenticated,setAuthenticated]=useState(false);
  const [error,setError]=useState("");
  const [companies,setCompanies]=useState<AdminCompany[]>([]);
  const [inbox,setInbox]=useState<InboxItem[]>([]);
  const [activeProjects,setActiveProjects]=useState(0);
  const [loading,setLoading]=useState(false);

  useEffect(()=>{if(window.localStorage.getItem("upz_admin")==="true")setAuthenticated(true);},[]);
  useEffect(()=>{if(!authenticated)return;setLoading(true);Promise.all([
    fetch("/api/admin/companies",{cache:"no-store"}).then((response)=>response.ok?response.json():[]),
    fetch("/api/admin/inbox",{cache:"no-store"}).then((response)=>response.ok?response.json():[]),
    fetch("/api/admin/operations",{cache:"no-store"}).then((response)=>response.ok?response.json():{projects:[]}),
  ]).then(([companyData,inboxData,operationsData])=>{setCompanies(Array.isArray(companyData)?companyData:[]);setInbox(Array.isArray(inboxData)?inboxData:[]);const projects=Array.isArray(operationsData?.projects)?operationsData.projects:[];setActiveProjects(projects.filter((project:any)=>!["complete","completed","cancelled"].includes(String(project.status).toLowerCase())).length);}).finally(()=>setLoading(false));},[authenticated]);

  const totalNew=inbox.length;
  const stats=useMemo(()=>[
    {label:"New Requests",value:totalNew},
    {label:"Urgent",value:inbox.filter((item)=>item.priority==="urgent").length},
    {label:"Active Projects",value:activeProjects},
    {label:"Active Portals",value:companies.filter((company)=>company.portalEnabled).length},
  ],[companies,inbox,totalNew,activeProjects]);

  function handleLogin(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(password.trim()!==ADMIN_PASSWORD){setError("Invalid admin password.");return;}window.localStorage.setItem("upz_admin","true");window.dispatchEvent(new Event("upz-admin-auth"));setAuthenticated(true);setError("");}

  if(!authenticated)return <main className="admin-page admin-login-page"><section className="admin-login-card"><div className="admin-eyebrow">UPZ Brand Portal</div><h1>Admin Access</h1><p>Manage company portals, services, products, projects, and brand assets from one control center.</p><form onSubmit={handleLogin} className="admin-login-form"><label>Password<input type="password" value={password} onChange={(event)=>setPassword(event.target.value)} placeholder="Enter admin password"/></label>{error&&<div className="admin-error">{error}</div>}<button type="submit">Enter Admin</button></form></section></main>;

  return <main className="admin-page admin-dashboard-page"><section className="admin-main">
    <header id="dashboard" className="admin-hero"><div><div className="admin-eyebrow">UPZ Admin</div><h1>Creative Operations</h1><p>Manage active work, schedules, team assignments, client requests, and the settings that power each portal.</p></div><Link className="admin-primary-button" href="/admin/operations">Open Operations</Link></header>
    <section className="admin-stat-grid">{stats.map((stat)=><article key={stat.label} className="admin-stat-card"><span>{stat.label}</span><strong>{loading?"—":stat.value}</strong></article>)}</section>
    {totalNew>0&&<section className="admin-action-required"><div><span>New Activity</span><h2>{totalNew} new request{totalNew===1?"":"s"}</h2><p>Review each submission and either approve it as a project or decline it.</p></div><Link className="admin-primary-button" href="/admin/inbox">Review Requests</Link></section>}
    <section className="admin-section admin-dashboard-inbox"><div className="admin-section-heading"><div><span>Request Queue</span><h2>Pending client requests</h2></div><Link className="admin-secondary-button" href="/admin/inbox">View All</Link></div>{inbox.length?<div className="admin-inbox-list">{inbox.slice(0,5).map((item)=><article key={item.id} className={`admin-inbox-row is-new priority-${item.priority}`}><div className="admin-inbox-company"><div><strong>{item.company.shortName}</strong><span>{item.company.name}</span></div></div><div className="admin-inbox-copy"><div className="admin-inbox-tags"><b>New Request</b><em>{item.priority} priority</em><span>{item.type}</span></div><h3>{item.title}</h3><small>{new Date(item.createdAt).toLocaleString()}</small></div><div className="admin-inbox-actions"><Link className="admin-primary-button" href={`/admin/request/${item.id}`}>Review</Link></div></article>)}</div>:<p>No requests are waiting for review.</p>}</section>
    <section className="admin-section"><div className="admin-section-heading"><div><span>Admin Settings</span><h2>Workspace configuration</h2></div></div><div className="admin-dashboard-settings"><article><span>Clients</span><h3>Companies</h3><p>Manage portal branding, access, and client-specific settings.</p><Link href="/admin/companies">Manage companies →</Link></article><article><span>Projects</span><h3>Engagements</h3><p>Organize related work by client, property, or campaign.</p><Link href="/admin/engagements">View engagements →</Link></article><article><span>Production</span><h3>Team Directory</h3><p>Manage the people available for project and task assignment.</p><Link href="/admin/team">Manage team →</Link></article><article><span>Configuration</span><h3>Service Library</h3><p>Manage available services and concise client intake forms.</p><Link href="/admin/services">Manage services →</Link></article><article><span>Production</span><h3>Operations Board</h3><p>Assign work, update progress, manage tasks, and move projects through production.</p><Link href="/admin/operations">Open board →</Link></article></div></section>
  </section></main>;
}