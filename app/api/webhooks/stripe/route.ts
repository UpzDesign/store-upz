import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  createPrintfulDraftOrder,
  parseFulfillmentItems,
} from "@/lib/printful-order";

export const runtime = "nodejs";

type StripeSession = {
  id: string;
  customer_details?: {
    email?: string;
    name?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      country?: string;
      postal_code?: string;
    };
  };
  shipping_details?: {
    name?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      country?: string;
      postal_code?: string;
    };
  };
  metadata?: {
    fulfillment_items?: string;
  };
};

function verifyStripeSignature(payload: string, signatureHeader: string, secret: string) {
  const parts = signatureHeader.split(",").reduce<Record<string, string[]>>((acc, part) => {
    const [key, value] = part.split("=");
    if (!key || !value) return acc;
    acc[key] = [...(acc[key] || []), value];
    return acc;
  }, {});

  const timestamp = parts.t?.[0];
  const signatures = parts.v1 || [];

  if (!timestamp || !signatures.length) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  return signatures.some((signature) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  });
}

function getRecipient(session: StripeSession) {
  const shipping = session.shipping_details;
  const customer = session.customer_details;
  const address = shipping?.address || customer?.address;

  if (!address?.line1 || !address?.city || !address?.country || !address?.postal_code) {
    throw new Error("Missing shipping address");
  }

  return {
    name: shipping?.name || customer?.name || "UPZ Store Customer",
    email: customer?.email,
    address1: address.line1,
    address2: address.line2 || undefined,
    city: address.city,
    state_code: address.state || undefined,
    country_code: address.country,
    zip: address.postal_code,
  };
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET environment variable" },
      { status: 500 }
    );
  }

  const payload = await request.text();
  const signatureHeader = request.headers.get("stripe-signature") || "";

  if (!verifyStripeSignature(payload, signatureHeader, webhookSecret)) {
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  const event = JSON.parse(payload);

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data?.object as StripeSession;
  const items = parseFulfillmentItems(session.metadata?.fulfillment_items);

  if (!items.length) {
    console.log("No fulfillment items found for session", session.id);
    return NextResponse.json({ received: true, skipped: "no_items" });
  }

  const printfulOrder = await createPrintfulDraftOrder({
    externalId: session.id,
    recipient: getRecipient(session),
    items,
  });

  console.log("Created Printful draft order", printfulOrder?.id);

  return NextResponse.json({ received: true, printful_order_id: printfulOrder?.id });
}
