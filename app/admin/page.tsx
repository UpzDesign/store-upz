"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminButton, AdminCard, AdminGrid, AdminHeader, AdminPage, AdminSection, AdminSectionHeader, AdminStats, StatCard } from "@/components/admin/AdminUI";
import { isClosedRequestStatus, isCompleteStatus, isDueToday, isInactiveStatus, isPastDue, normalizeStatus } from "@/lib/operations-foundation";

const ADMIN_PASSWORD = "upzadmin";

type AdminCompany = { id:number; portalEnabled:boolean };
type InboxItem = { id:number; inboxKind?:"request"|"client_activity"|"operation"; type:string; title:string; priority:string; status:string; createdAt:string; company:{name:string;shortName:string;slug:string;primaryColor:string}; project?:{id:number;status:string}|null };
type Task = { id?:number;title?:string;status:string;assignedTo?:string|null;dueDate?:string|null };
type WorkOrder = { id:number;title:string;status:string;priority:string;assignedTo?:string|null;dueDate?:string|null;updatedAt?:string;company:{name:string;shortName:string;slug:string;primaryColor?:string|null};engagement?:{id:number;name:string}|null;tasks?:Task[] };
type TeamMember = { id:number;name:string;role:string;capacity:number;active:number;overdue:number;tasks:number };
type ActivityItem = {id:string;kind:string;category:string;title:string;message:string;createdAt:string;company:{name:string;shortName:string;slug:string;primaryColor?:string|null};portfolio?:{id:number;name:string}|null;href:string;actionable:boolean;priority?:string};
type SourceErrors = Partial<Record<"companies"|"inbox"|"operations"|"activity",string>>;

const needsAction=(item:ActivityItem)=>item.actionable||item.category==="Attention"||item.category==="Requests"||item.kind==="client_response"||item.priority==="urgent"||item.priority==="high";

async function readJson(response:Response,label:string){
  if(!response.ok)throw new Error(`${label} failed (${response.status})`);
  return response.json();
}

