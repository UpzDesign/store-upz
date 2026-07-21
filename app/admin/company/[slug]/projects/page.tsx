"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

const STATUSES = ["new", "quoted", "approved", "design", "production", "printing", "installation", "photography", "review", "completed"];

type Project = { id:number; title:string; description?:string|null; status:string; priority:string; assignedTo?:string|null; dueDate?:string|null; budget?:number|null; tasks:{id:number;status:string}[] };

export default function ProjectsPage(){
  const params=useParams(); const slug=Array.isArray(params.slug)?params.slug[0]:String(params.slug||"");
  const [projects,setProjects]=useState<Project[]>([]); const [company,setCompany]=useState<any>(null); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
  const [form,setForm]=useState({title:"",description:"",status:"new",priority:"normal",assignedTo:"",dueDate:""});
  const load=()=>{setLoading(true);fetch(`/api/admin/companies/${slug}/projects`).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error);setProjects(d.projects||[]);setCompany(d.company)}).catch(e=>setError(e.message)).finally(()=>setLoading(false));};
  useEffect(load,[slug]);
  async function createProject(e:React.FormEvent){e.preventDefault();const r=await fetch(`/api/admin/companies/${slug}/projects`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});const d=await r.json();if(!r.ok){setError(d.error);return;}setForm({title:"",description:"",status:"new",priority:"normal",assignedTo:"",dueDate:""});load();}
  async function moveProject(id:number,status:string){await fetch(`/api/admin/projects/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});load();}
  const grouped=useMemo(()=>Object.fromEntries(STATUSES.map(s=>[s,projects.filter(p=>p.status===s)])),[projects]);
  if(loading)return <main className="admin-page"><section className="admin-simple-state"><h1>Loading projects...</h1></section></main>;
  return <main className="admin-page"><section className="project-shell">
    <div className="admin-detail-topbar"><Link href={`/admin/company/${slug}`}>← Company Dashboard</Link><Link href={`/portal/${slug}/projects`}>Client View</Link></div>
    <header className="project-header"><div><span className="admin-eyebrow">Project Management</span><h1>{company?.name||slug} Projects</h1><p>Manage active work, deadlines, ownership, tasks, and client visibility.</p></div><div className="project-count"><strong>{projects.length}</strong><span>Total Projects</span></div></header>
    {error&&<p className="project-error">{error}</p>}
    <form className="project-create" onSubmit={createProject}><input required placeholder="Project title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/><input placeholder="Assigned to" value={form.assignedTo} onChange={e=>setForm({...form,assignedTo:e.target.value})}/><select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select><input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/><textarea placeholder="Project description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/><button className="admin-primary-button">Create Project</button></form>
    <div className="project-board">{STATUSES.map(status=><section className="project-column" key={status}><header><span>{status}</span><strong>{grouped[status].length}</strong></header><div>{grouped[status].map(p=>{const done=p.tasks.filter(t=>t.status==="done").length;return <article className="project-card" key={p.id}><div className={`project-priority ${p.priority}`}>{p.priority}</div><Link href={`/admin/company/${slug}/projects/${p.id}`}><h3>{p.title}</h3></Link><p>{p.description||"No description yet."}</p><div className="project-meta"><span>{p.assignedTo||"Unassigned"}</span><span>{p.dueDate?new Date(p.dueDate).toLocaleDateString():"No due date"}</span></div><div className="project-progress"><span style={{width:`${p.tasks.length?Math.round(done/p.tasks.length*100):0}%`}} /></div><small>{done}/{p.tasks.length} tasks complete</small><select value={p.status} onChange={e=>moveProject(p.id,e.target.value)}>{STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select></article>})}</div></section>)}</div>
  </section></main>;
}