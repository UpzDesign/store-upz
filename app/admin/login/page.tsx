"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function StaffLoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError("");
    const response = await fetch("/api/staff/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) return setError(data?.error || "Unable to sign in");
    const next = search.get("next");
    router.replace(next && next.startsWith("/admin") ? next : data.session.role === "admin" ? "/admin/operations" : "/admin/my-tasks");
    router.refresh();
  }

  return <main className="staff-login-page"><section className="staff-login-card"><img src="/upz-logo.svg" alt="UPZ Design"/><span>UPZ TEAM ACCESS</span><h1>Staff workspace</h1><p>Sign in to access assigned projects, production tasks, and internal operations.</p><form onSubmit={submit}><label>Email<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{error&&<div className="staff-login-error">{error}</div>}<button disabled={loading}>{loading?"Signing in...":"Sign In"}</button></form><small>Client access remains available through the separate client portal login.</small></section></main>;
}
