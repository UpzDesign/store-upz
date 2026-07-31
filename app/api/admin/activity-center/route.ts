import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isProjectActive, normalizeProjectStage } from "@/lib/project-status";
import { parseProjectMessage } from "@/lib/project-messages";

export async function GET() {
  const now = new Date();
  const [requests, projects, activities, notes] = await Promise.all([
    prisma.marketingRequest.findMany({
      where: { project: null, status: { notIn: ["approved", "declined", "cancelled", "converted"] } },
      include: { company: { select: { name: true, shortName: true, slug: true, primaryColor: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.project.findMany({
      include: {
        company: { select: { name: true, shortName: true, slug: true, primaryColor: true } },
        engagement: { select: { id: true, name: true } },
        tasks: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.projectActivity.findMany({
      include: {
        project: {
          include: {
            company: { select: { name: true, shortName: true, slug: true, primaryColor: true } },
            engagement: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.projectNote.findMany({
      where: { visibility: { in: ["client", "client_update", "feedback_request", "approval_request"] } },
      include: {
        project: {
          include: {
            company: { select: { name: true, shortName: true, slug: true, primaryColor: true } },
            engagement: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 75,
    }),
  ]);

  const items: Array<Record<string, unknown>> = [];

  for (const request of requests) {
    items.push({
      id: `request-${request.id}`,
      kind: "request",
      category: "Requests",
      title: request.title,
      message: `${request.company.name} submitted a new ${request.type} request.`,
      status: request.status,
      priority: request.priority,
      createdAt: request.createdAt,
      company: request.company,
      href: `/admin/request/${request.id}`,
      actionable: true,
    });
  }

  for (const project of projects) {
    const status = normalizeProjectStage(project.status);
    if (!isProjectActive(status)) continue;
    if (project.dueDate && project.dueDate < now) {
      items.push({
        id: `project-overdue-${project.id}`,
        kind: "overdue",
        category: "Attention",
        title: project.title,
        message: `Work order is overdue${project.assignedTo ? ` and assigned to ${project.assignedTo}` : " and remains unassigned"}.`,
        status,
        priority: project.priority,
        createdAt: project.dueDate,
        company: project.company,
        portfolio: project.engagement,
        href: `/admin/operations?project=${project.id}`,
        actionable: true,
      });
    }
    for (const task of project.tasks) {
      if (["complete", "completed"].includes(task.status.toLowerCase())) continue;
      if (task.dueDate && task.dueDate < now) {
        items.push({
          id: `task-overdue-${task.id}`,
          kind: "overdue_stage",
          category: "Attention",
          title: task.title,
          message: `Stage is overdue in ${project.title}${task.assignedTo ? ` · ${task.assignedTo}` : " · Unassigned"}.`,
          status: task.status,
          priority: task.priority,
          createdAt: task.dueDate,
          company: project.company,
          portfolio: project.engagement,
          href: `/admin/operations?project=${project.id}`,
          actionable: true,
        });
      }
    }
  }

  for (const note of notes) {
    const parsed = parseProjectMessage(note.body);
    const clientResponse = parsed.kind === "client_response";
    const title = clientResponse
      ? parsed.action === "approved" ? "Client approved" : parsed.action === "revision_requested" ? "Revision requested" : "Client replied"
      : parsed.kind === "approval_request" ? "Approval requested" : parsed.kind === "feedback_request" ? "Feedback requested" : "Client update";
    items.push({
      id: `note-${note.id}`,
      kind: clientResponse ? "client_response" : "client_update",
      category: "Client Activity",
      title,
      message: parsed.body,
      status: note.visibility,
      priority: clientResponse && parsed.action === "revision_requested" ? "high" : "normal",
      createdAt: note.createdAt,
      company: note.project.company,
      portfolio: note.project.engagement,
      href: `/admin/operations?project=${note.projectId}`,
      actionable: clientResponse,
    });
  }

  for (const activity of activities) {
    items.push({
      id: `activity-${activity.id}`,
      kind: activity.type,
      category: "Production",
      title: activity.project.title,
      message: activity.message,
      status: normalizeProjectStage(activity.project.status),
      priority: activity.project.priority,
      createdAt: activity.createdAt,
      company: activity.project.company,
      portfolio: activity.project.engagement,
      actor: activity.actor,
      href: `/admin/operations?project=${activity.projectId}`,
      actionable: false,
    });
  }

  items.sort((a, b) => +new Date(String(b.createdAt)) - +new Date(String(a.createdAt)));
  const counts = {
    total: items.length,
    requests: items.filter((item) => item.category === "Requests").length,
    attention: items.filter((item) => item.category === "Attention").length,
    client: items.filter((item) => item.category === "Client Activity").length,
    production: items.filter((item) => item.category === "Production").length,
  };

  return NextResponse.json({ items: items.slice(0, 200), counts }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
