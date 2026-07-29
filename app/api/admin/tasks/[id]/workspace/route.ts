import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const include = {
  checklist: { orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }] },
  comments: { orderBy: { createdAt: "desc" as const } },
  attachments: { orderBy: { createdAt: "desc" as const } },
};

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const task = await prisma.projectTask.findUnique({ where: { id: Number(id) }, include });
  return task ? NextResponse.json(task) : NextResponse.json({ error: "Task not found" }, { status: 404 });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const taskId = Number(id);
    const body = await request.json();
    const task = await prisma.projectTask.findUnique({ where: { id: taskId } });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    const action = String(body?.action || "");

    if (action === "add_checklist") {
      const title = String(body?.title || "").trim();
      if (!title) return NextResponse.json({ error: "Checklist title is required" }, { status: 400 });
      const count = await prisma.taskChecklistItem.count({ where: { taskId } });
      await prisma.taskChecklistItem.create({ data: { taskId, title, sortOrder: count } });
      await prisma.projectActivity.create({ data: { projectId: task.projectId, type: "task_checklist_added", message: `Checklist item added to ${task.title}: ${title}`, actor: "UPZ Admin" } });
    } else if (action === "toggle_checklist") {
      const itemId = Number(body?.itemId);
      const item = await prisma.taskChecklistItem.findFirst({ where: { id: itemId, taskId } });
      if (!item) return NextResponse.json({ error: "Checklist item not found" }, { status: 404 });
      await prisma.taskChecklistItem.update({ where: { id: item.id }, data: { completed: !item.completed } });
    } else if (action === "add_comment") {
      const message = String(body?.message || "").trim();
      if (!message) return NextResponse.json({ error: "Comment is required" }, { status: 400 });
      await prisma.taskComment.create({ data: { taskId, body: message, author: String(body?.author || "UPZ Admin"), visibility: String(body?.visibility || "internal") } });
      await prisma.projectActivity.create({ data: { projectId: task.projectId, type: "task_comment", message: `Comment added to task: ${task.title}`, actor: String(body?.author || "UPZ Admin") } });
    } else if (action === "add_attachment") {
      const title = String(body?.title || "").trim();
      const fileUrl = String(body?.fileUrl || "").trim();
      if (!title || !fileUrl) return NextResponse.json({ error: "Attachment title and URL are required" }, { status: 400 });
      await prisma.taskAttachment.create({ data: { taskId, title, fileUrl, fileType: body?.fileType ? String(body.fileType).trim() : null } });
      await prisma.projectActivity.create({ data: { projectId: task.projectId, type: "task_attachment", message: `Attachment added to task: ${task.title}`, actor: "UPZ Admin" } });
    } else {
      return NextResponse.json({ error: "Unsupported task action" }, { status: 400 });
    }

    const updated = await prisma.projectTask.findUnique({ where: { id: taskId }, include });
    return NextResponse.json(updated, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to update task workspace" }, { status: 500 });
  }
}