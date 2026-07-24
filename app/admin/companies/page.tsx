"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Company={id:number;name:string;slug:string;shortName:string;logo?:string|null;primaryColor:string;heroText:string;portalEnabled:boolean;newRequestCount?:number};

export default function CompaniesPage(){
  const [companies,setCompanies]=useState<Company[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  useEffect(()=>{fetch("/api/admin/companies",{cache:"no-store"}).then((response)=>{if(!response.ok)throw new Error("Unable to load companies");return response.json();}).then((data)=>setCompanies(Array.isArray(data)?data:[])).catch((err)=>setError(err?.message||"Unable to load companies")).finally(()=>setLoading(false));},[]);
  return <main className="admin-page"><section className="admin-main">
    <header className="admin-hero"><div><div className="admin-eyebrow">Client Administration</div><h1>Companies</h1><p>Add and manage client portals, branding, access, services, products, and request settings.</p></div><Link className="admin-primary-button" href="/admin/new-company">+ New Company</Link></header>
    <section className="admin-section"><div className="admin-section-heading"><div><span>Client Directory</span><h2>Active client portals</h2></div></div>
      {loading&&<p>Loading companies...</p>}{error&&<p className="admin-error">{error}</p>}
      <div className="admin-company-grid">{companies.map((company)=>{const count=Number(company.newRequestCount||0);return <article key={company.id} className={`admin-company-card ${count>0?"has-new-requests":""}`}>{count>0&&<Link className="admin-request-badge" href={`/admin/company/${company.slug}/requests`}>{count} new</Link>}<div className="admin-company-logo" style={{borderColor:company.primaryColor}}><img src={company.logo||"/upz-logo.svg"} alt={`${company.name} logo`}/></div><div><span style={{color:company.primaryColor}}>{company.shortName}</span><h3>{company.name}</h3><p>{company.heroText}</p></div><div className="admin-company-meta"><div><strong>Status</strong><span>{company.portalEnabled?"Active":"Disabled"}</span></div><div><strong>Requests</strong><Link href={`/admin/company/${company.slug}/requests`}>{count?`${count} new`:"View Requests"}</Link></div><div><strong>Manage</strong><Link href={`/admin/company/${company.slug}`}>Company Settings</Link></div><div><strong>Portal</strong><Link href={`/portal/${company.slug}`}>Open Portal</Link></div></div></article>;})}</div>
      {!loading&&!error&&!companies.length&&<p>No companies have been added yet.</p>}
    </section>
  </section></main>;
}
