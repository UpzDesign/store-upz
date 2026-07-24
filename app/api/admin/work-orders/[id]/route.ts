import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  const allowed = ["new", "in_progress", "waiting_client", "review", "complete", "cancelled"];
  if (body.status && !allowed.includes(body.status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const project = await prisma.project.update({
    where: { id: Number(id) },
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
  return NextResponse.json(project);
}
