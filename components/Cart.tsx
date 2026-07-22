"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/store/cart-store";

const money = (value?: number) => `$${Number(value || 0).toFixed(2)}`;

export default function Cart() {
  const pathname = usePathname();
  const cart = useCartStore();
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");

  const quantity = useMemo(() => cart.items.reduce((sum, item) => sum + item.quantity, 0), [cart.items]);
  const subtotal = useMemo(() => cart.items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0), [cart.items]);

  if (!pathname?.startsWith("/portal/")) return null;

  async function checkout() {
    setCheckingOut(true);
    setError("");
    try {
      const companySlug = window.localStorage.getItem("upz_company_slug");
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart.items, companySlug }),
      });
      const data = await response.json();
      if (!response.ok || !data?.url) throw new Error(data?.error || "Unable to start checkout");
      window.location.assign(data.url);
    } catch (checkoutError: any) {
      setError(checkoutError?.message || "Unable to start checkout");
      setCheckingOut(false);
    }
  }

  return <>
    <button className="portal-cart-trigger" type="button" onClick={() => cart.isOpen ? cart.closeCart() : cart.openCart()}>Cart ({quantity})</button>
    <div className={`portal-cart-overlay ${cart.isOpen ? "open" : ""}`} onClick={cart.closeCart} />
    <aside className={`portal-cart-drawer ${cart.isOpen ? "open" : ""}`} aria-hidden={!cart.isOpen}>
      <header><div><h3>Cart</h3><p>{quantity} item{quantity === 1 ? "" : "s"}</p></div><button type="button" onClick={cart.closeCart} aria-label="Close cart">×</button></header>
      <div className="portal-cart-items">
        {cart.items.length === 0 ? <p>Your cart is empty.</p> : cart.items.map((item) => <article key={item.id}>
          <img src={item.image || "/placeholder.png"} alt={item.name} />
          <div><strong>{item.name}</strong>{item.variant && <span>{item.variant}</span>}<div className="portal-cart-quantity"><button type="button" onClick={() => cart.decreaseQuantity(item.id)}>-</button><b>{item.quantity}</b><button type="button" onClick={() => cart.increaseQuantity(item.id)}>+</button><em>{money(Number(item.price || 0) * item.quantity)}</em></div></div>
          <button type="button" onClick={() => cart.removeItem(item.id)}>Remove</button>
        </article>)}
      </div>
      {cart.items.length > 0 && <footer><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>{error && <p>{error}</p>}<button className="button" type="button" onClick={checkout} disabled={checkingOut || subtotal <= 0}>{checkingOut ? "Redirecting..." : "Checkout"}</button><button type="button" onClick={cart.clearCart}>Clear Cart</button></footer>}
    </aside>
  </>;
}
