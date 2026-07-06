"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { storePackages } from "@/lib/packages";
import { useCartStore } from "@/store/cart-store";

const categories = ["All", "Apparel", "Drinkware", "Bags", "Office", "Accessories"];
const priceFilters = ["All", "Under $25", "$25–$50", "$50+"];

function formatPrice(value?: number | string | null) {
  const amount = Number(value || 0);
  if (!amount) return "View pricing";
  return `$${amount.toFixed(2)}`;
}

function getCategory(product: any) {
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

function matchesPriceFilter(product: any, filter: string) {
  const price = Number(product?.price || 0);
  if (filter === "All") return true;
  if (!price) return true;
  if (filter === "Under $25") return price < 25;
  if (filter === "$25–$50") return price >= 25 && price <= 50;
  if (filter === "$50+") return price > 50;
  return true;
}

function getPrimaryVariant(product: any) {
  return product?.variants?.[0] || product;
}

function buildPackageItems(storePackage: any, products: any[]) {
  const usedProductIds = new Set<string>();

  return storePackage.rules.flatMap((rule: any) => {
    const matches = products.filter((product) => {
      const productId = String(product?.id || "");
      return getCategory(product) === rule.category && !usedProductIds.has(productId);
    });

    const product = matches[0];
    if (!product) return [];

    usedProductIds.add(String(product.id));
    const variant = getPrimaryVariant(product);
    const price = Number(variant?.price || product?.price || 0);

    return [
      {
        id: String(variant?.id || product.id),
        productId: String(product.id),
        name: product.name,
        variant: variant?.name,
        image:
          variant?.images?.[0] ||
          product.image ||
          product.thumbnail ||
          product.thumbnail_url ||
          "/placeholder.png",
        price,
        quantity: Number(rule.quantity || 1),
        packageId: storePackage.id,
        packageName: storePackage.title,
      },
    ];
  });
}

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [priceFilter, setPriceFilter] = useState("All");
  const addItems = useCartStore((state) => state.addItems);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();

    return products.filter((product) => {
      const category = getCategory(product);
      const name = String(product?.name || "").toLowerCase();
      const variantText = (product?.variants || [])
        .map((variant: any) => `${variant?.name || ""} ${variant?.size || ""} ${variant?.color || ""}`)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || name.includes(q) || variantText.includes(q) || category.toLowerCase().includes(q);
      const matchesCategory = activeCategory === "All" || category === activeCategory;
      const matchesPrice = matchesPriceFilter(product, priceFilter);

      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [products, query, activeCategory, priceFilter]);

  const packageSummaries = useMemo(
    () =>
      storePackages.map((storePackage) => {
        const items = buildPackageItems(storePackage, products);
        const subtotal = items.reduce(
          (sum, item) => sum + Number(item.price || 0) * item.quantity,
          0
        );

        return {
          ...storePackage,
          items,
          subtotal,
        };
      }),
    [products]
  );

  const clearFilters = () => {
    setQuery("");
    setActiveCategory("All");
    setPriceFilter("All");
  };

  const addPackageToCart = (packageSummary: any) => {
    if (!packageSummary.items.length) return;
    addItems(packageSummary.items);
  };

  return (
    <main>
      <section
        style={{
          padding: "96px 0 56px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="container">
          <div style={{ maxWidth: 850 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 11px",
                borderRadius: 999,
                border: "1px solid rgba(237,191,45,0.38)",
                color: "var(--upzyellow)",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 22,
              }}
            >
              UPZ Store · CRE Merchandise
            </div>

            <h1
              style={{
                fontSize: "clamp(42px, 7vw, 92px)",
                lineHeight: 0.96,
                letterSpacing: "-0.06em",
                marginBottom: 24,
              }}
            >
              Branded products for modern brokerage teams.
            </h1>

            <p
              style={{
                maxWidth: 620,
                fontSize: 18,
                lineHeight: 1.8,
                opacity: 0.76,
                marginBottom: 34,
              }}
            >
              Start with individual products, then build curated broker packages
              for onboarding, open houses, tenant pitches, and team branding.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="#products" className="button">
                Browse Products
              </a>
              <a href="#cre-packages" className="button outline">
                View CRE Packages
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="cre-packages" style={{ padding: "64px 0" }}>
        <div className="container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 24,
              alignItems: "end",
              flexWrap: "wrap",
              marginBottom: 24,
            }}
          >
            <div>
              <h2 style={{ marginBottom: 10 }}>CRE Packages</h2>
              <p style={{ maxWidth: 650, opacity: 0.7 }}>
                Packages now auto-select matching products from your Printful catalog.
                This is the first working package-builder version.
              </p>
            </div>
            <span style={{ color: "var(--upzyellow)", fontWeight: 800 }}>
              Bundle system active
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 18,
            }}
          >
            {packageSummaries.map((pack) => (
              <article
                key={pack.id}
                style={{
                  padding: 24,
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.02))",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    padding: "5px 9px",
                    borderRadius: 999,
                    background: "rgba(237,191,45,0.13)",
                    color: "var(--upzyellow)",
                    fontSize: 11,
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 16,
                  }}
                >
                  {pack.tag}
                </div>
                <h3 style={{ marginBottom: 10 }}>{pack.title}</h3>
                <p style={{ opacity: 0.72, marginBottom: 12 }}>{pack.description}</p>
                <p style={{ opacity: 0.55, fontSize: 13, marginBottom: 18 }}>
                  {pack.idealFor}
                </p>

                <div style={{ display: "grid", gap: 8, marginBottom: 18 }}>
                  {pack.rules.map((rule: any) => (
                    <span key={`${pack.id}-${rule.category}`} style={{ fontSize: 13, opacity: 0.82 }}>
                      ✓ {rule.label}
                    </span>
                  ))}
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: 8,
                    padding: 12,
                    borderRadius: 14,
                    background: "rgba(1,1,1,0.42)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    marginBottom: 14,
                  }}
                >
                  {pack.items.length > 0 ? (
                    pack.items.map((item: any) => (
                      <div
                        key={`${pack.id}-${item.id}`}
                        style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12 }}
                      >
                        <span style={{ opacity: 0.74 }}>
                          {item.quantity}× {item.name}
                        </span>
                        <strong style={{ color: "var(--upzyellow)" }}>
                          {formatPrice(Number(item.price || 0) * item.quantity)}
                        </strong>
                      </div>
                    ))
                  ) : (
                    <span style={{ opacity: 0.65, fontSize: 12 }}>
                      No matching products found yet.
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <strong style={{ color: "var(--upzyellow)", fontSize: 18 }}>
                    {pack.subtotal ? formatPrice(pack.subtotal) : "Needs products"}
                  </strong>
                  <button
                    onClick={() => addPackageToCart(pack)}
                    disabled={!pack.items.length}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 999,
                      border: "1px solid var(--upzyellow)",
                      background: pack.items.length ? "var(--upzyellow)" : "transparent",
                      color: pack.items.length ? "var(--upzblack)" : "rgba(255,255,255,0.45)",
                      cursor: pack.items.length ? "pointer" : "not-allowed",
                      fontWeight: 900,
                    }}
                  >
                    Add Package
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="products" style={{ padding: "64px 0 96px" }}>
        <div className="container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 24,
              alignItems: "end",
              flexWrap: "wrap",
              marginBottom: 24,
            }}
          >
            <div>
              <h2 style={{ marginBottom: 10 }}>Products</h2>
              <p style={{ maxWidth: 620, opacity: 0.7 }}>
                Search by product name, category, color, or variant. Product categories are
                currently inferred automatically from Printful product names.
              </p>
            </div>
            <span style={{ opacity: 0.65 }}>
              {loading ? "Loading..." : `${filteredProducts.length} of ${products.length} products`}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gap: 14,
              padding: 16,
              borderRadius: 22,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.035)",
              marginBottom: 28,
            }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, colors, variants..."
              style={{
                width: "100%",
                minHeight: 48,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "#010101",
                color: "#fff",
                padding: "0 18px",
                outline: "none",
                fontSize: 15,
              }}
            />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 999,
                    border:
                      activeCategory === category
                        ? "1px solid var(--upzyellow)"
                        : "1px solid rgba(255,255,255,0.13)",
                    background:
                      activeCategory === category
                        ? "var(--upzyellow)"
                        : "transparent",
                    color:
                      activeCategory === category
                        ? "var(--upzblack)"
                        : "var(--upzwhite)",
                    cursor: "pointer",
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  {category}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              {priceFilters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setPriceFilter(filter)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    border:
                      priceFilter === filter
                        ? "1px solid var(--upzyellow)"
                        : "1px solid rgba(255,255,255,0.13)",
                    background:
                      priceFilter === filter
                        ? "rgba(237,191,45,0.14)"
                        : "transparent",
                    color:
                      priceFilter === filter
                        ? "var(--upzyellow)"
                        : "rgba(255,255,255,0.72)",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {filter}
                </button>
              ))}

              {(query || activeCategory !== "All" || priceFilter !== "All") && (
                <button
                  onClick={clearFilters}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: "none",
                    background: "transparent",
                    color: "var(--upzyellow)",
                    cursor: "pointer",
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {loading && <p>Loading products...</p>}

          {!loading && products.length === 0 && (
            <p style={{ opacity: 0.7 }}>
              No Printful products found. Check your Printful token and synced
              store products.
            </p>
          )}

          {!loading && products.length > 0 && filteredProducts.length === 0 && (
            <p style={{ opacity: 0.7 }}>
              No products match your current search or filters.
            </p>
          )}

          <div
            style={{
              display: "grid",
              gap: 22,
              gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
            }}
          >
            {filteredProducts.map((p: any) => {
              const previewImages = [p.image, ...(p.images || [])].filter(Boolean);
              const uniquePreviews = Array.from(new Set(previewImages)).slice(0, 3);
              const category = getCategory(p);

              return (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <article
                    style={{
                      height: "100%",
                      borderRadius: 20,
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.035)",
                      transition: "transform 0.25s ease, border-color 0.25s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-6px)";
                      e.currentTarget.style.borderColor = "rgba(237,191,45,0.7)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    }}
                  >
                    <div style={{ position: "relative", background: "#f4f4f4" }}>
                      <img
                        src={p.image || "/placeholder.png"}
                        alt={p.name || "Product"}
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.png";
                        }}
                        style={{
                          width: "100%",
                          aspectRatio: "1 / 1",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />

                      <span
                        style={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          padding: "6px 9px",
                          borderRadius: 999,
                          background: "rgba(1,1,1,0.86)",
                          color: "var(--upzyellow)",
                          fontSize: 11,
                          fontWeight: 900,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {category}
                      </span>

                      {uniquePreviews.length > 1 && (
                        <div
                          style={{
                            position: "absolute",
                            left: 12,
                            bottom: 12,
                            display: "flex",
                            gap: 6,
                          }}
                        >
                          {uniquePreviews.map((img: any, index: number) => (
                            <span
                              key={`${img}-${index}`}
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                overflow: "hidden",
                                border: "1px solid rgba(0,0,0,0.12)",
                                background: "#fff",
                                display: "block",
                              }}
                            >
                              <img
                                src={img}
                                alt=""
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ padding: 16 }}>
                      <div
                        style={{
                          minHeight: 38,
                          fontSize: 13,
                          fontWeight: 800,
                          lineHeight: 1.45,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          marginBottom: 10,
                        }}
                      >
                        {p.name || "Untitled Product"}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <strong style={{ color: "var(--upzyellow)", fontSize: 18 }}>
                          {formatPrice(p.price)}
                        </strong>
                        <span style={{ fontSize: 12, opacity: 0.65 }}>View →</span>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
