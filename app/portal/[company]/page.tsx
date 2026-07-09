"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { formatPrice } from "@/lib/catalog";
import { useCartStore, type CartItem } from "@/store/cart-store";

type PortalCompany = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  heroTitle: string;
  heroText: string;
  modules: string[];
  featuredActions: Array<{
    title: string;
    description: string;
    href: string;
  }>;
};

type CatalogItem = {
  id: number;
  title: string;
  description?: string | null;
  itemType: string;
  sourceVendor?: string | null;
  sourceProductId?: string | null;
  thumbnail?: string | null;
  price?: number | null;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  collection?: {
    id: number;
    name: string;
    slug: string;
  } | null;
  product?: {
    id: number;
  } | null;
};

function getItemImage(item: CatalogItem) {
  return item.thumbnail || "/placeholder.png";
}

function getItemLabel(item: CatalogItem) {
  if (item.sourceVendor === "printful") return "Merchandise";
  if (item.itemType === "service") return "Service";
  if (item.itemType === "digital") return "Digital";
  if (item.itemType === "asset") return "Asset";
  return "Catalog Item";
}

function buildCartItem(item: CatalogItem, company: PortalCompany): CartItem {
  return {
    id: `catalog-${item.id}`,
    productId: item.product?.id ? String(item.product.id) : undefined,
    name: `${company.shortName} ${item.title}`,
    image: getItemImage(item),
    price: Number(item.price || 0),
    quantity: 1,
    companySlug: company.slug,
    companyName: company.name,
  };
}

export default function CompanyPortalPage() {
  const params = useParams();
  const router = useRouter();
  const slug = Array.isArray(params?.company) ? params.company[0] : params?.company;
  const [company, setCompany] = useState<PortalCompany | null>(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companyError, setCompanyError] = useState("");
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCollection, setActiveCollection] = useState("All");
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (!slug) return;

    const savedSlug = window.localStorage.getItem("upz_company_slug");
    if (savedSlug !== slug) {
      router.push("/login");
      return;
    }

    setCompanyLoading(true);
    setCompanyError("");

    fetch(`/api/portal/companies/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Portal not found");
        return res.json();
      })
      .then((data) => setCompany(data))
      .catch((err) => setCompanyError(err?.message || "Portal not found"))
      .finally(() => setCompanyLoading(false));
  }, [slug, router]);

  useEffect(() => {
    if (!company) return;

    setLoading(true);
    fetch(`/api/portal/companies/${company.slug}/catalog-items`)
      .then((res) => res.json())
      .then((data) => setCatalogItems(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [company]);

  const collections = useMemo(() => {
    const unique = new Map<string, string>();
    catalogItems.forEach((item) => {
      const label = item.collection?.name || "Unassigned";
      unique.set(label, label);
    });
    return ["All", ...Array.from(unique.values())];
  }, [catalogItems]);

  const filteredItems = useMemo(() => {
    if (activeCollection === "All") return catalogItems;
    return catalogItems.filter((item) => (item.collection?.name || "Unassigned") === activeCollection);
  }, [catalogItems, activeCollection]);

  const featuredItems = useMemo(
    () => catalogItems.filter((item) => item.featured).slice(0, 6),
    [catalogItems]
  );

  if (companyLoading) {
    return (
      <main className="portal-page">
        <section className="portal-simple-state">
          <h1>Loading portal...</h1>
        </section>
      </main>
    );
  }

  if (companyError || !company) {
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
              <a href="#catalog">Browse Catalog</a>
              <a href="#featured">Featured</a>
              <a href="#assets">Brand Assets</a>
            </div>
          </div>

          <div className="portal-brand-card">
            <img src={company.logo || "/upz-logo.svg"} alt={`${company.name} logo`} />
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
              <a href={action.href === "#products" ? "#catalog" : action.href} key={action.title} className="portal-action-card">
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {featuredItems.length > 0 && (
        <section id="featured" className="portal-section portal-dark-section">
          <div className="upz-wrap">
            <div className="portal-section-heading">
              <div>
                <span>Featured</span>
                <h2>Recommended items</h2>
              </div>
            </div>
            <div className="portal-product-grid">
              {featuredItems.map((item) => (
                <article key={item.id} className="portal-product-card">
                  <img src={getItemImage(item)} alt={item.title} />
                  <div>
                    <span>{getItemLabel(item)} · {item.collection?.name || "Catalog"}</span>
                    <h3>{company.shortName} {item.title}</h3>
                    <strong>{formatPrice(item.price)}</strong>
                    {item.product?.id ? (
                      <Link href={`/portal/${company.slug}/product/${item.product.id}`}>View Product</Link>
                    ) : (
                      <button onClick={() => addItem(buildCartItem(item, company))}>Add to Cart</button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="catalog" className="portal-section">
        <div className="upz-wrap">
          <div className="portal-section-heading">
            <div>
              <span>Catalog</span>
              <h2>Products & Services</h2>
            </div>
            <strong>{loading ? "Loading..." : `${filteredItems.length} items`}</strong>
          </div>

          <div className="portal-filter-row">
            {collections.map((collection) => (
              <button
                key={collection}
                className={activeCollection === collection ? "is-active" : ""}
                onClick={() => setActiveCollection(collection)}
              >
                {collection}
              </button>
            ))}
          </div>

          <div className="portal-product-grid">
            {filteredItems.map((item) => (
              <article key={item.id} className="portal-product-card">
                <img src={getItemImage(item)} alt={item.title} />
                <div>
                  <span>{getItemLabel(item)} · {item.collection?.name || "Catalog"}</span>
                  <h3>{company.shortName} {item.title}</h3>
                  <strong>{formatPrice(item.price)}</strong>
                  {item.description && <p>{item.description}</p>}
                  {item.product?.id ? (
                    <Link href={`/portal/${company.slug}/product/${item.product.id}`}>View Product</Link>
                  ) : (
                    <button onClick={() => addItem(buildCartItem(item, company))}>Add to Cart</button>
                  )}
                </div>
              </article>
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
            {["Logo Files", "Brand Guide", "Email Signature", "PowerPoint Template", "Business Card Template"].map((asset) => (
              <div key={asset}>{asset}<span>Coming Soon</span></div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
