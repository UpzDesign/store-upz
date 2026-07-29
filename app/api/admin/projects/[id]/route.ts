import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const include = {
  company: true,
  engagement: true,
  request: true,
  package: true,
  tasks: {
    orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
    include: {
      checklist: { orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }] },
      comments: { orderBy: { createdAt: "desc" as const } },
      attachments: { orderBy: { createdAt: "desc" as const } },
    },
  },
  notes: { orderBy: { createdAt: "desc" as const } },
  activities: { orderBy: { createdAt: "desc" as const }, take: 100 },
};

export async function GET(_r: NextRequest, c: { params: Promise<{ id: string }> }) {
  const { id } = await c.params;
  const project = await prisma.project.findUnique({ where: { id: Number(id) }, include });
  return project
    ? NextResponse.json(project, { headers: { "Cache-Control": "private, no-store, max-age=0" } })
    : NextResponse.json({ error: "Project not found" }, { status: 404 });
}

export async function PATCH(request: NextRequest, c: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await c.params;
    const body = await request.json();
    const existing = await prisma.project.findUnique({ where: { id: Number(id) } });
    if (!existing) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    const data: any = {};
    for (const key of ["title", "description", "status", "priority", "assignedTo"]) if (key in body) data[key] = body[key] ? String(body[key]).trim() : null;
    for (const key of ["startDate", "dueDate"]) if (key in body) data[key] = body[key] ? new Date(body[key]) : null;
    for (const key of ["budget", "internalCost"]) if (key in body) data[key] = Number.isFinite(Number(body[key])) ? Number(body[key]) : null;
    if ("clientVisible" in body) data.clientVisible = Boolean(body.clientVisible);
    const changedStatus = data.status && data.status !== existing.status;
    const project = await prisma.project.update({
      where: { id: Number(id) },
      data: {
        ...data,
        ...(changedStatus ? { activities: { create: { type: "status_changed", message: `Status changed from ${existing.status} to ${data.status}`, actor: "UPZ Admin" } } } : {}),
      },
      include,
    });
    return NextResponse.json(project, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to update project" }, { status: 500 });
  }
}

export async function DELETE(_r: NextRequest, c: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await c.params;
    await prisma.project.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete project" }, { status: 500 });
  }
}