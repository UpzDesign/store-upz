"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { storePackages } from "@/lib/packages";
import { useCartStore, type CartItem } from "@/store/cart-store";
import {
  categories,
  formatPrice,
  getCategory,
  matchesPriceFilter,
  slugifyCategory,
} from "@/lib/catalog";

const priceFilters = ["All", "Under $25", "$25-$50", "$50+"];

const collectionCards = [
  {
    title: "Apparel",
    slug: "apparel",
    desc: "Polos, hoodies, hats, and team-ready apparel.",
  },
  {
    title: "Drinkware",
    slug: "drinkware",
    desc: "Mugs, tumblers, and premium office drinkware.",
  },
  {
    title: "Office",
    slug: "office",
    desc: "Desk essentials, print materials, and presentation tools.",
  },
  {
    title: "Accessories",
    slug: "accessories",
    desc: "Client-facing details, giveaways, and branded extras.",
  },
];

const benefits = [
  {
    title: "Premium Quality",
    text: "Top-tier products that represent your brand well.",
    icon: "◇",
  },
  {
    title: "Custom Branding",
    text: "Elevate your brand with curated printed materials.",
    icon: "✦",
  },
  {
    title: "Fast Fulfillment",
    text: "Print-on-demand products with streamlined ordering.",
    icon: "▱",
  },
  {
    title: "CRE Focused",
    text: "Built for brokers, teams, launches, and listing campaigns.",
    icon: "◎",
  },
];

function getPrimaryVariant(product: any) {
  return product?.variants?.[0] || product;
}

