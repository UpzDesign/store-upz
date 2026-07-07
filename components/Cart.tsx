"use client";

import { useMemo, useState } from "react";
import { useCartStore } from "@/store/cart-store";

function formatPrice(value?: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default function Cart() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    removePackage,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    openCart,
  } = useCartStore();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0),
    [items]
  );

  const packageGroups = useMemo(() => {
    const groups = new Map<string, { name: string; count: number }>();

    items.forEach((item) => {
      if (!item.packageId) return;
      const current = groups.get(item.packageId);
      groups.set(item.packageId, {
        name: item.packageName || "Package",
        count: (current?.count || 0) + 1,
      });
    });

    return Array.from(groups.entries()).map(([id, group]) => ({ id, ...group }));
  }, [items]);

  const handleCheckout = async () => {
    setCheckoutError("");
    setIsCheckingOut(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const data = await response.json();

      if (!response.ok || !data?.url) {
        throw new Error(data?.error || "Unable to start checkout");
      }

      window.location.href = data.url;
    } catch (error: any) {
      setCheckoutError(error?.message || "Unable to start checkout");
      setIsCheckingOut(false);
    }
  };

  return (
    <>
      <button
        onClick={() => (isOpen ? closeCart() : openCart())}
        style={{
          position: "fixed",
          bottom: 18,
          right: 18,
          background: "var(--upzyellow)",
          color: "var(--upzblack)",
          padding: "10px 14px",
          borderRadius: 6,
          border: "1px solid var(--upzyellow)",
          zIndex: 10000,
          cursor: "pointer",
          fontWeight: 900,
          fontSize: 12,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          boxShadow: "0 16px 42px rgba(0,0,0,0.28)",
        }}
      >
        Cart ({totalQuantity})
      </button>

      <div
        onClick={closeCart}
        style={{
          position: "fixed",
          inset: 0,
          background: isOpen ? "rgba(0,0,0,0.62)" : "transparent",
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
          width: "min(430px, 100vw)",
          height: "100dvh",
          maxHeight: "100dvh",
          background: "#010101",
          color: "#ffffff",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s ease",
          boxShadow: "0 0 70px rgba(0,0,0,0.65)",
          zIndex: 9999,
          display: "grid",
          gridTemplateRows: "auto auto minmax(0, 1fr) auto",
          borderLeft: "1px solid rgba(255,255,255,0.12)",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "20px 20px 14px" }}>
          <div>
            <h3 style={{ margin: 0, color: "#fff", fontSize: 22, letterSpacing: "-0.04em" }}>Cart</h3>
            <p style={{ marginTop: 5, marginBottom: 0, fontSize: 12, opacity: 0.62 }}>
              {totalQuantity} item{totalQuantity === 1 ? "" : "s"}
            </p>
          </div>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.16)",
              background: "transparent",
              color: "#fff",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: packageGroups.length ? "0 20px 12px" : "0 20px" }}>
          {packageGroups.length > 0 && (
            <div style={{ display: "grid", gap: 8 }}>
              {packageGroups.map((group) => (
                <div
                  key={group.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid rgba(237,191,45,0.24)",
                    background: "rgba(237,191,45,0.08)",
                    fontSize: 11,
                  }}
                >
                  <strong style={{ color: "var(--upzyellow)", lineHeight: 1.3 }}>{group.name}</strong>
                  <button
                    onClick={() => removePackage(group.id)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#fff",
                      opacity: 0.72,
                      cursor: "pointer",
                      padding: 0,
                      fontSize: 11,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ overflowY: "auto", padding: "0 20px 18px", minHeight: 0 }}>
          {items.length === 0 ? (
            <p style={{ opacity: 0.65, fontSize: 13 }}>Your cart is empty</p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "62px minmax(0, 1fr)",
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
                    width: 62,
                    height: 62,
                    objectFit: "cover",
                    borderRadius: 8,
                    background: "#fff",
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0 }}>
                      {item.packageName && (
                        <div style={{ color: "var(--upzyellow)", fontSize: 9, fontWeight: 900, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {item.packageName}
                        </div>
                      )}
                      <div style={{ fontWeight: 800, lineHeight: 1.3, fontSize: 13, overflowWrap: "anywhere" }}>{item.name}</div>
                      {item.variant && (
                        <div style={{ fontSize: 11, opacity: 0.58, marginTop: 4, overflowWrap: "anywhere" }}>
                          {item.variant}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "var(--upzyellow)",
                        cursor: "pointer",
                        fontSize: 11,
                        padding: 0,
                        flexShrink: 0,
                      }}
                    >
                      Remove
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 9, flexWrap: "wrap" }}>
                    <button
                      onClick={() => decreaseQuantity(item.id)}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        border: "1px solid rgba(255,255,255,0.18)",
                        background: "transparent",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      -
                    </button>
                    <strong style={{ minWidth: 16, textAlign: "center", fontSize: 12 }}>{item.quantity}</strong>
                    <button
                      onClick={() => increaseQuantity(item.id)}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        border: "1px solid rgba(255,255,255,0.18)",
                        background: "transparent",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      +
                    </button>
                    <span style={{ fontSize: 11, opacity: 0.58 }}>× {formatPrice(item.price)}</span>
                    <strong style={{ marginLeft: "auto", color: "var(--upzyellow)", fontSize: 13 }}>
                      {formatPrice(Number(item.price || 0) * item.quantity)}
                    </strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", padding: "16px 20px 20px", background: "#010101" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
              <span>Subtotal</span>
              <strong style={{ color: "var(--upzyellow)" }}>{formatPrice(subtotal)}</strong>
            </div>
            <p style={{ marginBottom: 12, fontSize: 11, opacity: 0.58, lineHeight: 1.5 }}>
              Shipping, taxes, and fulfillment will be calculated during checkout.
            </p>
            {checkoutError && (
              <p style={{ marginBottom: 10, color: "var(--upzyellow)", fontSize: 12 }}>
                {checkoutError}
              </p>
            )}
            <button
              className="button"
              onClick={handleCheckout}
              disabled={isCheckingOut || subtotal <= 0}
              style={{ width: "100%", opacity: isCheckingOut || subtotal <= 0 ? 0.55 : 1 }}
            >
              {isCheckingOut ? "Redirecting..." : "Checkout"}
            </button>
            <button
              onClick={clearCart}
              style={{
                width: "100%",
                marginTop: 9,
                padding: 11,
                background: "transparent",
                color: "#fff",
                borderRadius: 5,
                border: "1px solid rgba(255,255,255,0.18)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
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
