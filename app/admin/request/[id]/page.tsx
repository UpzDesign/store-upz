"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getWorkflowTemplate, type WorkflowStep } from "@/lib/workflow-templates";
import { AdminButton, AdminCard, AdminField, AdminFormGrid, AdminHeader, AdminPage, AdminSection, AdminSectionHeader } from "@/components/admin/AdminUI";

type RequestDetail = {
  id: number;
  type: string;
  title: string;
  description?: string | null;
  priority: string;
  status: string;
  createdAt: string;
  company: { name: string; shortName: string; slug: string; logo?: string | null; primaryColor: string };
  project?: { id: number } | null;
};
type Member = { id: number; name: string; role: string };
type ApprovalStage = WorkflowStep & { id: string };

function visibleDescription(value?: string | null) {
  return (value || "").split("__UPZ_CONTEXT__")[0].trim() || "No additional description provided.";
}

function decisionReason(value?: string | null) {
  const marker = "__UPZ_DECISION__";
  const source = value || "";
  const index = source.lastIndexOf(marker);
  if (index < 0) return "";
  try { return JSON.parse(source.slice(index + marker.length).trim()).reason || ""; }
  catch { return ""; }
}

function makeStages(service: string): ApprovalStage[] {
  return getWorkflowTemplate(service).map((stage, index) => ({ ...stage, id: `${Date.now()}-${index}` }));
}