function buildPackageItems(storePackage: any, products: any[]): CartItem[] {
  const usedProductIds = new Set<string>();

  return storePackage.rules.flatMap((rule: any) => {
    const product = products.find((item) => {
      const productId = String(item?.id || "");
      return getCategory(item) === rule.category && !usedProductIds.has(productId);
    });

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

function ProductCard({ product }: { product: any }) {
  const category = getCategory(product);
  const previewImages = [product.image, ...(product.images || [])].filter(Boolean);
  const uniquePreviews = Array.from(new Set(previewImages)).slice(0, 3);

  return (
    <Link href={`/product/${product.id}`} style={{ color: "inherit", textDecoration: "none" }}>
      <article
        style={{
          height: "100%",
          borderRadius: 18,
          overflow: "hidden",
          border: "1px solid rgba(1,1,1,0.08)",
          background: "#fff",
          boxShadow: "0 18px 46px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ position: "relative", background: "#f3f3f3" }}>
          <img
            src={product.image || "/placeholder.png"}
            alt={product.name || "Product"}
            onError={(e) => {
              e.currentTarget.src = "/placeholder.png";
            }}
            style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", display: "block" }}
          />
          <span
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              padding: "6px 9px",
              borderRadius: 999,
              background: "rgba(1,1,1,0.88)",
              color: "var(--upzyellow)",
              fontSize: 10,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {category}
          </span>
          {uniquePreviews.length > 1 && (
            <div style={{ position: "absolute", left: 12, bottom: 12, display: "flex", gap: 6 }}>
              {uniquePreviews.map((img: any, index: number) => (
                <span
                  key={`${img}-${index}`}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    overflow: "hidden",
                    border: "1px solid rgba(0,0,0,0.18)",
                    background: "#fff",
                    display: "block",
                  }}
                >
                  <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding: 16, color: "#010101" }}>
          <div
            style={{
              minHeight: 38,
              fontSize: 13,
              fontWeight: 900,
              lineHeight: 1.35,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            {product.name || "Untitled Product"}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <strong style={{ fontSize: 20 }}>{formatPrice(product.price)}</strong>
            <span style={{ color: "var(--upzyellow)", fontWeight: 900 }}>Shop Now</span>
          </div>
        </div>
      </article>
    </Link>
  );
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
      .then((data) => setProducts(Array.isArray(data) ? data : []))
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

      return (
        (!q || name.includes(q) || variantText.includes(q) || category.toLowerCase().includes(q)) &&
        (activeCategory === "All" || category === activeCategory) &&
        matchesPriceFilter(product, priceFilter)
      );
    });
  }, [products, query, activeCategory, priceFilter]);

  const packageSummaries = useMemo(
    () =>
      storePackages.map((storePackage) => {
        const items = buildPackageItems(storePackage, products);
        const subtotal = items.reduce(
          (sum: number, item: CartItem) => sum + Number(item.price || 0) * item.quantity,
          0
        );
        return { ...storePackage, items, subtotal };
      }),
    [products]
  );

  const heroProducts = products.slice(0, 4);
  const featuredProducts = filteredProducts.slice(0, 12);

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
    <main style={{ background: "#fff", color: "#010101" }}>
      <section
        style={{
          minHeight: "680px",
          display: "grid",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(90deg, rgba(1,1,1,0.98) 0%, rgba(1,1,1,0.88) 42%, rgba(1,1,1,0.58) 100%), url('https://www.upzdesign.com/images/bg.jpg') center/cover no-repeat",
          color: "#fff",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: "-120px",
            top: "18%",
            width: "360px",
            height: "360px",
            background: "var(--upzyellow)",
            transform: "rotate(45deg)",
          }}
        />
        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 0.92fr) minmax(320px, 1.08fr)", gap: 42, alignItems: "center" }}>
            <div>
              <div style={{ color: "var(--upzyellow)", fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 18 }}>
                Brand it. Market it. Close it.
              </div>
              <h1 style={{ fontSize: "clamp(44px, 6.7vw, 92px)", lineHeight: 0.94, letterSpacing: "-0.075em", marginBottom: 24 }}>
                Premium merch for <span style={{ color: "var(--upzyellow)" }}>commercial real estate</span> professionals.
              </h1>
              <p style={{ color: "rgba(255,255,255,0.82)", maxWidth: 560, fontSize: 17, lineHeight: 1.8, marginBottom: 30 }}>
                High-quality branded merchandise and marketing materials for brokers, teams,
                and CRE companies who want to stand out.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a href="#products" className="button">Shop All Products</a>
                <a href="#cre-packages" className="button outline">View Broker Packages</a>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {heroProducts.length > 0 ? (
                heroProducts.map((product, index) => (
                  <div
                    key={product.id}
                    style={{
                      borderRadius: index === 0 ? "28px 28px 6px 28px" : 22,
                      overflow: "hidden",
                      background: "rgba(255,255,255,0.09)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      backdropFilter: "blur(14px)",
                      minHeight: index === 0 ? 300 : 220,
                    }}
                  >
                    <img src={product.image || "/placeholder.png"} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: "1 / -1", minHeight: 390, borderRadius: 28, border: "1px solid rgba(255,255,255,0.12)", background: "linear-gradient(135deg, rgba(237,191,45,0.32), rgba(255,255,255,0.08))", display: "grid", placeItems: "center", textAlign: "center", padding: 28 }}>
                  <strong style={{ fontSize: 28 }}>UPZ Branded Merchandise Preview</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "70px 0" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 20, marginBottom: 28, flexWrap: "wrap" }}>
            <div>
              <div style={{ color: "var(--upzyellow)", fontWeight: 900, textTransform: "uppercase", fontSize: 12, marginBottom: 8 }}>Shop by category</div>
              <h2 style={{ color: "#010101", fontSize: "clamp(32px, 4vw, 54px)", marginBottom: 0 }}>Explore our collections</h2>
              <div style={{ width: 62, height: 4, background: "var(--upzyellow)", marginTop: 16 }} />
            </div>
            <a href="#products" style={{ fontSize: 13, fontWeight: 900, textTransform: "uppercase" }}>View all collections →</a>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
            {collectionCards.map((collection) => {
              const product = products.find((item) => getCategory(item) === collection.title);
              return (
                <Link key={collection.slug} href={`/collections/${collection.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
                  <article style={{ minHeight: 330, borderRadius: 18, overflow: "hidden", position: "relative", background: "#111" }}>
                    <img src={product?.image || "/placeholder.png"} alt={collection.title} style={{ width: "100%", height: "100%", position: "absolute", inset: 0, objectFit: "cover", opacity: 0.78 }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 25%, rgba(0,0,0,0.82) 100%)" }} />
                    <div style={{ position: "absolute", left: 22, right: 22, bottom: 22, color: "#fff" }}>
                      <h3 style={{ fontSize: 22, textTransform: "uppercase", marginBottom: 8 }}>{collection.title}</h3>
                      <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 13, lineHeight: 1.55, marginBottom: 12 }}>{collection.desc}</p>
                      <span style={{ color: "var(--upzyellow)", fontWeight: 900 }}>Shop Now →</span>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="cre-packages" style={{ padding: "76px 0", background: "#070707", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 0.72fr) minmax(320px, 1.28fr)", gap: 38, alignItems: "center" }}>
            <div>
              <div style={{ color: "var(--upzyellow)", fontWeight: 900, textTransform: "uppercase", fontSize: 12, marginBottom: 14 }}>Featured Packages</div>
              <h2 style={{ color: "#fff", fontSize: "clamp(34px, 4.6vw, 62px)", lineHeight: 0.96, marginBottom: 20 }}>
                Built for brokers. Designed to impress.
              </h2>
              <p style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.8, marginBottom: 26 }}>
                Curated packages with everything you need to market listings, build your brand,
                and stay prepared for every opportunity.
              </p>
              <a href="#products" className="button">View Broker Packages</a>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
              {packageSummaries.map((pack) => (
                <article key={pack.id} style={{ background: "#fff", color: "#010101", borderRadius: 14, overflow: "hidden" }}>
                  <div style={{ height: 165, background: "#e9e9e9", display: "grid", placeItems: "center", overflow: "hidden" }}>
                    {pack.items[0]?.image ? (
                      <img src={pack.items[0].image} alt={pack.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <strong>UPZ Kit</strong>
                    )}
                  </div>
                  <div style={{ padding: 16 }}>
                    <h3 style={{ color: "#010101", fontSize: 17, lineHeight: 1.15, textTransform: "uppercase", marginBottom: 10 }}>{pack.title}</h3>
                    <strong style={{ fontSize: 28 }}>{pack.subtotal ? formatPrice(pack.subtotal) : "Build Kit"}</strong>
                    <p style={{ color: "rgba(1,1,1,0.55)", fontSize: 11, margin: "4px 0 14px" }}>{pack.items.length} selected items</p>
                    <button onClick={() => addPackageToCart(pack)} disabled={!pack.items.length} style={{ border: 0, background: "transparent", color: "#010101", fontWeight: 900, cursor: pack.items.length ? "pointer" : "not-allowed", opacity: pack.items.length ? 1 : 0.45, padding: 0 }}>
                      Add Package →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "44px 0", background: "#fff" }}>
        <div className="container" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 20 }}>
          {benefits.map((benefit) => (
            <div key={benefit.title} style={{ display: "grid", gridTemplateColumns: "46px 1fr", gap: 14, alignItems: "start", padding: "10px 0" }}>
              <div style={{ width: 46, height: 46, border: "2px solid #010101", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 22 }}>{benefit.icon}</div>
              <div>
                <h3 style={{ color: "#010101", fontSize: 13, textTransform: "uppercase", marginBottom: 8 }}>{benefit.title}</h3>
                <p style={{ color: "rgba(1,1,1,0.64)", fontSize: 13, lineHeight: 1.55, margin: 0 }}>{benefit.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="products" style={{ padding: "74px 0 90px", background: "#f6f6f6" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 22, flexWrap: "wrap", marginBottom: 26 }}>
            <div>
              <div style={{ color: "var(--upzyellow)", fontWeight: 900, textTransform: "uppercase", fontSize: 12, marginBottom: 8 }}>All Products</div>
              <h2 style={{ color: "#010101", marginBottom: 8 }}>Shop the catalog</h2>
              <p style={{ color: "rgba(1,1,1,0.62)", maxWidth: 650, margin: 0 }}>
                Search branded products, filter by category, and build your next CRE marketing kit.
              </p>
            </div>
            <span style={{ color: "rgba(1,1,1,0.58)", fontWeight: 800 }}>{loading ? "Loading..." : `${filteredProducts.length} of ${products.length} products`}</span>
          </div>

          <div style={{ display: "grid", gap: 14, padding: 18, borderRadius: 18, background: "#fff", marginBottom: 28, boxShadow: "0 18px 46px rgba(0,0,0,0.06)" }}>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products, colors, variants..." style={{ minHeight: 50, borderRadius: 999, border: "1px solid rgba(1,1,1,0.12)", padding: "0 18px", outline: "none", color: "#010101" }} />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {categories.map((category) => (
                <button key={category} onClick={() => setActiveCategory(category)} style={{ padding: "10px 14px", borderRadius: 999, border: activeCategory === category ? "1px solid var(--upzyellow)" : "1px solid rgba(1,1,1,0.14)", background: activeCategory === category ? "var(--upzyellow)" : "#fff", color: "#010101", cursor: "pointer", fontWeight: 900 }}>{category}</button>
              ))}
              {priceFilters.map((filter) => (
                <button key={filter} onClick={() => setPriceFilter(filter)} style={{ padding: "10px 14px", borderRadius: 999, border: priceFilter === filter ? "1px solid #010101" : "1px solid rgba(1,1,1,0.14)", background: priceFilter === filter ? "#010101" : "#fff", color: priceFilter === filter ? "#fff" : "#010101", cursor: "pointer", fontWeight: 800 }}>{filter}</button>
              ))}
              {(query || activeCategory !== "All" || priceFilter !== "All") && <button onClick={clearFilters} style={{ border: 0, background: "transparent", color: "#010101", fontWeight: 900, cursor: "pointer" }}>Clear filters</button>}
            </div>
          </div>

          {!loading && filteredProducts.length === 0 && <p style={{ color: "rgba(1,1,1,0.7)" }}>No products match your current filters.</p>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 22 }}>
            {featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </section>

      <section style={{ padding: "66px 0", background: "#fff" }}>
        <div className="container">
          <div style={{ borderRadius: 18, overflow: "hidden", display: "grid", gridTemplateColumns: "minmax(240px, 0.8fr) minmax(320px, 1.2fr)", background: "#010101", color: "#fff" }}>
            <div style={{ minHeight: 260, background: "linear-gradient(135deg, rgba(237,191,45,0.22), rgba(255,255,255,0.06))" }} />
            <div style={{ padding: "46px clamp(24px, 5vw, 70px)" }}>
              <div style={{ color: "var(--upzyellow)", fontSize: 12, textTransform: "uppercase", fontWeight: 900, marginBottom: 12 }}>Ready to elevate your brand?</div>
              <h2 style={{ color: "#fff", fontSize: "clamp(30px, 4vw, 56px)", marginBottom: 20 }}>Let’s create something exceptional together.</h2>
              <a href="https://www.upzdesign.com/contact.html" className="button">Get in Touch</a>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ background: "#070707", color: "#fff", padding: "54px 0 26px" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1.4fr) repeat(4, minmax(130px, 1fr))", gap: 32, marginBottom: 34 }}>
            <div>
              <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-0.08em", lineHeight: 0.9 }}>UPZ<br /><span style={{ color: "var(--upzyellow)", fontSize: 23 }}>DESIGN</span></div>
              <p style={{ color: "rgba(255,255,255,0.62)", marginTop: 18, maxWidth: 260, lineHeight: 1.7 }}>Premium merchandising and marketing solutions for commercial real estate professionals and companies.</p>
            </div>
            <div><h4>Shop</h4><p>All Products</p><p>Apparel</p><p>Drinkware</p><p>Office</p></div>
            <div><h4>Broker Packages</h4><p>Starter Kit</p><p>Open House</p><p>Listing Launch</p><p>Luxury Listing</p></div>
            <div><h4>Company</h4><p>About Us</p><p>Our Process</p><p>Contact Us</p><p>FAQ</p></div>
            <div><h4>Account</h4><p>Orders</p><p>Favorites</p><p>Cart</p></div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 18, display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap", color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
            <span>© 2026 UPZ Design. All rights reserved.</span>
            <span>Privacy Policy / Terms of Service / Shipping & Returns</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
