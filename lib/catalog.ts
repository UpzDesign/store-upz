export const categories = ["All", "Apparel", "Drinkware", "Bags", "Office", "Accessories"];

export const priceFilters = ["All", "Under $25", "$25-$50", "$50+"];

export function formatPrice(value?: number | string | null) {
  const amount = Number(value || 0);
  if (!amount) return "View pricing";
  return `$${amount.toFixed(2)}`;
}

export function getCategory(product: any) {
  const name = String(product?.name || "").toLowerCase();

  if (/shirt|tee|hoodie|sweatshirt|jacket|polo|hat|cap|beanie/.test(name)) {
    return "Apparel";
  }
  if (/mug|bottle|tumbler|cup|drink/.test(name)) {
    return "Drinkware";
  }
  if (/bag|tote|backpack|duffle/.test(name)) {
    return "Bags";
  }
  if (/notebook|journal|mouse pad|poster|card|sticker|print/.test(name)) {
    return "Office";
  }

  return "Accessories";
}

export function slugifyCategory(category: string) {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function categoryFromSlug(slug: string) {
  return categories.find((category) => slugifyCategory(category) === slug) || null;
}

export function matchesPriceFilter(product: any, filter: string) {
  const price = Number(product?.price || 0);
  if (filter === "All") return true;
  if (!price) return true;
  if (filter === "Under $25") return price < 25;
  if (filter === "$25-$50") return price >= 25 && price <= 50;
  if (filter === "$50+") return price > 50;
  return true;
}

export function getColorOptions(variants: any[] = []) {
  return Array.from(
    new Set(
      variants
        .map((variant) => String(variant?.color || "").trim())
        .filter(Boolean)
    )
  );
}

export function getSizeOptions(variants: any[] = []) {
  return Array.from(
    new Set(
      variants
        .map((variant) => String(variant?.size || "").trim())
        .filter(Boolean)
    )
  );
}

export function findVariant({
  variants,
  color,
  size,
}: {
  variants: any[];
  color?: string | null;
  size?: string | null;
}) {
  if (!variants?.length) return null;

  return (
    variants.find((variant) => {
      const colorMatch = !color || variant.color === color;
      const sizeMatch = !size || variant.size === size;
      return colorMatch && sizeMatch;
    }) || variants[0]
  );
}
