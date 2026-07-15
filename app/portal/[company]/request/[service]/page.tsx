"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const SERVICE_NAMES: Record<string, string> = {
  signage: "Signage, Print & Installation",
  brochure: "Brochure & Marketing Design",
  photography: "Photography & Media",
  web: "Web Development",
  general: "General Marketing Request",
};

const SERVICE_DELIVERABLES: Record<string, string> = {
  signage: "Window graphics, storefront vinyl, site signage, banners, printed materials, installation",
  brochure: "Property brochure, flyer, presentation deck, map, floor plan layout, email campaign graphics",
  photography: "Interior photography, exterior photography, drone, video, 360 tour, virtual staging",
  web: "Property website, landing page, broker page, listing system, analytics, lead forms",
  general: "Describe the marketing, design, print, photography, or web support you need",
};

export default function ProjectRequestPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = Array.isArray(params?.company) ? params.company[0] : params?.company;
  const serviceSlug = Array.isArray(params?.service) ? params.service[0] : params?.service;
  const serviceName = useMemo(() => SERVICE_NAMES[String(serviceSlug || "general")] || String(serviceSlug || "General Request").replace(/-/g, " "), [serviceSlug]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    projectTitle: "",
    contactName: "",
    contactEmail: "",
    propertyAddress: "",
    deadline: "",
    budget: "",
    deliverables: SERVICE_DELIVERABLES[String(serviceSlug || "general")] || "",
    priority: "normal",
    notes: "",
  });

  useEffect(() => {
    if (!companySlug) return;
    const savedSlug = window.localStorage.getItem("upz_company_slug");
    if (savedSlug !== companySlug) router.push("/login");
  }, [companySlug, router]);

  function updateForm(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companySlug) return;
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/portal/companies/${companySlug}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, service: serviceName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Unable to submit project request");
      setSubmitted(true);
      setMessage("Your project request has been submitted to UPZ Design.");
    } catch (error: any) {
      setMessage(error?.message || "Unable to submit project request");
    } finally {
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <main className="portal-page portal-request-page">
        <section className="portal-request-success">
          <span>Request received</span>
          <h1>Thank you.</h1>
          <p>{message}</p>
          <Link href={`/portal/${companySlug}`}>Return to Portal</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="portal-page portal-request-page">
      <section className="portal-request-wrap">
        <div className="portal-request-intro">
          <Link href={`/portal/${companySlug}`}>← Back to Portal</Link>
          <span>Start a Project</span>
          <h1>{serviceName}</h1>
          <p>Tell us what you need. UPZ Design will review the request and follow up with scope, timing, and next steps.</p>
        </div>

        <form className="portal-request-form" onSubmit={submitRequest}>
          <label className="portal-request-wide">Project Title<input value={form.projectTitle} onChange={(event) => updateForm("projectTitle", event.target.value)} placeholder="625 Broadway marketing launch" required /></label>
          <label>Contact Name<input value={form.contactName} onChange={(event) => updateForm("contactName", event.target.value)} required /></label>
          <label>Email<input type="email" value={form.contactEmail} onChange={(event) => updateForm("contactEmail", event.target.value)} required /></label>
          <label className="portal-request-wide">Property / Project Address<input value={form.propertyAddress} onChange={(event) => updateForm("propertyAddress", event.target.value)} placeholder="625 Broadway, New York, NY" /></label>
          <label>Requested Deadline<input type="date" value={form.deadline} onChange={(event) => updateForm("deadline", event.target.value)} /></label>
          <label>Budget / Range<input value={form.budget} onChange={(event) => updateForm("budget", event.target.value)} placeholder="$1,500–$3,000 or TBD" /></label>
          <label>Priority<select value={form.priority} onChange={(event) => updateForm("priority", event.target.value)}><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
          <label className="portal-request-wide">Requested Deliverables<textarea value={form.deliverables} onChange={(event) => updateForm("deliverables", event.target.value)} /></label>
          <label className="portal-request-wide">Project Notes<textarea value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} placeholder="Share goals, dimensions, quantities, existing files, brand requirements, or anything else we should know." /></label>
          <div className="portal-request-actions"><button type="submit" disabled={saving}>{saving ? "Submitting..." : "Submit Project Request"}</button>{message && <span>{message}</span>}</div>
        </form>
      </section>
    </main>
  );
}
