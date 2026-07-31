"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminButton, AdminEmptyState, AdminHeader, AdminPage, AdminSection, AdminSectionHeader, AdminStats, StatCard } from "@/components/admin/AdminUI";

type ActivityItem={id:string;kind:string;category:string;title:string;message:string;status?:string;priority?:string;createdAt:string;company:{name:string;shortName:string;slug:string;primaryColor?:string|null};portfolio?:{id:number;name:string}|null;actor?:string|null;href:string;actionable:boolean};
type ActivityData={items:ActivityItem[]};
const STORAGE_KEY="upz_admin_read_notifications";
const important=(item:ActivityItem)=>item.actionable||item.category==="Requests"||item.category==="Attention"||item.kind==="client_response"||["assignment_changed","stage_ready","project_completed"].includes(item.kind)||item.priority==="urgent"||item.priority==="high";

export default function NotificationsPage(){
 const[data,setData]=useState<ActivityData|null>(null);const[readIds,setReadIds]=useState<string[]>([]);const[showRead,setShowRead]=useState(false);
 useEffect(()=>{try{setReadIds(JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]"))}catch{}fetch("/api/admin/activity-center",{cache:"no-store"}).then(response=>response.json()).then(setData)},[]);
 const notifications=useMemo(()=>!data?[]:data.items.filter(important).slice(0,100),[data]);
 const visible=showRead?notifications:notifications.filter(item=>!readIds.includes(item.id));
 const unread=notifications.filter(item=>!readIds.includes(item.id)).length;
 function saveRead(next:string[]){setReadIds(next);localStorage.setItem(STORAGE_KEY,JSON.stringify(next.slice(-500)));window.dispatchEvent(new Event("upz-notifications-read"))}
 function markRead(id:string){if(!readIds.includes(id))saveRead([...readIds,id])}
 function markAll(){saveRead(Array.from(new Set([...readIds,...notifications.map(item=>item.id)])))}
 if(!data)return <AdminPage><AdminEmptyState>Loading notifications...</AdminEmptyState></AdminPage>;
 return <AdminPage className="admin-notifications-page">
  <AdminHeader eyebrow="Internal Only" title="Notifications" description="A focused internal queue for assignments, client responses, overdue work, stage releases, approvals, and completed work orders." actions={<AdminButton href="/admin/activity-center" variant="outline">Open Full Activity Log</AdminButton>}/>
  <AdminStats><StatCard label="Unread" value={unread}/><StatCard label="Action items" value={notifications.filter(item=>item.actionable).length}/><StatCard label="Client responses" value={notifications.filter(item=>item.kind==="client_response").length}/><StatCard label="Workflow updates" value={notifications.filter(item=>["assignment_changed","stage_ready","project_completed"].includes(item.kind)).length}/></AdminStats>
  <AdminSection><AdminSectionHeader eyebrow="Internal Queue" title={showRead?"All notifications":"Unread notifications"} actions={<div className="admin-notification-actions"><AdminButton type="button" variant="outline" onClick={()=>setShowRead(value=>!value)}>{showRead?"Hide Read":"Show Read"}</AdminButton><AdminButton type="button" onClick={markAll} disabled={!unread}>Mark All Read</AdminButton></div>}/>
   <div className="admin-notification-list">{visible.map(item=><Link href={item.href} key={item.id} className={readIds.includes(item.id)?"is-read":""} onClick={()=>markRead(item.id)} style={{"--notification-client":item.company.primaryColor||"#edbf2d"} as React.CSSProperties}><i/><div><span>{item.category} · {item.company.shortName}{item.portfolio?` · ${item.portfolio.name}`:""}</span><strong>{item.title}</strong><p>{item.message}</p><small>{item.actor?`${item.actor} · `:""}{new Date(item.createdAt).toLocaleString()}</small></div><em>{readIds.includes(item.id)?"Read":"Open"}</em></Link>)}{visible.length===0&&<AdminEmptyState><h3>{showRead?"No notifications":"You’re caught up"}</h3><p>{showRead?"No internal notifications are available yet.":"There are no unread internal notifications."}</p></AdminEmptyState>}</div>
  </AdminSection>
 </AdminPage>
}
