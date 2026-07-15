"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type MarketingRequest = {
  id: number;
  type: string;
  title: string;
  description?: string | null;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type Company = {
  name: string;
  slug: string;
  shortName: string;
  primaryColor: string;
  requests?: MarketingRequest[];
};

const STATUS_OPTIONS = ["open", "reviewing", "quoted", "approved", "in-progress", "proofing", "complete", "cancelled"];

export default function AdminRequestsPage() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const [company, setCompany] = useState<Company | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  function loadCompany() {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/admin/companies/${slug}`)
      .then((response) => {
        if (!response.ok) throw new Error("Company not found");
        return response.json();
      })
      .then((data) => setCompany(data))
      .catch((error) => setMessage(error?.message || "Unable to load requests"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCompany();
  }, [slug]);

  async function updateRequest(request: MarketingRequest, updates: Partial<MarketingRequest>) {
    setMessage("");
    try {
      const response = await fetch(`/api/admin/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...request, ...updates }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Unable to update request");
      setCompany((current) => current ? { ...current, requests: (current.requests || []).map((item) => item.id === request.id ? data : item) } : current);
      setMessage("Request updated.");
    } catch (error: any) {
      setMessage(error?.message || "Unable to update request");
    }
  }

  async function deleteRequest(request: MarketingRequest) {
    if (!window.confirm(`Delete request ${request.title}?`)) return;
    setMessage("");
    try {
      const response = await fetch(`/api/admin/requests/${request.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Unable to delete request");
      setCompany((current) => current ? { ...current, requests: (current.requests || []).filter((item) => item.id !== request.id) } : current);
      setMessage("Request deleted.");
    } catch (error: any) {
      setMessage(error?.message || "Unable to delete request");
    }
  }

  if (loading) return <main className="admin-page"><section className="admin-simple-state"><h1>Loading requests...</h1></section></main>;
  if (!company) return <main className="admin-page"><section className="admin-simple-state"><Link href="/admin">← Back to Admin</Link><h1>Company not found</h1></section></main>;

  const requests = company.requests || [];

  return (
    <main className="admin-page">
      <section className="admin-company-detail">
        <div className="admin-detail-topbar"><Link href={`/admin/company/${company.slug}`}>← Back to {company.name}</Link><Link href={`/portal/${company.slug}`}>Open Portal</Link></div>
        <header className="admin-detail-hero"><div className="admin-detail-logo" style={{ borderColor: company.primaryColor }}><span>{company.shortName}</span></div><div><div className="admin-eyebrow">Project Requests</div><h1>{company.shortName} Requests</h1><p>Review incoming client opportunities, update status, and track each request from inquiry through completion.</p></div></header>

        <section className="admin-section">
          <div className="admin-section-heading"><div><span>Requests</span><h2>{requests.length} total</h2></div></div>
          {message && <p className="admin-error">{message}</p>}
          <div className="admin-request-list">
            {requests.length === 0 ? <p>No project requests have been submitted yet.</p> : requests.map((request) => <article key={request.id} className="admin-request-card"><div className="admin-request-card-head"><div><span>{request.type}</span><h3>{request.title}</h3></div><small>{new Date(request.createdAt).toLocaleDateString()}</small></div>{request.description && <pre>{request.description}</pre>}<div className="admin-request-controls"><label>Status<select value={request.status} onChange={(event) => updateRequest(request, { status: event.target.value })}>{STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}</select></label><label>Priority<select value={request.priority} onChange={(event) => updateRequest(request, { priority: event.target.value })}><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label><button onClick={() => deleteRequest(request)}>Delete</button></div></article>)}
          </div>
        </section>
      </section>
    </main>
  );
}
