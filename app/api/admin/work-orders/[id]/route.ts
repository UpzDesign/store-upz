import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const projectId = parseId(id);
  if (!projectId) return NextResponse.json({ error: "Invalid work order id" }, { status: 400 });
  const body = await request.json();
  const allowed = ["new", "in_progress", "waiting_client", "review", "complete", "cancelled"];
  if (body.status && !allowed.includes(body.status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      title: body.title === undefined ? undefined : String(body.title).trim(),
      description: body.description === undefined ? undefined : body.description ? String(body.description).trim() : null,
      status: body.status,
      priority: body.priority === undefined ? undefined : String(body.priority),
      assignedTo: body.assignedTo === undefined ? undefined : body.assignedTo || null,
      startDate: body.startDate === undefined ? undefined : body.startDate ? new Date(body.startDate) : null,
      dueDate: body.dueDate === undefined ? undefined : body.dueDate ? new Date(body.dueDate) : null,
      budget: body.budget === undefined ? undefined : body.budget === "" || body.budget === null ? null : Number(body.budget),
      internalCost: body.internalCost === undefined ? undefined : body.internalCost === "" || body.internalCost === null ? null : Number(body.internalCost),
      clientVisible: body.clientVisible === undefined ? undefined : Boolean(body.clientVisible),
    },
    include: { tasks: { orderBy: { sortOrder: "asc" } }, company: { select: { name: true, shortName: true, slug: true } }, engagement: { select: { id: true, name: true } }, notes: { orderBy: { createdAt: "desc" }, take: 5 } },
  });
  await prisma.projectActivity.create({ data: { projectId: project.id, type: "work_order_updated", message: "Work order details updated", actor: "UPZ Admin" } });
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
