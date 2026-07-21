"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getIntakeForm, INTAKE_FORMS, type IntakeField } from "@/lib/intake-forms";

function initialValues(fields: IntakeField[]) {
  return fields.reduce<Record<string, string | boolean>>((values, field) => {
    values[field.key] = field.type === "checkbox" ? false : field.key === "priority" ? "normal" : "";
    return values;
  }, {});
}

export default function ProjectRequestPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = Array.isArray(params?.company) ? params.company[0] : params?.company;
  const serviceSlug = Array.isArray(params?.service) ? params.service[0] : params?.service;
  const definition = useMemo(() => getIntakeForm(serviceSlug), [serviceSlug]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<Record<string, string | boolean>>(() => initialValues(definition.fields));

  useEffect(() => {
    setForm(initialValues(definition.fields));
    setSubmitted(false);
    setToast(null);
  }, [definition]);

  useEffect(() => {
    if (!companySlug) return;
    const savedSlug = window.localStorage.getItem("upz_company_slug");
    if (savedSlug !== companySlug) router.push("/login");
  }, [companySlug, router]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function updateForm(field: string, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companySlug) return;
    setSaving(true);
    setToast(null);

    try {
      const response = await fetch(`/api/portal/companies/${companySlug}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: definition.name,
          serviceSlug: definition.slug,
          projectTitle: form.projectTitle,
          priority: form.priority || "normal",
          answers: form,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Unable to submit project request");
      setSubmitted(true);
      setToast({ type: "success", message: "Your project request was submitted successfully." });
    } catch (error: unknown) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Unable to submit project request" });
    } finally {
      setSaving(false);
    }
  }

  function renderField(field: IntakeField) {
    const value = form[field.key] ?? "";
    const className = field.wide ? "portal-request-wide" : undefined;

    if (field.type === "textarea") {
      return <label key={field.key} className={className}>{field.label}<textarea value={String(value)} onChange={(event) => updateForm(field.key, event.target.value)} placeholder={field.placeholder} required={field.required} /></label>;
    }

    if (field.type === "select") {
      return <label key={field.key} className={className}>{field.label}<select value={String(value)} onChange={(event) => updateForm(field.key, event.target.value)} required={field.required}><option value="">Select an option</option>{field.options?.map((option) => <option key={option} value={option.toLowerCase()}>{option}</option>)}</select></label>;
    }

    if (field.type === "checkbox") {
      return <label key={field.key} className={`portal-request-checkbox ${className || ""}`}><input type="checkbox" checked={Boolean(value)} onChange={(event) => updateForm(field.key, event.target.checked)} /><span>{field.label}</span></label>;
    }

    return <label key={field.key} className={className}>{field.label}<input type={field.type} value={String(value)} onChange={(event) => updateForm(field.key, event.target.value)} placeholder={field.placeholder} required={field.required} /></label>;
  }

  if (submitted) {
    return (
      <main className="portal-page portal-request-page">
        {toast && <div className={`upz-toast ${toast.type}`} role="status"><strong>{toast.type === "success" ? "✓" : "!"}</strong><span>{toast.message}</span></div>}
        <section className="portal-request-success">
          <span>Request received</span>
          <h1>Thank you.</h1>
          <p>Your {definition.name.toLowerCase()} request is now in the UPZ Design project queue. We will review the details and follow up with scope, timing, and next steps.</p>
          <div className="portal-request-success-actions"><Link href={`/portal/${companySlug}`}>Return to Portal</Link><button type="button" onClick={() => { setForm(initialValues(definition.fields)); setSubmitted(false); }}>Submit Another</button></div>
        </section>
      </main>
    );
  }

  return (
    <main className="portal-page portal-request-page">
      {toast && <div className={`upz-toast ${toast.type}`} role="alert"><strong>{toast.type === "success" ? "✓" : "!"}</strong><span>{toast.message}</span></div>}
      <section className="portal-request-wrap">
        <div className="portal-request-intro">
          <Link href={`/portal/${companySlug}`}>← Back to Portal</Link>
          <span>Start a Project</span>
          <h1>{definition.name}</h1>
          <p>{definition.description}</p>
          <nav className="portal-project-type-list" aria-label="Project types">
            {Object.values(INTAKE_FORMS).map((item) => <Link key={item.slug} className={item.slug === definition.slug ? "active" : ""} href={`/portal/${companySlug}/request/${item.slug}`}>{item.name}</Link>)}
          </nav>
        </div>

        <form className="portal-request-form" onSubmit={submitRequest}>
          <div className="portal-request-form-heading portal-request-wide"><span>{definition.name}</span><h2>Project intake</h2><p>Fields marked as required help us prepare an accurate scope and timeline.</p></div>
          {definition.fields.map(renderField)}
          <div className="portal-request-actions"><button type="submit" disabled={saving}>{saving ? "Submitting..." : "Submit Project Request"}</button></div>
        </form>
      </section>
    </main>
  );
}
