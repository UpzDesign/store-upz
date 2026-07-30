"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminButton, AdminCard, AdminHeader, AdminPage, AdminSection, AdminSectionHeader, AdminStats, AdminTabs, StatCard } from "@/components/admin/AdminUI";

type Task={id:number;title:string;status:string;assignedTo?:string|null;dueDate?:string|null};
type WorkOrder={id:number;title:string;description?:string|null;status:string;priority:string;budget?:number|null;internalCost?:number|null;assignedTo?:string|null;dueDate?:string|null;tasks:Task[];notes:Array<{id:number;body:string;author?:string|null;createdAt:string}>};
type Portfolio={id:number;name:string;type:string;status:string;address?:string|null;city?:string|null;state?:string|null;postalCode?:string|null;description?:string|null;progress:number;totalBudget:number;totalCost:number;company:{name:string;shortName:string;slug?:string;logo?:string|null;primaryColor:string};assets:Array<{id:number;title:string;category:string;fileUrl?:string|null;description?:string|null}>;workOrders:WorkOrder[];activity:Array<{id:number;message:string;actor?:string|null;createdAt:string;workOrderTitle:string}>};

function money(value:number){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(value||0)}
function progress(order:WorkOrder){return order.tasks.length?Math.round(order.tasks.filter((task)=>["complete","completed"].includes(task.status)).length/order.tasks.length*100):0}
function label(value:string){return value.replaceAll("_"," ").replace(/\b\w/g,(letter)=>letter.toUpperCase())}

