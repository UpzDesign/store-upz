import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string; taskId: string }> }) {
  try {
    const { id, taskId } = await context.params;
    const body = await request.json();
    const data: any = {};
    for (const key of ["title", "description", "status", "priority", "assignedTo"]) if (key in body) data[key] = body[key] || null;
    if ("dueDate" in body) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if ("sortOrder" in body) data.sortOrder = Number(body.sortOrder) || 0;
    const task = await prisma.projectTask.update({ where: { id: Number(taskId) }, data });
    await prisma.projectActivity.create({ data: { projectId: Number(id), type: "task_updated", message: `Task updated: ${task.title}`, actor: "UPZ Admin" } });
    return NextResponse.json(task);
  } catch { return NextResponse.json({ error: "Unable to update task" }, { status: 500 }); }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string; taskId: string }> }) {
  try { const { taskId } = await context.params; await prisma.projectTask.delete({ where: { id: Number(taskId) } }); return NextResponse.json({ success: true }); }
  catch { return NextResponse.json({ error: "Unable to delete task" }, { status: 500 }); }
}