import { NextRequest, NextResponse } from "next/server";

type CheckoutItem = {
  id: string;
  name: string;
  variant?: string;
  image?: string;
  price?: number;
  quantity: number;
  packageId?: string;
  packageName?: string;
};

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` ||
    "http://localhost:3000"
  );
}

function sanitizeItems(items: CheckoutItem[]) {
  return items
    .map((item) => ({
      ...item,
      name: String(item.name || "UPZ Store Item").slice(0, 120),
      variant: item.variant ? String(item.variant).slice(0, 120) : undefined,
      quantity: Math.max(1, Number(item.quantity || 1)),
      price: Number(item.price || 0),
    }))
    .filter((item) => item.price > 0 && item.quantity > 0);
}

export async function POST(request: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "Missing STRIPE_SECRET_KEY environment variable" },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const items = sanitizeItems(Array.isArray(body?.items) ? body.items : []);

  if (!items.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const siteUrl = getSiteUrl();
  const params = new URLSearchParams();

  params.append("mode", "payment");
  params.append("success_url", `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
  params.append("cancel_url", `${siteUrl}/checkout/cancel`);
  params.append("allow_promotion_codes", "true");
  params.append("billing_address_collection", "auto");
  params.append("shipping_address_collection[allowed_countries][0]", "US");

  items.forEach((item, index) => {
    const descriptionParts = [item.variant, item.packageName].filter(Boolean);
    const displayName = item.packageName
      ? `${item.name} (${item.packageName})`
      : item.name;

    params.append(`line_items[${index}][quantity]`, String(item.quantity));
    params.append(`line_items[${index}][price_data][currency]`, "usd");
    params.append(
      `line_items[${index}][price_data][unit_amount]`,
      String(Math.round(Number(item.price || 0) * 100))
    );
    params.append(`line_items[${index}][price_data][product_data][name]`, displayName);

    if (descriptionParts.length) {
      params.append(
        `line_items[${index}][price_data][product_data][description]`,
        descriptionParts.join(" · ")
      );
    }
  });

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const session = await stripeResponse.json();

  if (!stripeResponse.ok) {
    return NextResponse.json(
      { error: session?.error?.message || "Unable to create checkout session" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: session.url });
}
