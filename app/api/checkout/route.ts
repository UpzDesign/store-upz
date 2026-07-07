import { NextRequest, NextResponse } from "next/server";
import { getCompanyBySlug } from "@/lib/companies";

type CheckoutItem = {
  id: string;
  name: string;
  variant?: string;
  image?: string;
  price?: number;
  quantity: number;
  packageId?: string;
  packageName?: string;
  companySlug?: string;
  companyName?: string;
};

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL &&
      `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    "http://localhost:3000"
  );
}

function sanitizeItems(items: CheckoutItem[]) {
  return items
    .map((item) => ({
      ...item,
      id: String(item.id || ""),
      name: String(item.name || "UPZ Store Item").slice(0, 120),
      variant: item.variant ? String(item.variant).slice(0, 120) : undefined,
      quantity: Math.max(1, Number(item.quantity || 1)),
      price: Number(item.price || 0),
      companySlug: item.companySlug ? String(item.companySlug).toLowerCase() : undefined,
      companyName: item.companyName ? String(item.companyName).slice(0, 120) : undefined,
    }))
    .filter((item) => item.id && item.price > 0 && item.quantity > 0);
}

function buildFulfillmentPayload(items: ReturnType<typeof sanitizeItems>) {
  return items
    .map((item) => `${item.id}:${item.quantity}`)
    .join(",")
    .slice(0, 500);
}

function resolveCompanySlug(bodyCompanySlug: unknown, items: ReturnType<typeof sanitizeItems>) {
  const itemCompanySlugs = Array.from(
    new Set(items.map((item) => item.companySlug).filter(Boolean))
  ) as string[];

  if (itemCompanySlugs.length > 1) {
    return { error: "Please checkout one company portal at a time." };
  }

  const explicitSlug = typeof bodyCompanySlug === "string" ? bodyCompanySlug.trim().toLowerCase() : "";
  const slug = itemCompanySlugs[0] || explicitSlug || "upz";
  const company = slug === "upz" ? null : getCompanyBySlug(slug);

  if (slug !== "upz" && !company) {
    return { error: "Invalid company portal checkout." };
  }

  return { slug, company };
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

  const companyResult = resolveCompanySlug(body?.companySlug, items);

  if (companyResult.error) {
    return NextResponse.json({ error: companyResult.error }, { status: 400 });
  }

  const checkoutCompanySlug = companyResult.slug || "upz";
  const checkoutCompanyName = companyResult.company?.name || "UPZ Store";
  const siteUrl = getSiteUrl();
  const params = new URLSearchParams();

  params.append("mode", "payment");
  params.append("success_url", `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
  params.append("cancel_url", `${siteUrl}/checkout/cancel`);
  params.append("allow_promotion_codes", "true");
  params.append("billing_address_collection", "required");
  params.append("shipping_address_collection[allowed_countries][0]", "US");
  params.append("metadata[fulfillment_items]", buildFulfillmentPayload(items));
  params.append("metadata[source]", "upz-brand-portal");
  params.append("metadata[company_slug]", checkoutCompanySlug);
  params.append("metadata[company_name]", checkoutCompanyName);
  params.append("metadata[printful_token_env]", checkoutCompanySlug === "upz" ? "PRINTFUL_ACCESS_TOKEN" : `PRINTFUL_ACCESS_TOKEN_${checkoutCompanySlug.toUpperCase()}`);

  items.forEach((item, index) => {
    const descriptionParts = [item.variant, item.packageName, checkoutCompanyName].filter(Boolean);
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
        descriptionParts.join(" - ")
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
