"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Member={id:number;name:string;email?:string|null;role:string;capacity:number};
type Checklist={id:number;title:string;completed:boolean};
type Comment={id:number;body:string;author?:string|null;createdAt:string};
type Attachment={id:number;title:string;fileUrl:string;fileType?:string|null};
type Task={id:number;title:string;description?:string|null;status:string;priority:string;dueDate?:string|null;checklist:Checklist[];comments:Comment[];attachments:Attachment[];project:{id:number;title:string;status:string;dueDate?:string|null;company:{name:string;shortName:string;slug:string;primaryColor:string};engagement?:{id:number;name:string;address?:string|null}|null}};
type Data={team:Member[];member:Member|null;tasks:Task[]};
const STATUSES=["todo","ready","in_progress","blocked","review","complete"];
const pretty=(value:string)=>value.replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
const overdue=(task:Task)=>Boolean(task.dueDate&&new Date(task.dueDate)<new Date()&&task.status!=="complete");

export default function MyTasksPage(){
 const[data,setData]=useState<Data|null>(null);const[member,setMember]=useState("");const[filter,setFilter]=useState("open");const[query,setQuery]=useState("");const[openTask,setOpenTask]=useState<number|null>(null);const[comment,setComment]=useState("");const[checklist,setChecklist]=useState("");
 async function load(name=member){const response=await fetch(`/api/admin/my-tasks${name?`?member=${encodeURIComponent(name)}`:""}`,{cache:"no-store"});const value=await response.json();setData(value);if(name)localStorage.setItem("upz_team_member",name)}
 useEffect(()=>{const saved=localStorage.getItem("upz_team_member")||"";setMember(saved);load(saved)},[]);
 async function patchTask(task:Task,body:Record<string,unknown>){await fetch(`/api/admin/tasks/${task.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});await load()}
 async function action(task:Task,body:Record<string,unknown>){await fetch(`/api/admin/tasks/${task.id}/workspace`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});await load()}
 async function addComment(event:FormEvent,task:Task){event.preventDefault();if(!comment.trim()||!data?.member)return;await action(task,{action:"add_comment",message:comment.trim(),author:data.member.name});setComment("")}
 async function addChecklist(event:FormEvent,task:Task){event.preventDefault();if(!checklist.trim())return;await action(task,{action:"add_checklist",title:checklist.trim()});setChecklist("")}
 const tasks=useMemo(()=>!data?[]:data.tasks.filter(task=>{const text=`${task.title} ${task.project.title} ${task.project.company.name} ${task.project.engagement?.name||""}`.toLowerCase();const status=filter==="all"||filter==="open"&&task.status!=="complete"||filter==="complete"&&task.status==="complete"||filter==="overdue"&&overdue(task);return text.includes(query.toLowerCase())&&status}),[data,filter,query]);
 const completed=data?.tasks.filter(task=>task.status==="complete").length||0;const late=data?.tasks.filter(overdue).length||0;
 if(!data)return <main className="my-tasks-page"><section className="admin-simple-state"><h1>Loading assignments...</h1></section></main>;
 return <main className="my-tasks-page"><section className="my-tasks-shell">
  <header className="my-tasks-hero"><div><span>UPZ PRODUCTION</span><h1>My Tasks</h1><p>A focused workspace for assigned production work, checklists, notes, and deadlines.</p></div><div><Link href="/admin/operations">Operations</Link><Link href="/admin/team">Team</Link></div></header>
  <section className="my-tasks-member"><label>Working as<select value={member} onChange={e=>{setMember(e.target.value);load(e.target.value)}}><option value="">Select team member</option>{data.team.map(item=><option key={item.id} value={item.name}>{item.name} — {item.role}</option>)}</select></label>{data.member&&<div><strong>{data.member.name}</strong><span>{data.member.role}</span><small>Capacity: {data.member.capacity} active tasks</small></div>}</section>
  {!data.member?<section className="my-tasks-empty"><h2>Select a team member</h2><p>This testing selector simulates the contributor view. Once selected, only that person's assigned tasks are shown.</p></section>:<>
   <section className="my-tasks-kpis"><article><span>Assigned</span><strong>{data.tasks.length}</strong></article><article><span>Open</span><strong>{data.tasks.length-completed}</strong></article><article><span>Complete</span><strong>{completed}</strong></article><article><span>Overdue</span><strong>{late}</strong></article></section>
   <div className="my-tasks-toolbar"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search tasks or projects..."/><nav>{["open","overdue","complete","all"].map(value=><button key={value} className={filter===value?"active":""} onClick={()=>setFilter(value)}>{pretty(value)}</button>)}</nav></div>
   <section className="my-task-list">{tasks.map(task=>{const done=task.checklist.filter(item=>item.completed).length;const expanded=openTask===task.id;return <article key={task.id} className={`${expanded?"expanded":""} ${overdue(task)?"overdue":""}`} style={{"--task-brand":task.project.company.primaryColor} as React.CSSProperties}>
    <button className="my-task-summary" onClick={()=>setOpenTask(expanded?null:task.id)}><span className={`status ${task.status}`}>{pretty(task.status)}</span><div><small>{task.project.company.shortName} · {task.project.title}</small><h2>{task.title}</h2><p>{task.project.engagement?.name||"General project"}{task.project.engagement?.address?` · ${task.project.engagement.address}`:""}</p></div><div className="my-task-meta"><strong>{task.dueDate?new Date(task.dueDate).toLocaleDateString():"No due date"}</strong><span>{done}/{task.checklist.length} checklist</span></div></button>
    {expanded&&<div className="my-task-detail"><section><h3>Task status</h3><select value={task.status} onChange={e=>patchTask(task,{status:e.target.value})}>{STATUSES.map(value=><option key={value} value={value}>{pretty(value)}</option>)}</select><p>{task.description||"No additional task instructions."}</p><Link href={`/admin/project/${task.project.id}?tab=tasks`}>Open full project →</Link></section><section><h3>Checklist</h3>{task.checklist.map(item=><button key={item.id} className={item.completed?"checked":""} onClick={()=>action(task,{action:"toggle_checklist",itemId:item.id})}>{item.completed?"✓":"○"} {item.title}</button>)}<form onSubmit={e=>addChecklist(e,task)}><input value={checklist} onChange={e=>setChecklist(e.target.value)} placeholder="Add checklist item"/><button>Add</button></form></section><section><h3>Production notes</h3>{task.comments.map(item=><article key={item.id}><p>{item.body}</p><small>{item.author||"Team"} · {new Date(item.createdAt).toLocaleString()}</small></article>)}<form onSubmit={e=>addComment(e,task)}><textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Add a task note..."/><button>Post Note</button></form></section><section><h3>Attachments</h3>{task.attachments.length?task.attachments.map(item=><a key={item.id} href={item.fileUrl} target="_blank" rel="noreferrer"><span>{item.title}</span><small>{item.fileType||"File"} ↗</small></a>):<p>No task attachments.</p>}</section></div>}
   </article>})}{!tasks.length&&<div className="my-tasks-empty"><h2>No matching tasks</h2><p>There are no assignments in this view.</p></div>}</section>
  </>}
 </section></main>
}
