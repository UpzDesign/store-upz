"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminButton, AdminCard, AdminGrid, AdminHeader, AdminPage, AdminSection, AdminSectionHeader, AdminStats, StatCard } from "@/components/admin/AdminUI";

const ADMIN_PASSWORD = "upzadmin";
type AdminCompany = { id:number; portalEnabled:boolean };
type InboxItem = { id:number; inboxKind?:"request"|"client_activity"; type:string; title:string; priority:string; status:string; createdAt:string; company:{name:string;shortName:string;slug:string;primaryColor:string}; project?:{id:number;status:string}|null };
type WorkOrder = { id:number;title:string;status:string;priority:string;assignedTo?:string|null;dueDate?:string|null;updatedAt?:string;company:{name:string;shortName:string;slug:string;primaryColor?:string|null};engagement?:{id:number;name:string}|null;tasks?:Array<{status:string}> };
type ActivityItem = {id:string;kind:string;category:string;title:string;message:string;createdAt:string;company:{name:string;shortName:string;slug:string;primaryColor?:string|null};portfolio?:{id:number;name:string}|null;href:string;actionable:boolean;priority?:string};
const needsAction=(item:ActivityItem)=>item.actionable||item.category==="Attention"||item.category==="Requests"||item.kind==="client_response"||item.priority==="urgent"||item.priority==="high";

