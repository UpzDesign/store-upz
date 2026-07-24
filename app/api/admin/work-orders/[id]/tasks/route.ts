import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const projectId = Number(id);
  const body = await request.json();
  const title = String(body?.title || "").trim();
  if (!title) return NextResponse.json({ error: "Task title is required" }, { status: 400 });

  const lastTask = await prisma.projectTask.findFirst({ where: { projectId }, orderBy: { sortOrder: "desc" } });
  const task = await prisma.projectTask.create({
    data: {
      projectId,
      title,
      description: body?.description ? String(body.description).trim() : null,
      status: String(body?.status || "todo"),
      priority: String(body?.priority || "normal"),
      assignedTo: body?.assignedTo ? String(body.assignedTo).trim() : null,
      dueDate: body?.dueDate ? new Date(body.dueDate) : null,
      sortOrder: (lastTask?.sortOrder ?? -1) + 1,
    },
  });
  await prisma.projectActivity.create({ data: { projectId, type: "task_created", message: `Task added: ${title}`, actor: "UPZ Admin" } });
  return NextResponse.json(task, { status: 201 });
}
