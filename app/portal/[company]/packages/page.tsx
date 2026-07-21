"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getIntakeForm, inferProjectType } from "@/lib/intake-forms";

type CatalogItem = { id: number; title: string; itemType: string; price?: number | null; thumbnail?: string | null };
type PackageItem = { id: number; quantity: number; catalogItem?: CatalogItem | null };
type PackageOffer = { id: number; title: string; description?: string | null; featured: boolean; items: PackageItem[] };

export default function PortalPackagesPage() {
  const params = useParams();
  const router = useRouter();
  const company = Array.isArray(params?.company) ? params.company[0] : params?.company;
  const [packages, setPackages] = useState<PackageOffer[]>([]);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [requesting, setRequesting] = useState<number | null>(null);

  useEffect(() => {
    if (!company) return;
    const savedSlug = window.localStorage.getItem("upz_company_slug");
    if (savedSlug !== company) { router.push("/login"); return; }
    fetch(`/api/portal/companies/${company}/packages`)
      .then((r) => { if (!r.ok) throw new Error("Unable to load packages"); return r.json(); })
      .then((data) => setPackages(Array.isArray(data) ? data : []))
      .catch((error) => setToast({ type: "error", message: error instanceof Error ? error.message : "Unable to load packages" }));
  }, [company, router]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function requestPackage(pkg: PackageOffer) {
    if (!company) return;
    setRequesting(pkg.id);
    setToast(null);
    const included = pkg.items.map((item) => `${item.quantity} × ${item.catalogItem?.title || "Catalog Item"}`).join("\n");
    const searchableText = `${pkg.title} ${pkg.description || ""} ${included}`;
    const projectTypeSlug = inferProjectType(searchableText);
    const projectType = getIntakeForm(projectTypeSlug);

    try {
      const response = await fetch(`/api/portal/companies/${company}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pkg.id,
          packageTitle: pkg.title,
          service: projectType.name,
          serviceSlug: projectType.slug,
          projectTitle: pkg.title,
          priority: "normal",
          answers: {
            package: pkg.title,
            projectType: projectType.name,
            includedItems: included,
            requestSource: "Client package page",
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Unable to request package");
      setToast({ type: "success", message: `${pkg.title} was submitted as a ${projectType.name} request.` });
    } catch (error: unknown) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Unable to request package" });
    } finally {
      setRequesting(null);
    }
  }

  return (
    <main className="portal-page">
      {toast && <div className={`upz-toast ${toast.type}`} role={toast.type === "error" ? "alert" : "status"}><strong>{toast.type === "success" ? "✓" : "!"}</strong><span>{toast.message}</span></div>}
      <section className="portal-section portal-service-lead">
        <div className="upz-wrap">
          <div className="portal-detail-topbar"><Link href={`/portal/${company}`}>← Back to Portal</Link></div>
          <div className="portal-section-heading"><div><span>Curated Offers</span><h2>Packages</h2></div><strong>{packages.length} available</strong></div>
          <p>Start a complete project with a pre-built combination of UPZ services, products, and deliverables.</p>
        </div>
      </section>
      <section className="portal-section">
        <div className="upz-wrap">
          <div className="portal-package-offer-grid">
            {packages.map((pkg) => {
              const total = pkg.items.reduce((sum, item) => sum + Number(item.catalogItem?.price || 0) * item.quantity, 0);
              const projectType = getIntakeForm(inferProjectType(`${pkg.title} ${pkg.description || ""} ${pkg.items.map((item) => item.catalogItem?.title || "").join(" ")}`));
              return <article key={pkg.id} className={pkg.featured ? "is-featured" : ""}><span>{pkg.featured ? "Featured Package" : "Package"}</span><div className="portal-package-type">Creates a {projectType.name} request</div><h2>{pkg.title}</h2><p>{pkg.description}</p><ul>{pkg.items.map((item) => <li key={item.id}><strong>{item.quantity}×</strong> {item.catalogItem?.title}</li>)}</ul><div><strong>{total > 0 ? `Starting at $${total.toFixed(2)}` : "Custom Quote"}</strong><button disabled={requesting === pkg.id} onClick={() => requestPackage(pkg)}>{requesting === pkg.id ? "Submitting..." : "Request Package"}</button></div></article>;
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
