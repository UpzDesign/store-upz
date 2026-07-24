"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type Task = { id:number; title:string; status:string; dueDate?:string|null };
type Project = {
  id:number;
  title:string;
  status:string;
  priority:string;
  startDate?:string|null;
  dueDate?:string|null;
  assignedTo?:string|null;
  company:{ shortName:string; name:string };
  engagement?:{ id:number; name:string }|null;
  tasks:Task[];
};

type OperationsData = { projects:Project[] };

const DAY = 86_400_000;
const completeStatuses = new Set(["complete", "completed", "cancelled"]);

function startOfDay(value:Date){ const date=new Date(value); date.setHours(0,0,0,0); return date; }
function addDays(value:Date,days:number){ return new Date(value.getTime()+days*DAY); }
function clamp(value:number,min:number,max:number){ return Math.min(max,Math.max(min,value)); }
function dateLabel(value:Date){ return value.toLocaleDateString("en-US",{month:"short",day:"numeric"}); }

export default function OperationsTimelinePage(){
  const [data,setData]=useState<OperationsData|null>(null);
  const [query,setQuery]=useState("");
  const [showCompleted,setShowCompleted]=useState(false);
  const [rangeStart,setRangeStart]=useState(()=>addDays(startOfDay(new Date()),-7));
  const rangeDays=42;
  const rangeEnd=addDays(rangeStart,rangeDays-1);

  useEffect(()=>{ fetch("/api/admin/operations",{cache:"no-store"}).then((response)=>response.json()).then(setData); },[]);

  const days=useMemo(()=>Array.from({length:rangeDays},(_,index)=>addDays(rangeStart,index)),[rangeStart]);
  const projects=useMemo(()=>{
    if(!data)return [];
    return data.projects
      .filter((project)=>showCompleted||!completeStatuses.has(project.status.toLowerCase()))
      .filter((project)=>`${project.title} ${project.company.name} ${project.engagement?.name||""} ${project.assignedTo||""}`.toLowerCase().includes(query.toLowerCase()))
      .sort((a,b)=>new Date(a.dueDate||"2999-12-31").getTime()-new Date(b.dueDate||"2999-12-31").getTime());
  },[data,query,showCompleted]);

  if(!data)return <main className={styles.page}><p>Loading timeline...</p></main>;

  const todayOffset=clamp(((startOfDay(new Date()).getTime()-rangeStart.getTime())/DAY)/rangeDays*100,0,100);

  return <main className={styles.page}>
    <header className={styles.header}>
      <div><span>OPERATIONS 2.2</span><h1>Production Timeline</h1><p>Schedule and review active work orders across a six-week delivery window.</p></div>
      <Link href="/admin/operations">Production board →</Link>
    </header>

    <section className={styles.controls}>
      <input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search work orders, clients, engagements..." />
      <button onClick={()=>setRangeStart(addDays(rangeStart,-14))}>← Earlier</button>
      <button onClick={()=>setRangeStart(addDays(startOfDay(new Date()),-7))}>Today</button>
      <button onClick={()=>setRangeStart(addDays(rangeStart,14))}>Later →</button>
      <label><input type="checkbox" checked={showCompleted} onChange={(event)=>setShowCompleted(event.target.checked)}/> Show completed</label>
    </section>

    <section className={styles.summary}>
      <article><span>Visible work orders</span><strong>{projects.length}</strong></article>
      <article><span>Due in range</span><strong>{projects.filter((project)=>project.dueDate&&new Date(project.dueDate)>=rangeStart&&new Date(project.dueDate)<=rangeEnd).length}</strong></article>
      <article><span>Unscheduled</span><strong>{projects.filter((project)=>!project.startDate&&!project.dueDate).length}</strong></article>
      <article><span>Overdue</span><strong>{projects.filter((project)=>project.dueDate&&new Date(project.dueDate)<new Date()&&!completeStatuses.has(project.status)).length}</strong></article>
    </section>

    <section className={styles.timeline}>
      <div className={styles.timelineHead}>
        <div className={styles.projectHeading}>Work order</div>
        <div className={styles.days}>{days.map((day)=><div className={day.getDay()===0||day.getDay()===6?styles.weekend:""} key={day.toISOString()}><strong>{day.toLocaleDateString("en-US",{weekday:"short"}).slice(0,1)}</strong><span>{day.getDate()}</span></div>)}</div>
      </div>
      <div className={styles.timelineBody}>
        <i className={styles.today} style={{left:`calc(320px + (100% - 320px) * ${todayOffset/100})`}}/>
        {projects.map((project)=>{
          const start=startOfDay(new Date(project.startDate||project.dueDate||new Date()));
          const due=startOfDay(new Date(project.dueDate||project.startDate||new Date()));
          const left=clamp((start.getTime()-rangeStart.getTime())/DAY,0,rangeDays);
          const right=clamp((due.getTime()-rangeStart.getTime())/DAY+1,0,rangeDays);
          const complete=project.tasks.filter((task)=>completeStatuses.has(task.status.toLowerCase())).length;
          const progress=project.tasks.length?Math.round(complete/project.tasks.length*100):0;
          return <article className={styles.row} key={project.id}>
            <div className={styles.projectInfo}><small>{project.company.shortName} · {project.priority}</small><h3>{project.title}</h3><p>{project.engagement?.name||"General engagement"} · {project.assignedTo||"Unassigned"}</p></div>
            <div className={styles.track}>
              <div className={`${styles.bar} ${styles[`status_${project.status}`]||""}`} style={{left:`${left/rangeDays*100}%`,width:`${Math.max((right-left)/rangeDays*100,2.4)}%`}} title={`${dateLabel(start)} – ${dateLabel(due)}`}>
                <i style={{width:`${progress}%`}}/><span>{progress}%</span>
              </div>
              {project.tasks.filter((task)=>task.dueDate).map((task)=>{const offset=clamp((startOfDay(new Date(task.dueDate!)).getTime()-rangeStart.getTime())/DAY,0,rangeDays);return <b className={styles.milestone} style={{left:`${offset/rangeDays*100}%`}} title={`${task.title}: ${dateLabel(new Date(task.dueDate!))}`} key={task.id}/>})}
            </div>
          </article>;
        })}
        {!projects.length&&<div className={styles.empty}>No work orders match this timeline view.</div>}
      </div>
    </section>
  </main>;
}
