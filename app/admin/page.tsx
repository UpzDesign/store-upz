"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminButton, AdminCard, AdminGrid, AdminHeader, AdminNotice, AdminPage, AdminSection, AdminSectionHeader, AdminStats, StatCard } from "@/components/admin/AdminUI";

const ADMIN_PASSWORD = "upzadmin";
type AdminCompany = { id:number; portalEnabled:boolean };
type InboxItem = { id:number; type:string; title:string; priority:string; status:string; createdAt:string; company:{name:string;shortName:string;slug:string;primaryColor:string}; project?:{id:number;status:string}|null };

export default function AdminDashboardPage() {
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

  return <AdminPage className="admin-dashboard-page">
    <AdminHeader eyebrow="UPZ Admin" title="Creative Operations" description="Manage active work, schedules, team assignments, client requests, and the settings that power each portal." actions={<AdminButton href="/admin/operations">Open Operations</AdminButton>}/>
    <AdminStats>{stats.map((stat)=><StatCard key={stat.label} label={stat.label} value={loading?"—":stat.value}/>)}</AdminStats>
    {totalNew>0&&<AdminNotice><div><span className="admin-ui-eyebrow">New Activity</span><h2>{totalNew} new request{totalNew===1?"":"s"}</h2><p>Review each submission and either approve it as a project or decline it.</p></div><AdminButton href="/admin/inbox">Review Requests</AdminButton></AdminNotice>}
    <AdminSection>
      <AdminSectionHeader eyebrow="Request Queue" title="Pending client requests" actions={<AdminButton variant="outline" href="/admin/inbox">View All</AdminButton>}/>
      {inbox.length?<div className="admin-inbox-list">{inbox.slice(0,5).map((item)=><article key={item.id} className={`admin-inbox-row is-new priority-${item.priority}`}><div className="admin-inbox-company"><div><strong>{item.company.shortName}</strong><span>{item.company.name}</span></div></div><div className="admin-inbox-copy"><div className="admin-inbox-tags"><b>New Request</b><em>{item.priority} priority</em><span>{item.type}</span></div><h3>{item.title}</h3><small>{new Date(item.createdAt).toLocaleString()}</small></div><div className="admin-inbox-actions"><AdminButton href={`/admin/request/${item.id}`}>Review</AdminButton></div></article>)}</div>:<p>No requests are waiting for review.</p>}
    </AdminSection>
    <AdminSection>
      <AdminSectionHeader eyebrow="Admin Settings" title="Workspace configuration"/>
      <AdminGrid columns={3}>
        <AdminCard><span className="admin-ui-eyebrow">Clients</span><h3>Companies</h3><p>Manage portal branding, access, and client-specific settings.</p><Link href="/admin/companies">Manage companies →</Link></AdminCard>
        <AdminCard><span className="admin-ui-eyebrow">Projects</span><h3>Engagements</h3><p>Organize related work by client, property, or campaign.</p><Link href="/admin/engagements">View engagements →</Link></AdminCard>
        <AdminCard><span className="admin-ui-eyebrow">Production</span><h3>Team Directory</h3><p>Manage the people available for project and task assignment.</p><Link href="/admin/team">Manage team →</Link></AdminCard>
        <AdminCard><span className="admin-ui-eyebrow">Configuration</span><h3>Service Library</h3><p>Manage available services and concise client intake forms.</p><Link href="/admin/services">Manage services →</Link></AdminCard>
        <AdminCard><span className="admin-ui-eyebrow">Production</span><h3>Operations Board</h3><p>Assign work, update progress, manage tasks, and move projects through production.</p><Link href="/admin/operations">Open board →</Link></AdminCard>
      </AdminGrid>
    </AdminSection>
  </AdminPage>;
}
