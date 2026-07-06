"use client";

import { useMemo } from "react";
import { useCartStore } from "@/store/cart-store";

function formatPrice(value?: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default function Cart() {
  const { items, isOpen, closeCart, removeItem, clearCart, openCart } = useCartStore();

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0),
    [items]
  );

  return (
    <>
      <button
        onClick={() => (isOpen ? closeCart() : openCart())}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          background: "var(--upzyellow)",
          color: "var(--upzblack)",
          padding: "12px 16px",
          borderRadius: 999,
          border: "1px solid var(--upzyellow)",
          zIndex: 10000,
          cursor: "pointer",
          fontWeight: 900,
          boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
        }}
      >
        Cart ({totalQuantity})
      </button>

      <div
        onClick={closeCart}
        style={{
          position: "fixed",
          inset: 0,
          background: isOpen ? "rgba(0,0,0,0.68)" : "transparent",
          pointerEvents: isOpen ? "auto" : "none",
          transition: "background 0.3s ease",
          zIndex: 9998,
        }}
      />

      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "min(430px, 92vw)",
          height: "100vh",
          background: "#010101",
          color: "#ffffff",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s ease",
          boxShadow: "0 0 70px rgba(0,0,0,0.65)",
          zIndex: 9999,
          padding: 22,
          display: "flex",
          flexDirection: "column",
          borderLeft: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h3 style={{ margin: 0 }}>Cart</h3>
            <p style={{ marginTop: 6, fontSize: 13, opacity: 0.65 }}>
              {totalQuantity} item{totalQuantity === 1 ? "" : "s"}
            </p>
          </div>
          <button
            onClick={closeCart}
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.16)",
              background: "transparent",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", marginTop: 18 }}>
          {items.length === 0 ? (
            <p style={{ opacity: 0.65 }}>Your cart is empty</p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "70px 1fr auto",
                  gap: 12,
                  marginBottom: 14,
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                  paddingBottom: 14,
                }}
              >
                <img
                  src={item.image || "/placeholder.png"}
                  alt={item.name}
                  style={{
                    width: 70,
                    height: 70,
                    objectFit: "cover",
                    borderRadius: 12,
                    background: "#fff",
                  }}
                />
                <div>
                  <div style={{ fontWeight: 800, lineHeight: 1.25 }}>{item.name}</div>
                  {item.variant && (
                    <div style={{ fontSize: 12, opacity: 0.62, marginTop: 4 }}>
                      {item.variant}
                    </div>
                  )}
                  <div style={{ fontSize: 12, opacity: 0.62, marginTop: 4 }}>
                    Qty: {item.quantity} × {formatPrice(item.price)}
                  </div>
                  <div style={{ marginTop: 5, color: "var(--upzyellow)", fontWeight: 900 }}>
                    {formatPrice(Number(item.price || 0) * item.quantity)}
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "var(--upzyellow)",
                    cursor: "pointer",
                    fontSize: 12,
                    padding: 0,
                  }}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span>Subtotal</span>
              <strong style={{ color: "var(--upzyellow)" }}>{formatPrice(subtotal)}</strong>
            </div>
            <button className="button" disabled style={{ width: "100%", opacity: 0.5, cursor: "not-allowed" }}>
              Checkout Coming Next
            </button>
            <button
              onClick={clearCart}
              style={{
                width: "100%",
                marginTop: 10,
                padding: 12,
                background: "transparent",
                color: "#fff",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.18)",
                cursor: "pointer",
              }}
            >
              Clear Cart
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
