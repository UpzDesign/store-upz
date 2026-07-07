import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <main style={{ padding: "96px 0" }}>
      <div className="container" style={{ maxWidth: 820 }}>
        <div className="eyebrow">Checkout</div>
        <h1
          style={{
            fontSize: "clamp(42px, 7vw, 88px)",
            lineHeight: 0.95,
            letterSpacing: "-0.065em",
            marginBottom: 24,
          }}
        >
          Checkout was not completed.
        </h1>
        <p className="lead" style={{ marginBottom: 32 }}>
          Return to the store to review your cart and continue shopping.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/" className="button">
            Back to Store
          </Link>
          <Link href="/#products" className="button outline">
            Browse Products
          </Link>
        </div>
      </div>
    </main>
  );
}
