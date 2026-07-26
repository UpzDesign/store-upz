import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  const taskId = Number(id);
  const existing = await prisma.projectTask.findUnique({ where: { id: taskId } });
  if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const task = await prisma.projectTask.update({
    where: { id: taskId },
    data: {
      title: body.title === undefined ? undefined : String(body.title).trim(),
      status: body.status === undefined ? undefined : String(body.status),
      priority: body.priority === undefined ? undefined : String(body.priority),
      assignedTo: body.assignedTo === undefined ? undefined : body.assignedTo ? String(body.assignedTo).trim() : null,
      dueDate: body.dueDate === undefined ? undefined : body.dueDate ? new Date(body.dueDate) : null,
    },
  });

  let message = `Task updated: ${task.title}.`;
  if (body.status !== undefined && existing.status !== task.status) message = task.status === "complete" ? `Task completed: ${task.title}.` : `Task “${task.title}” moved to ${task.status.replaceAll("_", " ")}.`;
  else if (body.assignedTo !== undefined && existing.assignedTo !== task.assignedTo) message = task.assignedTo ? `Task “${task.title}” assigned to ${task.assignedTo}.` : `Task assignment removed: ${task.title}.`;
  else if (body.dueDate !== undefined) message = `Task due date updated: ${task.title}.`;

  await prisma.projectActivity.create({ data: { projectId: task.projectId, type: "task_updated", message, actor: "UPZ Admin" } });
  return NextResponse.json(task);
}
