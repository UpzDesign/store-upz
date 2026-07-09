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
  featuredActions: Array<{ title: string; description: string; href: string }>;
};

type Collection = { id: number; name: string; slug: string; description?: string | null; heroImage?: string | null; active?: boolean };
type CatalogItem = {
  id: number;
  title: string;
  description?: string | null;
  itemType: string;
  sourceVendor?: string | null;
  thumbnail?: string | null;
  price?: number | null;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  collection?: Collection | null;
  product?: { id: number } | null;
};

function getItemImage(item: CatalogItem) { return item.thumbnail || "/placeholder.png"; }
function getItemLabel(item: CatalogItem) {
  if (item.sourceVendor === "printful") return "Merchandise";
  if (item.itemType === "service") return "Service";
  if (item.itemType === "digital") return "Digital";
  if (item.itemType === "asset") return "Asset";
  return "Catalog Item";
}
function buildCartItem(item: CatalogItem, company: PortalCompany): CartItem {
  return { id: `catalog-${item.id}`, productId: item.product?.id ? String(item.product.id) : undefined, name: `${company.shortName} ${item.title}`, image: getItemImage(item), price: Number(item.price || 0), quantity: 1, companySlug: company.slug, companyName: company.name };
}
function CatalogCard({ item, company, addItem }: { item: CatalogItem; company: PortalCompany; addItem: (item: CartItem) => void }) {
  return <article className="portal-product-card"><img src={getItemImage(item)} alt={item.title} /><div><span>{getItemLabel(item)} · {item.collection?.name || "Catalog"}</span><h3>{company.shortName} {item.title}</h3><strong>{formatPrice(item.price)}</strong>{item.description && <p>{item.description}</p>}{item.product?.id ? <Link href={`/portal/${company.slug}/product/${item.product.id}`}>View Product</Link> : <button onClick={() => addItem(buildCartItem(item, company))}>Add to Cart</button>}</div></article>;
}
function slugLabel(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

export default function CompanyPortalPage() {
  const params = useParams();
  const router = useRouter();
  const slug = Array.isArray(params?.company) ? params.company[0] : params?.company;
  const [company, setCompany] = useState<PortalCompany | null>(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companyError, setCompanyError] = useState("");
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (!slug) return;
    const savedSlug = window.localStorage.getItem("upz_company_slug");
    if (savedSlug !== slug) { router.push("/login"); return; }
    setCompanyLoading(true);
    setCompanyError("");
    fetch(`/api/portal/companies/${slug}`)
      .then((res) => { if (!res.ok) throw new Error("Portal not found"); return res.json(); })
      .then((data) => setCompany(data))
      .catch((err) => setCompanyError(err?.message || "Portal not found"))
      .finally(() => setCompanyLoading(false));
  }, [slug, router]);

  useEffect(() => {
    if (!company) return;
    setLoading(true);
    fetch(`/api/portal/companies/${company.slug}/catalog-items`)
      .then((res) => { if (!res.ok) throw new Error("Unable to load catalog"); return res.json(); })
      .then((data) => setCatalogItems(Array.isArray(data) ? data : []))
      .catch((error) => { console.error(error); setCatalogItems([]); })
      .finally(() => setLoading(false));
  }, [company]);

  const groupedCollections = useMemo(() => {
    const groups = new Map<string, { name: string; slug: string; description?: string | null; heroImage?: string | null; items: CatalogItem[] }>();
    catalogItems.forEach((item) => {
      const name = item.collection?.name || (item.itemType === "service" ? "Services" : item.sourceVendor === "printful" ? "Merchandise" : "General Catalog");
      const groupSlug = item.collection?.slug || slugLabel(name);
      if (!groups.has(groupSlug)) groups.set(groupSlug, { name, slug: groupSlug, description: item.collection?.description, heroImage: item.collection?.heroImage, items: [] });
      groups.get(groupSlug)?.items.push(item);
    });
    return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [catalogItems]);

  const featuredItems = useMemo(() => catalogItems.filter((item) => item.featured).slice(0, 6), [catalogItems]);

  if (companyLoading) return <main className="portal-page"><section className="portal-simple-state"><h1>Loading portal...</h1></section></main>;
  if (companyError || !company) return <main className="portal-page"><section className="portal-simple-state"><h1>Portal not found</h1><Link href="/login">Back to login</Link></section></main>;

  return (
    <main className="portal-page" style={{ "--company-primary": company.primaryColor, "--company-secondary": company.secondaryColor } as React.CSSProperties}>
      <section className="portal-hero"><div className="upz-wrap portal-hero-inner"><div><div className="portal-eyebrow">Private Company Portal</div><h1>{company.heroTitle}</h1><p>{company.heroText}</p><div className="portal-actions"><a href="#collections">Collections</a><a href="#featured">Featured</a><a href="#assets">Brand Assets</a></div></div><div className="portal-brand-card"><img src={company.logo || "/upz-logo.svg"} alt={`${company.name} logo`} /><h2>{company.name}</h2><p>Approved materials, company merchandise, and marketing support powered by UPZ Design.</p></div></div></section>
      <section className="portal-modules"><div className="upz-wrap portal-module-grid">{company.modules.map((module) => <div key={module} className="portal-module-card"><span>{module}</span></div>)}</div></section>
      <section id="collections" className="portal-section"><div className="upz-wrap"><div className="portal-section-heading"><div><span>Collections</span><h2>Browse by section</h2></div><strong>{loading ? "Loading..." : `${catalogItems.length} items`}</strong></div><div className="portal-collection-nav">{groupedCollections.map((collection) => <a key={collection.slug} href={`#collection-${collection.slug}`}>{collection.name}<span>{collection.items.length}</span></a>)}</div></div></section>
      {featuredItems.length > 0 && <section id="featured" className="portal-section portal-dark-section"><div className="upz-wrap"><div className="portal-section-heading"><div><span>Featured</span><h2>Recommended items</h2></div></div><div className="portal-product-grid">{featuredItems.map((item) => <CatalogCard key={item.id} item={item} company={company} addItem={addItem} />)}</div></div></section>}
      {groupedCollections.map((collection, index) => {
        const products = collection.items.filter((item) => item.itemType === "product" || item.sourceVendor === "printful");
        const services = collection.items.filter((item) => item.itemType === "service");
        const digital = collection.items.filter((item) => ["digital", "asset", "custom"].includes(item.itemType));
        return <section key={collection.slug} id={`collection-${collection.slug}`} className={`portal-section ${index % 2 === 1 ? "portal-soft-section" : ""}`}><div className="upz-wrap"><div className="portal-collection-hero">{collection.heroImage && <img src={collection.heroImage} alt="" />}<div><span>Collection</span><h2>{collection.name}</h2>{collection.description && <p>{collection.description}</p>}<strong>{collection.items.length} items</strong></div></div>{products.length > 0 && <><div className="portal-subheading"><span>Products</span><strong>{products.length}</strong></div><div className="portal-product-grid">{products.map((item) => <CatalogCard key={item.id} item={item} company={company} addItem={addItem} />)}</div></>}{services.length > 0 && <><div className="portal-subheading"><span>Services</span><strong>{services.length}</strong></div><div className="portal-product-grid">{services.map((item) => <CatalogCard key={item.id} item={item} company={company} addItem={addItem} />)}</div></>}{digital.length > 0 && <><div className="portal-subheading"><span>Digital / Assets</span><strong>{digital.length}</strong></div><div className="portal-product-grid">{digital.map((item) => <CatalogCard key={item.id} item={item} company={company} addItem={addItem} />)}</div></>}</div></section>;
      })}
      <section id="assets" className="portal-section portal-assets-section"><div className="upz-wrap portal-assets-grid"><div><span>Brand Assets</span><h2>Everything approved in one place.</h2><p>Logo files, brand colors, email signatures, presentation templates, and collateral downloads will live here.</p></div><div className="portal-asset-list">{["Logo Files", "Brand Guide", "Email Signature", "PowerPoint Template", "Business Card Template"].map((asset) => <div key={asset}>{asset}<span>Coming Soon</span></div>)}</div></div></section>
    </main>
  );
}
