const PRINTFUL_API = "https://api.printful.com";

/**
 * Normalize Printful product into a consistent frontend shape
 */
function normalizeProduct(p: any) {
  return {
    id: p.id,
    name: p.name,

    image:
      p.thumbnail_url ||
      p.sync_product?.thumbnail_url ||
      p.sync_product?.image ||
      p.sync_product?.main_image ||
      p.sync_variants?.[0]?.files?.[0]?.preview_url ||
      p.sync_variants?.[0]?.files?.[0]?.thumbnail_url ||
      null,
  };
}

/**
 * Fetch all store products
 */
export async function getProducts() {
  const res = await fetch(`${PRINTFUL_API}/store/products`, {
    headers: {
      Authorization: `Bearer ${process.env.PRINTFUL_ACCESS_TOKEN}`,
    },
    cache: "no-store",
  });

  const data = await res.json();

  console.log("PRINTFUL PRODUCTS RAW:", data);

  const raw =
    data.result?.sync_products ||
    data.result ||
    [];

  if (!Array.isArray(raw)) {
    console.log("Unexpected Printful structure:", data);
    return [];
  }

  return raw.map(normalizeProduct);
}

/**
 * Fetch single product by ID
 */
export async function getProductById(id: string) {
  const res = await fetch(`${PRINTFUL_API}/store/products/${id}`, {
    headers: {
      Authorization: `Bearer ${process.env.PRINTFUL_ACCESS_TOKEN}`,
    },
    cache: "no-store",
  });

  const data = await res.json();

  console.log("PRINTFUL PRODUCT DETAIL RAW:", data);

  if (!data?.result) return null;

  return normalizeProduct(data.result);
}