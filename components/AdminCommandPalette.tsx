"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Company = { id:number; name:string; shortName:string; slug:string };
type Command = { label:string; detail:string; href:string; keywords:string };

const baseCommands:Command[] = [
  { label:"Admin Dashboard", detail:"Overview and company portals", href:"/admin", keywords:"dashboard home companies" },
  { label:"Inbox", detail:"Review incoming client requests", href:"/admin/inbox", keywords:"inbox requests notifications queue" },
  { label:"Service Library", detail:"Add, edit, and manage shared intake services", href:"/admin/services", keywords:"services photography signage website branding print form editor" },
  { label:"New Company", detail:"Create a client portal", href:"/admin/new-company", keywords:"new company client portal" },
];

export default function AdminCommandPalette(){
  const pathname=usePathname();
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState("");
  const [companies,setCompanies]=useState<Company[]>([]);

  useEffect(()=>{
    if(!pathname?.startsWith("/admin"))return;
    fetch("/api/admin/companies",{cache:"no-store"}).then((response)=>response.ok?response.json():[]).then((data)=>setCompanies(Array.isArray(data)?data:[])).catch(()=>setCompanies([]));
  },[pathname]);

  useEffect(()=>{
    function onKeyDown(event:KeyboardEvent){
      if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){event.preventDefault();setOpen((current)=>!current);}
      if(event.key==="Escape")setOpen(false);
    }
    window.addEventListener("keydown",onKeyDown);
    return()=>window.removeEventListener("keydown",onKeyDown);
  },[]);

  const commands=useMemo(()=>[
    ...baseCommands,
    ...companies.flatMap((company):Command[]=>[
      {label:company.shortName,detail:`Open ${company.name}`,href:`/admin/company/${company.slug}`,keywords:`${company.name} ${company.slug} company settings`},
      {label:`${company.shortName} Requests`,detail:"Open company request queue",href:`/admin/company/${company.slug}/requests`,keywords:`${company.name} requests inbox`},
      {label:`${company.shortName} Portal`,detail:"Open client portal",href:`/portal/${company.slug}`,keywords:`${company.name} portal client`},
    ])
  ],[companies]);

  const filtered=useMemo(()=>{const value=query.trim().toLowerCase();return commands.filter((item)=>!value||`${item.label} ${item.detail} ${item.keywords}`.toLowerCase().includes(value)).slice(0,12);},[commands,query]);
  if(!pathname?.startsWith("/admin"))return null;

  return <>
    <button className="admin-command-trigger" type="button" onClick={()=>setOpen(true)} aria-label="Search admin"><span aria-hidden="true">⌕</span><strong>Search</strong><kbd>⌘K</kbd></button>
    {open&&<div className="admin-command-backdrop" role="presentation" onMouseDown={()=>setOpen(false)}>
      <section className="admin-command-palette" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={(event)=>event.stopPropagation()}>
        <div className="admin-command-search"><span>⌕</span><input autoFocus value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search companies, requests, services, or pages..."/><kbd>ESC</kbd></div>
        <div className="admin-command-results">{filtered.length?filtered.map((item)=><Link key={`${item.href}-${item.label}`} href={item.href} onClick={()=>{setOpen(false);setQuery("");}}><strong>{item.label}</strong><span>{item.detail}</span></Link>):<p>No matching destination.</p>}</div>
        <footer><span>Navigate instantly</span><span>⌘K / Ctrl+K</span></footer>
      </section>
    </div>}
  </>;
}