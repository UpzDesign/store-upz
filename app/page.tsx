"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { storePackages } from "@/lib/packages";
import { useCartStore, type CartItem } from "@/store/cart-store";
import { categories, formatPrice, getCategory, matchesPriceFilter } from "@/lib/catalog";

const priceFilters = ["All", "Under $25", "$25-$50", "$50+"];

const collectionCards = [
  { title: "Apparel", slug: "apparel", desc: "Polos, hoodies, hats, and team-ready apparel." },
  { title: "Drinkware", slug: "drinkware", desc: "Mugs, tumblers, and premium office drinkware." },
  { title: "Office", slug: "office", desc: "Desk essentials, printed materials, and presentation tools." },
  { title: "Accessories", slug: "accessories", desc: "Client-facing details, giveaways, and branded extras." },
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
    <Link href={`/product/${product.id}`} className="upz-product-card">
      <article>
        <div className="upz-product-image">
          <img src={product.image || "/placeholder.png"} alt={product.name || "Product"} onError={(e) => { e.currentTarget.src = "/placeholder.png"; }} />
          <span>{category}</span>
        </div>
        <div className="upz-product-info">
          <h3>{product.name || "Untitled Product"}</h3>
          <div>
            <strong>{formatPrice(product.price)}</strong>
            <span>Shop Now</span>
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

      return (!q || name.includes(q) || variantText.includes(q) || category.toLowerCase().includes(q)) &&
        (activeCategory === "All" || category === activeCategory) &&
        matchesPriceFilter(product, priceFilter);
    });
  }, [products, query, activeCategory, priceFilter]);

  const packageSummaries = useMemo(() => storePackages.map((storePackage) => {
    const items = buildPackageItems(storePackage, products);
    const subtotal = items.reduce((sum: number, item: CartItem) => sum + Number(item.price || 0) * item.quantity, 0);
    return { ...storePackage, items, subtotal };
  }), [products]);

  const heroProducts = products.slice(0, 5);
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
    <main className="upz-home">
      <section className="upz-hero">
        <div className="upz-hero-grid-bg" />
        <div className="upz-hero-shape" />
        <div className="upz-wrap upz-hero-inner">
          <div className="upz-hero-copy">
            <div className="upz-kicker"><span>Brand it.</span> Market it. Close it.</div>
            <h1>Premium merch for <span>commercial real estate</span> professionals</h1>
            <p>High-quality branded merchandise and marketing materials for brokers, teams, and CRE companies who want to stand out.</p>
            <div className="upz-hero-actions">
              <a href="#products">Shop All Products</a>
              <a href="#cre-packages">Broker Packages</a>
            </div>
          </div>

          <div className="upz-hero-slider" aria-label="Featured product preview slider">
            {(heroProducts.length ? heroProducts : [0, 1, 2, 3]).map((product: any, index: number) => (
              <div className="upz-hero-slide" key={product?.id || index}>
                {product?.image ? <img src={product.image} alt={product.name} /> : null}
                <div className="upz-hero-slide-overlay" />
                <div className="upz-hero-slide-copy">
                  <strong>{product?.name || "UPZ Custom Image"}</strong>
                  <span>{product ? getCategory(product) : "Replace with your own hero image"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="upz-benefits">
        <div className="upz-wrap upz-benefit-grid">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="upz-benefit">
              <div>{benefit.icon}</div>
              <span><strong>{benefit.title}</strong><small>{benefit.text}</small></span>
            </div>
          ))}
        </div>
      </section>

      <section className="upz-section upz-collections">
        <div className="upz-wrap">
          <div className="upz-section-title">
            <div><span>Shop by category</span><h2>Explore our collections</h2></div>
            <a href="#products">View all products</a>
          </div>
          <div className="upz-collection-grid">
            {collectionCards.map((collection) => {
              const product = products.find((item) => getCategory(item) === collection.title);
              return (
                <Link key={collection.slug} href={`/collections/${collection.slug}`} className="upz-collection-card">
                  {product?.image ? <img src={product.image} alt={collection.title} /> : null}
                  <div><h3>{collection.title}</h3><p>{collection.desc}</p><strong>Shop Now</strong></div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="cre-packages" className="upz-packages">
        <div className="upz-wrap upz-package-layout">
          <div className="upz-package-copy">
            <span>Featured Packages</span>
            <h2>Built for brokers. Designed to impress.</h2>
            <p>Curated packages with everything you need to market listings, build your brand, and stay prepared for every opportunity.</p>
            <a href="#products">View Broker Packages</a>
          </div>
          <div className="upz-package-grid">
            {packageSummaries.map((pack) => (
              <article key={pack.id} className="upz-package-card">
                <div className="upz-package-image">
                  {pack.items[0]?.image ? <img src={pack.items[0].image} alt={pack.title} /> : <div>UPZ Kit</div>}
                </div>
                <div className="upz-package-info">
                  <h3>{pack.title}</h3>
                  <strong>{pack.subtotal ? formatPrice(pack.subtotal) : "Build Kit"}</strong>
                  <small>{pack.items.length} selected items</small>
                  <button onClick={() => addPackageToCart(pack)} disabled={!pack.items.length}>Add Package</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="upz-yellow-cta">
        <div className="upz-wrap upz-yellow-grid">
          <div className="upz-yellow-image" />
          <div><span>Ready to elevate your brand?</span><h2>Let’s create something exceptional together.</h2><a href="https://www.upzdesign.com/contact.html">Get in Touch</a></div>
        </div>
      </section>

      <section id="products" className="upz-products-section">
        <div className="upz-wrap">
          <div className="upz-section-title">
            <div><span>All Products</span><h2>Shop the catalog</h2></div>
            <strong>{loading ? "Loading..." : `${filteredProducts.length} of ${products.length} products`}</strong>
          </div>
          <div className="upz-filter-panel">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products, colors, variants..." />
            <div>
              {categories.map((category) => <button key={category} onClick={() => setActiveCategory(category)} className={activeCategory === category ? "is-active" : ""}>{category}</button>)}
              {priceFilters.map((filter) => <button key={filter} onClick={() => setPriceFilter(filter)} className={priceFilter === filter ? "is-dark" : ""}>{filter}</button>)}
              {(query || activeCategory !== "All" || priceFilter !== "All") && <button onClick={clearFilters}>Clear</button>}
            </div>
          </div>
          {!loading && filteredProducts.length === 0 && <p className="upz-empty">No products match your current filters.</p>}
          <div className="upz-product-grid">{featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        </div>
      </section>

      <footer className="upz-footer">
        <div className="upz-wrap upz-footer-grid">
          <div><img className="upz-footer-logo" src="/upz-logo.svg" alt="UPZ Design" /><p>Premium merchandising and marketing solutions for commercial real estate professionals and companies.</p></div>
          <div><h4>Shop</h4><p>All Products</p><p>Apparel</p><p>Drinkware</p><p>Office</p></div>
          <div><h4>Broker Packages</h4><p>Broker Starter Kit</p><p>Open House Package</p><p>New Listing Launch Kit</p><p>Luxury Listing Package</p></div>
          <div><h4>Company</h4><p>About Us</p><p>Our Process</p><p>Contact Us</p><p>FAQ</p></div>
          <div><h4>Account</h4><p>Orders</p><p>Favorites</p><p>Cart</p></div>
        </div>
      </footer>
    </main>
  );
}
