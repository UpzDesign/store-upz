import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/staff-auth";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await requireStaffSession(["admin"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const member = await prisma.teamMember.findUnique({ where: { id: Number(id) } });
  if (!member) return NextResponse.json({ error: "Team member not found" }, { status: 404 });

  const body = await request.json();
  const type = String(body?.type || "");
  const action = String(body?.action || "assign");
  const recordId = Number(body?.recordId);
  if (!recordId || !["project", "task"].includes(type) || !["assign", "unassign"].includes(action)) {
    return NextResponse.json({ error: "Invalid assignment request" }, { status: 400 });
  }

  const assignedTo = action === "assign" ? member.name : null;

  if (type === "project") {
    const project = await prisma.project.update({ where: { id: recordId }, data: { assignedTo } });
    await prisma.projectActivity.create({
      data: {
        projectId: project.id,
        type: action === "assign" ? "project_assigned" : "project_unassigned",
        message: action === "assign" ? `Project assigned to ${member.name}` : `Project unassigned from ${member.name}`,
        actor: session.name,
      },
    });
    return NextResponse.json(project);
  }

  const task = await prisma.projectTask.findUnique({ where: { id: recordId } });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  if (action === "unassign" && task.assignedTo !== member.name) {
    return NextResponse.json({ error: "Task is assigned to another team member" }, { status: 409 });
  }

  const updated = await prisma.projectTask.update({ where: { id: recordId }, data: { assignedTo } });
  await prisma.projectActivity.create({
    data: {
      projectId: task.projectId,
      type: action === "assign" ? "task_assigned" : "task_unassigned",
      message: action === "assign" ? `${task.title} assigned to ${member.name}` : `${task.title} unassigned from ${member.name}`,
      actor: session.name,
    },
  });
  return NextResponse.json(updated);
}
