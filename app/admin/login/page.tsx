"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function StaffLoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Unable to sign in");
        return;
      }

      const next = search.get("next");
      router.replace(
        next && next.startsWith("/admin")
          ? next
          : data.session.role === "admin"
            ? "/admin/operations"
            : "/admin/my-tasks"
      );
      router.refresh();
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="staff-login-page">
      <section className="staff-login-card">
        <img src="/upz-logo.svg" alt="UPZ Design" />
        <span>UPZ TEAM ACCESS</span>
        <h1>Staff workspace</h1>
        <p>Sign in to access assigned projects, production tasks, and internal operations.</p>
        <form onSubmit={submit}>
          <label>
            Email
            <input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <div className="staff-login-error">{error}</div>}
          <button disabled={loading}>{loading ? "Signing in..." : "Sign In"}</button>
        </form>
        <small>Client access remains available through the separate client portal login.</small>
      </section>
    </main>
  );
}

export default function StaffLoginPage() {
  return (
    <Suspense fallback={<main className="staff-login-page"><section className="staff-login-card"><p>Loading staff access...</p></section></main>}>
      <StaffLoginForm />
    </Suspense>
  );
}
