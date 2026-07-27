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
  kind: "client_update" | "feedback_request" | "approval_request" | "client_response";
  replyToId?: number | null;
  action?: "reply" | "approved" | "revision_requested" | null;
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
  assets: Array<{ id: number; title: string; category: string; fileUrl?: string | null }>;
};

type Company = {
  name: string;
  shortName: string;
  logo?: string | null;
  primaryColor: string;
  secondaryColor: string;
};

type ReplyMode = "reply" | "revision_requested";

type ReplyState = {
  projectId: number;
  updateId: number;
  mode: ReplyMode;
} | null;

function locationLabel(engagement: Engagement) {
  return [engagement.address, engagement.city, engagement.state, engagement.postalCode]
    .filter(Boolean)
    .join(", ");
}

function updateLabel(note: Note) {
  if (note.kind === "approval_request") return "Approval Required";
  if (note.kind === "feedback_request") return "Feedback Requested";
  return "Project Update";
}

function actionLabel(action: Note["action"]) {
  if (action === "approved") return "Approved";
  if (action === "revision_requested") return "Needs Revision";
  return "Client Comment";
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
  const [replying, setReplying] = useState<ReplyState>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function loadProjects() {
    if (!slug) return;
    const response = await fetch(`/api/portal/companies/${slug}/projects`, { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load projects and campaigns");
    const data = await response.json();
    const next = Array.isArray(data) ? data : [];
    setEngagements(next);
    setOpenEngagement((current) => current ?? next[0]?.id ?? null);
  }

  useEffect(() => {
    if (!slug) return;
    const savedSlug = window.localStorage.getItem("upz_company_slug");
    if (savedSlug !== slug) {
      router.push("/login");
      return;
    }

    Promise.all([
      fetch(`/api/portal/companies/${slug}`).then((response) => (response.ok ? response.json() : null)),
      fetch(`/api/portal/companies/${slug}/projects`, { cache: "no-store" }).then((response) =>
        response.ok ? response.json() : []
      ),
    ])
      .then(([companyData, projectData]) => {
        setCompany(companyData);
        const next = Array.isArray(projectData) ? projectData : [];
        setEngagements(next);
        const hash = window.location.hash.match(/engagement-(\d+)/);
        setOpenEngagement(hash ? Number(hash[1]) : next[0]?.id ?? null);
      })
      .catch((requestError) =>
        setError(requestError?.message || "Unable to load projects and campaigns")
      )
      .finally(() => setLoading(false));
  }, [slug, router]);

  async function respond(
    projectId: number,
    updateId: number,
    action: "reply" | "approved" | "revision_requested",
    text = ""
  ) {
    if (!slug) return;
    setSending(true);
    setError("");

    try {
      const response = await fetch(
        `/api/portal/companies/${slug}/projects/${projectId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updateId, action, message: text }),
        }
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Unable to send response");

      setMessage("");
      setReplying(null);
      await loadProjects();
    } catch (responseError: any) {
      setError(responseError?.message || "Unable to send response");
    } finally {
      setSending(false);
    }
  }

  async function submitReply(event: FormEvent) {
    event.preventDefault();
    if (!replying || !message.trim()) return;
    await respond(replying.projectId, replying.updateId, replying.mode, message.trim());
  }

  function openReply(projectId: number, updateId: number) {
    setReplying({ projectId, updateId, mode: "reply" });
    setMessage("");
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
          <p>Follow your company’s projects, production steps, approvals, and shared updates.</p>
        </header>

        {loading && <p>Loading projects and campaigns...</p>}
        {error && <p className="project-conversation-error">{error}</p>}

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
                    <span>{engagement.type === "property" ? "Property Project" : "Campaign"}</span>
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
                      {engagement.workOrders.map((project) => {
                        const roots = project.notes.filter(
                          (note) => !note.replyToId && note.kind !== "client_response"
                        );

                        return (
                          <article
                            key={project.id}
                            className="client-project-card workflow-project-card engagement-work-order-card"
                          >
                            <div className="client-project-card-head">
                              <div><span>{project.status}</span><h2>{project.title}</h2></div>
                              <em>{project.priority} priority</em>
                            </div>

                            {project.description && <p>{project.description}</p>}

                            <div className="workflow-progress-head">
                              <strong>Work order progress</strong><span>{project.progress}%</span>
                            </div>
                            <div className="workflow-progress-track">
                              <i style={{ width: `${project.progress}%` }} />
                            </div>

                            <div className="client-project-meta">
                              <div><small>Priority</small><strong>{project.priority}</strong></div>
                              <div><small>Last Updated</small><strong>{new Date(project.updatedAt).toLocaleDateString()}</strong></div>
                            </div>

                            {project.tasks.length > 0 && (
                              <section className="workflow-timeline">
                                <h3>Production workflow</h3>
                                <div>
                                  {project.tasks.map((task, index) => {
                                    const complete = ["complete", "completed"].includes(task.status);
                                    const previousComplete =
                                      index === 0 ||
                                      ["complete", "completed"].includes(project.tasks[index - 1].status);
                                    const state = complete
                                      ? "complete"
                                      : previousComplete
                                        ? "current"
                                        : "upcoming blocked";

                                    return (
                                      <article key={task.id} className={`workflow-stage ${state}`}>
                                        <span>{complete ? "✓" : index + 1}</span>
                                        <div>
                                          <strong>{task.title}</strong>
                                          {task.description && <p>{task.description}</p>}
                                          {task.dueDate && previousComplete && (
                                            <small>Target: {new Date(task.dueDate).toLocaleDateString()}</small>
                                          )}
                                        </div>
                                      </article>
                                    );
                                  })}
                                </div>
                              </section>
                            )}

                            {roots.length > 0 && (
                              <section className="client-project-messages">
                                <h3>Updates &amp; Decisions</h3>

                                {roots.map((update) => {
                                  const replies = project.notes.filter(
                                    (note) => note.replyToId === update.id
                                  );
                                  const latestDecision = [...replies]
                                    .reverse()
                                    .find((reply) =>
                                      ["approved", "revision_requested"].includes(reply.action || "")
                                    );
                                  const isOpen =
                                    replying?.projectId === project.id &&
                                    replying.updateId === update.id;

                                  return (
                                    <article
                                      key={update.id}
                                      className={`project-update-thread ${update.kind}`}
                                    >
                                      <div className="project-update-heading">
                                        <strong>{updateLabel(update)}</strong>
                                        {update.kind !== "client_update" && !latestDecision && (
                                          <span>Waiting for your response</span>
                                        )}
                                        {latestDecision && (
                                          <span className={`decision-${latestDecision.action}`}>
                                            {actionLabel(latestDecision.action)}
                                          </span>
                                        )}
                                      </div>

                                      <small>
                                        {update.author || "UPZ Design"} · {new Date(update.createdAt).toLocaleString()}
                                      </small>
                                      <p>{update.body}</p>

                                      {replies.map((reply) => (
                                        <div
                                          key={reply.id}
                                          className={`project-thread-reply action-${reply.action || "reply"}`}
                                        >
                                          <strong>{actionLabel(reply.action)}</strong>
                                          <p>{reply.body}</p>
                                          <small>
                                            {reply.author} · {new Date(reply.createdAt).toLocaleString()}
                                          </small>
                                        </div>
                                      ))}

                                      <div className="project-thread-actions">
                                        <button
                                          type="button"
                                          onClick={() => openReply(project.id, update.id)}
                                        >
                                          Reply
                                        </button>
                                        {update.kind === "approval_request" && (
                                          <button
                                            type="button"
                                            disabled={sending}
                                            onClick={() => {
                                              if (window.confirm("Approve this deliverable? This lets the UPZ team move to the next step.")) {
                                                respond(project.id, update.id, "approved");
                                              }
                                            }}
                                          >
                                            Approve
                                          </button>
                                        )}
                                      </div>

                                      {isOpen && (
                                        <form className="project-reply-composer" onSubmit={submitReply}>
                                          <div className="project-reply-composer-head">
                                            <div>
                                              <strong>Reply to this update</strong>
                                              <small>
                                                Choose whether this is a comment or a revision request.
                                              </small>
                                            </div>
                                            <label>
                                              Response type
                                              <select
                                                value={replying.mode}
                                                onChange={(event) =>
                                                  setReplying({
                                                    ...replying,
                                                    mode: event.target.value as ReplyMode,
                                                  })
                                                }
                                              >
                                                <option value="reply">General comment</option>
                                                {update.kind !== "client_update" && (
                                                  <option value="revision_requested">Request revision</option>
                                                )}
                                              </select>
                                            </label>
                                          </div>

                                          <textarea
                                            value={message}
                                            onChange={(event) => setMessage(event.target.value)}
                                            maxLength={2000}
                                            placeholder={
                                              replying.mode === "revision_requested"
                                                ? "What would you like us to revise?"
                                                : "Add your comment or question..."
                                            }
                                            autoFocus
                                          />

                                          <div>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setReplying(null);
                                                setMessage("");
                                              }}
                                            >
                                              Cancel
                                            </button>
                                            <button disabled={sending || !message.trim()}>
                                              {sending
                                                ? "Sending..."
                                                : replying.mode === "revision_requested"
                                                  ? "Send Revision Request"
                                                  : "Send Comment"}
                                            </button>
                                          </div>
                                        </form>
                                      )}
                                    </article>
                                  );
                                })}
                              </section>
                            )}
                          </article>
                        );
                      })}
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
