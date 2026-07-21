"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const STATUSES = ["new", "quoted", "approved", "design", "production", "printing", "installation", "photography", "review", "completed"];

type ProjectTask = { id: number; title: string; status: string; assignedTo?: string | null };
type ProjectNote = { id: number; body: string; visibility: string; author?: string | null; createdAt: string };
type ProjectActivity = { id: number; message: string; createdAt: string };
type Project = {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  assignedTo?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  budget?: number | string | null;
  internalCost?: number | string | null;
  clientVisible: boolean;
  createdAt: string;
  company?: { name: string } | null;
  tasks: ProjectTask[];
  notes: ProjectNote[];
  activities: ProjectActivity[];
};

type ProjectUpdate = Partial<Pick<Project, "title" | "description" | "status" | "priority" | "assignedTo" | "startDate" | "dueDate" | "budget" | "internalCost" | "clientVisible">>;

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const slug = Array.isArray(params.slug) ? params.slug[0] : String(params.slug || "");
  const id = Number(Array.isArray(params.id) ? params.id[0] : params.id);
  const [project, setProject] = useState<Project | null>(null);
  const [task, setTask] = useState("");
  const [note, setNote] = useState("");
  const [visibility, setVisibility] = useState("internal");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) return;
    const response = await fetch(`/api/admin/projects/${id}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || "Unable to load project");
    setProject(data);
  }, [id]);

  useEffect(() => {
    void load().catch((error: unknown) => {
      setMessage(error instanceof Error ? error.message : "Unable to load project");
    });
  }, [load]);

  async function save(fields: ProjectUpdate) {
    const response = await fetch(`/api/admin/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    const data = await response.json();
    if (response.ok) setProject(data);
    setMessage(response.ok ? "Project saved." : data?.error || "Unable to save");
  }

  async function addTask(event: React.FormEvent) {
    event.preventDefault();
    if (!task.trim()) return;
    await fetch(`/api/admin/projects/${id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: task }),
    });
    setTask("");
    await load();
  }

  async function updateTask(taskId: number, status: string) {
    await fetch(`/api/admin/projects/${id}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  async function addNote(event: React.FormEvent) {
    event.preventDefault();
    if (!note.trim()) return;
    await fetch(`/api/admin/projects/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: note, visibility }),
    });
    setNote("");
    await load();
  }

  async function remove() {
    if (!confirm("Delete this project?")) return;
    await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
    router.push(`/admin/company/${slug}/projects`);
  }

  if (!project) {
    return <main className="admin-page"><section className="admin-simple-state"><h1>{message || "Loading project..."}</h1></section></main>;
  }

  return <main className="admin-page"><section className="project-shell"><div className="admin-detail-topbar"><Link href={`/admin/company/${slug}/projects`}>← All Projects</Link><Link href={`/portal/${slug}/projects`}>Client View</Link></div>
  <header className="project-workspace-header"><div><span className="admin-eyebrow">{project.company?.name}</span><input className="project-title-input" value={project.title} onChange={event => setProject({ ...project, title: event.target.value })}/><p>Created {new Date(project.createdAt).toLocaleDateString()}</p></div><div><select value={project.status} onChange={event => { const status = event.target.value; setProject({ ...project, status }); void save({ status }); }}>{STATUSES.map(status => <option key={status}>{status}</option>)}</select><button className="admin-primary-button" onClick={() => void save(project)}>Save Project</button></div></header>{message && <p>{message}</p>}
  <div className="project-workspace-grid"><section className="project-panel project-overview"><h2>Overview</h2><label>Description<textarea value={project.description || ""} onChange={event => setProject({ ...project, description: event.target.value })}/></label><div className="project-fields"><label>Priority<select value={project.priority} onChange={event => setProject({ ...project, priority: event.target.value })}><option>low</option><option>normal</option><option>high</option><option>urgent</option></select></label><label>Assigned To<input value={project.assignedTo || ""} onChange={event => setProject({ ...project, assignedTo: event.target.value })}/></label><label>Start Date<input type="date" value={project.startDate?.slice(0, 10) || ""} onChange={event => setProject({ ...project, startDate: event.target.value })}/></label><label>Due Date<input type="date" value={project.dueDate?.slice(0, 10) || ""} onChange={event => setProject({ ...project, dueDate: event.target.value })}/></label><label>Budget<input type="number" value={project.budget ?? ""} onChange={event => setProject({ ...project, budget: event.target.value })}/></label><label>Internal Cost<input type="number" value={project.internalCost ?? ""} onChange={event => setProject({ ...project, internalCost: event.target.value })}/></label></div><label className="project-checkbox"><input type="checkbox" checked={project.clientVisible} onChange={event => setProject({ ...project, clientVisible: event.target.checked })}/> Visible in client portal</label></section>
  <section className="project-panel"><h2>Tasks</h2><form className="project-inline-form" onSubmit={addTask}><input placeholder="Add a task" value={task} onChange={event => setTask(event.target.value)}/><button>Add</button></form><div className="task-list">{project.tasks.map(item => <article key={item.id}><button className={`task-check ${item.status === "done" ? "done" : ""}`} onClick={() => void updateTask(item.id, item.status === "done" ? "todo" : "done")}>{item.status === "done" ? "✓" : ""}</button><div><strong>{item.title}</strong><span>{item.assignedTo || "Unassigned"}</span></div><select value={item.status} onChange={event => void updateTask(item.id, event.target.value)}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="review">Review</option><option value="done">Done</option></select></article>)}</div></section>
  <section className="project-panel"><h2>Notes</h2><form onSubmit={addNote}><textarea placeholder="Add project note" value={note} onChange={event => setNote(event.target.value)}/><div className="project-inline-form"><select value={visibility} onChange={event => setVisibility(event.target.value)}><option value="internal">Internal</option><option value="client">Client visible</option></select><button>Add Note</button></div></form>{project.notes.map(item => <article className="project-note" key={item.id}><span>{item.visibility}</span><p>{item.body}</p><small>{item.author || "UPZ Design"} · {new Date(item.createdAt).toLocaleString()}</small></article>)}</section>
  <section className="project-panel"><h2>Activity</h2><div className="activity-list">{project.activities.map(item => <article key={item.id}><i/><div><strong>{item.message}</strong><span>{new Date(item.createdAt).toLocaleString()}</span></div></article>)}</div></section></div>
  <button className="admin-danger-button" onClick={() => void remove()}>Delete Project</button></section></main>;
}
