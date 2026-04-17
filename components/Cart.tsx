"use client";

import { useCartStore } from "@/store/cart-store";

export default function Cart() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    clearCart,
  } = useCartStore();

  return (
    <>
      {/* CART BUTTON */}
      <button
        onClick={() =>
          isOpen ? closeCart() : useCartStore.getState().openCart()
        }
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          background: "#111",
          color: "#fff",
          padding: "12px 16px",
          borderRadius: 999,
          border: "none",
          zIndex: 10000,
          cursor: "pointer",
          transition: "transform 0.2s ease",
        }}
      >
        🛒 Cart ({items.length})
      </button>

      {/* OVERLAY */}
      <div
        onClick={closeCart}
        style={{
          position: "fixed",
          inset: 0,
          background: isOpen ? "rgba(0,0,0,0.4)" : "transparent",
          pointerEvents: isOpen ? "auto" : "none",
          transition: "background 0.3s ease",
          zIndex: 9998,
        }}
      />

      {/* DRAWER */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: 380,
          height: "100vh",
          background: "#fff",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s ease",
          boxShadow: "0 0 40px rgba(0,0,0,0.15)",
          zIndex: 9999,
          padding: 20,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h3>Cart</h3>
          <button onClick={closeCart}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", marginTop: 10 }}>
          {items.length === 0 ? (
            <p style={{ color: "#888" }}>Your cart is empty</p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 12,
                  borderBottom: "1px solid #eee",
                  paddingBottom: 10,
                }}
              >
                <div>
                  <div>{item.name}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>
                    Qty: {item.quantity}
                  </div>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#DC353C",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <button
            onClick={clearCart}
            style={{
              marginTop: 10,
              padding: 12,
              background: "#111",
              color: "#fff",
              borderRadius: 10,
              border: "none",
            }}
          >
            Clear Cart
          </button>
        )}
      </div>
    </>
  );
}