import Link from "next/link";
import { INTAKE_FORMS } from "@/lib/intake-forms";

export default function AdminServicesPage(){
  const services=Object.values(INTAKE_FORMS);
  return <main className="admin-page"><section className="admin-company-detail">
    <div className="admin-detail-topbar"><Link href="/admin">← Back to Admin</Link><Link href="/admin/inbox">Open Inbox</Link></div>
    <header className="admin-detail-hero"><div className="admin-detail-logo"><span>UPZ</span></div><div><div className="admin-eyebrow">Shared Architecture</div><h1>Service Library</h1><p>Every company portal uses these shared service definitions. Update a service once and the latest intake structure is available across RTL, KSR, BX, and future client portals without recreating it.</p></div></header>
    <section className="admin-stat-grid">{[["Shared Services",services.length],["Company Duplication",0],["Global Updates","Instant"],["Overrides","Planned"]].map(([label,value])=><article className="admin-stat-card" key={String(label)}><span>{label}</span><strong>{value}</strong></article>)}</section>
    <section className="admin-section"><div className="admin-section-heading"><div><span>UPZ Library</span><h2>Reusable services</h2></div></div>
      <div className="admin-service-library-grid">{services.map((service)=><article className="admin-service-library-card" key={service.slug}><div><span>{service.slug}</span><h3>{service.name}</h3><p>{service.description}</p></div><dl><div><dt>Intake Fields</dt><dd>{service.fields.length}</dd></div><div><dt>Availability</dt><dd>All Companies</dd></div></dl><div className="admin-service-library-actions"><Link className="admin-secondary-button" href={`/portal/rtl/request/${service.slug}`}>Preview Form</Link></div></article>)}</div>
    </section>
    <section className="admin-section"><div className="admin-section-heading"><div><span>How it works</span><h2>No service copying required</h2></div></div><div className="admin-detail-grid"><article className="admin-detail-card"><span>Shared by default</span><h2>One source of truth</h2><p>Photography, signage, websites, branding, print, and other service forms are defined once in the shared library rather than stored as duplicate company records.</p></article><article className="admin-detail-card"><span>Company flexibility</span><h2>Enablement and overrides</h2><p>The current release shares the full service set across companies. Company-specific visibility and field overrides can be layered on top without duplicating the underlying service definition.</p></article></div></section>
  </section></main>;
}
