"use client";

import { FormEvent, useEffect, useState } from "react";

type Member = { id:number; name:string; email?:string|null; role:string; capacity:number; active:boolean };

export default function TeamPage(){
 const [members,setMembers]=useState<Member[]>([]);const [form,setForm]=useState({name:"",email:"",role:"Creative Operations",capacity:"5"});
 const load=()=>fetch("/api/admin/team",{cache:"no-store"}).then(r=>r.json()).then(setMembers);
 useEffect(()=>{load()},[]);
 async function add(e:FormEvent){e.preventDefault();await fetch("/api/admin/team",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,capacity:Number(form.capacity)})});setForm({name:"",email:"",role:"Creative Operations",capacity:"5"});load()}
 async function toggle(member:Member){await fetch(`/api/admin/team/${member.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:!member.active})});load()}
 return <main className="ops-page"><header className="ops-head"><div><span>UPZ WORKSPACE</span><h1>Team Directory</h1><p>Create the people available for work-order and task assignment.</p></div></header><form className="team-form" onSubmit={add}><input required placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><input placeholder="Role" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}/><input type="number" min="1" placeholder="Capacity" value={form.capacity} onChange={e=>setForm({...form,capacity:e.target.value})}/><button>Add team member</button></form><section className="ops-grid">{members.map(member=><article className="ops-panel" key={member.id}><div className="ops-avatar">{member.name.split(" ").map(p=>p[0]).join("").slice(0,2)}</div><h3>{member.name}</h3><p>{member.role}</p><dl><div><dt>Email</dt><dd>{member.email||"—"}</dd></div><div><dt>Capacity</dt><dd>{member.capacity}</dd></div><div><dt>Status</dt><dd>{member.active?"Active":"Inactive"}</dd></div></dl><button onClick={()=>toggle(member)}>{member.active?"Deactivate":"Activate"}</button></article>)}</section></main>
}
