const PRINTFUL_API = "https://api.printful.com";

export type PrintfulClientOptions = {
  companySlug?: string | null;
  accessToken?: string | null;
  storeId?: string | null;
};

function normalizeSlug(slug?: string | null) {
  return slug?.toUpperCase().replace(/[^A-Z0-9]/g, "_") || null;
}

export function normalizePrintfulToken(value?: string | null) {
  let token = String(value || "").trim();

  // Accept tokens pasted directly, copied as an Authorization header,
  // or wrapped in quotes by password managers / environment-variable UIs.
  token = token.replace(/^authorization\s*:\s*/i, "").trim();
  token = token.replace(/^bearer\s+/i, "").trim();
  token = token.replace(/^["'`]+|["'`]+$/g, "").trim();
  token = token.replace(/\s+/g, "");

  return token;
}

export function getPrintfulEnvironmentNames(companySlug?: string | null) {
  const slug = normalizeSlug(companySlug);
  return {
    tokenEnv: slug ? `PRINTFUL_ACCESS_TOKEN_${slug}` : "PRINTFUL_ACCESS_TOKEN",
    storeIdEnv: slug ? `PRINTFUL_STORE_ID_${slug}` : "PRINTFUL_STORE_ID",
  };
}

function getToken(options: PrintfulClientOptions = {}) {
  const directToken = normalizePrintfulToken(options.accessToken);
  if (directToken) return directToken;

  const { tokenEnv } = getPrintfulEnvironmentNames(options.companySlug);
  const token = normalizePrintfulToken(process.env[tokenEnv]);
  if (!token) throw new Error(`Missing ${tokenEnv} environment variable`);
  return token;
}

function getStoreId(options: PrintfulClientOptions = {}) {
  if (options.storeId) return String(options.storeId).trim();
  const { storeIdEnv } = getPrintfulEnvironmentNames(options.companySlug);
  return process.env[storeIdEnv]?.trim() || null;
}

async function printfulFetch(path: string, options: PrintfulClientOptions = {}) {
  const storeId = getStoreId(options);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getToken(options)}`,
    Accept: "application/json",
  };
  if (storeId) headers["X-PF-Store-Id"] = storeId;

  const res = await fetch(`${PRINTFUL_API}${path}`, { headers, cache: "no-store" });
  if (!res.ok) {
    const message = await res.text();

    if (res.status === 401) {
      throw new Error(
        "Printful rejected the token. Paste the Private Token value itself (not its name), make sure it has Sync Products read access, and include the Store ID when using an account-level token."
      );
    }

    if (res.status === 403 && message.includes("sync_products")) {
      throw new Error(
        "The Printful token is valid but does not have Sync Products permission. Create a token with sync_products/read (or sync_products) access and try again."
      );
    }

    throw new Error(`Printful API error ${res.status}: ${message}`);
  }
  return res.json();
}

export async function testPrintfulConnection(options: PrintfulClientOptions = {}) {
  const environment = getPrintfulEnvironmentNames(options.companySlug);
  const configuredStoreId = getStoreId(options);

  // Validate against the same resource the app actually syncs. The /store
  // endpoint requires stores_list/read, which is unnecessary for product sync.
  await printfulFetch("/store/products?limit=1", options);

  return {
    connected: true,
    tokenEnv: options.accessToken ? null : environment.tokenEnv,
    storeIdEnv: options.accessToken ? null : environment.storeIdEnv,
    configuredStoreId,
    store: {
      id: configuredStoreId,
      name: "Connected Printful Store",
      type: null,
      website: null,
    },
  };
}

function getMockupImages(files: any[] = []) {
  return Array.from(new Set(files.filter((file: any) => {
    const type = String(file?.type || "").toLowerCase();
    return type === "mockup" || type === "preview" || type.includes("mockup");
  }).map((file: any) => file?.preview_url || file?.thumbnail_url).filter(Boolean))) as string[];
}

function getVariantImages(v: any, fallback?: string | null) {
  const images = getMockupImages(v?.files || []);
  if (images.length > 0) return images;
  return fallback ? [fallback] : [];
}

export async function getProductById(id: string, options: PrintfulClientOptions = {}) {
  try {
    const json = await printfulFetch(`/store/products/${id}`, options);
    const data = json?.result;
    const syncProduct = data?.sync_product;
    const syncVariants = Array.isArray(data?.sync_variants) ? data.sync_variants : [];
    const syncProductFiles = Array.isArray(data?.sync_product_files) ? data.sync_product_files : [];
    if (!syncProduct) return null;

    const productMockups = getMockupImages(syncProductFiles);
    const variantMockups = Array.from(new Set(syncVariants.flatMap((variant: any) => getMockupImages(variant?.files || [])))) as string[];
    const allMockups = Array.from(new Set([...productMockups, ...variantMockups])) as string[];
    const thumbnail = allMockups[0] || syncProduct.thumbnail_url || syncProduct.image || null;
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
    const gallery = allMockups.length > 0 ? allMockups : Array.from(new Set([thumbnail, ...variants.flatMap((variant: any) => variant.images || [])].filter(Boolean)));

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

    return await Promise.all(raw.map(async (p: any) => {
      const details = await getProductById(String(p.id), options);
      return {
        id: String(p.id),
        name: p.name,
        image: details?.image || p.thumbnail_url || null,
        images: details?.images || [],
        price: details?.price || null,
        variants: details?.variants || [],
      };
    }));
  } catch (err) {
    console.error("❌ PRINTFUL PRODUCTS ERROR:", err);
    return [];
  }
}
