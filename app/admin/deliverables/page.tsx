"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Version = {
  id: number;
  versionNumber: number;
  label?: string | null;
  fileUrl: string;
  fileName?: string | null;
  status: string;
};

type Deliverable = {
  id: number;
  projectId: number;
  title: string;
  description?: string | null;
  category: string;
  status: string;
  projectTitle: string;
  companyName: string;
  versions: Version[];
};

type StageOption = { id: number; title: string; status: string };
type ProjectOption = {
  id: number;
  title: string;
  status: string;
  engagementId: number | null;
  tasks: StageOption[];
};
type EngagementOption = { id: number; name: string };
type CompanyOption = {
  id: number;
  name: string;
  engagements: EngagementOption[];
  projects: ProjectOption[];
};

const emptyForm = {
  companyId: "",
  engagementId: "",
  projectId: "",
  stageId: "",
  title: "",
  description: "",
  category: "general",
  fileUrl: "",
  fileName: "",
  fileType: "",
  notes: "",
};

export default function AdminDeliverablesPage() {
  const [items, setItems] = useState<Deliverable[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [versionFor, setVersionFor] = useState<number | null>(null);
  const [version, setVersion] = useState({ fileUrl: "", fileName: "", fileType: "", notes: "" });

  async function load() {
    const [deliverablesResponse, optionsResponse] = await Promise.all([
      fetch("/api/admin/deliverables", { cache: "no-store" }),
      fetch("/api/admin/deliverables/options", { cache: "no-store" }),
    ]);

    if (!deliverablesResponse.ok) throw new Error("Unable to load deliverables");
    if (!optionsResponse.ok) throw new Error("Unable to load companies and projects");

    setItems(await deliverablesResponse.json());
    setCompanies(await optionsResponse.json());
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === Number(form.companyId)),
    [companies, form.companyId],
  );

  const filteredProjects = useMemo(() => {
    if (!selectedCompany) return [];
    if (!form.engagementId) return selectedCompany.projects;
    return selectedCompany.projects.filter(
      (project) => project.engagementId === Number(form.engagementId),
    );
  }, [selectedCompany, form.engagementId]);

  const selectedProject = useMemo(
    () => filteredProjects.find((project) => project.id === Number(form.projectId)),
    [filteredProjects, form.projectId],
  );

  async function create(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/admin/deliverables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Unable to create deliverable");
      setForm(emptyForm);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function addVersion(event: FormEvent, id: number) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/deliverables/${id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(version),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Unable to add version");
      setVersion({ fileUrl: "", fileName: "", fileType: "", notes: "" });
      setVersionFor(null);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="admin-deliverables-page">
      <section className="admin-deliverables-wrap">
        <header>
          <span>Production & Review</span>
          <h1>Deliverables</h1>
          <p>Create client-facing files, publish revisions, and track approval status.</p>
        </header>

        {error && <p className="deliverables-error">{error}</p>}

        <form className="admin-deliverable-form" onSubmit={create}>
          <h2>New deliverable</h2>
          <div className="admin-deliverable-fields">
            <label>
              Company
              <select
                required
                value={form.companyId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    companyId: e.target.value,
                    engagementId: "",
                    projectId: "",
                    stageId: "",
                  })
                }
              >
                <option value="">Select company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Engagement / Property
              <select
                disabled={!selectedCompany}
                value={form.engagementId}
                onChange={(e) =>
                  setForm({ ...form, engagementId: e.target.value, projectId: "", stageId: "" })
                }
              >
                <option value="">All engagements</option>
                {selectedCompany?.engagements.map((engagement) => (
                  <option key={engagement.id} value={engagement.id}>
                    {engagement.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Project
              <select
                required
                disabled={!selectedCompany}
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value, stageId: "" })}
              >
                <option value="">Select project</option>
                {filteredProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title} · {project.status.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Stage (optional)
              <select
                disabled={!selectedProject}
                value={form.stageId}
                onChange={(e) => setForm({ ...form, stageId: e.target.value })}
              >
                <option value="">No specific stage</option>
                {selectedProject?.tasks.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.title} · {stage.status.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Title
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>

            <label>
              Category
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="general">General</option>
                <option value="design">Design</option>
                <option value="photography">Photography</option>
                <option value="rendering">Rendering</option>
                <option value="video">Video</option>
                <option value="print">Print</option>
                <option value="website">Website</option>
              </select>
            </label>

            <label className="wide">
              Description
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>

            <label className="wide">
              File URL
              <input
                required
                type="url"
                value={form.fileUrl}
                onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
              />
            </label>

            <label>
              File name
              <input
                value={form.fileName}
                onChange={(e) => setForm({ ...form, fileName: e.target.value })}
              />
            </label>

            <label>
              File type
              <input
                placeholder="PDF, JPG, Video..."
                value={form.fileType}
                onChange={(e) => setForm({ ...form, fileType: e.target.value })}
              />
            </label>

            <label className="wide">
              Version notes
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </label>
          </div>
          <button disabled={saving || !form.projectId}>
            {saving ? "Publishing..." : "Publish for Client Review"}
          </button>
        </form>

        <div className="admin-deliverable-list">
          {items.map((item) => (
            <article key={item.id}>
              <div>
                <span>
                  {item.companyName} · {item.projectTitle}
                </span>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
              </div>
              <strong className={`status-${item.status}`}>{item.status.replaceAll("_", " ")}</strong>
              <div className="admin-version-list">
                {item.versions.map((v) => (
                  <a key={v.id} href={v.fileUrl} target="_blank" rel="noreferrer">
                    {v.label || `Version ${v.versionNumber}`} <small>{v.status.replaceAll("_", " ")}</small>
                  </a>
                ))}
              </div>
              <button onClick={() => setVersionFor(versionFor === item.id ? null : item.id)}>
                + Add Version
              </button>
              {versionFor === item.id && (
                <form onSubmit={(e) => addVersion(e, item.id)} className="admin-version-form">
                  <input
                    required
                    type="url"
                    placeholder="File URL"
                    value={version.fileUrl}
                    onChange={(e) => setVersion({ ...version, fileUrl: e.target.value })}
                  />
                  <input
                    placeholder="File name"
                    value={version.fileName}
                    onChange={(e) => setVersion({ ...version, fileName: e.target.value })}
                  />
                  <input
                    placeholder="File type"
                    value={version.fileType}
                    onChange={(e) => setVersion({ ...version, fileType: e.target.value })}
                  />
                  <textarea
                    placeholder="What changed in this version?"
                    value={version.notes}
                    onChange={(e) => setVersion({ ...version, notes: e.target.value })}
                  />
                  <button disabled={saving}>Publish New Version</button>
                </form>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
