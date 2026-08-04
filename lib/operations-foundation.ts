export const BUSINESS_TIME_ZONE = "America/New_York";

export const COMPLETE_STATUSES = new Set(["complete", "completed"]);
export const INACTIVE_STATUSES = new Set([...COMPLETE_STATUSES, "cancelled"]);
export const CLOSED_REQUEST_STATUSES = new Set(["approved", "declined", "cancelled", "converted"]);

export function normalizeStatus(value?: string | null) {
  return String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function isCompleteStatus(value?: string | null) {
  return COMPLETE_STATUSES.has(normalizeStatus(value));
}

export function isInactiveStatus(value?: string | null) {
  return INACTIVE_STATUSES.has(normalizeStatus(value));
}

export function isClosedRequestStatus(value?: string | null) {
  return CLOSED_REQUEST_STATUSES.has(normalizeStatus(value));
}

export function businessDateKey(value: Date | string | number = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function isDueToday(value?: string | null, now: Date = new Date()) {
  return Boolean(value && businessDateKey(value) === businessDateKey(now));
}

export function isPastDue(value?: string | null, now: Date = new Date()) {
  const due = value ? businessDateKey(value) : "";
  return Boolean(due && due < businessDateKey(now));
}

export type GeneratedContentContext = {
  workOrderId: number;
  workOrderTitle: string;
  companyName: string;
  engagementName?: string | null;
  status: string;
  priority: string;
  assignee?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  description?: string | null;
  stages: Array<{
    id?: number;
    title?: string;
    status: string;
    assignee?: string | null;
    dueDate?: string | null;
  }>;
};

export function buildGeneratedContentContext(input: GeneratedContentContext) {
  return {
    schemaVersion: "operations-context.v1",
    generatedAt: new Date().toISOString(),
    businessTimeZone: BUSINESS_TIME_ZONE,
    workOrder: {
      id: input.workOrderId,
      title: input.workOrderTitle,
      company: input.companyName,
      engagement: input.engagementName || null,
      status: normalizeStatus(input.status),
      priority: normalizeStatus(input.priority),
      assignee: input.assignee || null,
      startDate: input.startDate || null,
      dueDate: input.dueDate || null,
      description: input.description || null,
    },
    stages: input.stages.map(stage => ({
      id: stage.id || null,
      title: stage.title || "Untitled stage",
      status: normalizeStatus(stage.status),
      assignee: stage.assignee || null,
      dueDate: stage.dueDate || null,
      complete: isCompleteStatus(stage.status),
    })),
  };
}
