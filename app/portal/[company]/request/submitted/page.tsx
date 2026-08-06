"use client";

import Link from "next/link";
import { useEffect,useState } from "react";
import { useParams,useRouter,useSearchParams } from "next/navigation";

type Company={name:string;shortName:string;logo?:string|null;primaryColor:string;secondaryColor:string;brandTextColor?:string};

export default function RequestSubmittedPage(){
 const params=useParams(),router=useRouter(),search=useSearchParams();
 const slug=Array.isArray(params.company)?params.company[0]:String(params.company||"");
 const[company,setCompany]=useState<Company|null>(null);
 const project=search.get("project")||"Your project";
 const serviceCount=Math.max(1,Number(search.get("services")||1));
 useEffect(()=>{if(!slug)return;if(localStorage.getItem("upz_company_slug")!==slug){router.push("/login");return}fetch(`/api/portal/companies/${slug}`).then(response=>response.ok?response.json():null).then(setCompany)},[slug,router]);
 const style={"--company-primary":company?.primaryColor||"#edbf2d","--company-secondary":company?.secondaryColor||"#111","--company-on-primary":company?.brandTextColor||company?.secondaryColor||"#fff"}as React.CSSProperties;
 return <main className="portal-page client-workspace-page client-request-page" style={style}>
  <section className="client-workspace-hero"><div className="upz-wrap"><div className="client-workspace-brand">{company?.logo&&<img src={company.logo} alt={`${company.name} logo`}/>}<div><span>{company?.shortName||"Client"} Workspace</span><h1>Request Submitted</h1><p>Your project request is now in the UPZ review queue.</p></div></div><nav className="client-workspace-nav"><Link href={`/portal/${slug}`}>Portal Home</Link><Link className="active" href={`/portal/${slug}/projects`}>Projects &amp; Requests</Link><Link href={`/portal/${slug}/deliverables`}>Project Files</Link><Link href={`/portal/${slug}/request`}>New Request</Link></nav></div></section>
  <section className="upz-wrap client-request-confirmation"><div className="client-request-confirmation-mark">✓</div><span>Pending review</span><h2>{project}</h2><p>{serviceCount} service{serviceCount===1?"":"s"} submitted successfully. UPZ will review the scope, confirm pricing and scheduling, and post updates in Projects & Requests.</p><div><Link className="primary" href={`/portal/${slug}/projects`}>View Pending Request</Link><Link href={`/portal/${slug}`}>Return to Portal</Link></div></section>
 </main>
}
