"use client";

import Link from "next/link";
import {ChangeEvent,useEffect,useMemo,useState} from "react";
import {AdminButton,AdminCard,AdminEmptyState,AdminHeader,AdminPage,AdminSection,AdminSectionHeader,AdminStats,StatCard} from "@/components/admin/AdminUI";

type Invoice={fileId:number;fileName:string;invoiceNumber?:string;amount?:number|null};
type FinanceWorkOrder={id:number;title:string;status:string;budget?:number|null;company:{name:string;shortName:string};portfolio:string|null;invoice:Invoice|null;invoiceDate:string|null;paid:boolean;paymentDate:string|null};
const money=(amount:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(amount);
export default function FinancesPage(){
 const[items,setItems]=useState<FinanceWorkOrder[]>([]);
 const[loading,setLoading]=useState(true),[busy,setBusy]=useState<number|null>(null),[error,setError]=useState("");
 const[details,setDetails]=useState<Record<number,{invoiceNumber:string;amount:string}>>({});
 async function load(){const response=await fetch("/api/admin/finances",{cache:"no-store"});const data=await response.json();if(!response.ok)throw new Error(data.error||"Unable to load finances");setItems(data)}
 useEffect(()=>{load().catch(e=>setError(e.message)).finally(()=>setLoading(false))},[]);
 const ready=useMemo(()=>items.filter(item=>!item.invoice),[items]);
 const waiting=useMemo(()=>items.filter(item=>item.invoice&&!item.paid),[items]);
 const completed=useMemo(()=>items.filter(item=>item.invoice&&item.paid),[items]);
 async function upload(item:FinanceWorkOrder,event:ChangeEvent<HTMLInputElement>){
  const file=event.target.files?.[0];event.target.value="";if(!file)return;
  if(file.type!=="application/pdf"&&!file.name.toLowerCase().endsWith(".pdf")){setError("Please select a PDF invoice.");return}
  setBusy(item.id);setError("");
  try{
   const payload=new FormData();payload.append("file",file);payload.append("projectId",String(item.id));
   const response=await fetch("/api/admin/files/upload",{method:"POST",body:payload});
   const uploaded=await response.json();if(!response.ok)throw new Error(uploaded.error||"PDF upload failed");
   const detail=details[item.id]||{invoiceNumber:"",amount:""};
   const saved=await fetch("/api/admin/finances",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"invoice",projectId:item.id,fileId:uploaded.id,fileName:uploaded.name,invoiceNumber:detail.invoiceNumber,amount:detail.amount})});
   const result=await saved.json();if(!saved.ok)throw new Error(result.error||"Unable to save invoice");
   await load();
  }catch(e){setError(e instanceof Error?e.message:"Invoice upload failed")}finally{setBusy(null)}
 }
 async function markPaid(item:FinanceWorkOrder){
  if(!window.confirm("Confirm full payment received for "+item.title+"?"))return;
  setBusy(item.id);setError("");
  try{const response=await fetch("/api/admin/finances",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"paid",projectId:item.id})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Unable to record payment");await load()}catch(e){setError(e instanceof Error?e.message:"Unable to record payment")}finally{setBusy(null)}
 }
 const label=(item:FinanceWorkOrder)=><div className="upz-finance-identity"><span>{item.company.shortName} · {item.portfolio||"Unassigned portfolio"}</span><strong><Link href={`/admin/project/${item.id}`}>{item.title}</Link></strong><small>Work Order #{item.id}</small></div>;
 return <AdminPage className="upz-finances-page"><AdminHeader eyebrow="UPZ Admin · Accounting" title="Finances" description="Completed Work Orders flow from Ready to Invoice → Waiting for Payment → Paid. Upload the actual invoice PDF and record payment when received." actions={<AdminButton variant="outline" href="/admin/operations">Work Orders</AdminButton>}/>
  <AdminStats><StatCard label="Ready to invoice" value={ready.length}/><StatCard label="Awaiting payment" value={waiting.length}/><StatCard label="Paid" value={completed.length}/><StatCard label="Outstanding invoiced" value={money(waiting.reduce((sum,item)=>sum+Number(item.invoice?.amount??item.budget??0),0))}/></AdminStats>
  {error&&<p className="admin-error" role="alert">{error}</p>}
  <AdminSection><AdminSectionHeader eyebrow="Step 1" title={`Ready to invoice · ${ready.length}`}/>{loading?<p>Loading finances…</p>:ready.length?<div className="upz-finance-list">{ready.map(item=><AdminCard key={item.id} className="upz-finance-row">{label(item)}<div className="upz-finance-actions"><input aria-label="Invoice number" placeholder="Invoice # (optional)" value={details[item.id]?.invoiceNumber||""} onChange={e=>setDetails(s=>({...s,[item.id]:{invoiceNumber:e.target.value,amount:s[item.id]?.amount||""}}))}/><input aria-label="Invoice amount" type="number" min="0" step=".01" placeholder={item.budget!=null?`Amount (estimate ${money(item.budget)})`:"Amount (optional)"} value={details[item.id]?.amount||""} onChange={e=>setDetails(s=>({...s,[item.id]:{invoiceNumber:s[item.id]?.invoiceNumber||"",amount:e.target.value}}))}/><label className="admin-ui-btn admin-ui-btn--primary upz-finance-upload">{busy===item.id?"Uploading…":"Upload Invoice PDF"}<input type="file" accept="application/pdf,.pdf" disabled={busy!==null} onChange={e=>upload(item,e)}/></label></div></AdminCard>)}</div>:<AdminEmptyState>No completed Work Orders are waiting for invoices.</AdminEmptyState>}</AdminSection>
  <AdminSection><AdminSectionHeader eyebrow="Step 2" title={`Waiting for payment · ${waiting.length}`}/>{waiting.length?<div className="upz-finance-list">{waiting.map(item=><AdminCard key={item.id} className="upz-finance-row">{label(item)}<div className="upz-finance-actions"><div className="upz-finance-invoice"><a href={`/api/admin/files/${item.invoice?.fileId}`} target="_blank" rel="noreferrer">View invoice PDF ↗</a><span>{item.invoice?.invoiceNumber||"Invoice uploaded"} · {item.invoice?.amount!=null?money(item.invoice.amount):"Amount not specified"}</span></div><label className="upz-finance-paid-check"><input type="checkbox" disabled={busy!==null} checked={false} onChange={()=>markPaid(item)}/> Payment received</label></div></AdminCard>)}</div>:<AdminEmptyState>No invoices awaiting payment.</AdminEmptyState>}</AdminSection>
  <AdminSection><AdminSectionHeader eyebrow="Step 3" title={`Paid / completed · ${completed.length}`}/>{completed.length?<div className="upz-finance-list">{completed.map(item=><AdminCard key={item.id} className="upz-finance-row">{label(item)}<div className="upz-finance-actions"><a href={`/api/admin/files/${item.invoice?.fileId}`} target="_blank" rel="noreferrer">Invoice PDF ↗</a><span className="upz-finance-paid-label">✓ Paid {item.paymentDate?new Date(item.paymentDate).toLocaleDateString():""}</span></div></AdminCard>)}</div>:<AdminEmptyState>No paid invoices recorded yet.</AdminEmptyState>}</AdminSection>
 </AdminPage>
}