export default function RequestReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [item, setItem] = useState<RequestDetail | null>(null);
  const [team, setTeam] = useState<Member[]>([]);
  const [stages, setStages] = useState<ApprovalStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState<"approve" | "decline" | null>(null);
  const [assignedTo, setAssignedTo] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [declineReason, setDeclineReason] = useState("");

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/admin/requests/${id}`, { cache: "no-store" }).then((response) => {
        if (!response.ok) throw new Error("Unable to load request");
        return response.json();
      }),
      fetch("/api/admin/operations", { cache: "no-store" }).then((response) => response.ok ? response.json() : { team: [] }),
    ])
      .then(([requestData, operations]) => {
        setItem(requestData);
        setTeam(Array.isArray(operations?.team) ? operations.team : []);
        setStages(makeStages(requestData.type || requestData.title));
        setDeclineReason(decisionReason(requestData.description));
      })
      .catch((error) => setMessage(error?.message || "Unable to load request"))
      .finally(() => setLoading(false));
  }, [id]);

  function updateStage(stageId: string, patch: Partial<ApprovalStage>) {
    setStages((current) => current.map((stage) => stage.id === stageId ? { ...stage, ...patch } : stage));
  }

  function moveStage(index: number, direction: -1 | 1) {
    setStages((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addStage() {
    setStages((current) => [...current, {
      id: `${Date.now()}-${current.length}`,
      title: "New stage",
      description: "",
      durationDays: current.length ? Number(current[current.length - 1].durationDays || current.length - 1) + 1 : 0,
    }]);
  }

  async function approve() {
    if (!item || working || !stages.some((stage) => stage.title.trim())) return;
    setWorking("approve");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/requests/${item.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo, startDate, dueDate, priority: item.priority, clientVisible: true, stages: stages.map(({ title, description, durationDays }) => ({ title, description, durationDays })) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Unable to approve request");
      router.push(`/admin/operations?project=${data.id}`);
    } catch (error: any) {
      setMessage(error?.message || "Unable to approve request");
      setWorking(null);
    }
  }

  async function decline() {
    if (!item || working || !declineReason.trim()) return;
    setWorking("decline");
    setMessage("");
    try {
      const clean = visibleDescription(item.description);
      const description = `${clean}\n\n__UPZ_DECISION__${JSON.stringify({ reason: declineReason.trim() })}`;
      const response = await fetch(`/api/admin/requests/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "declined", description }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Unable to decline request");
      setItem({ ...item, ...data });
      setMessage("Request declined. The client will see the reason in their project updates.");
      setWorking(null);
    } catch (error: any) {
      setMessage(error?.message || "Unable to decline request");
      setWorking(null);
    }
  }

  if (loading) return <AdminPage><AdminSection><h1>Loading request...</h1></AdminSection></AdminPage>;
  if (!item) return <AdminPage><AdminSection><h1>Request not found</h1>{message && <p className="admin-error">{message}</p>}</AdminSection></AdminPage>;

  const decisionState = item.project ? "approved" : item.status === "declined" ? "declined" : "pending";

  return (
    <AdminPage className="request-review-page request-setup-page">
      <AdminHeader
        eyebrow="Project Approval"
        title={item.title}
        description={`${item.company.name} · ${item.type} · submitted ${new Date(item.createdAt).toLocaleString()}`}
        actions={<div className="request-header-brand" style={{ borderColor: item.company.primaryColor }}><img src={item.company.logo || "/upz-logo.svg"} alt={`${item.company.name} logo`} /><span>{item.company.shortName}</span></div>}
      />

      {decisionState === "approved" ? <AdminSection><AdminSectionHeader eyebrow="Project Created" title="This request is active"/><p>The approved project is now managed in Operations.</p><AdminButton href={`/admin/operations?project=${item.project?.id}`}>Open Project</AdminButton></AdminSection> : decisionState === "declined" ? <AdminSection><AdminSectionHeader eyebrow="Final Decision" title="Request declined"/><p><strong>Client-visible reason:</strong></p><p>{declineReason || "No reason provided."}</p></AdminSection> : <>
        <section className="request-setup-grid">
          <AdminSection className="request-intake-panel">
            <AdminSectionHeader eyebrow="Client Intake" title="Request brief" />
            <div className="request-detail-badges"><b>{item.status}</b><em>{item.priority} priority</em></div>
            <pre className="request-detail-pre">{visibleDescription(item.description)}</pre>
          </AdminSection>

          <AdminSection className="request-settings-panel">
            <AdminSectionHeader eyebrow="Project Setup" title="Ownership & schedule" />
            <p>Set the core project details before creating the workflow.</p>
            <AdminFormGrid>
              <AdminField label="Project manager" className="wide"><select value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}><option value="">Unassigned</option>{team.map((member) => <option value={member.name} key={member.id}>{member.name} — {member.role}</option>)}</select></AdminField>
              <AdminField label="Start date"><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></AdminField>
              <AdminField label="Due date"><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></AdminField>
            </AdminFormGrid>
            <div className="request-setup-summary">
              <AdminCard variant="highlight"><span>Workflow stages</span><strong>{stages.length}</strong></AdminCard>
              <AdminCard variant="compact"><span>Visibility</span><strong>Client visible</strong></AdminCard>
            </div>
          </AdminSection>
        </section>

        <AdminSection className="request-stage-builder">
          <AdminSectionHeader eyebrow="Workflow Builder" title="Project stages" actions={<AdminButton variant="outline" type="button" onClick={addStage}>Add Stage</AdminButton>} />
          <p className="request-stage-intro">Edit the default workflow before approval. These stages become the project tasks used by Operations and the client workspace.</p>
          <div className="request-stage-list">
            {stages.map((stage, index) => <article className="request-stage-row" key={stage.id}>
              <div className="request-stage-number"><span>Stage</span><strong>{index + 1}</strong></div>
              <div className="request-stage-fields">
                <AdminField label="Stage name" className="wide"><input value={stage.title} onChange={(event) => updateStage(stage.id, { title: event.target.value })} /></AdminField>
                <AdminField label="Description" className="wide"><textarea value={stage.description || ""} onChange={(event) => updateStage(stage.id, { description: event.target.value })} /></AdminField>
                <AdminField label="Days from start"><input type="number" min="0" value={stage.durationDays ?? index} onChange={(event) => updateStage(stage.id, { durationDays: Number(event.target.value) })} /></AdminField>
              </div>
              <div className="request-stage-actions">
                <AdminButton variant="ghost" type="button" onClick={() => moveStage(index, -1)} disabled={index === 0}>Move Up</AdminButton>
                <AdminButton variant="ghost" type="button" onClick={() => moveStage(index, 1)} disabled={index === stages.length - 1}>Move Down</AdminButton>
                <AdminButton variant="danger" type="button" onClick={() => setStages((current) => current.filter((entry) => entry.id !== stage.id))}>Remove</AdminButton>
              </div>
            </article>)}
          </div>
        </AdminSection>

        <section className="request-final-actions">
          <AdminSection className="request-approval-panel">
            <AdminSectionHeader eyebrow="Ready to Create" title="Approve project" />
            <p>Create the project with {stages.length} finalized stages. The first stage will begin in progress.</p>
            <AdminButton type="button" onClick={approve} disabled={Boolean(working) || !stages.some((stage) => stage.title.trim())}>{working === "approve" ? "Creating Project..." : `Approve & Create Project`}</AdminButton>
          </AdminSection>
          <AdminSection className="request-decline-box">
            <AdminSectionHeader eyebrow="Alternative" title="Decline request" />
            <AdminField label="Client-visible reason"><textarea value={declineReason} onChange={(event) => setDeclineReason(event.target.value)} placeholder="Explain why this request cannot move forward." /></AdminField>
            <AdminButton variant="danger" type="button" onClick={decline} disabled={Boolean(working) || !declineReason.trim()}>{working === "decline" ? "Declining..." : "Decline Request"}</AdminButton>
          </AdminSection>
        </section>
        {message && <p className={message.startsWith("Request declined") ? "admin-inline-success" : "admin-error"}>{message}</p>}
      </>}
    </AdminPage>
  );
}
