"use client";

import Link from "next/link";
import { DragEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { PROJECT_STAGES, normalizeProjectStage, isProjectComplete } from "@/lib/project-status";
import { parseProjectMessage } from "@/lib/project-messages";
import { AdminButton, AdminEmptyState, AdminHeader, AdminPage, AdminStats, AdminTabs, AdminToolbar, StatCard } from "@/components/admin/AdminUI";

const COLUMNS = PROJECT_STAGES.filter(([stage]) => stage !== "cancelled");
const PRIORITIES = ["urgent", "high", "normal", "low"];

type Task = { id:number; title:string; status:string; priority:string; assignedTo?:string|null; dueDate?:string|null; sortOrder:number };
type Note = { id:number; body:string; visibility:string; author?:string|null; createdAt:string };
type Project = {
  id:number; title:string; description?:string|null; status:string; priority:string; assignedTo?:string|null;
  startDate?:string|null; dueDate?:string|null; budget?:number|null; internalCost?:number|null; clientVisible:boolean;
  company:{ name:string; shortName:string; slug:string; primaryColor?:string|null };
  engagement?:{ id:number; name:string }|null; tasks:Task[]; notes:Note[];
};
type Member = { id:number; name:string; email?:string|null; role:string; capacity:number; active:number; overdue:number; tasks:number };
type Data = { projects:Project[]; engagements:any[]; assets:any[]; services:any[]; team:Member[] };

const dateInput = (value?:string|null) => value ? new Date(value).toISOString().slice(0,10) : "";
const isOverdue = (project:Project) => Boolean(project.dueDate && new Date(project.dueDate) < new Date() && !isProjectComplete(project.status));

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
  const [closing,setClosing] = useState(false);
  const [newTask,setNewTask] = useState("");
  const [note,setNote] = useState("");
  const [visibility,setVisibility] = useState("internal");
  const [postingNote,setPostingNote] = useState(false);

  const open = (project:Project) => {
    setSelected(project);
    setDraft({...project,status:normalizeProjectStage(project.status),startDate:dateInput(project.startDate),dueDate:dateInput(project.dueDate)});
  };

  const load = (projectId=requestedProject) => fetch("/api/admin/operations",{cache:"no-store"}).then(r=>r.json()).then((value:Data)=>{
    const normalized = {...value,projects:value.projects.map(project=>({...project,status:normalizeProjectStage(project.status),tasks:[...project.tasks].sort((a,b)=>a.sortOrder-b.sortOrder)}))};
    setData(normalized);
    const target = selected ? normalized.projects.find(project=>project.id===selected.id) : projectId ? normalized.projects.find(project=>project.id===projectId) : null;
    if(target) open(target);
  });

  useEffect(()=>{
    const projectId = Number(new URLSearchParams(window.location.search).get("project")||0);
    setRequestedProject(projectId);
    load(projectId);
  },[]);

  const projects = useMemo(()=>!data?[]:data.projects.filter(project=>{
    const text = `${project.title} ${project.company.name} ${project.engagement?.name||""}`.toLowerCase();
    return text.includes(query.toLowerCase()) &&
      (assignee==="all"||project.assignedTo===assignee) &&
      (priority==="all"||project.priority===priority) &&
      (!attentionOnly||isOverdue(project)||["urgent","high"].includes(project.priority));
  }),[data,query,assignee,priority,attentionOnly]);

  async function patchProject(id:number,body:any){
    setSaving(true);
    const response = await fetch(`/api/admin/work-orders/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    setSaving(false);
    if(response.ok) await load();
  }

  async function move(id:number,status:string){ await patchProject(id,{status}); }
  function startDrag(event:DragEvent<HTMLButtonElement>,id:number){ setDraggedId(id); event.dataTransfer.setData("text/plain",String(id)); }
  function drop(event:DragEvent<HTMLElement>,status:string){ event.preventDefault(); const id=Number(event.dataTransfer.getData("text/plain")||draggedId); if(id) move(id,status); }

  async function saveProject(event:FormEvent){
    event.preventDefault();
    if(!selected) return;
    await patchProject(selected.id,{title:draft.title,description:draft.description,status:draft.status,priority:draft.priority,assignedTo:draft.assignedTo,startDate:draft.startDate,dueDate:draft.dueDate,budget:draft.budget,internalCost:draft.internalCost,clientVisible:draft.clientVisible});
  }

  async function updateTask(task:Task,body:any){
    await fetch(`/api/admin/tasks/${task.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    await load();
  }

  async function addTask(event:FormEvent){
    event.preventDefault();
    if(!selected||!newTask.trim()) return;
    await fetch(`/api/admin/work-orders/${selected.id}/tasks`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:newTask})});
    setNewTask("");
    await load();
  }

  async function removeTask(task:Task){
    if(!window.confirm(`Remove task “${task.title}”?`)) return;
    await fetch(`/api/admin/tasks/${task.id}`,{method:"DELETE"});
    await load();
  }

  async function addNote(event:FormEvent){
    event.preventDefault();
    if(!selected||!note.trim()) return;
    setPostingNote(true);
    const response = await fetch(`/api/admin/projects/${selected.id}/notes`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({body:note,kind:visibility,author:"UPZ Admin"})});
    setPostingNote(false);
    if(response.ok){ setNote(""); await load(); }
  }

  async function closeWorkOrder(mode:"complete"|"cancelled"){
    if(!selected||closing) return;
    const action = mode === "complete" ? "close as completed" : "archive";
    if(!window.confirm(`${action.charAt(0).toUpperCase()+action.slice(1)} “${selected.title}”?`)) return;
    setClosing(true);
    const response = await fetch(`/api/admin/work-orders/${selected.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:mode})});
    setClosing(false);
    if(!response.ok) return;
    setSelected(null);
    await load(0);
  }

  if(!data) return <AdminPage><AdminEmptyState>Loading operations...</AdminEmptyState></AdminPage>;

  const active = projects.filter(project=>!isProjectComplete(project.status)).length;
  const overdue = projects.filter(isOverdue).length;

  return <AdminPage className="ops-page">
    <AdminHeader eyebrow="UPZ Workspace" title="Operations" description="Manage approved projects, assignments, tasks, schedules, financials, and client updates." actions={<AdminButton href="/admin/team">Manage Team</AdminButton>}/>
    <AdminStats>
      <StatCard label="Active work orders" value={active}/><StatCard label="Needs attention" value={overdue}/><StatCard label="Urgent" value={projects.filter(project=>project.priority==="urgent").length}/><StatCard label="Waiting client" value={projects.filter(project=>normalizeProjectStage(project.status)==="waiting_client").length}/><StatCard label="Team members" value={data.team.length}/>
    </AdminStats>
    <AdminTabs className="ops-tabs">{[["board","Production Board"],["team","Team"]].map(([id,label])=><button type="button" className={tab===id?"active":""} onClick={()=>setTab(id)} key={id}>{label}</button>)}</AdminTabs>
    <AdminToolbar className="ops-toolbar">
      <input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search work orders, companies, projects..."/>
      <select value={assignee} onChange={event=>setAssignee(event.target.value)}><option value="all">All team members</option>{data.team.map(member=><option value={member.name} key={member.id}>{member.name}</option>)}</select>
      <select value={priority} onChange={event=>setPriority(event.target.value)}><option value="all">All priorities</option>{PRIORITIES.map(value=><option value={value} key={value}>{value}</option>)}</select>
      <AdminButton variant={attentionOnly?"secondary":"outline"} type="button" onClick={()=>setAttentionOnly(!attentionOnly)}>Needs attention</AdminButton>
    </AdminToolbar>

    {tab==="board"&&<section className="ops-board">{COLUMNS.map(([status,label])=><article className="ops-column" key={status} onDragOver={event=>event.preventDefault()} onDrop={event=>drop(event,status)}><header><strong>{label}</strong><span>{projects.filter(project=>normalizeProjectStage(project.status)===status).length}</span></header><div className="ops-column-body">{projects.filter(project=>normalizeProjectStage(project.status)===status).map(project=>{const done=project.tasks.filter(task=>["complete","completed"].includes(task.status)).length;return <button className={`ops-card priority-${project.priority} ${isOverdue(project)?"is-overdue":""}`} key={project.id} onClick={()=>open(project)} draggable onDragStart={event=>startDrag(event,project.id)}><small>{project.company.shortName} · {project.priority}</small><h3>{project.title}</h3><p>{project.engagement?.name||"General project"}</p><div className="ops-card-meta"><span>{project.assignedTo||"Unassigned"}</span><span>{project.dueDate?new Date(project.dueDate).toLocaleDateString():"No due date"}</span></div><div className="ops-task-progress"><span><i style={{width:`${project.tasks.length?Math.round(done/project.tasks.length*100):0}%`}}/></span><strong>{done}/{project.tasks.length}</strong></div></button>})}{!projects.some(project=>normalizeProjectStage(project.status)===status)&&<div className="ops-column-empty">No work orders</div>}</div></article>)}</section>}

    {tab==="team"&&<section className="ops-grid">{data.team.map(member=><article className="ops-panel" key={member.id}><div className="ops-avatar">{member.name.split(" ").map(part=>part[0]).join("").slice(0,2)}</div><h3>{member.name}</h3><p>{member.role}</p><dl><div><dt>Active work orders</dt><dd>{member.active}</dd></div><div><dt>Open tasks</dt><dd>{member.tasks}</dd></div><div><dt>Overdue</dt><dd>{member.overdue}</dd></div><div><dt>Capacity</dt><dd>{member.capacity}</dd></div></dl></article>)}</section>}

    {selected&&<div className="ops-drawer-backdrop" onMouseDown={()=>setSelected(null)}>
      <aside className="ops-drawer ops-manager" style={{"--client-color":selected.company.primaryColor||"#edbf2d"} as React.CSSProperties} onMouseDown={event=>event.stopPropagation()}>
        <button className="ops-close" onClick={()=>setSelected(null)}>×</button>
        <small>{selected.company.name}</small><h2>Manage work order</h2>

        <form className="ops-manager-form" onSubmit={saveProject}>
          <label>Title<input value={draft.title||""} onChange={event=>setDraft({...draft,title:event.target.value})}/></label>
          <label>Description<textarea value={draft.description||""} onChange={event=>setDraft({...draft,description:event.target.value})}/></label>
          <div className="ops-manager-grid">
            <label>Status<select value={draft.status||"new"} onChange={event=>setDraft({...draft,status:event.target.value})}>{PROJECT_STAGES.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>
            <label>Priority<select value={draft.priority||"normal"} onChange={event=>setDraft({...draft,priority:event.target.value})}>{PRIORITIES.map(value=><option value={value} key={value}>{value}</option>)}</select></label>
            <label>Assigned team member<select value={draft.assignedTo||""} onChange={event=>setDraft({...draft,assignedTo:event.target.value})}><option value="">Unassigned</option>{data.team.map(member=><option value={member.name} key={member.id}>{member.name} — {member.role}</option>)}</select></label>
            <label>Start date<input className="admin-date-input" type="date" value={draft.startDate||""} onChange={event=>setDraft({...draft,startDate:event.target.value})}/></label>
            <label>Due date<input className="admin-date-input" type="date" value={draft.dueDate||""} onChange={event=>setDraft({...draft,dueDate:event.target.value})}/></label>
            <label>Budget<input type="number" min="0" step="0.01" value={draft.budget??""} onChange={event=>setDraft({...draft,budget:event.target.value})}/></label>
            <label>Internal cost<input type="number" min="0" step="0.01" value={draft.internalCost??""} onChange={event=>setDraft({...draft,internalCost:event.target.value})}/></label>
          </div>
          <label className="ops-check"><input type="checkbox" checked={draft.clientVisible!==false} onChange={event=>setDraft({...draft,clientVisible:event.target.checked})}/> Visible to client</label>
          <AdminButton type="submit" disabled={saving}>{saving?"Saving...":"Save work order"}</AdminButton>
        </form>

        <section className="ops-task-manager">
          <h3>Tasks</h3>
          {selected.tasks.map((task,index)=>{const blocked=index>0&&!["complete","completed"].includes(selected.tasks[index-1].status);return <article key={task.id} className={blocked?"is-blocked":""}><button className={task.status==="complete"?"complete":""} disabled={blocked} title={blocked?"Complete the previous task first":"Update task status"} onClick={()=>updateTask(task,{status:task.status==="complete"?"todo":"complete"})}>{task.status==="complete"?"✓":blocked?"—":"○"}</button><div><strong>{task.title}</strong>{blocked&&<small>Available after the previous task is complete</small>}<div className="ops-task-controls"><select disabled={blocked} aria-label={`Assign ${task.title}`} value={task.assignedTo||""} onChange={event=>updateTask(task,{assignedTo:event.target.value})}><option value="">Unassigned</option>{data.team.map(member=><option value={member.name} key={member.id}>{member.name}</option>)}</select><input className="admin-date-input" disabled={blocked} type="date" value={dateInput(task.dueDate)} onChange={event=>updateTask(task,{dueDate:event.target.value})}/></div><div className="task-row-actions"><AdminButton variant="danger" type="button" onClick={()=>removeTask(task)}>Remove</AdminButton></div></div></article>})}
          <form className="ops-add-task-form" onSubmit={addTask}><input value={newTask} onChange={event=>setNewTask(event.target.value)} placeholder="Add a task..."/><AdminButton type="submit">Add</AdminButton></form>
        </section>

        <section className="ops-message-manager">
          <h3>Updates & Messages</h3>
          <div className="ops-message-thread">{[...selected.notes].sort((a,b)=>new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime()).map(item=>{const parsed=parseProjectMessage(item.body);const clientReply=parsed.kind==="client_response";const isClient=item.visibility==="client"||clientReply;const title=clientReply?(parsed.action==="approved"?"Client Approved":parsed.action==="revision_requested"?"Revision Requested":"Client Reply"):item.visibility==="client"?(parsed.kind==="approval_request"?"Approval Required":parsed.kind==="feedback_request"?"Feedback Requested":"Client Update"):"Internal Note";return <article key={item.id} className={isClient?"client-note":"internal-note"}><strong>{title}</strong><small>{item.author||(isClient?selected.company.name:"UPZ Admin")} · {new Date(item.createdAt).toLocaleString()}</small><p>{parsed.body}</p></article>})}</div>
          <form className="ops-message-composer" onSubmit={addNote}><textarea value={note} onChange={event=>setNote(event.target.value)} placeholder="Add an internal note or publish a client update..."/><div><select value={visibility} onChange={event=>setVisibility(event.target.value)}><option value="internal">Internal note</option><option value="client_update">Client update</option><option value="feedback_request">Client feedback requested</option><option value="approval_request">Client approval required</option></select><AdminButton type="submit" disabled={postingNote}>{postingNote?"Posting...":"Post update"}</AdminButton></div></form>
        </section>

        <div className="ops-manager-footer">
          <Link href="/admin/projects">Project overview →</Link>
          <div className="ops-closure-actions"><AdminButton variant="outline" type="button" disabled={closing} onClick={()=>closeWorkOrder("cancelled")}>Archive</AdminButton><AdminButton type="button" disabled={closing} onClick={()=>closeWorkOrder("complete")}>{closing?"Updating...":"Close project"}</AdminButton></div>
        </div>
      </aside>
    </div>}
  </AdminPage>;
}
