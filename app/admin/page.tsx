"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminButton, AdminCard, AdminGrid, AdminHeader, AdminPage, AdminSection, AdminSectionHeader, AdminStats, StatCard } from "@/components/admin/AdminUI";

const ADMIN_PASSWORD = "upzadmin";
type AdminCompany = { id:number; portalEnabled:boolean };
type InboxItem = { id:number; inboxKind?:"request"|"client_activity"; type:string; title:string; priority:string; status:string; createdAt:string; company:{name:string;shortName:string;slug:string;primaryColor:string}; project?:{id:number;status:string}|null };
type WorkOrder = { id:number;title:string;status:string;priority:string;assignedTo?:string|null;dueDate?:string|null;updatedAt?:string;company:{name:string;shortName:string;slug:string};engagement?:{id:number;name:string}|null;tasks?:Array<{status:string}> };
type ActivityItem = {id:string;kind:string;category:string;title:string;message:string;createdAt:string;company:{name:string;shortName:string;slug:string;primaryColor?:string|null};portfolio?:{id:number;name:string}|null;href:string;actionable:boolean};

export default function AdminDashboardPage() {
  const [password,setPassword]=useState("");
  const [authenticated,setAuthenticated]=useState(false);
  const [error,setError]=useState("");
  const [companies,setCompanies]=useState<AdminCompany[]>([]);
  const [inbox,setInbox]=useState<InboxItem[]>([]);
  const [projects,setProjects]=useState<WorkOrder[]>([]);
  const [activity,setActivity]=useState<ActivityItem[]>([]);
  const [loading,setLoading]=useState(false);

  useEffect(()=>{if(window.localStorage.getItem("upz_admin")==="true")setAuthenticated(true);},[]);
  useEffect(()=>{if(!authenticated)return;setLoading(true);Promise.all([
    fetch("/api/admin/companies",{cache:"no-store"}).then((response)=>response.ok?response.json():[]),
    fetch("/api/admin/inbox",{cache:"no-store"}).then((response)=>response.ok?response.json():[]),
    fetch("/api/admin/operations",{cache:"no-store"}).then((response)=>response.ok?response.json():{projects:[]}),
    fetch("/api/admin/activity-center",{cache:"no-store"}).then((response)=>response.ok?response.json():{items:[]}),
  ]).then(([companyData,inboxData,operationsData,activityData])=>{
    setCompanies(Array.isArray(companyData)?companyData:[]);
    setInbox(Array.isArray(inboxData)?inboxData:[]);
    setProjects(Array.isArray(operationsData?.projects)?operationsData.projects:[]);
    setActivity(Array.isArray(activityData?.items)?activityData.items:[]);
  }).finally(()=>setLoading(false));},[authenticated]);

  const pendingRequests=useMemo(()=>inbox.filter((item)=>item.inboxKind==="request"&&!item.project&&!["approved","declined","cancelled","converted"].includes(String(item.status).toLowerCase())),[inbox]);
  const activeProjects=useMemo(()=>projects.filter((project)=>!["complete","completed","cancelled"].includes(String(project.status).toLowerCase())),[projects]);
  const recentProjects=useMemo(()=>[...activeProjects].sort((a,b)=>new Date(b.updatedAt||0).getTime()-new Date(a.updatedAt||0).getTime()).slice(0,6),[activeProjects]);
  const dashboardActivity=useMemo(()=>activity.filter((item)=>item.category!=="Production"||item.actionable).slice(0,7),[activity]);
  const totalNew=pendingRequests.length;
  const stats=useMemo(()=>[
    {label:"New Requests",value:totalNew},
    {label:"Needs Attention",value:activity.filter((item)=>item.category==="Attention").length},
    {label:"Active Work Orders",value:activeProjects.length},
    {label:"Active Portals",value:companies.filter((company)=>company.portalEnabled).length},
  ],[companies,totalNew,activeProjects,activity]);

  function handleLogin(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(password.trim()!==ADMIN_PASSWORD){setError("Invalid admin password.");return;}window.localStorage.setItem("upz_admin","true");window.dispatchEvent(new Event("upz-admin-auth"));setAuthenticated(true);setError("");}

  if(!authenticated)return <main className="admin-page admin-login-page"><section className="admin-login-card"><div className="admin-eyebrow">UPZ Brand Portal</div><h1>Admin Access</h1><p>Manage company portals, services, products, projects, and brand assets from one control center.</p><form onSubmit={handleLogin} className="admin-login-form"><label>Password<input type="password" value={password} onChange={(event)=>setPassword(event.target.value)} placeholder="Enter admin password"/></label>{error&&<div className="admin-error">{error}</div>}<button type="submit">Enter Admin</button></form></section></main>;

  return <AdminPage className="admin-dashboard-page">
    <AdminHeader eyebrow="UPZ Admin" title="Creative Operations" description="Start with what needs attention, then open the exact work order workspace where production, files, messages, and team assignments are managed." actions={<AdminButton href="/admin/operations">Open Work Management</AdminButton>}/>
    <AdminStats>{stats.map((stat)=><StatCard key={stat.label} label={stat.label} value={loading?"—":stat.value}/>)}</AdminStats>

    {totalNew>0&&<AdminSection className="admin-dashboard-activity"><AdminSectionHeader eyebrow="Approval Queue" title={`${totalNew} request${totalNew===1?"":"s"} ready for review`} actions={<AdminButton href="/admin/inbox">Review Requests</AdminButton>}/><p>Approve requests into configured work orders. Decline remains available as a secondary exception.</p></AdminSection>}

    <section className="admin-dashboard-main-grid">
      <AdminSection>
        <AdminSectionHeader eyebrow="Workspaces" title="Recent active work orders" actions={<AdminButton variant="outline" href="/admin/operations">View All</AdminButton>}/>
        {recentProjects.length?<div className="admin-dashboard-workorders">{recentProjects.map((project)=>{const done=project.tasks?.filter((task)=>["complete","completed"].includes(task.status)).length||0;const total=project.tasks?.length||0;return <article key={project.id}><div><span>{project.company.shortName}{project.engagement?.name?` · ${project.engagement.name}`:""}</span><h3>{project.title}</h3><small>{project.assignedTo||"Unassigned"} · {project.dueDate?`Due ${new Date(project.dueDate).toLocaleDateString()}`:"No due date"} · {done}/{total} stages</small></div><AdminButton href={`/admin/project/${project.id}`}>Open Workspace</AdminButton></article>})}</div>:<p>No active work orders.</p>}
      </AdminSection>

      <AdminSection>
        <AdminSectionHeader eyebrow="Activity" title="Needs your attention" actions={<AdminButton variant="outline" href="/admin/activity-center">Full Activity</AdminButton>}/>
        {dashboardActivity.length?<div className="admin-dashboard-feed">{dashboardActivity.map((item)=><Link href={item.href} key={item.id} style={{"--dashboard-client":item.company.primaryColor||"#edbf2d"} as React.CSSProperties}><i/><div><span>{item.category} · {item.company.shortName}</span><strong>{item.title}</strong><small>{item.message}</small></div><time>{new Date(item.createdAt).toLocaleDateString()}</time></Link>)}</div>:<p>No recent activity needs attention.</p>}
      </AdminSection>
    </section>

    <AdminSection>
      <AdminSectionHeader eyebrow="Request Queue" title="Pending client requests" actions={<AdminButton variant="outline" href="/admin/inbox">View All</AdminButton>}/>
      {pendingRequests.length?<div className="admin-inbox-list">{pendingRequests.slice(0,4).map((item)=><article key={item.id} className={`admin-inbox-row is-new priority-${item.priority}`}><div className="admin-inbox-company"><div><strong>{item.company.shortName}</strong><span>{item.company.name}</span></div></div><div className="admin-inbox-copy"><div className="admin-inbox-tags"><b>New Request</b><em>{item.priority} priority</em><span>{item.type}</span></div><h3>{item.title}</h3><small>{new Date(item.createdAt).toLocaleString()}</small></div><div className="admin-inbox-actions"><AdminButton href={`/admin/request/${item.id}`}>Review & Approve</AdminButton></div></article>)}</div>:<p>No requests are waiting for review.</p>}
    </AdminSection>

    <AdminSection>
      <AdminSectionHeader eyebrow="Configuration" title="Platform setup"/>
      <AdminGrid columns={3}>
        <AdminCard><span className="admin-ui-eyebrow">Clients</span><h3>Companies</h3><p>Manage portal branding, access, and client-specific settings.</p><Link href="/admin/companies">Manage companies →</Link></AdminCard>
        <AdminCard><span className="admin-ui-eyebrow">Portfolios</span><h3>Portfolio Library</h3><p>Organize properties, campaigns, landlords, tenants, and their work orders.</p><Link href="/admin/engagements">View portfolios →</Link></AdminCard>
        <AdminCard><span className="admin-ui-eyebrow">Production</span><h3>Team Directory</h3><p>Manage people, roles, capacity, and project assignments.</p><Link href="/admin/team">Manage team →</Link></AdminCard>
        <AdminCard><span className="admin-ui-eyebrow">Configuration</span><h3>Service Library</h3><p>Manage client-facing services and intake forms.</p><Link href="/admin/services">Manage services →</Link></AdminCard>
        <AdminCard><span className="admin-ui-eyebrow">Configuration</span><h3>Template Library</h3><p>Control the default stages generated for every service.</p><Link href="/admin/templates">Manage templates →</Link></AdminCard>
        <AdminCard><span className="admin-ui-eyebrow">Production</span><h3>Work Management</h3><p>Use the board, timeline, resource schedule, and team workload views.</p><Link href="/admin/operations">Open work management →</Link></AdminCard>
      </AdminGrid>
    </AdminSection>
  </AdminPage>;
}