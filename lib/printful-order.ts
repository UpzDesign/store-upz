type FulfillmentItem = {
  sync_variant_id: number;
  quantity: number;
};

type Recipient = {
  name: string;
  email?: string;
  address1: string;
  address2?: string;
  city: string;
  state_code?: string;
  country_code: string;
  zip: string;
};

const PRINTFUL_API = "https://api.printful.com";

function getPrintfulToken() {
  const token = process.env.PRINTFUL_ACCESS_TOKEN;

  if (!token) {
    throw new Error("Missing PRINTFUL_ACCESS_TOKEN environment variable");
  }

  return token;
}

export function parseFulfillmentItems(value?: string): FulfillmentItem[] {
  if (!value) return [];

  return value
    .split(",")
    .map((pair) => {
      const [variantId, quantity] = pair.split(":");
      return {
        sync_variant_id: Number(variantId),
        quantity: Math.max(1, Number(quantity || 1)),
      };
    })
    .filter((item) => item.sync_variant_id > 0 && item.quantity > 0);
}

export async function createPrintfulDraftOrder({
  externalId,
  recipient,
  items,
}: {
  externalId: string;
  recipient: Recipient;
  items: FulfillmentItem[];
}) {
  if (!items.length) {
    throw new Error("No Printful fulfillment items provided");
  }

  const response = await fetch(`${PRINTFUL_API}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getPrintfulToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      external_id: externalId,
      recipient,
      items,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Unable to create Printful order");
  }

  return data?.result;
}
