"use client";

import { useMemo } from "react";
import { useCartStore } from "@/store/cart-store";

function formatPrice(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default function Cart() {
  const { items, isOpen, closeCart, removeItem, clearCart, openCart } = useCartStore();

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
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
          color: "#111",
          padding: "12px 16px",
          borderRadius: 999,
          border: "none",
          zIndex: 10000,
          cursor: "pointer",
          fontWeight: 800,
          boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
        }}
      >
        🛒 Cart ({totalQuantity})
      </button>

      <div
        onClick={closeCart}
        style={{
          position: "fixed",
          inset: 0,
          background: isOpen ? "rgba(0,0,0,0.45)" : "transparent",
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
          width: "min(420px, 92vw)",
          height: "100vh",
          background: "var(--bg-color)",
          color: "var(--font-color)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s ease",
          boxShadow: "0 0 40px rgba(0,0,0,0.2)",
          zIndex: 9999,
          padding: 20,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h3 style={{ margin: 0 }}>Cart</h3>
            <p style={{ fontSize: 13, opacity: 0.65, marginTop: 4 }}>
              {totalQuantity} item{totalQuantity === 1 ? "" : "s"}
            </p>
          </div>
          <button
            onClick={closeCart}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "1px solid rgba(0,0,0,0.1)",
              background: "transparent",
              color: "var(--font-color)",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", marginTop: 18 }}>
          {items.length === 0 ? (
            <p style={{ color: "#888" }}>Your cart is empty</p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "72px 1fr auto",
                  gap: 12,
                  marginBottom: 14,
                  borderBottom: "1px solid rgba(0,0,0,0.08)",
                  paddingBottom: 14,
                  alignItems: "start",
                }}
              >
                <img
                  src={item.image || "/placeholder.png"}
                  alt={item.name}
                  style={{
                    width: 72,
                    height: 72,
                    objectFit: "cover",
                    borderRadius: 10,
                    background: "#f5f5f5",
                  }}
                />

                <div>
                  <div style={{ fontWeight: 700, lineHeight: 1.3 }}>{item.name}</div>
                  {item.variant && (
                    <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>
                      {item.variant}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>
                    Qty: {item.quantity} × {formatPrice(item.price)}
                  </div>
                  <div style={{ fontWeight: 800, marginTop: 6 }}>
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#DC353C",
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
          <div
            style={{
              borderTop: "1px solid rgba(0,0,0,0.1)",
              paddingTop: 16,
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Subtotal</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>

            <p style={{ fontSize: 12, opacity: 0.65 }}>
              Shipping and taxes will be calculated at checkout.
            </p>

            <button
              type="button"
              disabled
              style={{
                padding: 14,
                background: "#111",
                color: "#fff",
                borderRadius: 10,
                border: "none",
                opacity: 0.6,
                cursor: "not-allowed",
                fontWeight: 800,
              }}
            >
              Checkout Coming Next
            </button>

            <button
              onClick={clearCart}
              style={{
                padding: 12,
                background: "transparent",
                color: "#DC353C",
                borderRadius: 10,
                border: "1px solid rgba(220,53,60,0.25)",
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
