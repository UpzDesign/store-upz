import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const title = String(body?.title || "").trim();
    if (!title) return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    const task = await prisma.projectTask.create({ data: { projectId: Number(id), title, description: body?.description || null, priority: body?.priority || "normal", assignedTo: body?.assignedTo || null, dueDate: body?.dueDate ? new Date(body.dueDate) : null, sortOrder: Number(body?.sortOrder) || 0 } });
    await prisma.projectActivity.create({ data: { projectId: Number(id), type: "task_created", message: `Task created: ${title}`, actor: "UPZ Admin" } });
    return NextResponse.json(task, { status: 201 });
  } catch (error) { console.error(error); return NextResponse.json({ error: "Unable to create task" }, { status: 500 }); }
}