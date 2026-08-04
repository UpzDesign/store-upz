"use client";

import { useEffect } from "react";
import { useParams,useRouter,useSearchParams } from "next/navigation";

export default function LegacyServiceRequestRedirect(){
 const params=useParams(),router=useRouter(),search=useSearchParams();
 useEffect(()=>{
  const company=Array.isArray(params.company)?params.company[0]:String(params.company||"");
  const service=Array.isArray(params.service)?params.service[0]:String(params.service||"");
  const next=new URLSearchParams(search.toString());
  if(service)next.set("service",service);
  router.replace(`/portal/${company}/request?${next.toString()}`);
 },[params,router,search]);
 return <main className="portal-page composer-loading">Opening project request...</main>;
}
