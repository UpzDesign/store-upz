"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { formatPrice } from "@/lib/catalog";
import { getEnabledServiceSlugs, getServiceLibrary } from "@/lib/company-services";
import type { IntakeDefinition } from "@/lib/intake-forms";
import { useCartStore, type CartItem } from "@/store/cart-store";

type PortalCompany = { id:string; slug:string; name:string; shortName:string; logo:string; primaryColor:string; secondaryColor:string; heroTitle:string; heroText:string; modules:string[]; featuredActions:Array<{title:string;description:string;href:string}> };
type Collection = { id:number; name:string; slug:string; description?:string|null; heroImage?:string|null; active?:boolean };
type CatalogItem = { id:number; title:string; description?:string|null; itemType:string; sourceVendor?:string|null; thumbnail?:string|null; price?:number|null; active:boolean; featured:boolean; sortOrder:number; collection?:Collection|null; product?:{id:number}|null };
type MarketingRequest = { id:number; type:string; title:string; priority:string; status:string; createdAt:string };
type PackageSummary = { id:number; title:string; description?:string|null; featured:boolean; items?:unknown[] };

function getItemImage(item:CatalogItem){ return item.thumbnail || "/placeholder.png"; }
function getItemLabel(item:CatalogItem){ if(item.sourceVendor==="printful") return "Merchandise"; if(item.itemType==="service") return "Service"; if(item.itemType==="digital") return "Digital"; if(item.itemType==="asset") return "Asset"; return "Catalog Item"; }
function buildCartItem(item:CatalogItem,company:PortalCompany):CartItem{ return { id:`catalog-${item.id}`, productId:item.product?.id?String(item.product.id):undefined, name:`${company.shortName} ${item.title}`, image:getItemImage(item), price:Number(item.price||0), quantity:1, companySlug:company.slug, companyName:company.name }; }
function slugLabel(value:string){ return value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }

function CatalogCard({item,company,addItem}:{item:CatalogItem;company:PortalCompany;addItem:(item:CartItem)=>void}){
  const productHref=item.product?.id?`/portal/${company.slug}/product/${item.product.id}`:null;
  const href=productHref;
  const content=<><div className="portal-product-card-image"><img src={getItemImage(item)} alt={item.title}/></div><div className="portal-product-card-body"><span>{getItemLabel(item)} · {item.collection?.name||"Catalog"}</span><h3>{company.shortName} {item.title}</h3><strong>{formatPrice(item.price)}</strong>{item.description&&<p>{item.description}</p>}<div className="portal-product-card-action">{productHref?"View Product":"Add to Cart"}<b>→</b></div></div></>;
  if(href) return <Link href={href} className="portal-product-card portal-product-card-link">{content}</Link>;
  return <article className="portal-product-card" onClick={()=>addItem(buildCartItem(item,company))} role="button" tabIndex={0}>{content}</article>;
}

function ServiceCard({service,company}:{service:IntakeDefinition;company:PortalCompany}){
  return <Link href={`/portal/${company.slug}/request/${service.slug}`} className="portal-assigned-service-card"><span>{service.fields.length} intake fields</span><h3>{service.name}</h3><p>{service.description}</p><strong>Start project →</strong></Link>;
}

