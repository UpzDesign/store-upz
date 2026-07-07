"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { companies } from "@/lib/companies";

export default function LoginPage() {
  const router = useRouter();
  const [companySlug, setCompanySlug] = useState(companies[0]?.slug || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const company = companies.find((item) => item.slug === companySlug);

    if (!company || password !== company.password) {
      setError("Invalid company access. Please check your login details.");
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem("upz_company_slug", company.slug);
    }

    router.push(`/portal/${company.slug}`);
  }

  return (
    <main className="portal-login-page">
      <section className="portal-login-hero">
        <div className="portal-login-card">
          <div className="portal-eyebrow">UPZ Brand Portal</div>
          <h1>Company access</h1>
          <p>
            Log in to access your approved company merchandise, broker packages,
            brand assets, and marketing requests.
          </p>

          <form onSubmit={handleSubmit} className="portal-login-form">
            <label>
              Company
              <select value={companySlug} onChange={(event) => setCompanySlug(event.target.value)}>
                {companies.map((company) => (
                  <option key={company.id} value={company.slug}>{company.name}</option>
                ))}
              </select>
            </label>

            <label>
              Access Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter company password"
              />
            </label>

            {error && <div className="portal-login-error">{error}</div>}

            <button type="submit">Enter Portal</button>
          </form>

          <div className="portal-login-note">
            Demo RTL password: <strong>rtl-demo</strong>
          </div>
        </div>

        <div className="portal-login-side">
          <img src="/upz-logo.svg" alt="UPZ Design" />
          <h2>Your brand. Fully managed.</h2>
          <p>
            A private marketing and merchandise center for companies that want approved,
            ready-to-order branded materials in one place.
          </p>
        </div>
      </section>
    </main>
  );
}
