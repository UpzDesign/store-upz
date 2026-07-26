"use client";

import Link from "next/link";
import { DragEvent, FormEvent, useEffect, useMemo, useState } from "react";

const COLUMNS = [["new", "New"], ["in_progress", "In Progress"], ["waiting_client", "Waiting Client"], ["review", "Review"], ["complete", "Complete"]] as const;
const PRIORITIES = ["urgent", "high", "normal", "low"];
type Task = { id:number; title:string; status:string; priority:string; assignedTo?:string|null; dueDate?:string|null };
type Note = { id:number; body:string; visibility:string; author?:string|null; createdAt:string };
type Project = { id:number; title:string; description?:string|null; status:string; priority:string; assignedTo?:string|null; startDate?:string|null; dueDate?:string|null; budget?:number|null; internalCost?:number|null; clientVisible:boolean; company:{name:string;shortName:string;slug:string}; engagement?:{id:number;name:string}|null; tasks:Task[]; notes:Note[] };
type Member = { id:number; name:string; email?:string|null; role:string; capacity:number; active:number; overdue:number; tasks:number };
type Data = { projects:Project[]; engagements:any[]; assets:any[]; services:any[]; team:Member[] };

const money = (value:number) => new Intl.NumberFormat("en-US", { style:"currency", currency:"USD", maximumFractionDigits:0 }).format(value || 0);
const dateInput = (value?:string|null) => value ? new Date(value).toISOString().slice(0,10) : "";
const normalizedStatus = (status:string) => status === "active" ? "in_progress" : status;
const isComplete = (status:string) => ["complete", "completed", "cancelled"].includes(normalizedStatus(status));
const isOverdue = (project:Project) => Boolean(project.dueDate && new Date(project.dueDate) < new Date() && !isComplete(project.status));