export default function AdminDashboardPage() {
  const [password,setPassword]=useState("");const [authenticated,setAuthenticated]=useState(false);const [error,setError]=useState("");const [companies,setCompanies]=useState<AdminCompany[]>([]);const [inbox,setInbox]=useState<InboxItem[]>([]);const [projects,setProjects]=useState<WorkOrder[]>([]);const [activity,setActivity]=useState<ActivityItem[]>([]);const [loading,setLoading]=useState(false);
  useEffect(()=>{if(window.localStorage.getItem("upz_admin")==="true")setAuthenticated(true)},[]);
  useEffect(()=>{if(!authenticated)return;setLoading(true);Promise.all([
    fetch("/api/admin/companies",{cache:"no-store"}).then(response=>response.ok?response.json():[]),fetch("/api/admin/inbox",{cache:"no-store"}).then(response=>response.ok?response.json():[]),fetch("/api/admin/operations",{cache:"no-store"}).then(response=>response.ok?response.json():{projects:[]}),fetch("/api/admin/activity-center",{cache:"no-store"}).then(response=>response.ok?response.json():{items:[]}),
  ]).then(([companyData,inboxData,operationsData,activityData])=>{setCompanies(Array.isArray(companyData)?companyData:[]);setInbox(Array.isArray(inboxData)?inboxData:[]);setProjects(Array.isArray(operationsData?.projects)?operationsData.projects:[]);setActivity(Array.isArray(activityData?.items)?activityData.items:[])}).finally(()=>setLoading(false))},[authenticated]);

  const pendingRequests=useMemo(()=>inbox.filter(item=>item.inboxKind==="request"&&!item.project&&!["approved","declined","cancelled","converted"].includes(String(item.status).toLowerCase())),[inbox]);
  const activeProjects=useMemo(()=>projects.filter(project=>!["complete","completed","cancelled"].includes(String(project.status).toLowerCase())),[projects]);
  const recentProjects=useMemo(()=>[...activeProjects].sort((a,b)=>new Date(b.updatedAt||0).getTime()-new Date(a.updatedAt||0).getTime()).slice(0,6),[activeProjects]);
  const actionItems=useMemo(()=>activity.filter(needsAction).slice(0,7),[activity]);
  const stats=useMemo(()=>[{label:"New Requests",value:pendingRequests.length},{label:"Needs Attention",value:actionItems.length},{label:"Active Work Orders",value:activeProjects.length},{label:"Active Portals",value:companies.filter(company=>company.portalEnabled).length}],[companies,pendingRequests,actionItems,activeProjects]);

  function handleLogin(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(password.trim()!==ADMIN_PASSWORD){setError("Invalid admin password.");return}window.localStorage.setItem("upz_admin","true");window.dispatchEvent(new Event("upz-admin-auth"));setAuthenticated(true);setError("")}
  if(!authenticated)return <main className="admin-page admin-login-page"><section className="admin-login-card"><div className="admin-eyebrow">UPZ Brand Portal</div><h1>Admin Access</h1><p>Manage company portals, services, products, projects, and brand assets from one control center.</p><form onSubmit={handleLogin} className="admin-login-form"><label>Password<input type="password" value={password} onChange={event=>setPassword(event.target.value)} placeholder="Enter admin password"/></label>{error&&<div className="admin-error">{error}</div>}<button type="submit">Enter Admin</button></form></section></main>;

  return <AdminPage className="admin-dashboard-page">
    <AdminHeader eyebrow="UPZ Admin" title="Creative Operations" description="Start with requests and activity requiring action, then open the exact project workspace needed for production." actions={<AdminButton href="/admin/operations">Open Work Management</AdminButton>}/>
    <AdminStats>{stats.map(stat=><StatCard key={stat.label} label={stat.label} value={loading?"—":stat.value}/>)}</AdminStats>

    <section className="admin-dashboard-main-grid admin-dashboard-action-grid">
      <AdminSection className="admin-dashboard-activity"><AdminSectionHeader eyebrow="Approval Queue" title={pendingRequests.length?`${pendingRequests.length} request${pendingRequests.length===1?"":"s"} ready for review`:"Approval queue clear"} actions={<AdminButton href="/admin/inbox">Open Requests</AdminButton>}/>{pendingRequests.length?<div className="admin-dashboard-feed">{pendingRequests.slice(0,5).map(item=><Link href={`/admin/request/${item.id}`} key={item.id} style={{"--dashboard-client":item.company.primaryColor} as React.CSSProperties}><i/><div><span>{item.company.shortName} · {item.type}</span><strong>{item.title}</strong><small>{item.priority} priority</small></div><time>{new Date(item.createdAt).toLocaleDateString()}</time></Link>)}</div>:<p>No requests are waiting for approval.</p>}</AdminSection>
      <AdminSection><AdminSectionHeader eyebrow="Priority Activity" title="Needs your attention" actions={<AdminButton variant="outline" href="/admin/activity-center">Activity Center</AdminButton>}/>{actionItems.length?<div className="admin-dashboard-feed">{actionItems.map(item=><Link href={item.href} key={item.id} style={{"--dashboard-client":item.company.primaryColor||"#edbf2d"} as React.CSSProperties}><i/><div><span>{item.category} · {item.company.shortName}</span><strong>{item.title}</strong><small>{item.message}</small></div><time>{new Date(item.createdAt).toLocaleDateString()}</time></Link>)}</div>:<p>No activity currently requires action.</p>}</AdminSection>
    </section>

    <AdminSection>
      <AdminSectionHeader eyebrow="Workspaces" title="Recent active work orders" actions={<AdminButton variant="outline" href="/admin/operations">View All</AdminButton>}/>
      {recentProjects.length?<div className="admin-inbox-list">{recentProjects.map(project=>{const done=project.tasks?.filter(task=>["complete","completed"].includes(task.status)).length||0;const total=project.tasks?.length||0;return <article key={project.id} className="admin-inbox-row admin-dashboard-workorder-row" style={{"--dashboard-client":project.company.primaryColor||"#edbf2d"} as React.CSSProperties}><div className="admin-inbox-company"><div><strong>{project.company.shortName}</strong><span>{project.company.name}</span></div></div><div className="admin-inbox-copy"><div className="admin-inbox-tags"><b>{String(project.status).replaceAll("_"," ")}</b><em>{project.priority} priority</em>{project.engagement?.name&&<span>{project.engagement.name}</span>}</div><h3>{project.title}</h3><small>{project.assignedTo||"Unassigned"} · {project.dueDate?`Due ${new Date(project.dueDate).toLocaleDateString()}`:"No due date"} · {done}/{total} stages</small></div><div className="admin-inbox-actions"><AdminButton href={`/admin/project/${project.id}`}>Open Project</AdminButton></div></article>})}</div>:<p>No active work orders.</p>}
    </AdminSection>

    <AdminSection><AdminSectionHeader eyebrow="Configuration" title="Platform setup"/><AdminGrid columns={3}>
      <AdminCard><span className="admin-ui-eyebrow">Clients</span><h3>Companies</h3><p>Manage portal branding, access, and client-specific settings.</p><Link href="/admin/companies">Manage companies →</Link></AdminCard>
      <AdminCard><span className="admin-ui-eyebrow">Projects</span><h3>Project Library</h3><p>Organize properties, campaigns, landlords, tenants, and their work orders.</p><Link href="/admin/projects">View projects →</Link></AdminCard>
      <AdminCard><span className="admin-ui-eyebrow">Production</span><h3>Team Directory</h3><p>Manage people, roles, capacity, and work assignments.</p><Link href="/admin/team">Manage team →</Link></AdminCard>
      <AdminCard><span className="admin-ui-eyebrow">Configuration</span><h3>Service Library</h3><p>Manage client-facing services and intake forms.</p><Link href="/admin/services">Manage services →</Link></AdminCard>
      <AdminCard><span className="admin-ui-eyebrow">Configuration</span><h3>Template Library</h3><p>Control the default stages generated for every service.</p><Link href="/admin/templates">Manage templates →</Link></AdminCard>
      <AdminCard><span className="admin-ui-eyebrow">Production</span><h3>Work Management</h3><p>Use the board, timeline, resource schedule, and team workload views.</p><Link href="/admin/operations">Open work management →</Link></AdminCard>
    </AdminGrid></AdminSection>
  </AdminPage>;
}
