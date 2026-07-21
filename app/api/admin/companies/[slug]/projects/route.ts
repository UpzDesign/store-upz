import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PROJECT_INCLUDE = {
  request: true,
  package: true,
  tasks: { orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }] },
  notes: { orderBy: { createdAt: "desc" as const } },
  activities: { orderBy: { createdAt: "desc" as const }, take: 20 },
};

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const company = await prisma.company.findUnique({
      where: { slug },
      include: {
        projects: {
          include: PROJECT_INCLUDE,
          orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        },
      },
    });
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });
    return NextResponse.json({ company: { id: company.id, name: company.name, slug: company.slug }, projects: company.projects });
  } catch (error) {
    console.error("Load projects error:", error);
    return NextResponse.json({ error: "Unable to load projects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const body = await request.json().catch(() => null);
    const title = String(body?.title || "").trim();
    if (!title) return NextResponse.json({ error: "Project title is required" }, { status: 400 });

    const company = await prisma.company.findUnique({ where: { slug } });
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const project = await prisma.project.create({
      data: {
        companyId: company.id,
        title,
        description: body?.description ? String(body.description).trim() : null,
        status: String(body?.status || "new"),
        priority: String(body?.priority || "normal"),
        assignedTo: body?.assignedTo ? String(body.assignedTo).trim() : null,
        startDate: body?.startDate ? new Date(body.startDate) : null,
        dueDate: body?.dueDate ? new Date(body.dueDate) : null,
        budget: Number.isFinite(Number(body?.budget)) ? Number(body.budget) : null,
        internalCost: Number.isFinite(Number(body?.internalCost)) ? Number(body.internalCost) : null,
        clientVisible: body?.clientVisible !== false,
        packageId: Number.isFinite(Number(body?.packageId)) ? Number(body.packageId) : null,
        activities: { create: { type: "project_created", message: "Project created", actor: "UPZ Admin" } },
      },
      include: PROJECT_INCLUDE,
    });
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json({ error: "Unable to create project" }, { status: 500 });
  }
}