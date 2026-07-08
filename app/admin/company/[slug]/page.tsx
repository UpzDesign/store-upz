"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { getCompanyBySlug } from "@/lib/companies";

export default function AdminCompanyPage() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const company = getCompanyBySlug(String(slug || ""));

  if (!company) {
    return (
      <main className="admin-page">
        <section className="admin-simple-state">
          <Link href="/admin">← Back to Admin</Link>
          <h1>Company not found</h1>
        </section>
      </main>
    );
  }

  const tokenEnv = `PRINTFUL_ACCESS_TOKEN_${company.slug.toUpperCase()}`;

  return (
    <main className="admin-page">
      <section className="admin-company-detail">
        <div className="admin-detail-topbar">
          <Link href="/admin">← Back to Admin</Link>
          <Link href={`/portal/${company.slug}`}>Open Portal</Link>
        </div>

        <header className="admin-detail-hero">
          <div className="admin-detail-logo" style={{ borderColor: company.primaryColor }}>
            <img src={company.logo} alt={`${company.name} logo`} />
          </div>
          <div>
            <div className="admin-eyebrow">Company Settings</div>
            <h1>{company.name}</h1>
            <p>{company.heroText}</p>
          </div>
        </header>

        <section className="admin-detail-grid">
          <article className="admin-detail-card">
            <span>Brand</span>
            <h2>Identity</h2>
            <dl>
              <div><dt>Company</dt><dd>{company.name}</dd></div>
              <div><dt>Short Name</dt><dd>{company.shortName}</dd></div>
              <div><dt>Slug</dt><dd>{company.slug}</dd></div>
              <div><dt>Primary Color</dt><dd><code>{company.primaryColor}</code></dd></div>
              <div><dt>Secondary Color</dt><dd><code>{company.secondaryColor}</code></dd></div>
              <div><dt>Logo</dt><dd>{company.logo}</dd></div>
            </dl>
          </article>

          <article className="admin-detail-card">
            <span>Access</span>
            <h2>Portal</h2>
            <dl>
              <div><dt>Login Username</dt><dd>{company.slug.toUpperCase()}</dd></div>
              <div><dt>Password</dt><dd>Configured in company settings</dd></div>
              <div><dt>Portal URL</dt><dd>/portal/{company.slug}</dd></div>
              <div><dt>Printful Token</dt><dd><code>{tokenEnv}</code></dd></div>
              <div><dt>Status</dt><dd>Active</dd></div>
            </dl>
          </article>

          <article className="admin-detail-card admin-detail-wide">
            <span>Portal Content</span>
            <h2>Modules</h2>
            <div className="admin-chip-grid">
              {company.modules.map((module) => <div key={module}>{module}</div>)}
            </div>
          </article>

          <article className="admin-detail-card admin-detail-wide">
            <span>Quick Actions</span>
            <h2>Featured Actions</h2>
            <div className="admin-action-list">
              {company.featuredActions.map((action) => (
                <div key={action.title}>
                  <strong>{action.title}</strong>
                  <p>{action.description}</p>
                  <code>{action.href}</code>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="admin-next-grid">
          {[
            ["Products", "Sync products from this company’s Printful store and choose which products are visible or featured."],
            ["Packages", "Build company-specific broker kits and onboarding packages from synced products."],
            ["Assets", "Upload logos, brand guides, templates, email signatures, and client downloads."],
            ["Requests", "View and manage project requests submitted from this client portal."],
          ].map(([title, text]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
              <button>Build Next</button>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