export default function AdminPortfolioDetailPage(){
  const params=useParams();
  const router=useRouter();
  const id=Array.isArray(params?.id)?params.id[0]:params?.id;
  const[data,setData]=useState<Portfolio|null>(null);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState("");
  const[activeOrder,setActiveOrder]=useState<number|null>(null);
  const[tab,setTab]=useState("overview");
  const[working,setWorking]=useState(false);
  const[deleteConfirm,setDeleteConfirm]=useState("");

  async function load(){
    if(!id)return;
    setError("");
    try{
      const response=await fetch(`/api/admin/engagements/${id}`,{cache:"no-store"});
      const item=await response.json();
      if(!response.ok)throw new Error(item?.error||"Unable to load portfolio");
      setData(item);
      setActiveOrder((current)=>current&&item.workOrders.some((order:WorkOrder)=>order.id===current)?current:item.workOrders?.[0]?.id||null);
    }catch(error:any){setError(error?.message||"Unable to load portfolio");}
    finally{setLoading(false);}
  }

  useEffect(()=>{load();},[id]);
  const selected=useMemo(()=>data?.workOrders.find((item)=>item.id===activeOrder)||null,[data,activeOrder]);

  async function setPortfolioStatus(status:"active"|"archived"){
    if(!data||working)return;
    const verb=status==="archived"?"Archive":"Restore";
    if(!window.confirm(`${verb} portfolio “${data.name}”?`))return;
    setWorking(true);
    const response=await fetch(`/api/admin/engagements/${data.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});
    const result=await response.json().catch(()=>null);
    setWorking(false);
    if(!response.ok){setError(result?.error||`Unable to ${verb.toLowerCase()} portfolio`);return;}
    await load();
  }

  async function removeWorkOrder(order:WorkOrder){
    if(working)return;
    const confirmation=window.prompt(`Permanently delete “${order.title}”?\n\nThis removes its stages, messages, files, and originating request. Type DELETE to continue.`);
    if(confirmation!=="DELETE")return;
    setWorking(true);
    const response=await fetch(`/api/admin/work-orders/${order.id}`,{method:"DELETE"});
    const result=await response.json().catch(()=>null);
    setWorking(false);
    if(!response.ok){setError(result?.error||"Unable to delete work order");return;}
    await load();
  }

  async function deletePortfolio(){
    if(!data||working||deleteConfirm!==data.name)return;
    if(!window.confirm(`Permanently delete portfolio “${data.name}” and all ${data.workOrders.length} work orders? This cannot be undone.`))return;
    setWorking(true);
    const response=await fetch(`/api/admin/engagements/${data.id}`,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({confirmation:deleteConfirm})});
    const result=await response.json().catch(()=>null);
    if(!response.ok){setWorking(false);setError(result?.error||"Unable to delete portfolio");return;}
    router.replace("/admin/engagements");
    router.refresh();
  }

  if(loading)return <AdminPage><AdminSection><h1>Loading portfolio...</h1></AdminSection></AdminPage>;
  if(!data)return <AdminPage><AdminSection><h1>Portfolio not found</h1>{error&&<p className="admin-error">{error}</p>}<AdminButton href="/admin/engagements">Back to Portfolios</AdminButton></AdminSection></AdminPage>;

  const companySlug=data.company.slug||data.company.shortName.toLowerCase();
  const address=[data.address,data.city,data.state,data.postalCode].filter(Boolean).join(", ");
  const activeOrders=data.workOrders.filter((order)=>!["complete","completed","cancelled"].includes(order.status.toLowerCase())).length;
  const completedOrders=data.workOrders.filter((order)=>["complete","completed"].includes(order.status.toLowerCase())).length;

  return <AdminPage className="portfolio-detail-page">
    <AdminHeader
      eyebrow={`${data.company.shortName} · ${data.type==="property"?"Property Portfolio":"Portfolio"}`}
      title={data.name}
      description={address||data.description||"Portfolio workspace for related locations, services, files, and work orders."}
      actions={<><AdminButton variant="outline" href="/admin/engagements">All Portfolios</AdminButton><AdminButton variant="outline" href="/admin/operations">Operations</AdminButton><AdminButton href={`/portal/${companySlug}/request/general?engagementId=${data.id}&engagementName=${encodeURIComponent(data.name)}`}>Add Work Order</AdminButton></>}
    />

    {error&&<p className="admin-error">{error}</p>}

    <AdminStats>
      <StatCard label="Portfolio status" value={label(data.status)}/>
      <StatCard label="Active work orders" value={activeOrders}/>
      <StatCard label="Completed" value={completedOrders}/>
      <StatCard label="Overall progress" value={`${data.progress}%`}/>
      <StatCard label="Shared assets" value={data.assets.length}/>
    </AdminStats>

    <AdminTabs className="portfolio-detail-tabs">{[["overview","Overview"],["work-orders","Work Orders"],["assets","Shared Assets"],["activity","Activity"],["settings","Settings"]].map(([value,title])=><button type="button" key={value} className={tab===value?"active":""} onClick={()=>setTab(value)}>{title}</button>)}</AdminTabs>

    {tab==="overview"&&<div className="portfolio-detail-layout">
      <div className="portfolio-detail-main">
        <AdminSection>
          <AdminSectionHeader eyebrow="Financial summary" title="Portfolio performance"/>
          <div className="portfolio-metric-grid"><AdminCard><span>Total budget</span><strong>{money(data.totalBudget)}</strong></AdminCard><AdminCard><span>Internal cost</span><strong>{money(data.totalCost)}</strong></AdminCard><AdminCard variant="highlight"><span>Projected margin</span><strong>{money(data.totalBudget-data.totalCost)}</strong></AdminCard></div>
        </AdminSection>
        <AdminSection>
          <AdminSectionHeader eyebrow="Production" title="Work orders" actions={<AdminButton href={`/portal/${companySlug}/request/general?engagementId=${data.id}&engagementName=${encodeURIComponent(data.name)}`}>Add Work Order</AdminButton>}/>
          <div className="portfolio-order-list">{data.workOrders.map((order)=><button type="button" key={order.id} className={activeOrder===order.id?"active":""} onClick={()=>setActiveOrder(order.id)}><div><span>{label(order.status)} · {order.priority} priority</span><h3>{order.title}</h3><p>{order.description||"Production workflow"}</p></div><div><strong>{progress(order)}%</strong><small>{order.tasks.length} stages</small></div></button>)}{!data.workOrders.length&&<p>No work orders in this portfolio.</p>}</div>
        </AdminSection>
      </div>
      <AdminSection className="portfolio-selected-order">
        <AdminSectionHeader eyebrow="Selected work order" title={selected?.title||"Choose a work order"}/>
        {selected&&<><div className="portfolio-selected-meta"><span>Status<strong>{label(selected.status)}</strong></span><span>Assigned<strong>{selected.assignedTo||"Unassigned"}</strong></span><span>Due<strong>{selected.dueDate?new Date(selected.dueDate).toLocaleDateString():"TBD"}</strong></span><span>Budget<strong>{money(Number(selected.budget||0))}</strong></span></div><div className="portfolio-stage-list">{selected.tasks.map((task,index)=><article key={task.id} className={task.status}><span>{["complete","completed"].includes(task.status)?"✓":index+1}</span><div><strong>{task.title}</strong><small>{task.assignedTo||"Unassigned"}{task.dueDate?` · ${new Date(task.dueDate).toLocaleDateString()}`:""}</small></div></article>)}</div><div className="portfolio-selected-actions"><AdminButton href={`/admin/operations?project=${selected.id}`}>Manage Work Order</AdminButton><AdminButton variant="danger" type="button" disabled={working} onClick={()=>removeWorkOrder(selected)}>Delete Work Order</AdminButton></div></>}
      </AdminSection>
    </div>}

    {tab==="work-orders"&&<AdminSection><AdminSectionHeader eyebrow="All services" title="Portfolio work orders" actions={<AdminButton href={`/portal/${companySlug}/request/general?engagementId=${data.id}&engagementName=${encodeURIComponent(data.name)}`}>Add Work Order</AdminButton>}/><div className="portfolio-order-grid">{data.workOrders.map((order)=><article key={order.id}><span>{label(order.status)}</span><h3>{order.title}</h3><p>{order.description||"No description added."}</p><div><strong>{progress(order)}%</strong><small>{order.tasks.length} stages</small></div><footer><AdminButton variant="outline" href={`/admin/operations?project=${order.id}`}>Manage</AdminButton><AdminButton variant="danger" type="button" disabled={working} onClick={()=>removeWorkOrder(order)}>Delete</AdminButton></footer></article>)}</div></AdminSection>}

    {tab==="assets"&&<AdminSection><AdminSectionHeader eyebrow="Shared resources" title="Portfolio assets"/><div className="portfolio-asset-grid">{data.assets.map((asset)=><article key={asset.id}><span>{asset.category}</span><h3>{asset.title}</h3><p>{asset.description||"Available to every work order in this portfolio."}</p>{asset.fileUrl&&<a href={asset.fileUrl} target="_blank" rel="noreferrer">Open asset →</a>}</article>)}{!data.assets.length&&<p>No shared assets uploaded yet.</p>}</div></AdminSection>}

    {tab==="activity"&&<AdminSection><AdminSectionHeader eyebrow="Timeline" title="Recent portfolio activity"/><div className="portfolio-activity-list">{data.activity.map((item)=><article key={`${item.id}-${item.workOrderTitle}`}><span>{new Date(item.createdAt).toLocaleString()}</span><div><strong>{item.workOrderTitle}</strong><p>{item.message}</p><small>{item.actor||"UPZ Admin"}</small></div></article>)}{!data.activity.length&&<p>No activity yet.</p>}</div></AdminSection>}

    {tab==="settings"&&<div className="portfolio-settings-grid">
      <AdminSection><AdminSectionHeader eyebrow="Portfolio visibility" title={data.status==="archived"?"Restore portfolio":"Archive portfolio"}/><p>{data.status==="archived"?"Restore this portfolio to active admin and client views.":"Archive hides the portfolio and all of its work orders from active client and admin views without deleting the underlying history."}</p><AdminButton variant="outline" type="button" disabled={working} onClick={()=>setPortfolioStatus(data.status==="archived"?"active":"archived")}>{data.status==="archived"?"Restore Portfolio":"Archive Portfolio"}</AdminButton></AdminSection>
      <AdminSection className="portfolio-danger-zone"><AdminSectionHeader eyebrow="Danger zone" title="Permanently delete portfolio"/><p>This permanently removes the portfolio, every work order, all stages, discussions, activities, originating requests, and shared assets. This cannot be undone.</p><label>Type <strong>{data.name}</strong> to confirm<input value={deleteConfirm} onChange={(event)=>setDeleteConfirm(event.target.value)} placeholder={data.name}/></label><AdminButton variant="danger" type="button" disabled={working||deleteConfirm!==data.name} onClick={deletePortfolio}>{working?"Deleting...":`Delete Portfolio & ${data.workOrders.length} Work Orders`}</AdminButton></AdminSection>
    </div>}
  </AdminPage>;
}