export default function CompanyPortalPage(){
  const params=useParams(); const router=useRouter(); const slug=Array.isArray(params?.company)?params.company[0]:params?.company;
  const [company,setCompany]=useState<PortalCompany|null>(null); const [companyLoading,setCompanyLoading]=useState(true); const [companyError,setCompanyError]=useState(""); const [catalogItems,setCatalogItems]=useState<CatalogItem[]>([]); const [requests,setRequests]=useState<MarketingRequest[]>([]); const [packages,setPackages]=useState<PackageSummary[]>([]); const [loading,setLoading]=useState(true); const [services,setServices]=useState<IntakeDefinition[]>([]); const addItem=useCartStore((state)=>state.addItem);

  useEffect(()=>{ if(!slug)return; const savedSlug=window.localStorage.getItem("upz_company_slug"); if(savedSlug!==slug){router.push("/login");return;} setCompanyLoading(true); setCompanyError(""); fetch(`/api/portal/companies/${slug}`).then((res)=>{if(!res.ok)throw new Error("Portal not found");return res.json();}).then(setCompany).catch((err)=>setCompanyError(err?.message||"Portal not found")).finally(()=>setCompanyLoading(false)); },[slug,router]);
  useEffect(()=>{ if(!company)return; const library=getServiceLibrary(); const enabled=getEnabledServiceSlugs(company.slug,library); setServices(library.filter((service)=>enabled.includes(service.slug))); setLoading(true); Promise.all([fetch(`/api/portal/companies/${company.slug}/catalog-items`).then((res)=>{if(!res.ok)throw new Error("Unable to load catalog");return res.json();}),fetch(`/api/portal/companies/${company.slug}/requests`).then((res)=>res.ok?res.json():[]),fetch(`/api/portal/companies/${company.slug}/packages`).then((res)=>res.ok?res.json():[])]).then(([catalog,requestData,packageData])=>{setCatalogItems(Array.isArray(catalog)?catalog:[]);setRequests(Array.isArray(requestData)?requestData:[]);setPackages(Array.isArray(packageData)?packageData:[]);}).catch(()=>{setCatalogItems([]);setPackages([]);}).finally(()=>setLoading(false)); },[company]);

  const merchandiseItems=useMemo(()=>catalogItems.filter((item)=>item.itemType==="product"||item.sourceVendor==="printful"),[catalogItems]);
  const digitalItems=useMemo(()=>catalogItems.filter((item)=>["digital","asset","custom"].includes(item.itemType)),[catalogItems]);
  const activeRequests=useMemo(()=>requests.filter((request)=>!["complete","completed","cancelled"].includes(request.status.toLowerCase())).slice(0,6),[requests]);
  const featuredPackages=useMemo(()=>packages.filter((item)=>item.featured).slice(0,3),[packages]);
  const groupedMerchandise=useMemo(()=>{ const groups=new Map<string,{name:string;slug:string;description?:string|null;heroImage?:string|null;items:CatalogItem[]}>(); merchandiseItems.forEach((item)=>{const name=item.collection?.name||"Merchandise";const groupSlug=item.collection?.slug||slugLabel(name);if(!groups.has(groupSlug))groups.set(groupSlug,{name,slug:groupSlug,description:item.collection?.description,heroImage:item.collection?.heroImage,items:[]});groups.get(groupSlug)?.items.push(item);});return Array.from(groups.values()).sort((a,b)=>a.name.localeCompare(b.name)); },[merchandiseItems]);

  if(companyLoading)return <main className="portal-page"><section className="portal-simple-state"><h1>Loading portal...</h1></section></main>;
  if(companyError||!company)return <main className="portal-page"><section className="portal-simple-state"><h1>Portal not found</h1><Link href="/login">Back to login</Link></section></main>;

  return <main className="portal-page" style={{"--company-primary":company.primaryColor,"--company-secondary":company.secondaryColor} as React.CSSProperties}>
    <section className="portal-hero"><div className="upz-wrap portal-hero-inner"><div><div className="portal-eyebrow">Private Company Portal</div><h1>{company.heroTitle}</h1><p>{company.heroText}</p><div className="portal-actions"><a href="#requests">Active Projects</a><a href="#services">My Services</a><Link href={`/portal/${company.slug}/packages`}>Packages</Link><a href="#brand-assets">Brand Assets</a></div></div><div className="portal-brand-card"><img src={company.logo||"/upz-logo.svg"} alt={`${company.name} logo`}/><h2>{company.name}</h2><p>{services.length} approved services available through your UPZ workspace.</p></div></div></section>

    <section className="portal-modules"><div className="upz-wrap portal-module-grid">{[{label:"Active Projects",href:"#requests"},...services.slice(0,5).map((service)=>({label:service.name,href:`/portal/${company.slug}/request/${service.slug}`})),{label:"Packages",href:`/portal/${company.slug}/packages`},{label:"Brand Assets",href:"#brand-assets"}].map((module)=><Link key={`${module.label}-${module.href}`} href={module.href} className="portal-module-card"><span>{module.label}</span></Link>)}</div></section>

    <section id="requests" className="portal-section portal-request-dashboard"><div className="upz-wrap"><div className="portal-section-heading"><div><span>Workspace</span><h2>Active projects</h2></div><Link href={`/portal/${company.slug}/request/general`}>Start New Request</Link></div>{activeRequests.length?<div className="portal-request-grid">{activeRequests.map((request)=><article key={request.id}><span>{request.type}</span><h3>{request.title}</h3><div><strong>{request.status}</strong><em>{request.priority} priority</em></div></article>)}</div>:<div className="portal-empty-service"><h3>No active projects</h3><p>Choose an approved service below to start a request.</p></div>}</div></section>

    <section id="services" className="portal-section portal-service-lead"><div className="upz-wrap"><div className="portal-section-heading"><div><span>Company Catalog</span><h2>My services</h2></div><strong>{loading?"Loading...":`${services.length} available`}</strong></div>{services.length?<div className="portal-assigned-service-grid">{services.map((service)=><ServiceCard key={service.slug} service={service} company={company}/>)}</div>:<div className="portal-empty-service"><h3>No services enabled</h3><p>Contact UPZ to add services to this workspace.</p></div>}</div></section>

    <section className="portal-section portal-service-lead"><div className="upz-wrap"><div className="portal-section-heading"><div><span>Curated Solutions</span><h2>Packages</h2></div><Link href={`/portal/${company.slug}/packages`}>View All Packages</Link></div><div className="portal-service-priority-grid">{featuredPackages.length?featuredPackages.map((pkg)=><Link key={pkg.id} href={`/portal/${company.slug}/packages`}><span>Featured package</span><h3>{pkg.title}</h3><p>{pkg.description||"A curated combination of services, products, and deliverables."}</p></Link>):<Link href={`/portal/${company.slug}/packages`}><span>{packages.length} available</span><h3>Browse Curated Packages</h3><p>Start a complete project with a pre-built combination of services and products.</p></Link>}</div></div></section>

    <section id="merchandise" className="portal-section portal-merch-section"><div className="upz-wrap"><div className="portal-section-heading"><div><span>Products</span><h2>Company merchandise</h2></div><strong>{merchandiseItems.length} items</strong></div><div className="portal-collection-nav">{groupedMerchandise.map((collection)=><a key={collection.slug} href={`#merch-${collection.slug}`}>{collection.name}<span>{collection.items.length}</span></a>)}</div></div></section>
    {groupedMerchandise.map((collection,index)=><section key={collection.slug} id={`merch-${collection.slug}`} className={`portal-section ${index%2===1?"portal-soft-section":""}`}><div className="upz-wrap"><div className="portal-collection-hero">{collection.heroImage&&<img src={collection.heroImage} alt=""/>}<div><span>Merchandise Collection</span><h2>{collection.name}</h2>{collection.description&&<p>{collection.description}</p>}<strong>{collection.items.length} items</strong></div></div><div className="portal-product-grid">{collection.items.map((item)=><CatalogCard key={item.id} item={item} company={company} addItem={addItem}/>)}</div></div></section>)}

    <section id="brand-assets" className="portal-section portal-brand-assets"><div className="upz-wrap"><div className="portal-section-heading"><div><span>Brand Assets</span><h2>Approved identity resources</h2></div><strong>{digitalItems.length} downloadable item{digitalItems.length===1?"":"s"}</strong></div><div className="portal-brand-assets-grid"><div className="portal-brand-identity"><img src={company.logo||"/upz-logo.svg"} alt={`${company.name} logo`}/></div><div className="portal-brand-details"><article className="portal-brand-detail"><span>Primary Brand Color</span><div className="portal-color-swatch" style={{background:company.primaryColor}}/><strong>{company.primaryColor}</strong></article><article className="portal-brand-detail"><span>Secondary Brand Color</span><div className="portal-color-swatch" style={{background:company.secondaryColor}}/><strong>{company.secondaryColor}</strong></article><article className="portal-brand-detail"><span>Approved Logo</span><strong>{company.shortName} Identity</strong></article><article className="portal-brand-detail"><span>Support</span><strong>Request Another Format</strong></article></div></div>{digitalItems.length>0&&<div className="portal-product-grid" style={{marginTop:24}}>{digitalItems.map((item)=><CatalogCard key={item.id} item={item} company={company} addItem={addItem}/>)}</div>}</div></section>
  </main>;
}