export default function OperationsPage() {
  const [requestedProject,setRequestedProject] = useState(0);
  const [data,setData] = useState<Data|null>(null);
  const [query,setQuery] = useState("");
  const [assignee,setAssignee] = useState("all");
  const [priority,setPriority] = useState("all");
  const [attentionOnly,setAttentionOnly] = useState(false);
  const [tab,setTab] = useState("board");
  const [selected,setSelected] = useState<Project|null>(null);
  const [draft,setDraft] = useState<any>({});
  const [draggedId,setDraggedId] = useState<number|null>(null);
  const [saving,setSaving] = useState(false);
  const [deleting,setDeleting] = useState(false);
  const [newTask,setNewTask] = useState("");
  const [note,setNote]=useState("");
  const [visibility,setVisibility]=useState("internal");
  const [postingNote,setPostingNote]=useState(false);

  const open=(project:Project)=>{setSelected(project);setDraft({...project,status:normalizedStatus(project.status),startDate:dateInput(project.startDate),dueDate:dateInput(project.dueDate)})};
  const load = (projectId=requestedProject) => fetch("/api/admin/operations", { cache:"no-store" }).then(r=>r.json()).then((value:Data) => {
    const normalized = { ...value, projects:value.projects.map(project => ({ ...project, status:normalizedStatus(project.status) })) };
    setData(normalized);
    const target=selected?normalized.projects.find(project=>project.id===selected.id):projectId?normalized.projects.find(project=>project.id===projectId):null;
    if(target)open(target);
  });

  useEffect(() => {
    const projectId=Number(new URLSearchParams(window.location.search).get("project")||0);
    setRequestedProject(projectId);
    load(projectId);
  }, []);
  const projects = useMemo(() => !data ? [] : data.projects.filter(project => {
    const text = `${project.title} ${project.company.name} ${project.engagement?.name || ""}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (assignee === "all" || project.assignedTo === assignee) && (priority === "all" || project.priority === priority) && (!attentionOnly || isOverdue(project) || ["urgent","high"].includes(project.priority));
  }), [data,query,assignee,priority,attentionOnly]);

  async function patchProject(id:number, body:any) { setSaving(true); const response=await fetch(`/api/admin/work-orders/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) }); setSaving(false); if (!response.ok) return; await load(); }
  async function move(id:number,status:string) { await patchProject(id,{status}); }
  function startDrag(event:DragEvent<HTMLButtonElement>,id:number) { setDraggedId(id); event.dataTransfer.setData("text/plain",String(id)); }
  function drop(event:DragEvent<HTMLElement>,status:string) { event.preventDefault(); const id=Number(event.dataTransfer.getData("text/plain")||draggedId); if(id) move(id,status); }
  async function saveProject(event:FormEvent) { event.preventDefault(); if(!selected)return; await patchProject(selected.id,{title:draft.title,description:draft.description,status:draft.status,priority:draft.priority,assignedTo:draft.assignedTo,startDate:draft.startDate,dueDate:draft.dueDate,budget:draft.budget,internalCost:draft.internalCost,clientVisible:draft.clientVisible}); }
  async function updateTask(task:Task,body:any) { await fetch(`/api/admin/tasks/${task.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}); await load(); }
  async function addTask(event:FormEvent) { event.preventDefault(); if(!selected||!newTask.trim())return; await fetch(`/api/admin/work-orders/${selected.id}/tasks`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:newTask})}); setNewTask(""); await load(); }
  async function addNote(event:FormEvent){event.preventDefault();if(!selected||!note.trim())return;setPostingNote(true);const response=await fetch(`/api/admin/projects/${selected.id}/notes`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({body:note,visibility,author:"UPZ Admin"})});setPostingNote(false);if(response.ok){setNote("");await load();}}
  async function removeWorkOrder() { if(!selected || deleting) return; if(!window.confirm(`Permanently remove “${selected.title}”? It will disappear from Operations, Timeline, and the client Projects & Campaigns page.`)) return; setDeleting(true); const response = await fetch(`/api/admin/work-orders/${selected.id}`, { method:"DELETE" }); setDeleting(false); if (!response.ok) return; setSelected(null); await load(0); }

  if(!data) return <main className="ops-page"><p>Loading operations...</p></main>;
  const active=projects.filter(project=>!isComplete(project.status)).length;
  const overdue=projects.filter(isOverdue).length;
  const revenue=projects.reduce((sum,project)=>sum+Number(project.budget||0),0);
  const cost=projects.reduce((sum,project)=>sum+Number(project.internalCost||0),0);

  return <main className="ops-page">
    <header className="ops-head"><div><span>UPZ WORKSPACE</span><h1>Operations</h1><p>Manage stages, assignments, tasks, dates, messages, approvals, and production status from one place.</p></div><Link href="/admin/team">Manage team →</Link></header>
    <section className="ops-kpis"><article><span>Active work orders</span><strong>{active}</strong></article><article><span>Needs attention</span><strong>{overdue}</strong></article><article><span>Tracked revenue</span><strong>{money(revenue)}</strong></article><article><span>Projected margin</span><strong>{money(revenue-cost)}</strong></article><article><span>Team members</span><strong>{data.team.length}</strong></article></section>
    <nav className="ops-tabs">{[["board","Production Board"],["team","Team"],["assets","Assets"],["approvals","Approvals"]].map(([id,label])=><button className={tab===id?"active":""} onClick={()=>setTab(id)} key={id}>{label}</button>)}</nav>
    <div className="ops-toolbar"><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search work orders, companies, projects..."/><select value={assignee} onChange={event=>setAssignee(event.target.value)}><option value="all">All team members</option>{data.team.map(member=><option value={member.name} key={member.id}>{member.name}</option>)}</select><select value={priority} onChange={event=>setPriority(event.target.value)}><option value="all">All priorities</option>{PRIORITIES.map(value=><option value={value} key={value}>{value}</option>)}</select><button className={attentionOnly?"active":""} onClick={()=>setAttentionOnly(!attentionOnly)}>Needs attention</button></div>
    {tab==="board"&&<section className="ops-board">{COLUMNS.map(([status,label])=><article className="ops-column" key={status} onDragOver={event=>event.preventDefault()} onDrop={event=>drop(event,status)}><header><strong>{label}</strong><span>{projects.filter(project=>normalizedStatus(project.status)===status).length}</span></header><div className="ops-column-body">{projects.filter(project=>normalizedStatus(project.status)===status).map(project=>{const done=project.tasks.filter(task=>["complete","completed"].includes(task.status)).length;return <button className={`ops-card priority-${project.priority} ${isOverdue(project)?"is-overdue":""}`} key={project.id} onClick={()=>open(project)} draggable onDragStart={event=>startDrag(event,project.id)}><small>{project.company.shortName} · {project.priority}</small><h3>{project.title}</h3><p>{project.engagement?.name||"General project"}</p><div className="ops-card-meta"><span>{project.assignedTo||"Unassigned"}</span><span>{project.dueDate?new Date(project.dueDate).toLocaleDateString():"No due date"}</span></div><div className="ops-task-progress"><span><i style={{width:`${project.tasks.length?Math.round(done/project.tasks.length*100):0}%`}}/></span><strong>{done}/{project.tasks.length}</strong></div></button>})}{!projects.some(project=>normalizedStatus(project.status)===status)&&<div className="ops-column-empty">No work orders</div>}</div></article>)}</section>}
    {tab==="team"&&<section className="ops-grid">{data.team.map(member=><article className="ops-panel" key={member.id}><div className="ops-avatar">{member.name.split(" ").map(part=>part[0]).join("").slice(0,2)}</div><h3>{member.name}</h3><p>{member.role}</p><dl><div><dt>Active work orders</dt><dd>{member.active}</dd></div><div><dt>Open tasks</dt><dd>{member.tasks}</dd></div><div><dt>Overdue</dt><dd>{member.overdue}</dd></div><div><dt>Capacity</dt><dd>{member.capacity}</dd></div></dl></article>)}</section>}
    {tab==="assets"&&<section className="ops-assets">{data.assets.map(asset=><article key={asset.id}><small>{asset.engagement.company.shortName} · {asset.category}</small><h3>{asset.title}</h3><p>{asset.engagement.name}</p>{asset.fileUrl&&<a href={asset.fileUrl} target="_blank">Open asset →</a>}</article>)}</section>}
    {tab==="approvals"&&<section className="ops-approval-list">{projects.filter(project=>["waiting_client","review"].includes(project.status)).map(project=><article key={project.id}><div><small>{project.company.shortName}</small><h3>{project.title}</h3></div><button onClick={()=>open(project)}>Manage</button></article>)}</section>}
    {selected&&<div className="ops-drawer-backdrop" onMouseDown={()=>setSelected(null)}><aside className="ops-drawer ops-manager" onMouseDown={event=>event.stopPropagation()}><button className="ops-close" onClick={()=>setSelected(null)}>×</button><small>{selected.company.name}</small><h2>Manage work order</h2><form className="ops-manager-form" onSubmit={saveProject}><label>Title<input value={draft.title||""} onChange={event=>setDraft({...draft,title:event.target.value})}/></label><label>Description<textarea value={draft.description||""} onChange={event=>setDraft({...draft,description:event.target.value})}/></label><div className="ops-manager-grid"><label>Status<select value={draft.status||"new"} onChange={event=>setDraft({...draft,status:event.target.value})}>{COLUMNS.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label><label>Priority<select value={draft.priority||"normal"} onChange={event=>setDraft({...draft,priority:event.target.value})}>{PRIORITIES.map(value=><option value={value} key={value}>{value}</option>)}</select></label><label>Assigned team member<select value={draft.assignedTo||""} onChange={event=>setDraft({...draft,assignedTo:event.target.value})}><option value="">Unassigned</option>{data.team.map(member=><option value={member.name} key={member.id}>{member.name} — {member.role}</option>)}</select></label><label>Start date<input type="date" value={draft.startDate||""} onChange={event=>setDraft({...draft,startDate:event.target.value})}/></label><label>Due date<input type="date" value={draft.dueDate||""} onChange={event=>setDraft({...draft,dueDate:event.target.value})}/></label><label>Budget<input type="number" value={draft.budget??""} onChange={event=>setDraft({...draft,budget:event.target.value})}/></label><label>Internal cost<input type="number" value={draft.internalCost??""} onChange={event=>setDraft({...draft,internalCost:event.target.value})}/></label></div><label className="ops-check"><input type="checkbox" checked={draft.clientVisible!==false} onChange={event=>setDraft({...draft,clientVisible:event.target.checked})}/> Visible to client</label><button disabled={saving}>{saving?"Saving...":"Save work order"}</button></form><section className="ops-task-manager"><h3>Tasks</h3>{selected.tasks.map(task=><article key={task.id}><button className={task.status==="complete"?"complete":""} onClick={()=>updateTask(task,{status:task.status==="complete"?"todo":"complete"})}>{task.status==="complete"?"✓":"○"}</button><div><strong>{task.title}</strong><div><select aria-label={`Assign ${task.title}`} value={task.assignedTo||""} onChange={event=>updateTask(task,{assignedTo:event.target.value})}><option value="">Unassigned</option>{data.team.map(member=><option value={member.name} key={member.id}>{member.name}</option>)}</select><input type="date" value={dateInput(task.dueDate)} onChange={event=>updateTask(task,{dueDate:event.target.value})}/></div></div></article>)}<form onSubmit={addTask}><input value={newTask} onChange={event=>setNewTask(event.target.value)} placeholder="Add a task..."/><button>Add</button></form></section><section className="ops-message-manager"><h3>Updates & Messages</h3><form onSubmit={addNote}><textarea value={note} onChange={event=>setNote(event.target.value)} placeholder="Add an internal note or client-visible update..."/><div><select value={visibility} onChange={event=>setVisibility(event.target.value)}><option value="internal">Internal note</option><option value="client">Client-visible update</option></select><button disabled={postingNote}>{postingNote?"Posting...":"Post update"}</button></div></form><div>{selected.notes.map(item=><article key={item.id} className={item.visibility==="client"?"client-note":"internal-note"}><strong>{item.visibility==="client"?"Client Update":"Internal Note"}</strong><small>{item.author||"UPZ Admin"} · {new Date(item.createdAt).toLocaleString()}</small><p>{item.body}</p></article>)}</div></section><div className="ops-manager-footer"><Link href="/admin/projects">Project overview →</Link><button type="button" className="admin-danger-button" disabled={deleting} onClick={removeWorkOrder}>{deleting?"Removing...":"Delete work order"}</button></div></aside></div>}
  </main>;
}