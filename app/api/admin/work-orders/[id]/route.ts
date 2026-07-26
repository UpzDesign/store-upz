import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeProjectStage, projectStageLabel } from "@/lib/project-status";

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function displayDate(value: Date | string | null | undefined) {
  if (!value) return "unscheduled";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const projectId = parseId(id);
  if (!projectId) return NextResponse.json({ error: "Invalid work order id" }, { status: 400 });
  const body = await request.json();
  const existing = await prisma.project.findUnique({ where: { id: projectId } });
  if (!existing) return NextResponse.json({ error: "Work order not found" }, { status: 404 });

  const nextStatus = body.status === undefined ? undefined : normalizeProjectStage(body.status);
  const nextAssignedTo = body.assignedTo === undefined ? undefined : body.assignedTo || null;
  const nextStartDate = body.startDate === undefined ? undefined : body.startDate ? new Date(body.startDate) : null;
  const nextDueDate = body.dueDate === undefined ? undefined : body.dueDate ? new Date(body.dueDate) : null;
  const nextPriority = body.priority === undefined ? undefined : String(body.priority);
  const nextClientVisible = body.clientVisible === undefined ? undefined : Boolean(body.clientVisible);

  const activities: Array<{ type: string; message: string; actor: string }> = [];
  if (nextStatus && normalizeProjectStage(existing.status) !== nextStatus) activities.push({ type: "status_changed", message: `Stage changed from ${projectStageLabel(existing.status)} to ${projectStageLabel(nextStatus)}.`, actor: "UPZ Admin" });
  if (nextAssignedTo !== undefined && existing.assignedTo !== nextAssignedTo) activities.push({ type: "assignment_changed", message: nextAssignedTo ? `Assigned to ${nextAssignedTo}.` : "Project assignment removed.", actor: "UPZ Admin" });
  if (nextPriority !== undefined && existing.priority !== nextPriority) activities.push({ type: "priority_changed", message: `Priority changed from ${existing.priority} to ${nextPriority}.`, actor: "UPZ Admin" });
  if (nextStartDate !== undefined && displayDate(existing.startDate) !== displayDate(nextStartDate)) activities.push({ type: "date_changed", message: `Start date changed to ${displayDate(nextStartDate)}.`, actor: "UPZ Admin" });
  if (nextDueDate !== undefined && displayDate(existing.dueDate) !== displayDate(nextDueDate)) activities.push({ type: "date_changed", message: `Due date changed to ${displayDate(nextDueDate)}.`, actor: "UPZ Admin" });
  if (nextClientVisible !== undefined && existing.clientVisible !== nextClientVisible) activities.push({ type: "visibility_changed", message: nextClientVisible ? "Project is now visible to the client." : "Project was hidden from the client portal.", actor: "UPZ Admin" });

  const project = await prisma.$transaction(async (tx) => {
    const updated = await tx.project.update({
      where: { id: projectId },
      data: {
        title: body.title === undefined ? undefined : String(body.title).trim(),
        description: body.description === undefined ? undefined : body.description ? String(body.description).trim() : null,
        status: nextStatus,
        priority: nextPriority,
        assignedTo: nextAssignedTo,
        startDate: nextStartDate,
        dueDate: nextDueDate,
        budget: body.budget === undefined ? undefined : body.budget === "" || body.budget === null ? null : Number(body.budget),
        internalCost: body.internalCost === undefined ? undefined : body.internalCost === "" || body.internalCost === null ? null : Number(body.internalCost),
        clientVisible: nextClientVisible,
      },
      include: { tasks: { orderBy: { sortOrder: "asc" } }, company: { select: { name: true, shortName: true, slug: true } }, engagement: { select: { id: true, name: true } }, notes: { orderBy: { createdAt: "desc" }, take: 5 } },
    });
    if (activities.length) await tx.projectActivity.createMany({ data: activities.map((activity) => ({ ...activity, projectId })) });
    else await tx.projectActivity.create({ data: { projectId, type: "work_order_updated", message: "Project details updated.", actor: "UPZ Admin" } });
    return updated;
  });

  return NextResponse.json(project, { headers: { "Cache-Control": "no-store, max-age=0" } });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const projectId = parseId(id);
    if (!projectId) return NextResponse.json({ error: "Invalid work order id" }, { status: 400 });
    const existing = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, engagementId: true, requestId: true } });
    if (!existing) return NextResponse.json({ error: "Work order not found" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.project.delete({ where: { id: projectId } });
      if (existing.requestId) await tx.marketingRequest.deleteMany({ where: { id: existing.requestId } });
      if (existing.engagementId) {
        const remaining = await tx.project.count({ where: { engagementId: existing.engagementId } });
        const assets = await tx.engagementAsset.count({ where: { engagementId: existing.engagementId } });
        if (remaining === 0 && assets === 0) await tx.engagement.delete({ where: { id: existing.engagementId } });
      }
    });

    return NextResponse.json({ deleted: true, id: projectId });
  } catch (error) {
    console.error("Work order delete error:", error);
    return NextResponse.json({ error: "Unable to delete work order" }, { status: 500 });
  }
}
