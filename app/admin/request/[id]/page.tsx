"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getWorkflowTemplate, type WorkflowStep } from "@/lib/workflow-templates";

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
        body: JSON.stringify({
          assignedTo,
          startDate,
          dueDate,
          priority: item.priority,
          clientVisible: true,
          stages: stages.map(({ title, description, durationDays }) => ({ title, description, durationDays })),
        }),
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
      const response = await fetch(`/api/admin/requests/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "declined", description }),
      });
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

  if (loading) return <main className="admin-page"><section className="admin-simple-state"><h1>Loading request...</h1></section></main>;
  if (!item) return <main className="admin-page"><section className="admin-simple-state"><h1>Request not found</h1>{message && <p className="admin-error">{message}</p>}</section></main>;

  return (
    <main className="admin-page">
      <section className="admin-company-detail request-review-page">
        <header className="admin-detail-hero">
          <div className="admin-detail-logo" style={{ borderColor: item.company.primaryColor }}><img src={item.company.logo || "/upz-logo.svg"} alt="" /></div>
          <div><div className="admin-eyebrow">Project Approval</div><h1>{item.title}</h1><p>{item.company.name} · {item.type} · submitted {new Date(item.createdAt).toLocaleString()}</p></div>
        </header>

        <section className="admin-detail-grid request-approval-grid">
          <article className="admin-detail-card">
            <span>Client Intake</span><h2>Request details</h2>
            <div className="request-detail-badges"><b>{item.status}</b><em>{item.priority} priority</em></div>
            <pre className="request-detail-pre">{visibleDescription(item.description)}</pre>
          </article>

          <article className="admin-detail-card request-decision-card">
            <span>Project Setup</span>
            <h2>{item.project ? "Approved Project" : item.status === "declined" ? "Request Declined" : "Approve and create project"}</h2>
            {item.project ? <><p>This request is active and managed in Operations.</p><Link className="admin-primary-button" href={`/admin/operations?project=${item.project.id}`}>Open Project</Link></> : item.status === "declined" ? <><p><strong>Client-visible reason:</strong></p><p>{declineReason || "No reason provided."}</p></> : <>
              <p>Confirm ownership, schedule, and the exact workflow stages before creating the project.</p>
              <div className="request-approval-fields">
                <label>Project manager<select value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}><option value="">Unassigned</option>{team.map((member) => <option value={member.name} key={member.id}>{member.name} — {member.role}</option>)}</select></label>
                <label>Start date<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
                <label>Due date<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label>
              </div>

              <section className="request-stage-builder">
                <div className="request-stage-builder-head"><div><span>Workflow</span><h3>Project stages</h3><p>These stages become the project tasks shown in admin and the client project workspace.</p></div><button type="button" onClick={addStage}>Add Stage</button></div>
                <div className="request-stage-list">
                  {stages.map((stage, index) => <article className="request-stage-row" key={stage.id}>
                    <div className="request-stage-number">{index + 1}</div>
                    <div className="request-stage-fields">
                      <input value={stage.title} onChange={(event) => updateStage(stage.id, { title: event.target.value })} aria-label={`Stage ${index + 1} title`} />
                      <textarea value={stage.description || ""} onChange={(event) => updateStage(stage.id, { description: event.target.value })} aria-label={`Stage ${index + 1} description`} />
                      <label>Days from start<input type="number" min="0" value={stage.durationDays ?? index} onChange={(event) => updateStage(stage.id, { durationDays: Number(event.target.value) })} /></label>
                    </div>
                    <div className="request-stage-actions">
                      <button type="button" onClick={() => moveStage(index, -1)} disabled={index === 0}>↑</button>
                      <button type="button" onClick={() => moveStage(index, 1)} disabled={index === stages.length - 1}>↓</button>
                      <button type="button" className="admin-danger-button" onClick={() => setStages((current) => current.filter((item) => item.id !== stage.id))}>Remove</button>
                    </div>
                  </article>)}
                </div>
              </section>

              <button className="admin-primary-button" type="button" onClick={approve} disabled={Boolean(working) || !stages.some((stage) => stage.title.trim())}>{working === "approve" ? "Creating Project..." : `Approve & Create ${stages.length} Stages`}</button>
              <div className="request-decline-box"><label>Reason for declining<textarea value={declineReason} onChange={(event) => setDeclineReason(event.target.value)} placeholder="Explain why this request cannot move forward. This message will be visible to the client." /></label><button className="admin-danger-button" type="button" onClick={decline} disabled={Boolean(working) || !declineReason.trim()}>{working === "decline" ? "Declining..." : "Decline Request"}</button></div>
              {message && <p className={message.startsWith("Request declined") ? "admin-inline-success" : "admin-error"}>{message}</p>}
            </>}
          </article>
        </section>
      </section>
    </main>
  );
}
