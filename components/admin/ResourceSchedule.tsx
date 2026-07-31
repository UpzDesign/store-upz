"use client";

import type { CSSProperties } from "react";

type Task={id:number;title:string;status:string;assignedTo?:string|null;dueDate?:string|null};
type Project={id:number;title:string;status:string;priority:string;assignedTo?:string|null;startDate?:string|null;dueDate?:string|null;company:{shortName:string;primaryColor?:string|null};engagement?:{name:string}|null;tasks:Task[]};
type Member={id:number;name:string;role:string;capacity:number;active:number;overdue:number;tasks:number};

type Props={projects:Project[];team:Member[];onOpen:(project:Project)=>void};

const DAY=86400000;
const startOfDay=(value:Date)=>new Date(value.getFullYear(),value.getMonth(),value.getDate());
const addDays=(value:Date,days:number)=>new Date(value.getTime()+days*DAY);
const monday=(value:Date)=>{const date=startOfDay(value);const day=date.getDay()||7;return addDays(date,1-day)};
const taskDone=(task:Task)=>["complete","completed"].includes(String(task.status).toLowerCase());
const projectStart=(project:Project,today:Date)=>project.startDate?startOfDay(new Date(project.startDate)):project.dueDate?addDays(startOfDay(new Date(project.dueDate)),-5):today;
const projectEnd=(project:Project,start:Date)=>project.dueDate?startOfDay(new Date(project.dueDate)):addDays(start,4);

export function ResourceSchedule({projects,team,onOpen}:Props){
 const today=startOfDay(new Date());
 const rangeStart=monday(today);
 const days=Array.from({length:14},(_,index)=>addDays(rangeStart,index));
 const unassigned=projects.filter(project=>!project.assignedTo);
 const assignments=team.map(member=>({member,projects:projects.filter(project=>project.assignedTo===member.name)}));
 return <section className="resource-schedule">
  <header className="resource-schedule-head"><div><span>Resource Scheduling</span><h2>Two-week team schedule</h2><p>Current work is positioned using existing start and target dates. Open a work order to update its schedule or assignment.</p></div><div className="resource-schedule-legend"><i/> Scheduled <b/> Due or overdue</div></header>
  {unassigned.length>0&&<aside className="resource-unassigned"><strong>Unassigned work</strong><div>{unassigned.map(project=><button type="button" key={project.id} onClick={()=>onOpen(project)}>{project.company.shortName} · {project.title}</button>)}</div></aside>}
  <div className="resource-schedule-scroll"><div className="resource-schedule-grid">
   <div className="resource-schedule-corner"><strong>Team</strong><span>{projects.length} active work orders</span></div>
   <div className="resource-schedule-days">{days.map(day=><div key={day.toISOString()} className={day.getTime()===today.getTime()?"is-today":day.getDay()===0||day.getDay()===6?"is-weekend":""}><strong>{day.toLocaleDateString(undefined,{weekday:"short"})}</strong><span>{day.toLocaleDateString(undefined,{month:"short",day:"numeric"})}</span></div>)}</div>
   {assignments.map(({member,projects:memberProjects})=>{
    const load=Math.round(memberProjects.length/Math.max(1,member.capacity)*100);
    return <div className="resource-schedule-row" key={member.id}>
     <div className="resource-member"><div><strong>{member.name}</strong><span>{member.role}</span></div><em className={load>100?"is-over":load>=80?"is-busy":""}>{load}% load</em></div>
     <div className="resource-track">{days.map(day=><i key={day.toISOString()} className={day.getTime()===today.getTime()?"is-today":day.getDay()===0||day.getDay()===6?"is-weekend":""}/>)}{memberProjects.map(project=>{const start=projectStart(project,today);const end=projectEnd(project,start);const visibleStart=Math.max(start.getTime(),rangeStart.getTime());const visibleEnd=Math.min(end.getTime(),days[days.length-1].getTime());if(visibleEnd<rangeStart.getTime()||visibleStart>days[days.length-1].getTime())return null;const left=((visibleStart-rangeStart.getTime())/DAY/14)*100;const width=Math.max(7.14,((visibleEnd-visibleStart)/DAY+1)/14*100);const overdue=Boolean(project.dueDate&&new Date(project.dueDate)<today);return <button type="button" key={project.id} className={`resource-bar priority-${project.priority} ${overdue?"is-overdue":""}`} style={{left:`${left}%`,width:`${Math.min(width,100-left)}%`,"--client-color":project.company.primaryColor||"#edbf2d"} as CSSProperties} onClick={()=>onOpen(project)} title={`${project.title}: ${start.toLocaleDateString()} – ${end.toLocaleDateString()}`}><span>{project.title}</span></button>})}</div>
    </div>})}
  </div></div>
 </section>
}

export function TeamWorkload({projects,team,onOpen}:Props){
 const today=startOfDay(new Date());
 const weekEnd=addDays(today,7);
 return <section className="team-workload-v2">{team.map(member=>{
  const assigned=projects.filter(project=>project.assignedTo===member.name);
  const dueThisWeek=assigned.filter(project=>project.dueDate&&new Date(project.dueDate)>=today&&new Date(project.dueDate)<=weekEnd);
  const overdue=assigned.filter(project=>project.dueDate&&new Date(project.dueDate)<today);
  const stages=assigned.flatMap(project=>project.tasks).filter(task=>!taskDone(task));
  const load=Math.round(assigned.length/Math.max(1,member.capacity)*100);
  const state=load>100?"Over capacity":load>=80?"Near capacity":load===0?"Available":"Balanced";
  return <article className={`team-workload-card ${load>100?"is-over":load>=80?"is-busy":""}`} key={member.id}>
   <header><div className="ops-avatar">{member.name.split(" ").map(part=>part[0]).join("").slice(0,2)}</div><div><h3>{member.name}</h3><p>{member.role}</p></div><span>{state}</span></header>
   <div className="team-load-meter"><div><strong>{load}%</strong><span>{assigned.length} of {member.capacity} work orders</span></div><i><b style={{width:`${Math.min(100,load)}%`}}/></i></div>
   <dl><div><dt>Due this week</dt><dd>{dueThisWeek.length}</dd></div><div><dt>Open stages</dt><dd>{stages.length}</dd></div><div><dt>Overdue</dt><dd>{overdue.length}</dd></div><div><dt>Available slots</dt><dd>{Math.max(0,member.capacity-assigned.length)}</dd></div></dl>
   <div className="team-workload-orders">{assigned.slice(0,4).map(project=><button type="button" key={project.id} onClick={()=>onOpen(project)}><span><small>{project.company.shortName}</small><strong>{project.title}</strong></span><em>{project.dueDate?new Date(project.dueDate).toLocaleDateString():"No target"}</em></button>)}{assigned.length===0&&<p>No active work assigned.</p>}</div>
  </article>})}</section>
}
