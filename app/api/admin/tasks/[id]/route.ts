import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  const task = await prisma.projectTask.update({
    where: { id: Number(id) },
    data: {
      title: body.title === undefined ? undefined : String(body.title).trim(),
      status: body.status === undefined ? undefined : String(body.status),
      priority: body.priority === undefined ? undefined : String(body.priority),
      assignedTo: body.assignedTo === undefined ? undefined : body.assignedTo ? String(body.assignedTo).trim() : null,
      dueDate: body.dueDate === undefined ? undefined : body.dueDate ? new Date(body.dueDate) : null,
    },
  });
  await prisma.projectActivity.create({ data: { projectId: task.projectId, type: "task_updated", message: `Task updated: ${task.title}`, actor: "UPZ Admin" } });
  return NextResponse.json(task);
}
