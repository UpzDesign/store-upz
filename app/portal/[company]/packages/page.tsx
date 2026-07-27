"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getIntakeForm, inferProjectType } from "@/lib/intake-forms";

type CatalogItem = { id: number; title: string; itemType: string; price?: number | null; thumbnail?: string | null };
type PackageItem = { id: number; quantity: number; catalogItem?: CatalogItem | null };
type PackageOffer = { id: number; title: string; description?: string | null; featured: boolean; items: PackageItem[] };
type PortalCompany = { name:string; shortName:string; logo?:string|null; primaryColor:string; secondaryColor:string; heroTitle?:string|null; heroText?:string|null };

function money(value:number){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(value);}

export default function PortalPackagesPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = Array.isArray(params?.company) ? params.company[0] : params?.company;
  const [company, setCompany] = useState<PortalCompany | null>(null);
  const [packages, setPackages] = useState<PackageOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [requesting, setRequesting] = useState<number | null>(null);

  useEffect(() => {
    if (!companySlug) return;
    const savedSlug = window.localStorage.getItem("upz_company_slug");
    if (savedSlug !== companySlug) { router.push("/login"); return; }
    setLoading(true);
    Promise.all([
      fetch(`/api/portal/companies/${companySlug}`).then((r) => { if (!r.ok) throw new Error("Unable to load company portal"); return r.json(); }),
      fetch(`/api/portal/companies/${companySlug}/packages`).then((r) => { if (!r.ok) throw new Error("Unable to load packages"); return r.json(); }),
    ]).then(([companyData, packageData]) => {
      setCompany(companyData);
      setPackages(Array.isArray(packageData) ? packageData : []);
    }).catch((error) => setToast({ type: "error", message: error instanceof Error ? error.message : "Unable to load packages" }))
      .finally(() => setLoading(false));
  }, [companySlug, router]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function requestPackage(pkg: PackageOffer) {
    if (!companySlug) return;
    setRequesting(pkg.id);
    setToast(null);
    const included = pkg.items.map((item) => `${item.quantity} × ${item.catalogItem?.title || "Catalog Item"}`).join("\n");
    const searchableText = `${pkg.title} ${pkg.description || ""} ${included}`;
    const projectTypeSlug = inferProjectType(searchableText);
    const projectType = getIntakeForm(projectTypeSlug);

    try {
      const response = await fetch(`/api/portal/companies/${companySlug}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pkg.id,
          packageTitle: pkg.title,
          service: projectType.name,
          serviceSlug: projectType.slug,
          projectTitle: pkg.title,
          priority: "normal",
          answers: { package: pkg.title, projectType: projectType.name, includedItems: included, requestSource: "Client package page" },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Unable to request package");
      setToast({ type: "success", message: `${pkg.title} was submitted for review.` });
    } catch (error: unknown) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Unable to request package" });
    } finally {
      setRequesting(null);
    }
  }

  const style = {"--company-primary":company?.primaryColor||"#edbf2d","--company-secondary":company?.secondaryColor||"#010101"} as React.CSSProperties;

  return (
    <main className="portal-page portal-packages-page" style={style}>
      {toast && <div className={`upz-toast ${toast.type}`} role={toast.type === "error" ? "alert" : "status"}><strong>{toast.type === "success" ? "✓" : "!"}</strong><span>{toast.message}</span></div>}
      <section className="portal-hero portal-packages-hero">
        <div className="upz-wrap portal-hero-inner">
          <div>
            <div className="portal-eyebrow">{company?.shortName || "Client"} Portal</div>
            <h1>Project Packages</h1>
            <p>Curated combinations of services, production, and deliverables built for common project needs.</p>
            <div className="portal-actions"><Link href={`/portal/${companySlug}`}>← Back to Portal</Link><Link href={`/portal/${companySlug}/request/general`}>Start Custom Request</Link></div>
          </div>
          <div className="portal-brand-card">
            <img src={company?.logo||"/upz-logo.svg"} alt={`${company?.name||"Company"} logo`}/>
            <h2>{company?.name||"Company Packages"}</h2>
            <p>Review approved package options and submit the right solution directly to your project queue.</p>
          </div>
        </div>
      </section>
      <section className="portal-section portal-featured-packages">
        <div className="upz-wrap">
          <div className="portal-section-heading"><div><span>Curated Solutions</span><h2>Available packages</h2><p>Each package can be reviewed by UPZ and adjusted to the exact project scope.</p></div><strong>{loading?"Loading...":`${packages.length} available`}</strong></div>
          {!loading&&!packages.length&&<div className="portal-empty-service"><h3>No packages available</h3><p>Start a custom request and we will build the right scope for your project.</p></div>}
          <div className="portal-package-offer-grid">
            {packages.map((pkg) => {
              const total = pkg.items.reduce((sum, item) => sum + Number(item.catalogItem?.price || 0) * item.quantity, 0);
              const projectType = getIntakeForm(inferProjectType(`${pkg.title} ${pkg.description || ""} ${pkg.items.map((item) => item.catalogItem?.title || "").join(" ")}`));
              return <article key={pkg.id} className={pkg.featured ? "is-featured" : ""}>
                <span>{pkg.featured ? "Recommended Package" : "Project Package"}</span>
                <h2>{pkg.title}</h2>
                <p>{pkg.description||"A curated combination of services and deliverables for this project type."}</p>
                <div className="portal-package-type">Includes {projectType.name.toLowerCase()} support</div>
                <ul>{pkg.items.map((item) => <li key={item.id}><strong>{item.quantity}×</strong> {item.catalogItem?.title}</li>)}</ul>
                <div><strong>{total > 0 ? `Starting at ${money(total)}` : "Custom Quote"}</strong><button disabled={requesting === pkg.id} onClick={() => requestPackage(pkg)}>{requesting === pkg.id ? "Submitting..." : "Request Package"}</button></div>
              </article>;
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
