const PRINTFUL_API = "https://api.printful.com";

export function resolveImage(p: any) {
  return p?.sync_product?.thumbnail_url || p?.thumbnail_url || null;
}

function normalizeProduct(p: any) {
  return {
    id: p.id,
    name: p.name,
    image: resolveImage(p),
  };
}

export async function getProducts() {
  const res = await fetch(`${PRINTFUL_API}/store/products`, {
    headers: {
      Authorization: `Bearer ${process.env.PRINTFUL_ACCESS_TOKEN}`,
    },
    cache: "no-store",
  });

  const data = await res.json();

  const raw = data.result?.sync_products || [];

  if (!Array.isArray(raw)) return [];

  return raw.map((p: any) => ({
    id: p.id, // STORE PRODUCT ID (correct for routing)
    sync_product_id: p.sync_product_id,
    name: p.name,
    image: p.thumbnail_url || null, // IMPORTANT: use this only here
  }));
}

export async function getProductById(id: string) {
  const res = await fetch(`${PRINTFUL_API}/store/products/${id}`, {
    headers: {
      Authorization: `Bearer ${process.env.PRINTFUL_ACCESS_TOKEN}`,
    },
    cache: "no-store",
  });

  const data = await res.json();

  if (!data.result) return null;

  const p = data.result;

  return {
    id: p.id,
    name: p.sync_product?.name || p.name,

    // 👇 THIS is the ONLY reliable fallback chain
    image:
      p.sync_product?.thumbnail_url ||
      p.thumbnail_url ||
      null,
  };
}