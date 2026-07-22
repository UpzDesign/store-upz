"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type Task = { id: number; title: string; description?: string | null; status: string; dueDate?: string | null; sortOrder: number };
type WorkOrder = {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  budget?: number | null;
  dueDate?: string | null;
  updatedAt: string;
  progress: number;
  tasks: Task[];
  notes: Array<{ id: number; body: string; author?: string | null; createdAt: string }>;
  activities: Array<{ id: number; message: string; actor?: string | null; createdAt: string }>;
};
type Engagement = {
  id: number;
  name: string;
  slug: string;
  type: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  description?: string | null;
  status: string;
  budget?: number | null;
  updatedAt: string;
  progress: number;
  activeWorkOrders: number;
  workOrders: WorkOrder[];
  assets: Array<{ id: number; title: string; category: string; fileUrl?: string | null }>;
};
type Company = { name: string; shortName: string; logo?: string | null; primaryColor: string; secondaryColor: string };

function taskState(status: string) {
  if (status === "complete") return "complete";
  if (status === "in_progress") return "current";
  return "upcoming";
}

function engagementLocation(engagement: Engagement) {
  return [engagement.address, engagement.city, engagement.state, engagement.postalCode].filter(Boolean).join(", ");
}

export default function ClientProjectsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = Array.isArray(params?.company) ? params.company[0] : params?.company;
  const [company, setCompany] = useState<Company | null>(null);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [openEngagement, setOpenEngagement] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    const savedSlug = window.localStorage.getItem("upz_company_slug");
    if (savedSlug !== slug) {
      router.push("/login");
      return;
    }
    Promise.all([
      fetch(`/api/portal/companies/${slug}`).then((res) => (res.ok ? res.json() : null)),
      fetch(`/api/portal/companies/${slug}/projects`, { cache: "no-store" }).then((res) => {
        if (!res.ok) throw new Error("Unable to load workspaces");
        return res.json();
      }),
    ])
      .then(([companyData, engagementData]) => {
        setCompany(companyData);
        const next = Array.isArray(engagementData) ? engagementData : [];
        setEngagements(next);
        if (next.length) setOpenEngagement(next[0].id);
      })
      .catch((err) => setError(err?.message || "Unable to load workspaces"))
      .finally(() => setLoading(false));
  }, [slug, router]);

  const style = {
    "--company-primary": company?.primaryColor || "#edbf2d",
    "--company-secondary": company?.secondaryColor || "#010101",
  } as React.CSSProperties;

  return (
    <main className="portal-page client-projects-page workflow-projects-page engagement-workspaces-page" style={style}>
      <section className="client-projects-wrap">
        <div className="client-projects-topbar">
          <Link href={`/portal/${slug}`}>← Back to Workspace</Link>
          {company?.logo && <img src={company.logo} alt={`${company.name} logo`} />}
        </div>

        <header className="client-projects-hero">
          <span>{company?.shortName || "Client"} Workspace</span>
          <h1>Properties &amp; Campaigns</h1>
          <p>Manage every service, deliverable, and update under one shared workspace.</p>
        </header>

        {loading && <p>Loading workspaces...</p>}
        {error && <p>{error}</p>}
        {!loading && !error && engagements.length === 0 && (
          <div className="client-project-empty">
            <h2>No active workspaces yet</h2>
            <p>Your first service request will create a property or campaign workspace automatically.</p>
          </div>
        )}

        <div className="engagement-grid">
          {engagements.map((engagement) => {
            const expanded = openEngagement === engagement.id;
            const location = engagementLocation(engagement);
            return (
              <article key={engagement.id} className={`engagement-card ${expanded ? "is-open" : ""}`}>
                <button className="engagement-summary" type="button" onClick={() => setOpenEngagement(expanded ? null : engagement.id)}>
                  <div className="engagement-summary-copy">
                    <span>{engagement.type === "property" ? "Property Workspace" : "Campaign Workspace"}</span>
                    <h2>{engagement.name}</h2>
                    {location && <p>{location}</p>}
                  </div>
                  <div className="engagement-summary-stats">
                    <div><small>Active</small><strong>{engagement.activeWorkOrders}</strong></div>
                    <div><small>Services</small><strong>{engagement.workOrders.length}</strong></div>
                    <div><small>Progress</small><strong>{engagement.progress}%</strong></div>
                    <i aria-hidden="true">{expanded ? "−" : "+"}</i>
                  </div>
                </button>

                <div className="engagement-progress-track"><i style={{ width: `${engagement.progress}%` }} /></div>

                {expanded && (
                  <div className="engagement-body">
                    <div className="engagement-body-head">
                      <div>
                        <span>Work Orders</span>
                        <h3>Services for {engagement.name}</h3>
                      </div>
                      <Link href={`/portal/${slug}/request?engagementId=${engagement.id}&engagementName=${encodeURIComponent(engagement.name)}`}>
                        + Request another service
                      </Link>
                    </div>

                    {engagement.workOrders.length === 0 && <p>No services have been added to this workspace yet.</p>}
                    <div className="client-project-list engagement-work-order-list">
                      {engagement.workOrders.map((project) => (
                        <article key={project.id} className="client-project-card workflow-project-card engagement-work-order-card">
                          <div className="client-project-card-head">
                            <div><span>{project.status}</span><h2>{project.title}</h2></div>
                            <em>{project.priority} priority</em>
                          </div>
                          {project.description && <p>{project.description}</p>}
                          <div className="workflow-progress-head"><strong>Work order progress</strong><span>{project.progress}%</span></div>
                          <div className="workflow-progress-track"><i style={{ width: `${project.progress}%` }} /></div>
                          <div className="client-project-meta">
                            <div><small>Due Date</small><strong>{project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "To be confirmed"}</strong></div>
                            <div><small>Last Updated</small><strong>{new Date(project.updatedAt).toLocaleDateString()}</strong></div>
                          </div>
                          {project.tasks.length > 0 && (
                            <section className="workflow-timeline">
                              <h3>Production workflow</h3>
                              <div>
                                {project.tasks.map((task, index) => (
                                  <article key={task.id} className={`workflow-stage ${taskState(task.status)}`}>
                                    <span>{task.status === "complete" ? "✓" : index + 1}</span>
                                    <div>
                                      <strong>{task.title}</strong>
                                      {task.description && <p>{task.description}</p>}
                                      {task.dueDate && <small>{task.status === "complete" ? "Completed" : "Target"}: {new Date(task.dueDate).toLocaleDateString()}</small>}
                                    </div>
                                  </article>
                                ))}
                              </div>
                            </section>
                          )}
                          {project.notes.length > 0 && (
                            <section className="client-project-messages">
                              <h3>Latest Messages</h3>
                              {project.notes.map((note) => (
                                <article key={note.id}>
                                  <p>{note.body}</p>
                                  <small>{note.author || "UPZ Design"} · {new Date(note.createdAt).toLocaleString()}</small>
                                </article>
                              ))}
                            </section>
                          )}
                        </article>
                      ))}
                    </div>

                    {engagement.assets.length > 0 && (
                      <section className="engagement-assets-preview">
                        <div><span>Shared Assets</span><h3>Available across every work order</h3></div>
                        <strong>{engagement.assets.length} files</strong>
                      </section>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
