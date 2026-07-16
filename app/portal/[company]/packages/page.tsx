"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type CatalogItem = { id: number; title: string; itemType: string; price?: number | null; thumbnail?: string | null };
type PackageItem = { id: number; quantity: number; catalogItem?: CatalogItem | null };
type PackageOffer = { id: number; title: string; description?: string | null; featured: boolean; items: PackageItem[] };

export default function PortalPackagesPage() {
  const params = useParams();
  const router = useRouter();
  const company = Array.isArray(params?.company) ? params.company[0] : params?.company;
  const [packages, setPackages] = useState<PackageOffer[]>([]);
  const [message, setMessage] = useState("");
  const [requesting, setRequesting] = useState<number | null>(null);

  useEffect(() => {
    if (!company) return;
    const savedSlug = window.localStorage.getItem("upz_company_slug");
    if (savedSlug !== company) { router.push("/login"); return; }
    fetch(`/api/portal/companies/${company}/packages`)
      .then((r) => r.json())
      .then((data) => setPackages(Array.isArray(data) ? data : []))
      .catch(() => setMessage("Unable to load packages"));
  }, [company, router]);

  async function requestPackage(pkg: PackageOffer) {
    if (!company) return;
    setRequesting(pkg.id);
    setMessage("");
    const included = pkg.items.map((item) => `${item.quantity} × ${item.catalogItem?.title || "Catalog Item"}`).join("\n");
    try {
      const response = await fetch(`/api/portal/companies/${company}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "package",
          title: pkg.title,
          priority: "normal",
          description: `Package request: ${pkg.title}\n\nIncluded items:\n${included}`,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Unable to request package");
      setMessage(`${pkg.title} request submitted.`);
    } catch (error: any) {
      setMessage(error?.message || "Unable to request package");
    } finally {
      setRequesting(null);
    }
  }

  return (
    <main className="portal-page">
      <section className="portal-section portal-service-lead">
        <div className="upz-wrap">
          <div className="portal-detail-topbar"><Link href={`/portal/${company}`}>← Back to Portal</Link></div>
          <div className="portal-section-heading"><div><span>Curated Offers</span><h2>Packages</h2></div><strong>{packages.length} available</strong></div>
          <p>Start a complete project with a pre-built combination of UPZ services, products, and deliverables.</p>
        </div>
      </section>
      <section className="portal-section">
        <div className="upz-wrap">
          {message && <p className="portal-request-message">{message}</p>}
          <div className="portal-package-offer-grid">
            {packages.map((pkg) => {
              const total = pkg.items.reduce((sum, item) => sum + Number(item.catalogItem?.price || 0) * item.quantity, 0);
              return <article key={pkg.id} className={pkg.featured ? "is-featured" : ""}><span>{pkg.featured ? "Featured Package" : "Package"}</span><h2>{pkg.title}</h2><p>{pkg.description}</p><ul>{pkg.items.map((item) => <li key={item.id}><strong>{item.quantity}×</strong> {item.catalogItem?.title}</li>)}</ul><div><strong>{total > 0 ? `Starting at $${total.toFixed(2)}` : "Custom Quote"}</strong><button disabled={requesting === pkg.id} onClick={() => requestPackage(pkg)}>{requesting === pkg.id ? "Submitting..." : "Request Package"}</button></div></article>;
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
