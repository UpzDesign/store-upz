"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const ADMIN_PASSWORD = "upzadmin";

type AdminCompany = { id:number; name:string; slug:string; shortName:string; logo?:string|null; primaryColor:string; secondaryColor:string; heroText:string; printfulTokenEnv?:string|null; portalEnabled:boolean; newRequestCount?:number };
type InboxItem = { id:number; type:string; title:string; priority:string; status:string; createdAt:string; company:{name:string;shortName:string;slug:string;primaryColor:string}; project?:{id:number;status:string}|null };

export default function AdminPage() {
  const [password,setPassword]=useState("");
  const [authenticated,setAuthenticated]=useState(false);
  const [error,setError]=useState("");
  const [companies,setCompanies]=useState<AdminCompany[]>([]);
  const [inbox,setInbox]=useState<InboxItem[]>([]);
  const [loadingCompanies,setLoadingCompanies]=useState(false);
  const [companyError,setCompanyError]=useState("");

  useEffect(()=>{if(typeof window!=="undefined"&&window.localStorage.getItem("upz_admin")==="true")setAuthenticated(true);},[]);
  useEffect(()=>{if(!authenticated)return;setLoadingCompanies(true);setCompanyError("");Promise.all([
    fetch("/api/admin/companies",{cache:"no-store"}).then((response)=>{if(!response.ok)throw new Error("Unable to load companies");return response.json();}),
    fetch("/api/admin/inbox",{cache:"no-store"}).then((response)=>response.ok?response.json():[]),
  ]).then(([companyData,inboxData])=>{setCompanies(Array.isArray(companyData)?companyData:[]);setInbox(Array.isArray(inboxData)?inboxData:[]);}).catch((err)=>setCompanyError(err?.message||"Unable to load companies")).finally(()=>setLoadingCompanies(false));},[authenticated]);

  const totalNew=useMemo(()=>companies.reduce((sum,company)=>sum+Number(company.newRequestCount||0),0),[companies]);
  const stats=useMemo(()=>[
    {label:"New Requests",value:totalNew},
    {label:"Urgent",value:inbox.filter((item)=>item.priority==="urgent").length},
    {label:"Active Portals",value:companies.filter((company)=>company.portalEnabled).length},
    {label:"Companies",value:companies.length},
  ],[companies,inbox,totalNew]);

  function handleLogin(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(password.trim()!==ADMIN_PASSWORD){setError("Invalid admin password.");return;}window.localStorage.setItem("upz_admin","true");setAuthenticated(true);setError("");}

  if(!authenticated)return <main className="admin-page admin-login-page"><section className="admin-login-card"><div className="admin-eyebrow">UPZ Brand Portal</div><h1>Admin Access</h1><p>Manage company portals, brand settings, products, requests, and orders from one control center.</p><form onSubmit={handleLogin} className="admin-login-form"><label>Password<input type="password" value={password} onChange={(event)=>setPassword(event.target.value)} placeholder="Enter admin password"/></label>{error&&<div className="admin-error">{error}</div>}<button type="submit">Enter Admin</button></form></section></main>;

  return <main className="admin-page"><section className="admin-shell">
    <aside className="admin-sidebar"><img src="/upz-logo.svg" alt="UPZ Design"/><nav><a href="#dashboard">Dashboard</a><Link href="/admin/inbox">Inbox {totalNew>0?`(${totalNew})`:""}</Link><a href="#companies">Companies</a><Link href="/admin/services">Service Library</Link><a href="#integrations">Integrations</a></nav></aside>
    <div className="admin-main">
      <header id="dashboard" className="admin-hero"><div><div className="admin-eyebrow">UPZ Admin</div><h1>Brand Portal Control Center</h1><p>Incoming client work is prioritized first. Review new requests, convert approved work into projects, and manage every company portal.</p></div><Link className="admin-primary-button" href="/admin/new-company">+ New Company</Link></header>
      <section className="admin-stat-grid">{stats.map((stat)=><article key={stat.label} className="admin-stat-card"><span>{stat.label}</span><strong>{stat.value}</strong></article>)}</section>

      {totalNew>0&&<section className="admin-action-required"><div><span>New Activity</span><h2>{totalNew} new request{totalNew===1?"":"s"}</h2><p>Review each new submission, set priority, or convert it into an active project.</p></div><Link className="admin-primary-button" href="/admin/inbox">Open Admin Inbox</Link></section>}

      {inbox.length>0&&<section className="admin-section admin-dashboard-inbox"><div className="admin-section-heading"><div><span>Inbox</span><h2>Latest client activity</h2></div><Link className="admin-secondary-button" href="/admin/inbox">View All</Link></div><div className="admin-inbox-list">{inbox.slice(0,4).map((item)=>{const isNew=!item.project||item.project.status.toLowerCase()==="new";return <article key={item.id} className={`admin-inbox-row ${isNew?"is-new":""} priority-${item.priority}`}><div className="admin-inbox-company"><div><strong>{item.company.shortName}</strong><span>{item.company.name}</span></div></div><div className="admin-inbox-copy"><div className="admin-inbox-tags"><b>{isNew?"New Request":item.project?.status}</b><em>{item.priority} priority</em><span>{item.type}</span></div><h3>{item.title}</h3><small>{new Date(item.createdAt).toLocaleString()}</small></div><div className="admin-inbox-actions"><Link className="admin-primary-button" href={`/admin/request/${item.id}`}>Review</Link></div></article>;})}</div></section>}

      <section id="companies" className="admin-section"><div className="admin-section-heading"><div><span>Companies</span><h2>Active client portals</h2></div></div>{loadingCompanies&&<p>Loading companies...</p>}{companyError&&<p className="admin-error">{companyError}</p>}<div className="admin-company-grid">{companies.map((company)=>{const count=Number(company.newRequestCount||0);return <article key={company.id} className={`admin-company-card ${count>0?"has-new-requests":""}`}>{count>0&&<Link className="admin-request-badge" href={`/admin/company/${company.slug}/requests`}>{count} new request{count===1?"":"s"}</Link>}<div className="admin-company-logo" style={{borderColor:company.primaryColor}}><img src={company.logo||"/upz-logo.svg"} alt={`${company.name} logo`}/></div><div><span style={{color:company.primaryColor}}>{company.shortName}</span><h3>{company.name}</h3><p>{company.heroText}</p></div><div className="admin-company-meta"><div><strong>Status</strong><span>{company.portalEnabled?"Active":"Disabled"}</span></div><div><strong>Requests</strong><Link href={`/admin/company/${company.slug}/requests`}>{count?`${count} new` : "View Requests"}</Link></div><div><strong>Manage</strong><Link href={`/admin/company/${company.slug}`}>Company Settings</Link></div><div><strong>Portal</strong><Link href={`/portal/${company.slug}`}>Open Portal</Link></div></div></article>;})}</div></section>

      <section id="integrations" className="admin-section"><div className="admin-section-heading"><div><span>Integrations</span><h2>Connected platforms</h2></div></div><div className="admin-integration-grid"><article className="admin-integration-card"><div><span>Product API</span><h3>Printful</h3><p>Manage synced merchandise, variants, fulfillment settings, and source product data.</p></div><div className="admin-integration-actions"><a href="https://www.printful.com/dashboard" target="_blank" rel="noreferrer">Open Printful Dashboard</a><a href="https://developers.printful.com/docs/" target="_blank" rel="noreferrer">API Documentation</a></div></article></div></section>
    </div>
  </section></main>;
}
