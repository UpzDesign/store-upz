const PRINTFUL_API = "https://api.printful.com";

function resolveImage(p: any) {
  return (
    // 1. direct product thumbnail
    p?.thumbnail_url ||

    // 2. sync product thumbnail
    p?.sync_product?.thumbnail_url ||

    // 3. sync product image
    p?.sync_product?.image ||

    // 4. variant preview (MOST RELIABLE PER PRODUCT)
    p?.sync_variants?.find((v: any) =>
      v?.files?.some((f: any) => f?.type === "preview")
    )?.files?.find((f: any) => f?.type === "preview")?.preview_url ||

    // 5. fallback first variant image
    p?.sync_variants?.[0]?.files?.[0]?.preview_url ||

    null
  );
}

function getImage(p: any): string | null {
  return (
    p?.sync_product?.thumbnail_url ||
    p?.sync_product?.image ||
    p?.thumbnail_url ||
    p?.files?.find((f: any) => f?.type === "preview")?.preview_url ||
    p?.sync_variants?.[0]?.files?.find((f: any) => f?.type === "preview")?.preview_url ||
    null
  );
}

export async function getProducts() {
  const res = await fetch(`${PRINTFUL_API}/store/products`, {
    headers: {
      Authorization: `Bearer ${process.env.PRINTFUL_ACCESS_TOKEN}`,
    },
    cache: "no-store",
  });

  const data = await res.json();

  const raw = data?.result?.sync_products || [];

  if (!Array.isArray(raw)) return [];

  return raw.map((p: any) => ({
    id: p.id, // 🔥 ONLY STORE PRODUCT ID
    name: p.name,
    image: p.thumbnail_url || null,
  }));
}

export async function getProductById(id: string) {
  const res = await fetch(`${PRINTFUL_API}/store/products`, {
    headers: {
      Authorization: `Bearer ${process.env.PRINTFUL_ACCESS_TOKEN}`,
    },
    cache: "no-store",
  });

  const data = await res.json();

  const products = data?.result?.sync_products || [];

  const product = products.find((p: any) => String(p.id) === String(id));

  if (!product) {
    console.log("❌ ID NOT FOUND IN STORE:", id);
    return null;
  }

  return {
    id: product.id,
    name: product.name,
    image: product.thumbnail_url || null,
  };
}