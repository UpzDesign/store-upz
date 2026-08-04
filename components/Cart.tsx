"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart-store";

const money = (value?: number) => `$${Number(value || 0).toFixed(2)}`;

export default function Cart() {
  const pathname = usePathname();
  const router = useRouter();
  const cart = useCartStore();
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");

  const merchItems = useMemo(() => cart.items.filter(item => item.itemType !== "service_request"), [cart.items]);
  const requestItems = useMemo(() => cart.items.filter(item => item.itemType === "service_request"), [cart.items]);
  const quantity = useMemo(() => merchItems.reduce((sum, item) => sum + item.quantity, 0) + requestItems.length, [merchItems, requestItems]);
  const subtotal = useMemo(() => merchItems.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0), [merchItems]);

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

  function reviewRequests() {
    const item = requestItems[0];
    if (!item?.requestHref) return;
    cart.closeCart();
    router.push(item.requestHref);
  }

  return <>
    <button className="portal-cart-trigger" type="button" onClick={() => cart.isOpen ? cart.closeCart() : cart.openCart()}>Cart ({quantity})</button>
    <div className={`portal-cart-overlay ${cart.isOpen ? "open" : ""}`} onClick={cart.closeCart} />
    <aside className={`portal-cart-drawer ${cart.isOpen ? "open" : ""}`} aria-hidden={!cart.isOpen}>
      <header><div><h3>Cart</h3><p>{quantity} item{quantity === 1 ? "" : "s"}</p></div><button type="button" onClick={cart.closeCart} aria-label="Close cart">×</button></header>
      <div className="portal-cart-items">
        {!cart.items.length && <p>Your cart is empty.</p>}
        {requestItems.length > 0 && <section className="portal-request-cart-group"><span>Project Requests</span>{requestItems.map(item => <article className="portal-request-cart-item" key={item.id}>
          <div className="portal-request-cart-mark">{item.name.slice(0,2).toUpperCase()}</div>
          <div><small>{item.address || item.projectName}</small><strong>{item.name}</strong>{item.requestSummary && <span>{item.requestSummary}</span>}</div>
          <button type="button" onClick={() => cart.removeItem(item.id)}>Remove</button>
        </article>)}</section>}
        {merchItems.length > 0 && <section className="portal-merch-cart-group"><span>Merchandise</span>{merchItems.map(item => <article key={item.id}>
          <img src={item.image || "/placeholder.png"} alt={item.name} />
          <div><strong>{item.name}</strong>{item.variant && <span>{item.variant}</span>}<div className="portal-cart-quantity"><button type="button" onClick={() => cart.decreaseQuantity(item.id)}>-</button><b>{item.quantity}</b><button type="button" onClick={() => cart.increaseQuantity(item.id)}>+</button><em>{money(Number(item.price || 0) * item.quantity)}</em></div></div>
          <button type="button" onClick={() => cart.removeItem(item.id)}>Remove</button>
        </article>)}</section>}
      </div>
      {(requestItems.length > 0 || merchItems.length > 0) && <footer>
        {requestItems.length > 0 && <div className="portal-request-cart-footer"><div><span>Project services</span><strong>{requestItems.length}</strong></div><button className="button" type="button" onClick={reviewRequests}>Review Request</button></div>}
        {merchItems.length > 0 && <div className="portal-merch-cart-footer"><div><span>Merchandise subtotal</span><strong>{money(subtotal)}</strong></div>{error && <p>{error}</p>}<button className="button" type="button" onClick={checkout} disabled={checkingOut || subtotal <= 0}>{checkingOut ? "Redirecting..." : "Checkout"}</button></div>}
        <button type="button" onClick={cart.clearCart}>Clear Cart</button>
      </footer>}
    </aside>
  </>;
}
