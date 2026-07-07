"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { storePackages } from "@/lib/packages";
import { useCartStore, type CartItem } from "@/store/cart-store";
import { categories, formatPrice, getCategory, matchesPriceFilter } from "@/lib/catalog";

const YELLOW = "#edbf2d";
const BLACK = "#010101";
const WHITE = "#ffffff";
const priceFilters = ["All", "Under $25", "$25-$50", "$50+"];

const collectionCards = [
  { title: "Apparel", slug: "apparel", desc: "Polos, hoodies, hats, and team-ready apparel." },
  { title: "Drinkware", slug: "drinkware", desc: "Mugs, tumblers, and premium office drinkware." },
  { title: "Office & Accessories", slug: "office", desc: "Desk essentials, printed materials, and presentation tools." },
  { title: "Signage & Materials", slug: "accessories", desc: "Client-facing details, giveaways, and branded extras." },
];

const benefits = [
  { title: "Premium Quality", text: "Top-tier products that represent your brand well.", icon: "◇" },
  { title: "Custom Branding", text: "Elevate your brand with custom printed materials.", icon: "✦" },
  { title: "Fast Fulfillment", text: "Quick production and streamlined ordering.", icon: "▱" },
  { title: "Dedicated Support", text: "We are here to help you look your best.", icon: "◎" },
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
        image: variant?.images?.[0] || product.image || product.thumbnail || "/placeholder.png",
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

  return (
    <Link href={`/product/${product.id}`} style={{ color: BLACK, textDecoration: "none" }}>
      <article style={{ height: "100%", background: WHITE, borderRadius: 8, overflow: "hidden", boxShadow: "0 20px 55px rgba(0,0,0,.10)", border: "1px solid rgba(1,1,1,.08)" }}>
        <div style={{ position: "relative", background: "#f2f2f2" }}>
          <img src={product.image || "/placeholder.png"} alt={product.name || "Product"} onError={(e) => { e.currentTarget.src = "/placeholder.png"; }} style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", display: "block" }} />
          <span style={{ position: "absolute", top: 12, left: 12, background: BLACK, color: YELLOW, borderRadius: 999, padding: "6px 9px", fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em" }}>{category}</span>
        </div>
        <div style={{ padding: 16 }}>
          <h3 style={{ color: BLACK, fontSize: 13, textTransform: "uppercase", letterSpacing: ".02em", lineHeight: 1.35, minHeight: 38, marginBottom: 10 }}>{product.name || "Untitled Product"}</h3>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <strong style={{ fontSize: 20 }}>{formatPrice(product.price)}</strong>
            <span style={{ color: YELLOW, fontWeight: 900 }}>Shop Now</span>
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
      const variantText = (product?.variants || []).map((variant: any) => `${variant?.name || ""} ${variant?.size || ""} ${variant?.color || ""}`).join(" ").toLowerCase();
      return (!q || name.includes(q) || variantText.includes(q) || category.toLowerCase().includes(q)) && (activeCategory === "All" || category === activeCategory) && matchesPriceFilter(product, priceFilter);
    });
  }, [products, query, activeCategory, priceFilter]);

  const packageSummaries = useMemo(() => storePackages.map((storePackage) => {
    const items = buildPackageItems(storePackage, products);
    const subtotal = items.reduce((sum: number, item: CartItem) => sum + Number(item.price || 0) * item.quantity, 0);
    return { ...storePackage, items, subtotal };
  }), [products]);

  const heroProducts = products.slice(0, 4);
  const featuredProducts = filteredProducts.slice(0, 12);

  const addPackageToCart = (packageSummary: any) => {
    if (!packageSummary.items.length) return;
    addItems(packageSummary.items);
  };

  const clearFilters = () => {
    setQuery("");
    setActiveCategory("All");
    setPriceFilter("All");
  };

  return (
    <main style={{ background: WHITE, color: BLACK }}>
      <section style={{ minHeight: 720, color: WHITE, position: "relative", overflow: "hidden", display: "grid", alignItems: "center", background: `radial-gradient(circle at 73% 38%, rgba(237,191,45,.26), transparent 19vw), linear-gradient(90deg, ${BLACK} 0%, #050505 52%, #151515 100%)` }}>
        <div style={{ position: "absolute", inset: 0, opacity: .18, backgroundImage: "linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
        <div style={{ position: "absolute", right: -140, top: "22%", width: 380, height: 380, background: YELLOW, transform: "rotate(45deg)", boxShadow: "0 0 90px rgba(237,191,45,.3)" }} />
        <div style={{ width: "min(1320px, calc(100vw - 64px))", margin: "0 auto", position: "relative", zIndex: 2, display: "grid", gridTemplateColumns: "minmax(320px,.9fr) minmax(320px,1.1fr)", gap: 56, alignItems: "center" }}>
          <div>
            <div style={{ color: WHITE, fontWeight: 900, textTransform: "uppercase", fontSize: 13, letterSpacing: ".02em", marginBottom: 18 }}><span style={{ color: YELLOW }}>Brand it.</span> Market it. Close it.</div>
            <h1 style={{ color: WHITE, fontSize: "clamp(46px, 6.8vw, 96px)", lineHeight: .9, letterSpacing: "-.075em", marginBottom: 24, textTransform: "uppercase" }}>Premium merch for <span style={{ color: YELLOW }}>commercial real estate</span> professionals</h1>
            <p style={{ color: "rgba(255,255,255,.84)", maxWidth: 560, fontSize: 17, lineHeight: 1.8, marginBottom: 30 }}>High-quality branded merchandise and marketing materials for brokers, teams, and CRE companies who want to stand out.</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="#products" style={{ minHeight: 52, padding: "15px 24px", background: YELLOW, color: BLACK, borderRadius: 7, fontWeight: 900, textTransform: "uppercase" }}>Shop All Products</a>
              <a href="#cre-packages" style={{ minHeight: 52, padding: "15px 24px", color: WHITE, border: "1px solid rgba(255,255,255,.28)", borderRadius: 7, fontWeight: 900, textTransform: "uppercase" }}>Broker Packages</a>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {(heroProducts.length ? heroProducts : [0, 1, 2, 3]).map((product: any, index: number) => (
              <div key={product?.id || index} style={{ minHeight: index === 0 ? 330 : 230, borderRadius: index === 0 ? "28px 28px 6px 28px" : 22, overflow: "hidden", background: "linear-gradient(145deg,#191919,#050505)", border: "1px solid rgba(255,255,255,.1)", boxShadow: "0 24px 70px rgba(0,0,0,.34)", position: "relative" }}>
                {product?.image ? <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: .78, filter: "saturate(.78) contrast(1.08)" }} /> : null}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 45%, rgba(0,0,0,.62))" }} />
                <div style={{ position: "absolute", left: 18, bottom: 16, color: WHITE, fontWeight: 900, fontSize: 22, letterSpacing: "-.04em" }}>UPZ<br /><span style={{ color: YELLOW, fontSize: 14 }}>DESIGN</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: YELLOW, color: BLACK, padding: "18px 0" }}>
        <div style={{ width: "min(1320px, calc(100vw - 64px))", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
          {benefits.map((benefit) => <div key={benefit.title} style={{ display: "grid", gridTemplateColumns: "46px 1fr", gap: 12, alignItems: "center", padding: "10px 24px", borderRight: "1px solid rgba(1,1,1,.18)" }}><div style={{ width: 42, height: 42, border: `2px solid ${BLACK}`, display: "grid", placeItems: "center", fontWeight: 900, fontSize: 22 }}>{benefit.icon}</div><span><strong style={{ display: "block", fontSize: 12, textTransform: "uppercase" }}>{benefit.title}</strong><small>{benefit.text}</small></span></div>)}
        </div>
      </section>

      <section style={{ padding: "72px 0 82px" }}>
        <div style={{ width: "min(1320px, calc(100vw - 64px))", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 24, marginBottom: 30, flexWrap: "wrap" }}><div><span style={{ color: YELLOW, fontWeight: 900, textTransform: "uppercase", fontSize: 12 }}>Shop by category</span><h2 style={{ color: BLACK, fontSize: "clamp(34px,4vw,56px)", textTransform: "uppercase", margin: "6px 0 0" }}>Explore our collections</h2><div style={{ width: 64, height: 4, background: YELLOW, marginTop: 14 }} /></div><a href="#products" style={{ color: BLACK, fontSize: 13, fontWeight: 900, textTransform: "uppercase" }}>View all collections</a></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 18 }}>
            {collectionCards.map((collection) => {
              const product = products.find((item) => getCategory(item) === (collection.title === "Office & Accessories" ? "Office" : collection.title === "Signage & Materials" ? "Accessories" : collection.title));
              return <Link key={collection.slug} href={`/collections/${collection.slug}`} style={{ minHeight: 340, borderRadius: 8, overflow: "hidden", position: "relative", background: BLACK, color: WHITE, boxShadow: "0 20px 55px rgba(0,0,0,.12)" }}>{product?.image ? <img src={product.image} alt={collection.title} style={{ width: "100%", height: "100%", position: "absolute", inset: 0, objectFit: "cover", opacity: .72, filter: "saturate(.8) contrast(1.06)" }} /> : null}<div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 25%, rgba(0,0,0,.88))" }} /><div style={{ position: "absolute", zIndex: 2, left: 22, right: 22, bottom: 22 }}><h3 style={{ color: WHITE, fontSize: 24, textTransform: "uppercase", marginBottom: 8 }}>{collection.title}</h3><p style={{ color: "rgba(255,255,255,.72)", fontSize: 13, lineHeight: 1.55 }}>{collection.desc}</p><strong style={{ color: YELLOW }}>Shop Now</strong></div></Link>;
            })}
          </div>
        </div>
      </section>

      <section id="cre-packages" style={{ padding: "86px 0", background: "#070707", color: WHITE }}>
        <div style={{ width: "min(1320px, calc(100vw - 64px))", margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(280px,.72fr) minmax(320px,1.28fr)", gap: 38, alignItems: "center" }}>
          <div><span style={{ color: YELLOW, fontWeight: 900, textTransform: "uppercase", fontSize: 12 }}>Featured Packages</span><h2 style={{ color: WHITE, fontSize: "clamp(34px,4.6vw,62px)", lineHeight: .96, margin: "14px 0 20px", textTransform: "uppercase" }}>Built for brokers. Designed to impress.</h2><p style={{ color: "rgba(255,255,255,.74)", lineHeight: 1.8, marginBottom: 26 }}>Curated packages with everything you need to market listings, build your brand, and stay prepared for every opportunity.</p><a href="#products" style={{ minHeight: 52, padding: "15px 24px", background: YELLOW, color: BLACK, borderRadius: 7, fontWeight: 900, textTransform: "uppercase" }}>View Broker Packages</a></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
            {packageSummaries.map((pack) => <article key={pack.id} style={{ background: WHITE, color: BLACK, borderRadius: 8, overflow: "hidden", boxShadow: "0 22px 60px rgba(0,0,0,.28)" }}><div style={{ height: 178, background: "#e9e9e9", overflow: "hidden" }}>{pack.items[0]?.image ? <img src={pack.items[0].image} alt={pack.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ height: "100%", display: "grid", placeItems: "center", fontWeight: 900 }}>UPZ Kit</div>}</div><div style={{ padding: 16 }}><h3 style={{ color: BLACK, fontSize: 17, lineHeight: 1.12, textTransform: "uppercase", marginBottom: 10 }}>{pack.title}</h3><strong style={{ display: "block", fontSize: 28 }}>{pack.subtotal ? formatPrice(pack.subtotal) : "Build Kit"}</strong><small style={{ display: "block", color: "rgba(1,1,1,.55)", margin: "4px 0 14px" }}>{pack.items.length} selected items</small><button onClick={() => addPackageToCart(pack)} disabled={!pack.items.length} style={{ border: 0, background: "transparent", color: BLACK, fontWeight: 900, cursor: pack.items.length ? "pointer" : "not-allowed", opacity: pack.items.length ? 1 : .45, padding: 0, textTransform: "uppercase" }}>Add Package</button></div></article>)}
          </div>
        </div>
      </section>

      <section style={{ background: YELLOW, padding: "32px 0" }}><div style={{ width: "min(1320px, calc(100vw - 64px))", margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(240px,.92fr) minmax(320px,1.08fr)", gap: 40, alignItems: "center" }}><div style={{ minHeight: 260, borderRadius: "8px 8px 80px 8px", background: `linear-gradient(120deg, rgba(1,1,1,.2), rgba(255,255,255,.18)), radial-gradient(circle at 30% 20%, rgba(255,255,255,.7), transparent 18vw), ${BLACK}` }} /><div><span style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>Ready to elevate your brand?</span><h2 style={{ color: BLACK, fontSize: "clamp(34px,5vw,66px)", lineHeight: .95, textTransform: "uppercase", margin: "12px 0 24px" }}>Let’s create something exceptional together.</h2><a href="https://www.upzdesign.com/contact.html" style={{ display: "inline-flex", minHeight: 50, padding: "14px 24px", background: BLACK, color: WHITE, borderRadius: 7, fontWeight: 900, textTransform: "uppercase" }}>Get in Touch</a></div></div></section>

      <section id="products" style={{ padding: "74px 0 96px", background: "#f6f6f6" }}><div style={{ width: "min(1320px, calc(100vw - 64px))", margin: "0 auto" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 24, marginBottom: 30, flexWrap: "wrap" }}><div><span style={{ color: YELLOW, fontWeight: 900, textTransform: "uppercase", fontSize: 12 }}>All Products</span><h2 style={{ color: BLACK, fontSize: "clamp(34px,4vw,56px)", textTransform: "uppercase", margin: "6px 0 0" }}>Shop the catalog</h2><div style={{ width: 64, height: 4, background: YELLOW, marginTop: 14 }} /></div><strong>{loading ? "Loading..." : `${filteredProducts.length} of ${products.length} products`}</strong></div><div style={{ display: "grid", gap: 14, padding: 18, borderRadius: 12, background: WHITE, marginBottom: 28, boxShadow: "0 18px 46px rgba(0,0,0,.06)" }}><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products, colors, variants..." style={{ minHeight: 50, borderRadius: 7, border: "1px solid rgba(1,1,1,.12)", padding: "0 18px", outline: "none", color: BLACK }} /><div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{categories.map((category) => <button key={category} onClick={() => setActiveCategory(category)} style={{ padding: "10px 14px", borderRadius: 7, border: "1px solid rgba(1,1,1,.14)", background: activeCategory === category ? YELLOW : WHITE, color: BLACK, cursor: "pointer", fontWeight: 900 }}>{category}</button>)}{priceFilters.map((filter) => <button key={filter} onClick={() => setPriceFilter(filter)} style={{ padding: "10px 14px", borderRadius: 7, border: "1px solid rgba(1,1,1,.14)", background: priceFilter === filter ? BLACK : WHITE, color: priceFilter === filter ? WHITE : BLACK, cursor: "pointer", fontWeight: 900 }}>{filter}</button>)}{(query || activeCategory !== "All" || priceFilter !== "All") && <button onClick={clearFilters} style={{ padding: "10px 14px", borderRadius: 7, border: 0, background: "transparent", color: BLACK, cursor: "pointer", fontWeight: 900 }}>Clear</button>}</div></div>{!loading && filteredProducts.length === 0 && <p style={{ color: "rgba(1,1,1,.7)" }}>No products match your current filters.</p>}<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 22 }}>{featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div></div></section>

      <footer style={{ background: "#070707", color: WHITE, padding: "54px 0 32px" }}><div style={{ width: "min(1320px, calc(100vw - 64px))", margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(220px,1.4fr) repeat(4,minmax(130px,1fr))", gap: 32 }}><div><h2 style={{ color: WHITE, fontSize: 38, letterSpacing: "-.08em", lineHeight: .85, marginBottom: 16 }}>UPZ<span style={{ display: "block", color: YELLOW, fontSize: 24 }}>DESIGN</span></h2><p style={{ color: "rgba(255,255,255,.64)", lineHeight: 1.7 }}>Premium merchandising and marketing solutions for commercial real estate professionals and companies.</p></div><div><h4>Shop</h4><p>All Products</p><p>Apparel</p><p>Drinkware</p><p>Office & Accessories</p></div><div><h4>Broker Packages</h4><p>Broker Starter Kit</p><p>Open House Package</p><p>New Listing Launch Kit</p><p>Luxury Listing Package</p></div><div><h4>Company</h4><p>About Us</p><p>Our Process</p><p>Contact Us</p><p>FAQ</p></div><div><h4>Account</h4><p>Orders</p><p>Favorites</p><p>Cart</p></div></div></footer>
    </main>
  );
}
