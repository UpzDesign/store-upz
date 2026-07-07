const PRINTFUL_API = "https://api.printful.com";

export type PrintfulClientOptions = {
  companySlug?: string | null;
};

function getToken(options: PrintfulClientOptions = {}) {
  const slug = options.companySlug?.toUpperCase().replace(/[^A-Z0-9]/g, "_");

  if (slug) {
    const companyToken = process.env[`PRINTFUL_ACCESS_TOKEN_${slug}`];

    if (!companyToken) {
      throw new Error(`Missing PRINTFUL_ACCESS_TOKEN_${slug} environment variable`);
    }

    return companyToken;
  }

  const token = process.env.PRINTFUL_ACCESS_TOKEN;

  if (!token) {
    throw new Error("Missing PRINTFUL_ACCESS_TOKEN environment variable");
  }

  return token;
}

async function printfulFetch(path: string, options: PrintfulClientOptions = {}) {
  const res = await fetch(`${PRINTFUL_API}${path}`, {
    headers: {
      Authorization: `Bearer ${getToken(options)}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(`Printful API error ${res.status}: ${message}`);
  }

  return res.json();
}

function getVariantImages(v: any, fallback?: string | null) {
  const images =
    v?.files
      ?.map((f: any) => f?.preview_url || f?.thumbnail_url)
      .filter(Boolean) || [];

  if (images.length > 0) return images;
  return fallback ? [fallback] : [];
}

export async function getProductById(id: string, options: PrintfulClientOptions = {}) {
  try {
    const json = await printfulFetch(`/store/products/${id}`, options);
    const data = json?.result;

    const syncProduct = data?.sync_product;
    const syncVariants = Array.isArray(data?.sync_variants)
      ? data.sync_variants
      : [];

    if (!syncProduct) return null;

    const thumbnail =
      syncProduct.thumbnail_url ||
      syncProduct.image ||
      syncVariants?.[0]?.files?.find((f: any) => f?.type === "preview")?.preview_url ||
      null;

    const variants = syncVariants.map((v: any) => ({
      id: String(v.id),
      name: v.name || `${v.size || ""} ${v.color || ""}`.trim() || "Default",
      price: Number(v.retail_price || 0),
      currency: v.currency || "USD",
      size: v.size || null,
      color: v.color || null,
      stock: v.availability_status || null,
      sku: v.sku || null,
      images: getVariantImages(v, thumbnail),
    }));

    const gallery = Array.from(
      new Set(
        [
          thumbnail,
          ...variants.flatMap((variant: any) => variant.images || []),
        ].filter(Boolean)
      )
    );

    return {
      id: String(syncProduct.id),
      name: syncProduct.name,
      description: syncProduct.description || "",
      thumbnail,
      image: thumbnail,
      price: variants?.[0]?.price || null,
      variants,
      images: gallery,
      raw: data,
    };
  } catch (err) {
    console.error("❌ PRINTFUL PRODUCT ERROR:", err);
    return null;
  }
}

export async function getProducts(options: PrintfulClientOptions = {}) {
  try {
    const json = await printfulFetch("/store/products", options);
    const raw = json?.result?.sync_products ?? json?.result ?? [];

    if (!Array.isArray(raw)) {
      console.log("❌ INVALID PRODUCTS SHAPE:", raw);
      return [];
    }

    const products = await Promise.all(
      raw.map(async (p: any) => {
        const details = await getProductById(String(p.id), options);

        return {
          id: String(p.id),
          name: p.name,
          image: details?.image || p.thumbnail_url || null,
          images: details?.images || [],
          price: details?.price || null,
          variants: details?.variants || [],
        };
      })
    );

    return products;
  } catch (err) {
    console.error("❌ PRINTFUL PRODUCTS ERROR:", err);
    return [];
  }
}
