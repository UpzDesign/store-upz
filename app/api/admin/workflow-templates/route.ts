import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWorkflowTemplate, type WorkflowStep } from "@/lib/workflow-templates";

const PREFIX = "workflow:";

function parseStored(value: string | null | undefined): WorkflowStep[] | null {
  if (!value?.startsWith(PREFIX)) return null;
  try {
    const parsed = JSON.parse(value.slice(PREFIX.length));
    if (!Array.isArray(parsed)) return null;
    return parsed
      .map((step) => ({
        title: String(step?.title || "").trim(),
        description: String(step?.description || "").trim(),
        durationDays: Math.max(0, Number(step?.durationDays || 0)),
        clientVisible: step?.clientVisible !== false,
      }))
      .filter((step) => step.title);
  } catch {
    return null;
  }
}

export async function GET() {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, slug: true, name: true, description: true, estimatedDuration: true },
  });

  return NextResponse.json(
    services.map((service) => ({
      id: service.id,
      slug: service.slug,
      name: service.name,
      description: service.description,
      customized: Boolean(parseStored(service.estimatedDuration)),
      stages: parseStored(service.estimatedDuration) || getWorkflowTemplate(service.slug),
    })),
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const serviceId = Number(body?.serviceId);
  if (!serviceId || !Array.isArray(body?.stages)) {
    return NextResponse.json({ error: "Service and stages are required" }, { status: 400 });
  }

  const stages: WorkflowStep[] = body.stages
    .map((step: any) => ({
      title: String(step?.title || "").trim(),
      description: String(step?.description || "").trim(),
      durationDays: Math.max(0, Number(step?.durationDays || 0)),
      clientVisible: step?.clientVisible !== false,
    }))
    .filter((step: WorkflowStep) => step.title);

  if (!stages.length) return NextResponse.json({ error: "Add at least one stage" }, { status: 400 });

  const service = await prisma.service.update({
    where: { id: serviceId },
    data: { estimatedDuration: `${PREFIX}${JSON.stringify(stages)}` },
    select: { id: true, slug: true, name: true, description: true },
  });

  return NextResponse.json({ ...service, customized: true, stages });
}

export async function DELETE(request: NextRequest) {
  const serviceId = Number(new URL(request.url).searchParams.get("serviceId"));
  if (!serviceId) return NextResponse.json({ error: "Service is required" }, { status: 400 });
  const service = await prisma.service.update({
    where: { id: serviceId },
    data: { estimatedDuration: null },
    select: { id: true, slug: true, name: true, description: true },
  });
  return NextResponse.json({ ...service, customized: false, stages: getWorkflowTemplate(service.slug) });
}
