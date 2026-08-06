"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart-store";

const money = (value?: number) => `$${Number(value || 0).toFixed(2)}`;
type RequestDraft={mode:"new"|"existing";projectId:string;projectName:string;propertyType:string;address:string;space:string;contactName:string;contactEmail:string;priority:string;attachments:string;notes:string;selected:string[];services:Array<{slug:string;name:string;answers:Record<string,unknown>;fields:Array<{key:string;label:string;checklistStage?:string}>}>};

export default function Cart() {
  const pathname = usePathname();
  const router = useRouter();
  const cart = useCartStore();
  const [checkingOut, setCheckingOut] = useState(false);
  const [submittingRequests, setSubmittingRequests] = useState(false);
  const [error, setError] = useState("");

  const merchItems = useMemo(() => cart.items.filter(item => item.itemType !== "service_request"), [cart.items]);
  const requestItems = useMemo(() => cart.items.filter(item => item.itemType === "service_request"), [cart.items]);
  const quantity = useMemo(() => merchItems.reduce((sum, item) => sum + item.quantity, 0) + requestItems.length, [merchItems, requestItems]);
  const subtotal = useMemo(() => merchItems.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0), [merchItems]);
  const requestProject = requestItems[0]?.projectName || requestItems[0]?.address || "Project request";
  const requestAddress = requestItems[0]?.address || "";

  if (!pathname?.startsWith("/portal/")) return null;

  async function checkout() {
    setCheckingOut(true); setError("");
    try {
      const companySlug = window.localStorage.getItem("upz_company_slug");
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: merchItems, companySlug }) });
      const data = await response.json();
      if (!response.ok || !data?.url) throw new Error(data?.error || "Unable to start checkout");
      window.location.assign(data.url);
    } catch (checkoutError: any) {
      setError(checkoutError?.message || "Unable to start checkout"); setCheckingOut(false);
    }
  }

  async function submitRequests(){
    if(submittingRequests||!requestItems.length)return;
    const companySlug=requestItems[0]?.companySlug||window.localStorage.getItem("upz_company_slug")||"";
    const raw=sessionStorage.getItem(`upz_request_cart_${companySlug}`);
    if(!raw){setError("Request details are no longer available. Return to the form and review again.");return}
    let draft:RequestDraft;
    try{draft=JSON.parse(raw)}catch{setError("Unable to read the request details. Return to the form and review again.");return}
    const allowed=new Set(requestItems.map(item=>item.serviceSlug).filter(Boolean));
    const services=draft.services.filter(service=>allowed.has(service.slug));
    if(!services.length){setError("Add at least one service before submitting.");return}
    setSubmittingRequests(true);setError("");
    try{
      const requestGroup={projectName:draft.projectName,propertyType:draft.propertyType,address:draft.address,space:draft.space,services:services.map(service=>service.slug)};
      for(const service of services){
        const location=draft.space||draft.propertyType;
        const workOrderTitle=`${draft.projectName} · ${location} · ${service.name}`;
        const checklistSelections=service.fields.filter(field=>field.checklistStage&&Array.isArray(service.answers[field.key])&&(service.answers[field.key]as unknown[]).length).map(field=>({fieldKey:field.key,fieldLabel:field.label,stage:field.checklistStage,items:service.answers[field.key]}));
        const response=await fetch(`/api/portal/companies/${companySlug}/requests`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({service:service.name,serviceSlug:service.slug,engagementId:draft.mode==="existing"?draft.projectId:undefined,engagementName:draft.projectName,portfolioName:draft.projectName,locationName:location,workOrderTitle,propertyAddress:draft.address,propertyType:draft.propertyType,priority:draft.priority,answers:{contactName:draft.contactName,contactEmail:draft.contactEmail,propertyType:draft.propertyType,propertyAddress:draft.address,attachments:draft.attachments,notes:draft.notes,...service.answers},checklistSelections,requestGroup})});
        const data=await response.json().catch(()=>null);
        if(!response.ok)throw new Error(data?.error||`Unable to submit ${service.name}`);
      }
      sessionStorage.removeItem(`upz_request_cart_${companySlug}`);
      cart.clearRequestItems(companySlug);
      cart.closeCart();
      router.push(`/portal/${companySlug}/request/submitted?project=${encodeURIComponent(draft.projectName)}&services=${services.length}`);
    }catch(submitError:any){setError(submitError?.message||"Unable to submit request");setSubmittingRequests(false)}
  }

  return <>
    <button className="portal-cart-trigger" type="button" onClick={() => cart.isOpen ? cart.closeCart() : cart.openCart()}>Cart ({quantity})</button>
    <div className={`portal-cart-overlay ${cart.isOpen ? "open" : ""}`} onClick={cart.closeCart} />
    <aside className={`portal-cart-drawer ${cart.isOpen ? "open" : ""}`} aria-hidden={!cart.isOpen}>
      <header><div><h3>Cart</h3><p>{quantity} item{quantity === 1 ? "" : "s"}</p></div><button type="button" onClick={cart.closeCart} aria-label="Close cart">×</button></header>
      <div className="portal-cart-items">
        {!cart.items.length && <p>Your cart is empty.</p>}
        {requestItems.length > 0 && <section className="portal-request-cart-group"><span>Project Request</span><div className="portal-request-cart-project"><strong>{requestProject}</strong>{requestAddress&&requestAddress!==requestProject&&<small>{requestAddress}</small>}<em>{requestItems.length} service{requestItems.length===1?"":"s"}</em></div>{requestItems.map(item => <article className="portal-request-cart-item" key={item.id}>
          <div className="portal-request-cart-mark">{item.name.slice(0,2).toUpperCase()}</div>
          <div><strong>{item.name}</strong>{item.requestSummary && <span>{item.requestSummary}</span>}</div>
          <button type="button" onClick={() => cart.removeItem(item.id)}>Remove</button>
        </article>)}</section>}
        {merchItems.length > 0 && <section className="portal-merch-cart-group"><span>Merchandise</span>{merchItems.map(item => <article key={item.id}>
          <img src={item.image || "/placeholder.png"} alt={item.name} />
          <div><strong>{item.name}</strong>{item.variant && <span>{item.variant}</span>}<div className="portal-cart-quantity"><button type="button" onClick={() => cart.decreaseQuantity(item.id)}>-</button><b>{item.quantity}</b><button type="button" onClick={() => cart.increaseQuantity(item.id)}>+</button><em>{money(Number(item.price || 0) * item.quantity)}</em></div></div>
          <button type="button" onClick={() => cart.removeItem(item.id)}>Remove</button>
        </article>)}</section>}
      </div>
      {(requestItems.length > 0 || merchItems.length > 0) && <footer>
        {requestItems.length > 0 && <div className="portal-request-cart-footer"><div><span>Project services</span><strong>{requestItems.length}</strong></div><p>No payment is due. UPZ will review scope, pricing, and scheduling.</p><button className="button" type="button" onClick={submitRequests} disabled={submittingRequests}>{submittingRequests?"Submitting...":"Submit Request"}</button></div>}
        {merchItems.length > 0 && <div className="portal-merch-cart-footer"><div><span>Merchandise subtotal</span><strong>{money(subtotal)}</strong></div><button className="button" type="button" onClick={checkout} disabled={checkingOut || subtotal <= 0}>{checkingOut ? "Redirecting..." : "Checkout"}</button></div>}
        {error && <p className="portal-cart-error">{error}</p>}
        <button type="button" onClick={cart.clearCart}>Clear Cart</button>
      </footer>}
    </aside>
  </>;
}
