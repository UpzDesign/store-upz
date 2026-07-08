"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const ADMIN_PASSWORD = "upzadmin";

type AdminCompany = {
  id: number;
  name: string;
  slug: string;
  shortName: string;
  logo?: string | null;
  primaryColor: string;
  secondaryColor: string;
  heroText: string;
  printfulTokenEnv?: string | null;
  portalEnabled: boolean;
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [companyError, setCompanyError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage.getItem("upz_admin") === "true") {
      setAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!authenticated) return;

    setLoadingCompanies(true);
    setCompanyError("");

    fetch("/api/admin/companies")
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load companies");
        return response.json();
      })
      .then((data) => setCompanies(Array.isArray(data) ? data : []))
      .catch((err) => setCompanyError(err?.message || "Unable to load companies"))
      .finally(() => setLoadingCompanies(false));
  }, [authenticated]);

  const stats = useMemo(
    () => [
      { label: "Companies", value: companies.length },
      { label: "Active Portals", value: companies.filter((company) => company.portalEnabled).length },
      { label: "Requests", value: "0" },
      { label: "Orders", value: "Stripe" },
    ],
    [companies]
  );

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.trim() !== ADMIN_PASSWORD) {
      setError("Invalid admin password.");
      return;
    }
    window.localStorage.setItem("upz_admin", "true");
    setAuthenticated(true);
    setError("");
  }

  if (!authenticated) {
    return (
      <main className="admin-page admin-login-page">
        <section className="admin-login-card">
          <div className="admin-eyebrow">UPZ Brand Portal</div>
          <h1>Admin Access</h1>
          <p>Manage company portals, brand settings, products, requests, and orders from one control center.</p>
          <form onSubmit={handleLogin} className="admin-login-form">
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter admin password"
              />
            </label>
            {error && <div className="admin-error">{error}</div>}
            <button type="submit">Enter Admin</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <section className="admin-shell">
        <aside className="admin-sidebar">
          <img src="/upz-logo.svg" alt="UPZ Design" />
          <nav>
            <a href="#dashboard">Dashboard</a>
            <a href="#companies">Companies</a>
            <a href="#products">Products</a>
            <a href="#orders">Orders</a>
            <a href="#requests">Requests</a>
            <a href="#assets">Assets</a>
            <a href="#settings">Settings</a>
          </nav>
        </aside>

        <div className="admin-main">
          <header id="dashboard" className="admin-hero">
            <div>
              <div className="admin-eyebrow">UPZ Admin</div>
              <h1>Brand Portal Control Center</h1>
              <p>Manage client portals, company branding, product catalogs, marketing requests, and platform settings.</p>
            </div>
            <button className="admin-primary-button">+ New Company</button>
          </header>

          <section className="admin-stat-grid">
            {stats.map((stat) => (
              <article key={stat.label} className="admin-stat-card">
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </article>
            ))}
          </section>

          <section id="companies" className="admin-section">
            <div className="admin-section-heading">
              <div>
                <span>Companies</span>
                <h2>Active client portals</h2>
              </div>
            </div>

            {loadingCompanies && <p>Loading companies...</p>}
            {companyError && <p className="admin-error">{companyError}</p>}

            <div className="admin-company-grid">
              {companies.map((company) => (
                <article key={company.id} className="admin-company-card">
                  <div className="admin-company-logo" style={{ borderColor: company.primaryColor }}>
                    <img src={company.logo || "/upz-logo.svg"} alt={`${company.name} logo`} />
                  </div>
                  <div>
                    <span style={{ color: company.primaryColor }}>{company.shortName}</span>
                    <h3>{company.name}</h3>
                    <p>{company.heroText}</p>
                  </div>
                  <div className="admin-company-meta">
                    <div><strong>Slug</strong><span>{company.slug}</span></div>
                    <div><strong>Printful Env</strong><span>{company.printfulTokenEnv || `PRINTFUL_ACCESS_TOKEN_${company.slug.toUpperCase()}`}</span></div>
                    <div><strong>Status</strong><span>{company.portalEnabled ? "Active" : "Disabled"}</span></div>
                    <div><strong>Manage</strong><Link href={`/admin/company/${company.slug}`}>Company Settings</Link></div>
                    <div><strong>Portal</strong><Link href={`/portal/${company.slug}`}>Open Portal</Link></div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="products" className="admin-section admin-placeholder-grid">
            {[
              ["Products", "Sync from Printful, feature products, hide items, and assign collections."],
              ["Orders", "Stripe and Printful order tracking will appear here after fulfillment routing is finalized."],
              ["Requests", "Marketing request intake for brochures, photography, signage, websites, and campaigns."],
              ["Assets", "Upload logos, brand guides, templates, email signatures, and approved downloads."],
            ].map(([title, text]) => (
              <article key={title} className="admin-placeholder-card">
                <span>{title}</span>
                <h3>{title} Module</h3>
                <p>{text}</p>
                <button>Coming Next</button>
              </article>
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}
