"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok || !data?.company?.slug) {
        throw new Error(data?.error || "Invalid company access");
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("upz_company_slug", data.company.slug);
      }

      router.push(`/portal/${data.company.slug}`);
    } catch (err: any) {
      setError(err?.message || "Invalid company access. Please check your username and password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="portal-login-page">
      <section className="portal-login-hero">
        <div className="portal-login-card">
          <div className="portal-eyebrow">UPZ Client Portal</div>
          <h1>Company access</h1>
          <p>
            Log in to access curated service packages, approved company merchandise,
            brand assets, and active marketing requests.
          </p>

          <form onSubmit={handleSubmit} className="portal-login-form">
            <label>
              Username
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter company username"
                autoComplete="username"
                autoCapitalize="none"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </label>

            {error && <div className="portal-login-error">{error}</div>}

            <button type="submit" disabled={loading}>{loading ? "Checking..." : "Enter Portal"}</button>
          </form>
        </div>

        <div className="portal-login-side">
          <img src="/upz-logo.svg" alt="UPZ Design" />
          <h2>Everything your brand needs.</h2>
          <p>
            A private project, package, and merchandise center for approved marketing
            services, ready-to-request solutions, and branded materials.
          </p>
          <div className="admin-chip-grid">
            <div>Curated Packages</div>
            <div>Marketing Services</div>
            <div>Company Merchandise</div>
            <div>Active Requests</div>
          </div>
        </div>
      </section>
    </main>
  );
}
