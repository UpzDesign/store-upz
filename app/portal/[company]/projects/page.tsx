"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Task = {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  dueDate?: string | null;
  sortOrder: number;
};

type Note = {
  id: number;
  body: string;
  author?: string | null;
  createdAt: string;
};

type WorkOrder = {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: string | null;
  updatedAt: string;
  progress: number;
  tasks: Task[];
  notes: Note[];
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
  updatedAt: string;
  progress: number;
  activeWorkOrders: number;
  workOrders: WorkOrder[];
  assets: Array<{
    id: number;
    title: string;
    category: string;
    fileUrl?: string | null;
  }>;
};

type Company = {
  name: string;
  shortName: string;
  logo?: string | null;
  primaryColor: string;
  secondaryColor: string;
};

function locationLabel(engagement: Engagement) {
  return [
    engagement.address,
    engagement.city,
    engagement.state,
    engagement.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}

function taskState(tasks: Task[], index: number) {
  const task = tasks[index];
  const complete = ["complete", "completed"].includes(task.status);
  const previousComplete =
    index === 0 || ["complete", "completed"].includes(tasks[index - 1].status);

  if (complete) return "complete";
  if (previousComplete) return "current";
  return "upcoming blocked";
}

export default function ClientProjectsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = Array.isArray(params?.company) ? params.company[0] : params?.company;

  const [company, setCompany] = useState<Company | null>(null);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [openEngagement, setOpenEngagement] = useState<number | null>(null);
  const [messageDrafts, setMessageDrafts] = useState<Record<number, string>>({});
  const [sendingProject, setSendingProject] = useState<number | null>(null);
  const [messageStatus, setMessageStatus] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProjects() {
    if (!slug) return;

    const response = await fetch(`/api/portal/companies/${slug}/projects`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Unable to load projects and campaigns");
    }

    const data = await response.json();
    const next = Array.isArray(data) ? data : [];
    setEngagements(next);

    if (openEngagement === null) {
      const hash = window.location.hash.match(/engagement-(\d+)/);
      setOpenEngagement(hash ? Number(hash[1]) : next[0]?.id || null);
    }
  }

  useEffect(() => {
    if (!slug) return;

    const savedSlug = window.localStorage.getItem("upz_company_slug");
    if (savedSlug !== slug) {
      router.push("/login");
      return;
    }

    Promise.all([
      fetch(`/api/portal/companies/${slug}`).then((response) =>
        response.ok ? response.json() : null
      ),
      fetch(`/api/portal/companies/${slug}/projects`, { cache: "no-store" }).then(
        (response) => {
          if (!response.ok) throw new Error("Unable to load projects and campaigns");
          return response.json();
        }
      ),
    ])
      .then(([companyData, projectData]) => {
        setCompany(companyData);
        const next = Array.isArray(projectData) ? projectData : [];
        setEngagements(next);
        const hash = window.location.hash.match(/engagement-(\d+)/);
        setOpenEngagement(hash ? Number(hash[1]) : next[0]?.id || null);
      })
      .catch((requestError) =>
        setError(requestError?.message || "Unable to load projects and campaigns")
      )
      .finally(() => setLoading(false));
  }, [slug, router]);

  async function sendMessage(event: FormEvent, projectId: number) {
    event.preventDefault();
    if (!slug) return;

    const message = String(messageDrafts[projectId] || "").trim();
    if (!message) return;

    setSendingProject(projectId);
    setMessageStatus((current) => ({ ...current, [projectId]: "" }));

    try {
      const response = await fetch(
        `/api/portal/companies/${slug}/projects/${projectId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        }
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Unable to send message");
      }

      setMessageDrafts((current) => ({ ...current, [projectId]: "" }));
      setMessageStatus((current) => ({
        ...current,
        [projectId]: "Message sent to UPZ Design.",
      }));
      await loadProjects();
    } catch (sendError: any) {
      setMessageStatus((current) => ({
        ...current,
        [projectId]: sendError?.message || "Unable to send message",
      }));
    } finally {
      setSendingProject(null);
    }
  }

  const style = {
    "--company-primary": company?.primaryColor || "#edbf2d",
    "--company-secondary": company?.secondaryColor || "#010101",
  } as React.CSSProperties;

  return (
    <main
      className="portal-page client-projects-page workflow-projects-page engagement-workspaces-page"
      style={style}
    >
      <section className="client-projects-wrap">
        <div className="client-projects-topbar">
          <Link href={`/portal/${slug}`}>← Back to Portal</Link>
          {company?.logo && <img src={company.logo} alt={`${company.name} logo`} />}
        </div>

        <header className="client-projects-hero">
          <span>{company?.shortName || "Client"} Portal</span>
          <h1>Projects &amp; Campaigns</h1>
          <p>
            Follow your company’s projects, production steps, shared updates, and
            conversations with UPZ Design.
          </p>
        </header>

        {loading && <p>Loading projects and campaigns...</p>}
        {error && <p>{error}</p>}

        {!loading && !error && !engagements.length && (
          <div className="client-project-empty">
            <h2>No active projects yet</h2>
            <p>Approved requests will appear here.</p>
          </div>
        )}

        <div className="engagement-grid">
          {engagements.map((engagement) => {
            const expanded = openEngagement === engagement.id;
            const location = locationLabel(engagement);

            return (
              <article
                id={`engagement-${engagement.id}`}
                key={engagement.id}
                className={`engagement-card ${expanded ? "is-open" : ""}`}
              >
                <button
                  className="engagement-summary"
                  type="button"
                  onClick={() => setOpenEngagement(expanded ? null : engagement.id)}
                >
                  <div className="engagement-summary-copy">
                    <span>
                      {engagement.type === "property" ? "Property Project" : "Campaign"}
                    </span>
                    <h2>{engagement.name}</h2>
                    {location && <p>{location}</p>}
                  </div>

                  <div className="engagement-summary-stats">
                    <div>
                      <small>Active</small>
                      <strong>{engagement.activeWorkOrders}</strong>
                    </div>
                    <div>
                      <small>Services</small>
                      <strong>{engagement.workOrders.length}</strong>
                    </div>
                    <div>
                      <small>Progress</small>
                      <strong>{engagement.progress}%</strong>
                    </div>
                    <i aria-hidden="true">{expanded ? "−" : "+"}</i>
                  </div>
                </button>

                <div className="engagement-progress-track">
                  <i style={{ width: `${engagement.progress}%` }} />
                </div>

                {expanded && (
                  <div className="engagement-body">
                    <div className="engagement-body-head">
                      <div>
                        <span>Work Orders</span>
                        <h3>Services for {engagement.name}</h3>
                      </div>
                      <Link
                        href={`/portal/${slug}/request/general?engagementId=${engagement.id}&engagementName=${encodeURIComponent(
                          engagement.name
                        )}`}
                      >
                        + Request another service
                      </Link>
                    </div>

                    <div className="client-project-list engagement-work-order-list">
                      {engagement.workOrders.map((project) => (
                        <article
                          key={project.id}
                          className="client-project-card workflow-project-card engagement-work-order-card"
                        >
                          <div className="client-project-card-head">
                            <div>
                              <span>{project.status}</span>
                              <h2>{project.title}</h2>
                            </div>
                            <em>{project.priority} priority</em>
                          </div>

                          {project.description && <p>{project.description}</p>}

                          <div className="workflow-progress-head">
                            <strong>Work order progress</strong>
                            <span>{project.progress}%</span>
                          </div>
                          <div className="workflow-progress-track">
                            <i style={{ width: `${project.progress}%` }} />
                          </div>

                          <div className="client-project-meta">
                            <div>
                              <small>Due Date</small>
                              <strong>
                                {project.dueDate
                                  ? new Date(project.dueDate).toLocaleDateString()
                                  : "To be confirmed"}
                              </strong>
                            </div>
                            <div>
                              <small>Last Updated</small>
                              <strong>{new Date(project.updatedAt).toLocaleDateString()}</strong>
                            </div>
                          </div>

                          {project.tasks.length > 0 && (
                            <section className="workflow-timeline">
                              <h3>Production workflow</h3>
                              <div>
                                {project.tasks.map((task, index) => {
                                  const state = taskState(project.tasks, index);
                                  const complete = state === "complete";
                                  const available = complete || state === "current";

                                  return (
                                    <article
                                      key={task.id}
                                      className={`workflow-stage ${state}`}
                                    >
                                      <span>{complete ? "✓" : index + 1}</span>
                                      <div>
                                        <strong>{task.title}</strong>
                                        {task.description && <p>{task.description}</p>}
                                        {task.dueDate && available && (
                                          <small>
                                            {complete ? "Completed" : "Target"}: {" "}
                                            {new Date(task.dueDate).toLocaleDateString()}
                                          </small>
                                        )}
                                      </div>
                                    </article>
                                  );
                                })}
                              </div>
                            </section>
                          )}

                          <section className="client-project-messages">
                            <h3>Project conversation</h3>

                            {project.notes.length > 0 ? (
                              project.notes.map((note) => (
                                <article key={note.id}>
                                  <p>{note.body}</p>
                                  <small>
                                    {note.author || "UPZ Design"} · {" "}
                                    {new Date(note.createdAt).toLocaleString()}
                                  </small>
                                </article>
                              ))
                            ) : (
                              <p>No messages have been posted yet.</p>
                            )}

                            <form
                              onSubmit={(event) => sendMessage(event, project.id)}
                              style={{ marginTop: 18 }}
                            >
                              <label style={{ display: "block", fontWeight: 700 }}>
                                Reply to UPZ Design
                                <textarea
                                  value={messageDrafts[project.id] || ""}
                                  onChange={(event) =>
                                    setMessageDrafts((current) => ({
                                      ...current,
                                      [project.id]: event.target.value,
                                    }))
                                  }
                                  maxLength={4000}
                                  placeholder="Add feedback, ask a question, or confirm approval..."
                                  style={{
                                    display: "block",
                                    width: "100%",
                                    minHeight: 110,
                                    marginTop: 8,
                                    padding: 14,
                                    borderRadius: 12,
                                    border: "1px solid rgba(0,0,0,.16)",
                                    resize: "vertical",
                                    font: "inherit",
                                  }}
                                />
                              </label>

                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 12,
                                  marginTop: 10,
                                  flexWrap: "wrap",
                                }}
                              >
                                <small>{messageStatus[project.id] || ""}</small>
                                <button
                                  type="submit"
                                  disabled={
                                    sendingProject === project.id ||
                                    !String(messageDrafts[project.id] || "").trim()
                                  }
                                  style={{
                                    border: 0,
                                    borderRadius: 999,
                                    padding: "11px 18px",
                                    background: "var(--company-primary)",
                                    color: "var(--company-secondary)",
                                    fontWeight: 800,
                                    cursor: "pointer",
                                  }}
                                >
                                  {sendingProject === project.id
                                    ? "Sending..."
                                    : "Send message"}
                                </button>
                              </div>
                            </form>
                          </section>
                        </article>
                      ))}
                    </div>
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
