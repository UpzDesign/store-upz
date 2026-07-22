import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ProjectWithWorkflow = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  updatedAt: Date;
  tasks: Array<{ id: number; title: string; description: string | null; status: string; dueDate: Date | null; sortOrder: number }>;
  notes: Array<{ id: number; body: string; author: string | null; createdAt: Date }>;
  activities: Array<{ id: number; message: string; actor: string | null; createdAt: Date }>;
};

function progressFor(project: ProjectWithWorkflow) {
  const completed = project.tasks.filter((task) => task.status === "complete").length;
  return project.tasks.length ? Math.round((completed / project.tasks.length) * 100) : 0;
}

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const company = await prisma.company.findUnique({ where: { slug }, select: { id: true } });
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const projects = await prisma.project.findMany({
      where: { companyId: company.id, clientVisible: true, status: { notIn: ["cancelled"] } },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        updatedAt: true,
        tasks: { orderBy: { sortOrder: "asc" }, select: { id: true, title: true, description: true, status: true, dueDate: true, sortOrder: true } },
        notes: { where: { visibility: "client" }, orderBy: { createdAt: "desc" }, select: { id: true, body: true, author: true, createdAt: true } },
        activities: { where: { type: { in: ["status_changed", "project_created"] } }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, message: true, actor: true, createdAt: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const workOrders = projects.map((project) => ({ ...project, progress: progressFor(project) }));
    return NextResponse.json(workOrders);
  } catch (error) {
    console.error("Portal work orders error:", error);
    return NextResponse.json({ error: "Unable to load work orders" }, { status: 500 });
  }
}
