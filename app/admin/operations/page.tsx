"use client";

import Link from "next/link";
import { DragEvent, useEffect, useMemo, useState } from "react";

const COLUMNS = [
  ["new", "New"],
  ["in_progress", "In Progress"],
  ["waiting_client", "Waiting Client"],
  ["review", "Review"],
  ["complete", "Complete"],
] as const;

const PRIORITIES = ["all", "urgent", "high", "normal", "low"] as const;

type Project = {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  assignedTo?: string | null;
  dueDate?: string | null;
  budget?: number | null;
  internalCost?: number | null;
  company: { name: string; shortName: string; slug: string };
  engagement?: { id: number; name: string } | null;
  tasks: Array<{ status: string }>;
  notes: Array<{ body: string; createdAt: string }>;
};

type Data = {
  projects: Project[];
  engagements: any[];
  assets: any[];
  services: any[];
  team: Array<{ name: string; active: number; overdue: number; tasks: number }>;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);

const isComplete = (status: string) => ["complete", "completed", "cancelled"].includes(status);
const isOverdue = (project: Project) =>
  Boolean(project.dueDate && new Date(project.dueDate) < new Date() && !isComplete(project.status));

export default function OperationsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [query, setQuery] = useState("");
  const [assignee, setAssignee] = useState("all");
  const [priority, setPriority] = useState("all");
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [tab, setTab] = useState("board");
  const [selected, setSelected] = useState<Project | null>(null);
  const [comment, setComment] = useState("");
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = () =>
    fetch("/api/admin/operations", { cache: "no-store" })
      .then((response) => response.json())
      .then(setData);

  useEffect(() => {
    load();
  }, []);

  const projects = useMemo(() => {
    if (!data) return [];

    return data.projects.filter((project) => {
      const searchable = `${project.title} ${project.company.name} ${project.engagement?.name || ""}`.toLowerCase();
      const matchesQuery = searchable.includes(query.toLowerCase());
      const matchesAssignee = assignee === "all" || project.assignedTo === assignee;
      const matchesPriority = priority === "all" || project.priority === priority;
      const matchesAttention = !attentionOnly || isOverdue(project) || ["urgent", "high"].includes(project.priority);

      return matchesQuery && matchesAssignee && matchesPriority && matchesAttention;
    });
  }, [data, query, assignee, priority, attentionOnly]);

  async function move(id: number, status: string) {
    if (!data) return;
    const current = data.projects.find((project) => project.id === id);
    if (!current || current.status === status) return;

    setSavingId(id);
    setData({
      ...data,
      projects: data.projects.map((project) => (project.id === id ? { ...project, status } : project)),
    });

    try {
      const response = await fetch(`/api/admin/work-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Unable to update work order");
    } catch {
      await load();
    } finally {
      setSavingId(null);
      setDraggedId(null);
      setDropTarget(null);
    }
  }

  function startDrag(event: DragEvent<HTMLButtonElement>, id: number) {
    setDraggedId(id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(id));
  }

  function handleDrop(event: DragEvent<HTMLElement>, status: string) {
    event.preventDefault();
    const id = Number(event.dataTransfer.getData("text/plain") || draggedId);
    if (id) move(id, status);
  }

  async function approve(decision: string) {
    if (!selected) return;
    await fetch(`/api/admin/work-orders/${selected.id}/approval`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, comment }),
    });
    setComment("");
    setSelected(null);
    await load();
  }

  function clearFilters() {
    setQuery("");
    setAssignee("all");
    setPriority("all");
    setAttentionOnly(false);
  }

  if (!data) return <main className="ops-page"><p>Loading operations...</p></main>;

  const active = projects.filter((project) => !isComplete(project.status)).length;
  const overdue = projects.filter(isOverdue).length;
  const revenue = projects.reduce((sum, project) => sum + Number(project.budget || 0), 0);
  const cost = projects.reduce((sum, project) => sum + Number(project.internalCost || 0), 0);
  const activeFilters = Boolean(query || assignee !== "all" || priority !== "all" || attentionOnly);

  return (
    <main className="ops-page">
      <header className="ops-head">
        <div>
          <span>UPZ WORKSPACE</span>
          <h1>Operations</h1>
          <p>Production, team workload, assets, approvals, and engagement delivery in one place.</p>
        </div>
        <Link href="/admin/engagements">View engagements →</Link>
      </header>

      <section className="ops-kpis">
        <article><span>Active work orders</span><strong>{active}</strong></article>
        <article><span>Needs attention</span><strong>{overdue}</strong></article>
        <article><span>Tracked revenue</span><strong>{money(revenue)}</strong></article>
        <article><span>Projected margin</span><strong>{money(revenue - cost)}</strong></article>
        <article><span>Shared assets</span><strong>{data.assets.length}</strong></article>
      </section>

      <nav className="ops-tabs">
        {[
          ["board", "Production Board"],
          ["team", "Team"],
          ["assets", "Assets"],
          ["approvals", "Approvals"],
        ].map(([id, label]) => (
          <button className={tab === id ? "active" : ""} onClick={() => setTab(id)} key={id}>{label}</button>
        ))}
      </nav>

      <div className="ops-toolbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search work orders, companies, engagements..." />
        <select value={assignee} onChange={(event) => setAssignee(event.target.value)}>
          <option value="all">All team members</option>
          {data.team.map((member) => <option value={member.name} key={member.name}>{member.name}</option>)}
        </select>
        <select value={priority} onChange={(event) => setPriority(event.target.value)}>
          {PRIORITIES.map((value) => <option value={value} key={value}>{value === "all" ? "All priorities" : `${value[0].toUpperCase()}${value.slice(1)} priority`}</option>)}
        </select>
        <button className={attentionOnly ? "active" : ""} onClick={() => setAttentionOnly((value) => !value)}>Needs attention</button>
        {activeFilters && <button className="ops-clear" onClick={clearFilters}>Clear</button>}
      </div>

      {tab === "board" && (
        <>
          <div className="ops-board-guide"><span>Drag work orders between columns to update production status.</span><strong>{projects.length} visible</strong></div>
          <section className="ops-board">
            {COLUMNS.map(([status, label]) => {
              const columnProjects = projects.filter((project) => project.status === status);
              return (
                <article
                  className={`ops-column ${dropTarget === status ? "is-drop-target" : ""}`}
                  key={status}
                  onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDropTarget(status); }}
                  onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropTarget(null); }}
                  onDrop={(event) => handleDrop(event, status)}
                >
                  <header><strong>{label}</strong><span>{columnProjects.length}</span></header>
                  <div className="ops-column-body">
                    {columnProjects.map((project) => {
                      const overdueProject = isOverdue(project);
                      const completeTasks = project.tasks.filter((task) => ["complete", "completed"].includes(task.status)).length;
                      const taskProgress = project.tasks.length ? Math.round((completeTasks / project.tasks.length) * 100) : 0;
                      return (
                        <button
                          className={`ops-card priority-${project.priority} ${overdueProject ? "is-overdue" : ""} ${savingId === project.id ? "is-saving" : ""}`}
                          key={project.id}
                          onClick={() => setSelected(project)}
                          draggable
                          onDragStart={(event) => startDrag(event, project.id)}
                          onDragEnd={() => { setDraggedId(null); setDropTarget(null); }}
                        >
                          <small>{project.company.shortName} · {project.priority}</small>
                          <h3>{project.title}</h3>
                          <p>{project.engagement?.name || "General engagement"}</p>
                          <div className="ops-card-meta">
                            <span>{project.assignedTo || "Unassigned"}</span>
                            <span className={overdueProject ? "danger" : ""}>{project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "No due date"}</span>
                          </div>
                          <div className="ops-task-progress"><span><i style={{ width: `${taskProgress}%` }} /></span><strong>{project.tasks.length ? `${completeTasks}/${project.tasks.length}` : "No tasks"}</strong></div>
                          <select value={project.status} onClick={(event) => event.stopPropagation()} onChange={(event) => move(project.id, event.target.value)}>
                            {COLUMNS.map(([value, text]) => <option value={value} key={value}>{text}</option>)}
                          </select>
                        </button>
                      );
                    })}
                    {!columnProjects.length && <div className="ops-column-empty">Drop work here</div>}
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}

      {tab === "team" && (
        <section className="ops-grid">
          {data.team.length ? data.team.map((member) => (
            <article className="ops-panel" key={member.name}>
              <div className="ops-avatar">{member.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>
              <h3>{member.name}</h3>
              <p>Creative operations team member</p>
              <dl>
                <div><dt>Active assignments</dt><dd>{member.active}</dd></div>
                <div><dt>Tracked tasks</dt><dd>{member.tasks}</dd></div>
                <div><dt>Overdue</dt><dd>{member.overdue}</dd></div>
              </dl>
              <div className="ops-capacity"><i style={{ width: `${Math.min(100, member.active * 18)}%` }} /></div>
            </article>
          )) : <div className="ops-empty">Assign team members to work orders to build the workload directory.</div>}
        </section>
      )}

      {tab === "assets" && (
        <section className="ops-assets">
          {data.assets.map((asset) => (
            <article key={asset.id}>
              <div className="ops-asset-preview">{asset.fileUrl && /\.(jpg|jpeg|png|webp|gif)$/i.test(asset.fileUrl) ? <img src={asset.fileUrl} alt="" /> : <span>{asset.category?.slice(0, 2).toUpperCase() || "AS"}</span>}</div>
              <small>{asset.engagement.company.shortName} · {asset.category}</small>
              <h3>{asset.title}</h3>
              <p>{asset.engagement.name}</p>
              {asset.fileUrl && <a href={asset.fileUrl} target="_blank">Open asset →</a>}
            </article>
          ))}
          {!data.assets.length && <div className="ops-empty">No engagement assets have been uploaded yet.</div>}
        </section>
      )}

      {tab === "approvals" && (
        <section className="ops-approval-list">
          {projects.filter((project) => ["waiting_client", "review"].includes(project.status)).map((project) => (
            <article key={project.id}>
              <div><small>{project.company.shortName} · {project.status.replaceAll("_", " ")}</small><h3>{project.title}</h3><p>{project.engagement?.name || "General engagement"}</p></div>
              <button onClick={() => setSelected(project)}>Open review</button>
            </article>
          ))}
          {!projects.some((project) => ["waiting_client", "review"].includes(project.status)) && <div className="ops-empty">No work orders are currently waiting for approval.</div>}
        </section>
      )}

      {selected && (
        <div className="ops-drawer-backdrop" onMouseDown={() => setSelected(null)}>
          <aside className="ops-drawer" onMouseDown={(event) => event.stopPropagation()}>
            <button className="ops-close" onClick={() => setSelected(null)}>×</button>
            <small>{selected.company.name}</small>
            <h2>{selected.title}</h2>
            <p>{selected.description || selected.engagement?.name || "Production work order"}</p>
            <div className="ops-drawer-meta">
              <span>Status<strong>{selected.status.replaceAll("_", " ")}</strong></span>
              <span>Assigned<strong>{selected.assignedTo || "Unassigned"}</strong></span>
              <span>Tasks<strong>{selected.tasks.length}</strong></span>
              <span>Budget<strong>{money(Number(selected.budget || 0))}</strong></span>
            </div>
            <label>Approval note<textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add client feedback or an internal approval note..." /></label>
            <div className="ops-actions">
              <button onClick={() => approve("approved")}>Approve</button>
              <button onClick={() => approve("changes_requested")}>Request changes</button>
              <button onClick={() => approve("sent_for_review")}>Send for review</button>
            </div>
            {selected.engagement && <Link href={`/admin/engagements/${selected.engagement.id}`}>Open full engagement →</Link>}
          </aside>
        </div>
      )}
    </main>
  );
}
