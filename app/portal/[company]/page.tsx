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

type ServiceFocus = {
  key: string;
  title: string;
  text: string;
  keywords: string[];
};

type ServiceBucket = ServiceFocus & {
  items: CatalogItem[];
};

const SERVICE_FOCUS: ServiceFocus[] = [
  { key: "signage", title: "Signage, Print & Installation", text: "Storefront vinyl, window graphics, site signage, printed collateral, and installation coordination.", keywords: ["sign", "vinyl", "window", "print", "installation", "install", "graphic", "banner", "storefront"] },
  { key: "brochure", title: "Brochure & Marketing Design", text: "Property brochures, flyers, pitch materials, offering decks, maps, and campaign-ready collateral.", keywords: ["brochure", "flyer", "marketing", "deck", "map", "collateral", "presentation"] },
  { key: "photography", title: "Photography & Media", text: "Interior, exterior, drone, video, 360 tours, virtual staging, and launch media for listings.", keywords: ["photo", "photography", "drone", "video", "tour", "360", "staging", "media", "render"] },
  { key: "web", title: "Web Development", text: "Property websites, landing pages, campaign pages, listing systems, analytics, and lead forms.", keywords: ["web", "website", "landing", "seo", "analytics", "form", "development", "digital"] },
];

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
function itemMatches(item: CatalogItem, keywords: string[]) {
  const haystack = `${item.title} ${item.description || ""} ${item.collection?.name || ""}`.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword));
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

  const serviceItems = useMemo(() => catalogItems.filter((item) => item.itemType === "service"), [catalogItems]);
  const merchandiseItems = useMemo(() => catalogItems.filter((item) => item.itemType === "product" || item.sourceVendor === "printful"), [catalogItems]);
  const digitalItems = useMemo(() => catalogItems.filter((item) => ["digital", "asset", "custom"].includes(item.itemType)), [catalogItems]);
  const featuredServices = useMemo(() => serviceItems.filter((item) => item.featured).slice(0, 6), [serviceItems]);
  const serviceBuckets = useMemo<ServiceBucket[]>(() => SERVICE_FOCUS.map((bucket) => ({ ...bucket, items: serviceItems.filter((item) => itemMatches(item, bucket.keywords)) })), [serviceItems]);
  const otherServices = useMemo(() => serviceItems.filter((item) => !SERVICE_FOCUS.some((bucket) => itemMatches(item, bucket.keywords))), [serviceItems]);

  const groupedMerchandise = useMemo(() => {
    const groups = new Map<string, { name: string; slug: string; description?: string | null; heroImage?: string | null; items: CatalogItem[] }>();
    merchandiseItems.forEach((item) => {
      const name = item.collection?.name || "Merchandise";
      const groupSlug = item.collection?.slug || slugLabel(name);
      if (!groups.has(groupSlug)) groups.set(groupSlug, { name, slug: groupSlug, description: item.collection?.description, heroImage: item.collection?.heroImage, items: [] });
      groups.get(groupSlug)?.items.push(item);
    });
    return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [merchandiseItems]);

  if (companyLoading) return <main className="portal-page"><section className="portal-simple-state"><h1>Loading portal...</h1></section></main>;
  if (companyError || !company) return <main className="portal-page"><section className="portal-simple-state"><h1>Portal not found</h1><Link href="/login">Back to login</Link></section></main>;

  return (
    <main className="portal-page" style={{ "--company-primary": company.primaryColor, "--company-secondary": company.secondaryColor } as React.CSSProperties}>
      <section className="portal-hero"><div className="upz-wrap portal-hero-inner"><div><div className="portal-eyebrow">Private Company Portal</div><h1>{company.heroTitle}</h1><p>{company.heroText}</p><div className="portal-actions"><a href="#services">Request Services</a><a href="#signage">Signage & Print</a><a href="#merchandise">Merchandise</a></div></div><div className="portal-brand-card"><img src={company.logo || "/upz-logo.svg"} alt={`${company.name} logo`} /><h2>{company.name}</h2><p>Approved marketing services, creative requests, print production, and company merchandise powered by UPZ Design.</p></div></div></section>
      <section className="portal-modules"><div className="upz-wrap portal-module-grid">{[{ label: "Signage & Print", href: "#signage" }, { label: "Photography", href: "#photography" }, { label: "Brochure Design", href: "#brochure" }, { label: "Web Development", href: "#web" }, { label: "Merchandise", href: "#merchandise" }, { label: "Brand Assets", href: "#brand-assets" }].map((module) => <a key={module.label} href={module.href} className="portal-module-card"><span>{module.label}</span></a>)}</div></section>

      <section id="services" className="portal-section portal-service-lead"><div className="upz-wrap"><div className="portal-section-heading"><div><span>Start a project</span><h2>Marketing services first</h2></div><strong>{loading ? "Loading..." : `${serviceItems.length} services`}</strong></div><div className="portal-service-priority-grid">{serviceBuckets.map((bucket) => <a key={bucket.key} href={`#${bucket.key}`}><span>{bucket.items.length} available</span><h3>{bucket.title}</h3><p>{bucket.text}</p></a>)}</div></div></section>

      {featuredServices.length > 0 && <section className="portal-section portal-dark-section"><div className="upz-wrap"><div className="portal-section-heading"><div><span>Featured Services</span><h2>Recommended project starters</h2></div></div><div className="portal-product-grid">{featuredServices.map((item) => <CatalogCard key={item.id} item={item} company={company} addItem={addItem} />)}</div></div></section>}

      {serviceBuckets.map((bucket, index) => <section key={bucket.key} id={bucket.key} className={`portal-section ${index % 2 === 0 ? "portal-soft-section" : ""}`}><div className="upz-wrap"><div className="portal-collection-hero portal-service-hero"><div><span>High-value service</span><h2>{bucket.title}</h2><p>{bucket.text}</p><strong>{bucket.items.length} services</strong></div></div>{bucket.items.length ? <div className="portal-product-grid">{bucket.items.map((item) => <CatalogCard key={item.id} item={item} company={company} addItem={addItem} />)}</div> : <div className="portal-empty-service"><h3>{bucket.title}</h3><p>Add matching catalog services in admin to populate this section for clients.</p></div>}</div></section>)}

      {otherServices.length > 0 && <section className="portal-section"><div className="upz-wrap"><div className="portal-section-heading"><div><span>Additional Services</span><h2>More ways UPZ can help</h2></div><strong>{otherServices.length} services</strong></div><div className="portal-product-grid">{otherServices.map((item) => <CatalogCard key={item.id} item={item} company={company} addItem={addItem} />)}</div></div></section>}

      <section id="merchandise" className="portal-section portal-merch-section"><div className="upz-wrap"><div className="portal-section-heading"><div><span>Merchandise</span><h2>Company products & branded items</h2></div><strong>{merchandiseItems.length} items</strong></div><div className="portal-collection-nav">{groupedMerchandise.map((collection) => <a key={collection.slug} href={`#merch-${collection.slug}`}>{collection.name}<span>{collection.items.length}</span></a>)}</div></div></section>

      {groupedMerchandise.map((collection, index) => <section key={collection.slug} id={`merch-${collection.slug}`} className={`portal-section ${index % 2 === 1 ? "portal-soft-section" : ""}`}><div className="upz-wrap"><div className="portal-collection-hero">{collection.heroImage && <img src={collection.heroImage} alt="" />}<div><span>Merchandise Collection</span><h2>{collection.name}</h2>{collection.description && <p>{collection.description}</p>}<strong>{collection.items.length} items</strong></div></div><div className="portal-product-grid">{collection.items.map((item) => <CatalogCard key={item.id} item={item} company={company} addItem={addItem} />)}</div></div></section>)}

      {digitalItems.length > 0 && <section id="brand-assets" className="portal-section"><div className="upz-wrap"><div className="portal-section-heading"><div><span>Digital / Assets</span><h2>Downloads and templates</h2></div><strong>{digitalItems.length} items</strong></div><div className="portal-product-grid">{digitalItems.map((item) => <CatalogCard key={item.id} item={item} company={company} addItem={addItem} />)}</div></div></section>}
      <section id="assets" className="portal-section portal-assets-section"><div className="upz-wrap portal-assets-grid"><div><span>Brand Assets</span><h2>Everything approved in one place.</h2><p>Logo files, brand colors, email signatures, presentation templates, and collateral downloads will live here.</p></div><div className="portal-asset-list">{["Logo Files", "Brand Guide", "Email Signature", "PowerPoint Template", "Business Card Template"].map((asset) => <div key={asset}>{asset}<span>Coming Soon</span></div>)}</div></div></section>
    </main>
  );
}
