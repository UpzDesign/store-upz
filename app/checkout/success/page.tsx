import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <main style={{ padding: "96px 0" }}>
      <div className="container" style={{ maxWidth: 820 }}>
        <div className="eyebrow">Order received</div>
        <h1
          style={{
            fontSize: "clamp(42px, 7vw, 88px)",
            lineHeight: 0.95,
            letterSpacing: "-0.065em",
            marginBottom: 24,
          }}
        >
          Thank you for your order.
        </h1>
        <p className="lead" style={{ marginBottom: 32 }}>
          Your payment was completed successfully. The next phase will connect this order
          to Printful fulfillment and automated order records.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/" className="button">
            Back to Store
          </Link>
          <Link href="/#products" className="button outline">
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
