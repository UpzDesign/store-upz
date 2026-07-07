"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getCompanyBySlug } from "@/lib/companies";
import { categories, formatPrice, getCategory } from "@/lib/catalog";
import { storePackages } from "@/lib/packages";
import { useCartStore, type CartItem } from "@/store/cart-store";

function getPrimaryVariant(product: any) {
  return product?.variants?.[0] || product;
}

function buildPackageItems(storePackage: any, products: any[], packageName: string): CartItem[] {
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
        name: `${packageName} · ${product.name}`,
        variant: variant?.name,
        image: variant?.images?.[0] || product.image || product.thumbnail || "/placeholder.png",
        price,
        quantity: Number(rule.quantity || 1),
        packageId: storePackage.id,
        packageName,
      },
    ];
  });
}

export default function CompanyPortalPage() {
  const params = useParams();
  const router = useRouter();
  const slug = Array.isArray(params?.company) ? params.company[0] : params?.company;
  const company = getCompanyBySlug(String(slug || ""));
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const addItems = useCartStore((state) => state.addItems);

  useEffect(() => {
    if (!company) return;

    const savedSlug = window.localStorage.getItem("upz_company_slug");
    if (savedSlug !== company.slug) {
      router.push("/login");
      return;
    }

    fetch(`/api/products?company=${company.slug}`)
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [company, router]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === "All") return products;
    return products.filter((product) => getCategory(product) === activeCategory);
  }, [products, activeCategory]);

  const packageSummaries = useMemo(
    () =>
      storePackages.map((storePackage) => {
        const packageName = `${company?.shortName || "Company"} ${storePackage.title}`;
        const items = buildPackageItems(storePackage, products, packageName);
        const subtotal = items.reduce(
          (sum: number, item: CartItem) => sum + Number(item.price || 0) * item.quantity,
          0
        );
        return { ...storePackage, title: packageName, items, subtotal };
      }),
    [products, company]
  );

  if (!company) {
    return (
      <main className="portal-page">
        <section className="portal-simple-state">
          <h1>Portal not found</h1>
          <Link href="/login">Back to login</Link>
        </section>
      </main>
    );
  }

  return (
    <main
      className="portal-page"
      style={{
        "--company-primary": company.primaryColor,
        "--company-secondary": company.secondaryColor,
      } as React.CSSProperties}
    >
      <section className="portal-hero">
        <div className="upz-wrap portal-hero-inner">
          <div>
            <div className="portal-eyebrow">Private Company Portal</div>
            <h1>{company.heroTitle}</h1>
            <p>{company.heroText}</p>
            <div className="portal-actions">
              <a href="#products">Order Merchandise</a>
              <a href="#assets">Brand Assets</a>
              <a href="#services">Request Marketing</a>
            </div>
          </div>

          <div className="portal-brand-card">
            <img src={company.logo} alt={`${company.name} logo`} />
            <h2>{company.name}</h2>
            <p>Approved materials, company merchandise, and marketing support powered by UPZ Design.</p>
          </div>
        </div>
      </section>

      <section className="portal-modules">
        <div className="upz-wrap portal-module-grid">
          {company.modules.map((module) => (
            <div key={module} className="portal-module-card">
              <span>{module}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="portal-section">
        <div className="upz-wrap">
          <div className="portal-section-heading">
            <div>
              <span>Quick Actions</span>
              <h2>Start here</h2>
            </div>
          </div>
          <div className="portal-action-grid">
            {company.featuredActions.map((action) => (
              <a href={action.href} key={action.title} className="portal-action-card">
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="packages" className="portal-section portal-dark-section">
        <div className="upz-wrap">
          <div className="portal-section-heading">
            <div>
              <span>Packages</span>
              <h2>Approved kits</h2>
            </div>
          </div>
          <div className="portal-package-grid">
            {packageSummaries.map((pack) => (
              <article key={pack.id} className="portal-package-card">
                <div className="portal-package-image">
                  {pack.items[0]?.image ? <img src={pack.items[0].image} alt={pack.title} /> : <span>Kit</span>}
                </div>
                <div>
                  <h3>{pack.title}</h3>
                  <strong>{pack.subtotal ? formatPrice(pack.subtotal) : "Build Kit"}</strong>
                  <p>{pack.items.length} approved items</p>
                  <button onClick={() => addItems(pack.items)} disabled={!pack.items.length}>Add Package</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="products" className="portal-section">
        <div className="upz-wrap">
          <div className="portal-section-heading">
            <div>
              <span>Merchandise</span>
              <h2>Approved product catalog</h2>
            </div>
            <strong>{loading ? "Loading..." : `${filteredProducts.length} products`}</strong>
          </div>

          <div className="portal-filter-row">
            {categories.map((category) => (
              <button
                key={category}
                className={activeCategory === category ? "is-active" : ""}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="portal-product-grid">
            {filteredProducts.slice(0, 12).map((product) => (
              <Link key={product.id} href={`/product/${product.id}`} className="portal-product-card">
                <img src={product.image || "/placeholder.png"} alt={product.name} />
                <div>
                  <span>{getCategory(product)}</span>
                  <h3>{company.shortName} {product.name}</h3>
                  <strong>{formatPrice(product.price)}</strong>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="assets" className="portal-section portal-assets-section">
        <div className="upz-wrap portal-assets-grid">
          <div>
            <span>Brand Assets</span>
            <h2>Everything approved in one place.</h2>
            <p>Logo files, brand colors, email signatures, presentation templates, and collateral downloads will live here.</p>
          </div>
          <div className="portal-asset-list">
            {['Logo Files', 'Brand Guide', 'Email Signature', 'PowerPoint Template', 'Business Card Template'].map((asset) => (
              <div key={asset}>{asset}<span>Coming Soon</span></div>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="portal-section portal-services-section">
        <div className="upz-wrap portal-services-grid">
          {['Property Brochure', 'Photography', 'Drone / Aerial', 'Website Landing Page', 'Window Graphics', 'Social Media Kit'].map((service) => (
            <article key={service}>
              <h3>{service}</h3>
              <p>Request this service from UPZ Design for your next campaign or company need.</p>
              <button>Request</button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
