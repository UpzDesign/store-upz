import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/staff-auth";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await requireStaffSession(["admin"]);
  if (!session) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const { id } = await context.params;
  const projectId = Number(id);
  const body = await request.json();
  const title = String(body?.title || "").trim();
  if (!Number.isInteger(projectId) || projectId < 1) return NextResponse.json({ error: "Invalid work order id" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "Stage title is required" }, { status: 400 });

  const tasks = await prisma.projectTask.findMany({ where: { projectId }, orderBy: { sortOrder: "asc" } });
  let insertAt = tasks.length;

  if (body?.position === "after_completed") {
    const lastCompletedIndex = tasks.reduce((last, task, index) => ["complete", "completed"].includes(task.status.toLowerCase()) ? index : last, -1);
    insertAt = lastCompletedIndex + 1;
  } else if (body?.afterTaskId) {
    const taskIndex = tasks.findIndex((task) => task.id === Number(body.afterTaskId));
    if (taskIndex >= 0) insertAt = taskIndex + 1;
  } else if (body?.sortOrder !== undefined) {
    insertAt = Math.max(0, Math.min(tasks.length, Number(body.sortOrder) || 0));
  }

  const task = await prisma.$transaction(async (tx) => {
    const tasksToShift = tasks.filter((item) => item.sortOrder >= insertAt);
    for (const item of [...tasksToShift].sort((a, b) => b.sortOrder - a.sortOrder)) {
      await tx.projectTask.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder + 1 } });
    }

    const created = await tx.projectTask.create({
      data: {
        projectId,
        title,
        description: body?.description ? String(body.description).trim() : null,
        status: String(body?.status || "todo"),
        priority: String(body?.priority || "normal"),
        assignedTo: body?.assignedTo ? String(body.assignedTo).trim() : null,
        dueDate: body?.dueDate ? new Date(body.dueDate) : null,
        sortOrder: insertAt,
      },
    });

    await tx.projectActivity.create({
      data: {
        projectId,
        type: "task_created",
        message: `Work stage added: ${title}`,
        actor: session.name,
      },
    });
    return created;
  });

  return NextResponse.json(task, { status: 201 });
}
