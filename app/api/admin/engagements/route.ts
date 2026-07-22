import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const engagements = await prisma.engagement.findMany({
      include: {
        company: { select: { id: true, name: true, shortName: true, slug: true, logo: true, primaryColor: true } },
        workOrders: {
          select: {
            id: true, title: true, status: true, priority: true, budget: true, internalCost: true, dueDate: true, updatedAt: true,
            tasks: { select: { status: true } },
          },
          orderBy: { updatedAt: "desc" },
        },
        assets: { select: { id: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(engagements.map((engagement) => {
      const totalTasks = engagement.workOrders.reduce((sum, project) => sum + project.tasks.length, 0);
      const completeTasks = engagement.workOrders.reduce((sum, project) => sum + project.tasks.filter((task) => task.status === "complete").length, 0);
      const workOrderBudget = engagement.workOrders.reduce((sum, project) => sum + Number(project.budget || 0), 0);
      const cost = engagement.workOrders.reduce((sum, project) => sum + Number(project.internalCost || 0), 0);
      const activeOrders = engagement.workOrders.filter((project) => !["complete", "completed", "cancelled"].includes(project.status.toLowerCase())).length;
      return { ...engagement, progress: totalTasks ? Math.round((completeTasks / totalTasks) * 100) : 0, totalBudget: Number(engagement.budget || workOrderBudget), cost, activeOrders, assetCount: engagement.assets.length };
    }));
  } catch (error) {
    console.error("Admin engagements error:", error);
    return NextResponse.json({ error: "Unable to load engagements" }, { status: 500 });
  }
}
