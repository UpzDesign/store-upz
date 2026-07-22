import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const requestId = Number(id);
    const body = await request.json().catch(() => ({}));
    if (!Number.isFinite(requestId)) return NextResponse.json({ error: "Invalid request id" }, { status: 400 });

    const source = await prisma.marketingRequest.findUnique({ where: { id: requestId }, include: { project: true } });
    if (!source) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (source.project) return NextResponse.json(source.project);

    const project = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          companyId: source.companyId,
          requestId: source.id,
          title: String(body?.title || source.title).trim(),
          description: source.description,
          status: "new",
          priority: String(body?.priority || source.priority || "normal"),
          assignedTo: body?.assignedTo ? String(body.assignedTo).trim() : null,
          dueDate: body?.dueDate ? new Date(body.dueDate) : null,
        },
      });
      await tx.marketingRequest.update({ where: { id: source.id }, data: { status: "reviewing" } });
      await tx.projectActivity.create({ data: { projectId: created.id, type: "project_created", message: "Request converted into an active project.", actor: "UPZ Admin" } });
      return created;
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Convert request error:", error);
    return NextResponse.json({ error: "Unable to create project" }, { status: 500 });
  }
}
