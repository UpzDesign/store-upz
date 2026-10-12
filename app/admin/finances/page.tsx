"use client";

import Link from "next/link";
import {ChangeEvent,useEffect,useMemo,useState} from "react";
import {AdminButton,AdminCard,AdminEmptyState,AdminHeader,AdminPage,AdminSection,AdminSectionHeader,AdminStats,StatCard} from "@/components/admin/AdminUI";

type Invoice={fileId:number;fileName:string;invoiceNumber?:string;amount?:number|null};
type CompanyOption={id:number;name:string;shortName:string};
type FinanceWorkOrder={id:number;kind?:"direct"|"workorder";title:string;status:string;budget?:number|null;company:{name:string;shortName:string};portfolio:string|null;invoice:Invoice|null;invoiceDate:string|null;paid:boolean;paymentDate:string|null};
const money=(amount:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(amount);
export default function FinancesPage(){
 const[items,setItems]=useState<FinanceWorkOrder[]>([]);
 const[companies,setCompanies]=useState<CompanyOption[]>([]),[directCompany,setDirectCompany]=useState(""),[directTitle,setDirectTitle]=useState(""),[directNumber,setDirectNumber]=useState(""),[directAmount,setDirectAmount]=useState(""),[directFile,setDirectFile]=useState<File|null>(null);
 const[loading,setLoading]=useState(true),[busy,setBusy]=useState<number|null>(null),[error,setError]=useState("");
 const[details,setDetails]=useState<Record<number,{invoiceNumber:string;amount:string}>>({});
 async function load(){const response=await fetch("/api/admin/finances",{cache:"no-store"});const data=await response.json();if(!response.ok)throw new Error(data.error||"Unable to load finances");setItems(data)}
 useEffect(()=>{load().catch(e=>setError(e.message)).finally(()=>setLoading(false));fetch("/api/admin/companies",{cache:"no-store"}).then(r=>r.ok?r.json():[]).then(data=>setCompanies(Array.isArray(data)?data:[])).catch(()=>{})},[]);
 const ready=useMemo(()=>items.filter(item=>item.kind!=="direct"&&!item.invoice),[items]);
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
  try{const response=await fetch(item.kind==="direct"?`/api/admin/finances/direct/${item.id}`:"/api/admin/finances",{method:item.kind==="direct"?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"paid",projectId:item.id})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Unable to record payment");await load()}catch(e){setError(e instanceof Error?e.message:"Unable to record payment")}finally{setBusy(null)}
 }
 const label=(item:FinanceWorkOrder)=><div className="upz-finance-identity"><span>{item.company.shortName}{item.portfolio?` · ${item.portfolio}`:""}</span><strong>{item.kind==="direct"?item.title:<Link href={`/admin/project/${item.id}`}>{item.title}</Link>}</strong><small>{item.kind==="direct"?"Direct company invoice":`Work Order #${item.id}`}</small></div>;
 const invoiceHref=(item:FinanceWorkOrder)=>item.kind==="direct"?`/api/admin/finances/direct/${item.id}`:`/api/admin/files/${item.invoice?.fileId}`;
 async function uploadDirect(event:React.FormEvent){event.preventDefault();if(!directCompany||!directTitle.trim()||!directFile){setError("Company, description and PDF are required.");return}setBusy(-1);setError("");try{const form=new FormData();form.append("companyId",directCompany);form.append("title",directTitle);form.append("invoiceNumber",directNumber);form.append("amount",directAmount);form.append("file",directFile);const response=await fetch("/api/admin/finances/direct",{method:"POST",body:form});const data=await response.json();if(!response.ok)throw new Error(data.error||"Unable to upload invoice");setDirectTitle("");setDirectNumber("");setDirectAmount("");setDirectFile(null);const input=document.getElementById("upz-direct-invoice-pdf") as HTMLInputElement|null;if(input)input.value="";await load()}catch(e){setError(e instanceof Error?e.message:"Unable to upload invoice")}finally{setBusy(null)}}
 return <AdminPage className="upz-finances-page"><AdminHeader eyebrow="UPZ Admin · Accounting" title="Finances" description="Track completed Work Orders and upload invoices directly against a company—even when no Work Order was created." actions={<AdminButton variant="outline" href="/admin/operations">Work Orders</AdminButton>}/>
  <AdminSection className="upz-direct-invoice-section"><AdminSectionHeader eyebrow="Manual invoices" title="Add a company invoice" /><p>For completed jobs not tracked as Work Orders. Select a company, describe the job, and attach its invoice PDF. It will appear immediately under Waiting for Payment.</p><form className="upz-direct-invoice-form" onSubmit={uploadDirect}><label>Company *<select required value={directCompany} onChange={e=>setDirectCompany(e.target.value)}><option value="">Select company</option>{companies.map(company=><option key={company.id} value={company.id}>{company.name}</option>)}</select></label><label>Job / invoice description *<input required value={directTitle} onChange={e=>setDirectTitle(e.target.value)} placeholder="e.g. 25 Broker Headshots"/></label><label>Invoice number<input value={directNumber} onChange={e=>setDirectNumber(e.target.value)} placeholder="Optional"/></label><label>Invoice amount ($)<input type="number" min="0" step=".01" value={directAmount} onChange={e=>setDirectAmount(e.target.value)} placeholder="Optional"/></label><label>Invoice PDF *<input id="upz-direct-invoice-pdf" required type="file" accept="application/pdf,.pdf" onChange={e=>setDirectFile(e.target.files?.[0]||null)}/></label><AdminButton type="submit" disabled={busy!==null}>{busy===-1?"Uploading…":"Upload Company Invoice"}</AdminButton></form></AdminSection>
  <AdminStats><StatCard label="Ready to invoice" value={ready.length}/><StatCard label="Awaiting payment" value={waiting.length}/><StatCard label="Paid" value={completed.length}/><StatCard label="Outstanding invoiced" value={money(waiting.reduce((sum,item)=>sum+Number(item.invoice?.amount??item.budget??0),0))}/></AdminStats>
  {error&&<p className="admin-error" role="alert">{error}</p>}
  <AdminSection><AdminSectionHeader eyebrow="Step 1" title={`Ready to invoice · ${ready.length}`}/>{loading?<p>Loading finances…</p>:ready.length?<div className="upz-finance-list">{ready.map(item=><AdminCard key={item.id} className="upz-finance-row">{label(item)}<div className="upz-finance-actions"><input aria-label="Invoice number" placeholder="Invoice # (optional)" value={details[item.id]?.invoiceNumber||""} onChange={e=>setDetails(s=>({...s,[item.id]:{invoiceNumber:e.target.value,amount:s[item.id]?.amount||""}}))}/><input aria-label="Invoice amount" type="number" min="0" step=".01" placeholder={item.budget!=null?`Amount (estimate ${money(item.budget)})`:"Amount (optional)"} value={details[item.id]?.amount||""} onChange={e=>setDetails(s=>({...s,[item.id]:{invoiceNumber:s[item.id]?.invoiceNumber||"",amount:e.target.value}}))}/><label className="admin-ui-btn admin-ui-btn--primary upz-finance-upload">{busy===item.id?"Uploading…":"Upload Invoice PDF"}<input type="file" accept="application/pdf,.pdf" disabled={busy!==null} onChange={e=>upload(item,e)}/></label></div></AdminCard>)}</div>:<AdminEmptyState>No completed Work Orders are waiting for invoices.</AdminEmptyState>}</AdminSection>
  <AdminSection><AdminSectionHeader eyebrow="Step 2" title={`Waiting for payment · ${waiting.length}`}/>{waiting.length?<div className="upz-finance-list">{waiting.map(item=><AdminCard key={item.id} className="upz-finance-row">{label(item)}<div className="upz-finance-actions"><div className="upz-finance-invoice"><a href={invoiceHref(item)} target="_blank" rel="noreferrer">View invoice PDF ↗</a><span>{item.invoice?.invoiceNumber||"Invoice uploaded"} · {item.invoice?.amount!=null?money(item.invoice.amount):"Amount not specified"}</span></div><label className="upz-finance-paid-check"><input type="checkbox" disabled={busy!==null} checked={false} onChange={()=>markPaid(item)}/> Payment received</label></div></AdminCard>)}</div>:<AdminEmptyState>No invoices awaiting payment.</AdminEmptyState>}</AdminSection>
  <AdminSection><AdminSectionHeader eyebrow="Step 3" title={`Paid / completed · ${completed.length}`}/>{completed.length?<div className="upz-finance-list">{completed.map(item=><AdminCard key={item.id} className="upz-finance-row">{label(item)}<div className="upz-finance-actions"><a href={`/api/admin/files/${item.invoice?.fileId}`} target="_blank" rel="noreferrer">Invoice PDF ↗</a><span className="upz-finance-paid-label">✓ Paid {item.paymentDate?new Date(item.paymentDate).toLocaleDateString():""}</span></div></AdminCard>)}</div>:<AdminEmptyState>No paid invoices recorded yet.</AdminEmptyState>}</AdminSection>
 </AdminPage>
}
