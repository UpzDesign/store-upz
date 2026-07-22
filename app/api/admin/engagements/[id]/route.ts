import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const engagement = await prisma.engagement.findUnique({
    where: { id: Number(id) },
    include: {
      company: true,
      assets: { where: { active: true }, orderBy: { updatedAt: "desc" } },
      workOrders: {
        include: {
          tasks: { orderBy: { sortOrder: "asc" } },
          notes: { orderBy: { createdAt: "desc" }, take: 20 },
          activities: { orderBy: { createdAt: "desc" }, take: 20 },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
  if (!engagement) return NextResponse.json({ error: "Engagement not found" }, { status: 404 });
  const totalTasks = engagement.workOrders.reduce((sum, item) => sum + item.tasks.length, 0);
  const completeTasks = engagement.workOrders.reduce((sum, item) => sum + item.tasks.filter((task) => task.status === "complete").length, 0);
  const totalBudget = engagement.workOrders.reduce((sum, item) => sum + Number(item.budget || 0), 0);
  const totalCost = engagement.workOrders.reduce((sum, item) => sum + Number(item.internalCost || 0), 0);
  const activity = engagement.workOrders.flatMap((item) => item.activities.map((entry) => ({ ...entry, workOrderTitle: item.title }))).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 30);
  return NextResponse.json({ ...engagement, progress: totalTasks ? Math.round((completeTasks / totalTasks) * 100) : 0, totalBudget: Number(engagement.budget || totalBudget), totalCost, activity });
}
