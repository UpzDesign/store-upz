import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/staff-auth";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await requireStaffSession(["admin"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const memberId = Number(id);
  const existing = await prisma.teamMember.findUnique({ where: { id: memberId } });
  if (!existing) return NextResponse.json({ error: "Team member not found" }, { status: 404 });

  try {
    const body = await request.json();
    const nextName = body.name === undefined ? existing.name : String(body.name).trim();
    if (!nextName) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const member = await prisma.$transaction(async (tx) => {
      if (nextName !== existing.name) {
        await tx.project.updateMany({ where: { assignedTo: existing.name }, data: { assignedTo: nextName } });
        await tx.projectTask.updateMany({ where: { assignedTo: existing.name }, data: { assignedTo: nextName } });
      }
      return tx.teamMember.update({
        where: { id: memberId },
        data: {
          name: nextName,
          email: body.email === undefined ? undefined : body.email ? String(body.email).trim().toLowerCase() : null,
          role: body.role === undefined ? undefined : String(body.role).trim(),
          capacity: body.capacity === undefined ? undefined : Math.max(1, Number(body.capacity)),
          active: body.active === undefined ? undefined : Boolean(body.active),
        },
      });
    });
    return NextResponse.json(member);
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "That name or email is already in use" }, { status: 409 });
    console.error(error);
    return NextResponse.json({ error: "Unable to update team member" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await requireStaffSession(["admin"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const memberId = Number(id);
  const existing = await prisma.teamMember.findUnique({ where: { id: memberId } });
  if (!existing) return NextResponse.json({ error: "Team member not found" }, { status: 404 });

  const result = await prisma.$transaction(async (tx) => {
    const projects = await tx.project.updateMany({ where: { assignedTo: existing.name }, data: { assignedTo: null } });
    const tasks = await tx.projectTask.updateMany({ where: { assignedTo: existing.name }, data: { assignedTo: null } });
    await tx.teamMember.delete({ where: { id: memberId } });
    return { projects: projects.count, tasks: tasks.count };
  });

  return NextResponse.json({ deleted: true, unassigned: result });
}
