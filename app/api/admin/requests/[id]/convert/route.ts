import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWorkflowTemplate } from "@/lib/workflow-templates";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || `project-${Date.now()}`;
}

function parseRequestDescription(value?: string | null) {
  const source = value || "";
  const marker = "__UPZ_CONTEXT__";
  const index = source.lastIndexOf(marker);
  if (index < 0) return { description: source || null, context: null as any };
  const description = source.slice(0, index).trim() || null;
  try { return { description, context: JSON.parse(source.slice(index + marker.length).trim()) }; }
  catch { return { description: source || null, context: null as any }; }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const requestId = Number(id);
    const body = await request.json().catch(() => ({}));
    if (!Number.isInteger(requestId) || requestId <= 0) return NextResponse.json({ error: "Invalid request id" }, { status: 400 });

    const source = await prisma.marketingRequest.findUnique({ where: { id: requestId } });
    if (!source) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    const existingProject = await prisma.project.findUnique({ where: { requestId: source.id } });
    if (existingProject) return NextResponse.json(existingProject);

    const parsed = parseRequestDescription(source.description);
    const requestContext = parsed.context || {};
    const workflow = getWorkflowTemplate(source.type || source.title);
    const startDate = body?.startDate ? new Date(`${body.startDate}T12:00:00`) : new Date();
    const dueDate = body?.dueDate ? new Date(`${body.dueDate}T12:00:00`) : new Date(startDate.getTime() + Math.max(...workflow.map((step) => step.durationDays || 0), 7) * 86400000);

    const project = await prisma.$transaction(async (tx) => {
      let engagement = requestContext.engagementId ? await tx.engagement.findFirst({ where: { id: Number(requestContext.engagementId), companyId: source.companyId } }) : null;
      if (!engagement && requestContext.engagementName) {
        const baseSlug = slugify(String(requestContext.engagementName));
        engagement = await tx.engagement.findFirst({ where: { companyId: source.companyId, OR: [{ slug: baseSlug }, { name: { equals: String(requestContext.engagementName), mode: "insensitive" } }] } });
        if (!engagement) {
          let uniqueSlug = baseSlug;
          let suffix = 2;
          while (await tx.engagement.findUnique({ where: { companyId_slug: { companyId: source.companyId, slug: uniqueSlug } } })) uniqueSlug = `${baseSlug}-${suffix++}`;
          engagement = await tx.engagement.create({ data: { companyId: source.companyId, name: String(requestContext.engagementName), slug: uniqueSlug, type: String(requestContext.engagementType || "campaign"), address: requestContext.propertyAddress ? String(requestContext.propertyAddress) : null } });
        }
      }

      const created = await tx.project.create({
        data: {
          companyId: source.companyId,
          engagementId: engagement?.id || null,
          requestId: source.id,
          packageId: requestContext.packageId ? Number(requestContext.packageId) : null,
          title: String(body?.title || source.title).trim(),
          description: parsed.description,
          status: "new",
          priority: String(body?.priority || source.priority || "normal"),
          assignedTo: body?.assignedTo ? String(body.assignedTo).trim() : null,
          startDate,
          dueDate,
          clientVisible: body?.clientVisible === undefined ? true : Boolean(body.clientVisible),
          tasks: { create: workflow.map((step, index) => { const taskDueDate = new Date(startDate); taskDueDate.setDate(taskDueDate.getDate() + (step.durationDays || index)); return { title: step.title, description: step.description, status: index === 0 ? "in_progress" : "todo", priority: source.priority || "normal", dueDate: taskDueDate, sortOrder: index }; }) },
          activities: { create: [
            { type: "project_created", message: "Request approved and converted into a project.", actor: "UPZ Admin" },
            { type: "assignment_changed", message: body?.assignedTo ? `Assigned to ${String(body.assignedTo).trim()}.` : "Project created without an assignee.", actor: "UPZ Admin" },
            { type: "schedule_created", message: `Project scheduled from ${startDate.toLocaleDateString("en-US")} to ${dueDate.toLocaleDateString("en-US")}.`, actor: "UPZ Admin" },
          ] },
        },
      });
      await tx.marketingRequest.update({ where: { id: source.id }, data: { status: "approved" } });
      return created;
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error("Convert request error:", error);
    if (error?.code === "P2002") {
      const { id } = await context.params;
      const existing = await prisma.project.findUnique({ where: { requestId: Number(id) } });
      if (existing) return NextResponse.json(existing);
    }
    return NextResponse.json({ error: "Unable to create project" }, { status: 500 });
  }
}
