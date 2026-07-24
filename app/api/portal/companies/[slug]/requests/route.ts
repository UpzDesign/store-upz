import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWorkflowTemplate } from "@/lib/workflow-templates";

function labelFromKey(key: string) {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || `project-${Date.now()}`;
}

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const company = await prisma.company.findUnique({ where: { slug } });
    if (!company || !company.portalEnabled) return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    const requests = await prisma.marketingRequest.findMany({ where: { companyId: company.id }, orderBy: { createdAt: "desc" }, take: 12 });
    return NextResponse.json(requests, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Portal requests API error:", error);
    return NextResponse.json({ error: "Unable to load requests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const body = await request.json().catch(() => null);
    const company = await prisma.company.findUnique({ where: { slug } });
    if (!company || !company.portalEnabled) return NextResponse.json({ error: "Portal not found" }, { status: 404 });

    const service = String(body?.service || body?.type || "Custom Project").trim();
    const submittedTitle = String(body?.projectTitle || body?.title || service).trim();
    const engagementName = String(body?.engagementName || body?.propertyName || body?.projectName || body?.address || body?.propertyAddress || submittedTitle).trim();
    const workOrderTitle = String(body?.workOrderTitle || `${service}${engagementName && engagementName !== service ? ` — ${engagementName}` : ""}`).trim();
    const address = String(body?.propertyAddress || body?.address || "").trim() || null;
    if (!engagementName) return NextResponse.json({ error: "Project, campaign, or property name is required" }, { status: 400 });

    const ignoredKeys = new Set(["projectTitle", "title", "workOrderTitle", "projectName", "engagementName", "engagementId", "propertyName", "priority", "service", "type", "packageId", "packageTitle"]);
    const answers = body?.answers && typeof body.answers === "object" ? body.answers : body;
    const details = Object.entries(answers || {})
      .filter(([key, value]) => !ignoredKeys.has(key) && value !== "" && value !== null && value !== undefined && value !== false)
      .map(([key, value]) => `${labelFromKey(key)}: ${Array.isArray(value) ? value.join(", ") : String(value).trim()}`)
      .join("\n\n");
    const packageSummary = body?.packageId ? `Package ID: ${String(body.packageId)}${body?.packageTitle ? `\nPackage: ${String(body.packageTitle).trim()}` : ""}` : "";
    const description = [packageSummary, details].filter(Boolean).join("\n\n");
    const priority = String(body?.priority || answers?.priority || "normal");
    const workflow = getWorkflowTemplate(service);
    const createdAt = new Date();
    const dueDate = new Date(createdAt);
    dueDate.setDate(dueDate.getDate() + Math.max(...workflow.map((step) => step.durationDays || 0), 7));

    const result = await prisma.$transaction(async (tx) => {
      let engagement = body?.engagementId ? await tx.engagement.findFirst({ where: { id: Number(body.engagementId), companyId: company.id } }) : null;
      if (!engagement) {
        const baseSlug = slugify(engagementName);
        engagement = await tx.engagement.findFirst({
          where: { companyId: company.id, OR: [{ slug: baseSlug }, ...(address ? [{ address: { equals: address, mode: "insensitive" as const } }] : []), { name: { equals: engagementName, mode: "insensitive" as const } }] },
        });
        if (!engagement) {
          let uniqueSlug = baseSlug;
          let suffix = 2;
          while (await tx.engagement.findUnique({ where: { companyId_slug: { companyId: company.id, slug: uniqueSlug } } })) uniqueSlug = `${baseSlug}-${suffix++}`;
          engagement = await tx.engagement.create({
            data: { companyId: company.id, name: engagementName, slug: uniqueSlug, type: address ? "property" : String(body?.engagementType || "campaign"), address, city: body?.city ? String(body.city).trim() : null, state: body?.state ? String(body.state).trim() : null, postalCode: body?.postalCode ? String(body.postalCode).trim() : null, description: body?.engagementDescription ? String(body.engagementDescription).trim() : null },
          });
        }
      }

      const marketingRequest = await tx.marketingRequest.create({ data: { companyId: company.id, type: service, title: workOrderTitle, description: description || null, priority, status: "converted" } });
      const project = await tx.project.create({
        data: {
          companyId: company.id,
          engagementId: engagement.id,
          requestId: marketingRequest.id,
          packageId: body?.packageId ? Number(body.packageId) : null,
          title: workOrderTitle,
          description: description || `${service} work order submitted through the client portal.`,
          status: "new",
          priority,
          startDate: createdAt,
          dueDate,
          clientVisible: true,
          tasks: { create: workflow.map((step, index) => { const taskDueDate = new Date(createdAt); taskDueDate.setDate(taskDueDate.getDate() + (step.durationDays || index)); return { title: step.title, description: step.description, status: index === 0 ? "complete" : index === 1 ? "in_progress" : "todo", priority, dueDate: taskDueDate, sortOrder: index }; }) },
          activities: { create: [{ type: "project_created", message: `${service} work order added to ${engagement.name}.`, actor: "UPZ Workflow Engine" }, { type: "status_changed", message: `Workflow started with ${workflow.length} production stages.`, actor: "UPZ Workflow Engine" }] },
        },
        include: { tasks: { orderBy: { sortOrder: "asc" } }, engagement: true },
      });
      return { request: marketingRequest, engagement, project };
    });

    return NextResponse.json(result, { status: 201, headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Portal create work order API error:", error);
    return NextResponse.json({ error: "Unable to submit work order" }, { status: 500 });
  }
}
