"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

const STATUSES = ["new", "quoted", "approved", "design", "production", "printing", "installation", "photography", "review", "completed"];

type Project = { id:number; title:string; description?:string|null; status:string; priority:string; assignedTo?:string|null; dueDate?:string|null; budget?:number|null; tasks:{id:number;status:string}[] };
type CompanySummary = { name: string };

export default function ProjectsPage(){
  const params=useParams();
  const slug=Array.isArray(params.slug)?params.slug[0]:String(params.slug||"");
  const [projects,setProjects]=useState<Project[]>([]);
  const [company,setCompany]=useState<CompanySummary|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [form,setForm]=useState({title:"",description:"",status:"new",priority:"normal",assignedTo:"",dueDate:""});

  const load=useCallback(async()=>{
    if(!slug)return;
    setLoading(true);
    setError("");
    try{
      const response=await fetch(`/api/admin/companies/${slug}/projects`);
      const data=await response.json();
      if(!response.ok)throw new Error(data?.error||"Unable to load projects");
      setProjects(Array.isArray(data.projects)?data.projects:[]);
      setCompany(data.company||null);
    }catch(error:unknown){
      setError(error instanceof Error?error.message:"Unable to load projects");
    }finally{
      setLoading(false);
    }
  },[slug]);

  useEffect(()=>{
    void load();
  },[load]);

  async function createProject(event:React.FormEvent){
    event.preventDefault();
    const response=await fetch(`/api/admin/companies/${slug}/projects`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
    const data=await response.json();
    if(!response.ok){setError(data?.error||"Unable to create project");return;}
    setForm({title:"",description:"",status:"new",priority:"normal",assignedTo:"",dueDate:""});
    await load();
  }

  async function moveProject(id:number,status:string){
    const response=await fetch(`/api/admin/projects/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});
    if(!response.ok){
      const data=await response.json().catch(()=>null);
      setError(data?.error||"Unable to update project");
      return;
    }
    await load();
  }

  const grouped=useMemo<Record<string,Project[]>>(()=>Object.fromEntries(STATUSES.map(status=>[status,projects.filter(project=>project.status===status)])),[projects]);

  if(loading)return <main className="admin-page"><section className="admin-simple-state"><h1>Loading projects...</h1></section></main>;

  return <main className="admin-page"><section className="project-shell">
    <div className="admin-detail-topbar"><Link href={`/admin/company/${slug}`}>← Company Dashboard</Link><Link href={`/portal/${slug}/projects`}>Client View</Link></div>
    <header className="project-header"><div><span className="admin-eyebrow">Project Management</span><h1>{company?.name||slug} Projects</h1><p>Manage active work, deadlines, ownership, tasks, and client visibility.</p></div><div className="project-count"><strong>{projects.length}</strong><span>Total Projects</span></div></header>
    {error&&<p className="project-error">{error}</p>}
    <form className="project-create" onSubmit={createProject}><input required placeholder="Project title" value={form.title} onChange={event=>setForm({...form,title:event.target.value})}/><input placeholder="Assigned to" value={form.assignedTo} onChange={event=>setForm({...form,assignedTo:event.target.value})}/><select value={form.priority} onChange={event=>setForm({...form,priority:event.target.value})}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select><input type="date" value={form.dueDate} onChange={event=>setForm({...form,dueDate:event.target.value})}/><textarea placeholder="Project description" value={form.description} onChange={event=>setForm({...form,description:event.target.value})}/><button className="admin-primary-button">Create Project</button></form>
    <div className="project-board">{STATUSES.map(status=><section className="project-column" key={status}><header><span>{status}</span><strong>{grouped[status]?.length||0}</strong></header><div>{(grouped[status]||[]).map(project=>{const done=project.tasks.filter(task=>task.status==="done").length;return <article className="project-card" key={project.id}><div className={`project-priority ${project.priority}`}>{project.priority}</div><Link href={`/admin/company/${slug}/projects/${project.id}`}><h3>{project.title}</h3></Link><p>{project.description||"No description yet."}</p><div className="project-meta"><span>{project.assignedTo||"Unassigned"}</span><span>{project.dueDate?new Date(project.dueDate).toLocaleDateString():"No due date"}</span></div><div className="project-progress"><span style={{width:`${project.tasks.length?Math.round(done/project.tasks.length*100):0}%`}} /></div><small>{done}/{project.tasks.length} tasks complete</small><select value={project.status} onChange={event=>void moveProject(project.id,event.target.value)}>{STATUSES.map(item=><option key={item} value={item}>{item}</option>)}</select></article>})}</div></section>)}</div>
  </section></main>;
}
