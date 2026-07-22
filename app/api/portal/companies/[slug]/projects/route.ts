import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function progressFor(tasks: Array<{ status: string }>) {
  const completed = tasks.filter((task) => task.status === "complete").length;
  return tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
}

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const company = await prisma.company.findUnique({ where: { slug }, select: { id: true } });
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const engagements = await prisma.engagement.findMany({
      where: { companyId: company.id, clientVisible: true, status: { notIn: ["archived", "cancelled"] } },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        description: true,
        status: true,
        budget: true,
        updatedAt: true,
        assets: {
          where: { active: true },
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, category: true, fileUrl: true, description: true, createdAt: true },
        },
        workOrders: {
          where: { clientVisible: true, status: { notIn: ["cancelled"] } },
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            budget: true,
            dueDate: true,
            updatedAt: true,
            tasks: { orderBy: { sortOrder: "asc" }, select: { id: true, title: true, description: true, status: true, dueDate: true, sortOrder: true } },
            notes: { where: { visibility: "client" }, orderBy: { createdAt: "desc" }, select: { id: true, body: true, author: true, createdAt: true } },
            activities: { where: { type: { in: ["status_changed", "project_created"] } }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, message: true, actor: true, createdAt: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(engagements.map((engagement) => {
      const workOrders = engagement.workOrders.map((workOrder) => ({
        ...workOrder,
        progress: progressFor(workOrder.tasks),
      }));
      const progress = workOrders.length
        ? Math.round(workOrders.reduce((total, workOrder) => total + workOrder.progress, 0) / workOrders.length)
        : 0;
      const activeWorkOrders = workOrders.filter((workOrder) => !["complete", "completed", "delivered"].includes(workOrder.status.toLowerCase())).length;
      return { ...engagement, workOrders, progress, activeWorkOrders };
    }));
  } catch (error) {
    console.error("Portal engagement workspaces error:", error);
    return NextResponse.json({ error: "Unable to load workspaces" }, { status: 500 });
  }
}
