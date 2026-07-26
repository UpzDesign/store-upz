export const PROJECT_STAGES = [
  ["new", "New"],
  ["planning", "Planning"],
  ["in_progress", "In Progress"],
  ["waiting_client", "Waiting Client"],
  ["review", "Review"],
  ["complete", "Complete"],
  ["cancelled", "Cancelled"],
] as const;

export type ProjectStage = (typeof PROJECT_STAGES)[number][0];

const aliases: Record<string, ProjectStage> = {
  active: "in_progress",
  "in-progress": "in_progress",
  inprogress: "in_progress",
  proofing: "review",
  waiting: "waiting_client",
  "waiting-client": "waiting_client",
  completed: "complete",
  closed: "complete",
  canceled: "cancelled",
};

export function normalizeProjectStage(value?: string | null): ProjectStage {
  const normalized = String(value || "new").trim().toLowerCase().replaceAll(" ", "_");
  const direct = PROJECT_STAGES.find(([stage]) => stage === normalized)?.[0];
  return direct || aliases[normalized] || "new";
}

export function projectStageLabel(value?: string | null) {
  const stage = normalizeProjectStage(value);
  return PROJECT_STAGES.find(([key]) => key === stage)?.[1] || "New";
}

export function isProjectComplete(value?: string | null) {
  return ["complete", "cancelled"].includes(normalizeProjectStage(value));
}