export default function AdminDashboardPage() {
  const [password,setPassword]=useState("");
  const [authenticated,setAuthenticated]=useState(false);
  const [error,setError]=useState("");
  const [companies,setCompanies]=useState<AdminCompany[]>([]);
  const [inbox,setInbox]=useState<InboxItem[]>([]);
  const [projects,setProjects]=useState<WorkOrder[]>([]);
  const [team,setTeam]=useState<TeamMember[]>([]);
  const [activity,setActivity]=useState<ActivityItem[]>([]);
  const [sourceErrors,setSourceErrors]=useState<SourceErrors>({});
  const [loading,setLoading]=useState(false);

  useEffect(()=>{if(window.localStorage.getItem("upz_admin")==="true")setAuthenticated(true)},[]);
  useEffect(()=>{
    if(!authenticated)return;
    setLoading(true);
    setSourceErrors({});
    Promise.allSettled([
      fetch("/api/admin/companies",{cache:"no-store"}).then(response=>readJson(response,"Companies")),
      fetch("/api/admin/inbox",{cache:"no-store"}).then(response=>readJson(response,"Action Center")),
      fetch("/api/admin/operations",{cache:"no-store"}).then(response=>readJson(response,"Operations")),
      fetch("/api/admin/activity-center",{cache:"no-store"}).then(response=>readJson(response,"Activity Center")),
    ]).then(results=>{
      const nextErrors:SourceErrors={};
      const [companyResult,inboxResult,operationsResult,activityResult]=results;
      if(companyResult.status==="fulfilled")setCompanies(Array.isArray(companyResult.value)?companyResult.value:[]);else nextErrors.companies=companyResult.reason?.message||"Companies unavailable";
      if(inboxResult.status==="fulfilled")setInbox(Array.isArray(inboxResult.value)?inboxResult.value:[]);else nextErrors.inbox=inboxResult.reason?.message||"Action Center unavailable";
      if(operationsResult.status==="fulfilled"){
        setProjects(Array.isArray(operationsResult.value?.projects)?operationsResult.value.projects:[]);
        setTeam(Array.isArray(operationsResult.value?.team)?operationsResult.value.team:[]);
      }else nextErrors.operations=operationsResult.reason?.message||"Operations unavailable";
      if(activityResult.status==="fulfilled")setActivity(Array.isArray(activityResult.value?.items)?activityResult.value.items:[]);else nextErrors.activity=activityResult.reason?.message||"Activity Center unavailable";
      setSourceErrors(nextErrors);
    }).finally(()=>setLoading(false));
  },[authenticated]);

  const pendingRequests=useMemo(()=>inbox.filter(item=>item.inboxKind==="request"&&!item.project&&!isClosedRequestStatus(item.status)),[inbox]);
  const activeProjects=useMemo(()=>projects.filter(project=>!isInactiveStatus(project.status)),[projects]);
  const dueToday=useMemo(()=>activeProjects.filter(project=>isDueToday(project.dueDate)),[activeProjects]);
  const overdue=useMemo(()=>activeProjects.filter(project=>isPastDue(project.dueDate)),[activeProjects]);
  const waitingClient=useMemo(()=>activeProjects.filter(project=>normalizeStatus(project.status)==="waiting_client"),[activeProjects]);
  const recentlyCompleted=useMemo(()=>projects.filter(project=>isCompleteStatus(project.status)).sort((a,b)=>new Date(b.updatedAt||0).getTime()-new Date(a.updatedAt||0).getTime()).slice(0,5),[projects]);
  const recentProjects=useMemo(()=>[...activeProjects].sort((a,b)=>new Date(b.updatedAt||0).getTime()-new Date(a.updatedAt||0).getTime()).slice(0,6),[activeProjects]);
  const actionItems=useMemo(()=>activity.filter(needsAction).slice(0,7),[activity]);
  const teamCapacity=useMemo(()=>team.map(member=>({...member,load:Math.round((member.tasks/Math.max(1,member.capacity))*100)})).sort((a,b)=>b.load-a.load),[team]);
  const stats=useMemo(()=>[
    {label:"Due Today",value:dueToday.length},
    {label:"Overdue",value:overdue.length},
    {label:"Waiting Client",value:waitingClient.length},
    {label:"Active Work Orders",value:activeProjects.length},
    {label:"New Requests",value:pendingRequests.length},
  ],[dueToday,overdue,waitingClient,activeProjects,pendingRequests]);
  const sourceErrorList=Object.values(sourceErrors).filter(Boolean);

  function handleLogin(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(password.trim()!==ADMIN_PASSWORD){setError("Invalid admin password.");return}window.localStorage.setItem("upz_admin","true");window.dispatchEvent(new Event("upz-admin-auth"));setAuthenticated(true);setError("")}
  if(!authenticated)return <main className="admin-page admin-login-page"><section className="admin-login-card"><div className="admin-eyebrow">UPZ Brand Portal</div><h1>Admin Access</h1><p>Manage company portals, services, products, projects, and brand assets from one control center.</p><form onSubmit={handleLogin} className="admin-login-form"><label>Password<input type="password" value={password} onChange={event=>setPassword(event.target.value)} placeholder="Enter admin password"/></label>{error&&<div className="admin-error">{error}</div>}<button type="submit">Enter Admin</button></form></section></main>;

  const workList=(items:WorkOrder[],empty:string)=>items.length?<div className="operations-dashboard-list">{items.map(project=>{const done=project.tasks?.filter(task=>isCompleteStatus(task.status)).length||0;const total=project.tasks?.length||0;return <Link href={`/admin/operations?project=${project.id}`} key={project.id} style={{"--dashboard-client":project.company.primaryColor||"#edbf2d"} as React.CSSProperties}><i/><div><small>{project.company.shortName}{project.engagement?.name?` · ${project.engagement.name}`:""}</small><strong>{project.title}</strong><span>{project.assignedTo||"Unassigned"} · {done}/{total} stages</span></div><time>{project.dueDate?new Date(project.dueDate).toLocaleDateString():"No target"}</time></Link>})}</div>:<p>{empty}</p>;

  return <AdminPage className="admin-dashboard-page operations-dashboard-page">
    <AdminHeader eyebrow="UPZ Admin" title="Creative Operations" description="Start with today’s deadlines and attention items, then open the exact work order or resource view needed for production." actions={<AdminButton href="/admin/operations">Open Work Management</AdminButton>}/>
    {sourceErrorList.length>0&&<div className="admin-error">Some dashboard sources could not be refreshed: {sourceErrorList.join(" · ")}. Available sections remain active.</div>}
    <AdminStats>{stats.map(stat=><StatCard key={stat.label} label={stat.label} value={loading?"—":stat.value}/>)}</AdminStats>

    <section className="operations-dashboard-priority-grid">
      <AdminSection className="operations-dashboard-due"><AdminSectionHeader eyebrow="Today" title="Due today" actions={<AdminButton variant="outline" href="/admin/operations?due=today">Timeline</AdminButton>}/>{workList(dueToday,"Nothing is due today.")}</AdminSection>
      <AdminSection className="operations-dashboard-overdue"><AdminSectionHeader eyebrow="Attention" title="Overdue work" actions={<AdminButton variant="outline" href="/admin/operations?view=overdue">Work Management</AdminButton>}/>{workList(overdue,"No overdue work orders.")}</AdminSection>
      <AdminSection><AdminSectionHeader eyebrow="Client Hold" title="Waiting on client" actions={<AdminButton variant="outline" href="/admin/operations?status=waiting_client">Open Queue</AdminButton>}/>{workList(waitingClient,"No work orders are waiting on a client response.")}</AdminSection>
    </section>

    <section className="admin-dashboard-main-grid admin-dashboard-action-grid">
      <AdminSection className="admin-dashboard-activity"><AdminSectionHeader eyebrow="Approval Queue" title={pendingRequests.length?`${pendingRequests.length} request${pendingRequests.length===1?"":"s"} ready for review`:"Approval queue clear"} actions={<AdminButton href="/admin/inbox?tab=requests">Open Requests</AdminButton>}/>{pendingRequests.length?<div className="admin-dashboard-feed">{pendingRequests.slice(0,5).map(item=><Link href={`/admin/request/${item.id}`} key={item.id} style={{"--dashboard-client":item.company.primaryColor} as React.CSSProperties}><i/><div><span>{item.company.shortName} · {item.type}</span><strong>{item.title}</strong><small>{item.priority} priority</small></div><time>{new Date(item.createdAt).toLocaleDateString()}</time></Link>)}</div>:<p>No requests are waiting for approval.</p>}</AdminSection>
      <AdminSection><AdminSectionHeader eyebrow="Priority Activity" title="Needs your attention" actions={<AdminButton variant="outline" href="/admin/activity-center">Activity Center</AdminButton>}/>{actionItems.length?<div className="admin-dashboard-feed">{actionItems.map(item=><Link href={item.href} key={item.id} style={{"--dashboard-client":item.company.primaryColor||"#edbf2d"} as React.CSSProperties}><i/><div><span>{item.category} · {item.company.shortName}</span><strong>{item.title}</strong><small>{item.message}</small></div><time>{new Date(item.createdAt).toLocaleDateString()}</time></Link>)}</div>:<p>No activity currently requires action.</p>}</AdminSection>
    </section>

    <section className="operations-dashboard-secondary-grid">
      <AdminSection><AdminSectionHeader eyebrow="Resources" title="Team capacity" actions={<AdminButton variant="outline" href="/admin/operations?tab=schedule">Resource Schedule</AdminButton>}/><div className="operations-dashboard-team">{teamCapacity.map(member=><article key={member.id} className={member.load>100?"is-over":member.load>=80?"is-busy":""}><div><strong>{member.name}</strong><span>{member.role}</span></div><em>{member.load}%</em><i><b style={{width:`${Math.min(100,member.load)}%`}}/></i><small>{member.tasks} active stages · {member.overdue} overdue</small></article>)}{!teamCapacity.length&&<p>No active team members.</p>}</div></AdminSection>
      <AdminSection><AdminSectionHeader eyebrow="History" title="Recently completed" actions={<AdminButton variant="outline" href="/admin/projects">Project Library</AdminButton>}/>{workList(recentlyCompleted,"No completed work orders yet.")}</AdminSection>
    </section>

    <AdminSection>
      <AdminSectionHeader eyebrow="Workspaces" title="Recent active work orders" actions={<AdminButton variant="outline" href="/admin/operations">View All</AdminButton>}/>
      {recentProjects.length?<div className="admin-inbox-list">{recentProjects.map(project=>{const done=project.tasks?.filter(task=>isCompleteStatus(task.status)).length||0;const total=project.tasks?.length||0;return <article key={project.id} className="admin-inbox-row admin-dashboard-workorder-row" style={{"--dashboard-client":project.company.primaryColor||"#edbf2d"} as React.CSSProperties}><div className="admin-inbox-company"><div><strong>{project.company.shortName}</strong><span>{project.company.name}</span></div></div><div className="admin-inbox-copy"><div className="admin-inbox-tags"><b>{normalizeStatus(project.status).replaceAll("_"," ")}</b><em>{project.priority} priority</em>{project.engagement?.name&&<span>{project.engagement.name}</span>}</div><h3>{project.title}</h3><small>{project.assignedTo||"Unassigned"} · {project.dueDate?`Due ${new Date(project.dueDate).toLocaleDateString()}`:"No due date"} · {done}/{total} stages</small></div><div className="admin-inbox-actions"><AdminButton href={`/admin/project/${project.id}`}>Open Project</AdminButton></div></article>})}</div>:<p>No active work orders.</p>}
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
