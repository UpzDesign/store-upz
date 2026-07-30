import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const portfolioId = parseId(id);
  if (!portfolioId) return NextResponse.json({ error: "Invalid portfolio id" }, { status: 400 });

  const engagement = await prisma.engagement.findUnique({
    where: { id: portfolioId },
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

  if (!engagement) return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  const totalTasks = engagement.workOrders.reduce((sum, item) => sum + item.tasks.length, 0);
  const completeTasks = engagement.workOrders.reduce((sum, item) => sum + item.tasks.filter((task) => ["complete", "completed"].includes(task.status)).length, 0);
  const totalBudget = engagement.workOrders.reduce((sum, item) => sum + Number(item.budget || 0), 0);
  const totalCost = engagement.workOrders.reduce((sum, item) => sum + Number(item.internalCost || 0), 0);
  const activity = engagement.workOrders
    .flatMap((item) => item.activities.map((entry) => ({ ...entry, workOrderTitle: item.title })))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 30);

  return NextResponse.json(
    { ...engagement, progress: totalTasks ? Math.round((completeTasks / totalTasks) * 100) : 0, totalBudget: Number(engagement.budget || totalBudget), totalCost, activity },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } }
  );
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const portfolioId = parseId(id);
  if (!portfolioId) return NextResponse.json({ error: "Invalid portfolio id" }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const existing = await prisma.engagement.findUnique({ where: { id: portfolioId } });
  if (!existing) return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });

  const status = body.status === undefined ? undefined : String(body.status).trim().toLowerCase();
  if (status !== undefined && !["active", "archived"].includes(status)) {
    return NextResponse.json({ error: "Unsupported portfolio status" }, { status: 400 });
  }

  const updated = await prisma.engagement.update({
    where: { id: portfolioId },
    data: {
      status,
      clientVisible: status === "archived" ? false : body.clientVisible === undefined ? undefined : Boolean(body.clientVisible),
    },
  });

  return NextResponse.json(updated, { headers: { "Cache-Control": "no-store, max-age=0" } });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const portfolioId = parseId(id);
    if (!portfolioId) return NextResponse.json({ error: "Invalid portfolio id" }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const confirmation = String(body?.confirmation || "").trim();
    const portfolio = await prisma.engagement.findUnique({
      where: { id: portfolioId },
      select: { id: true, name: true, workOrders: { select: { id: true, requestId: true } } },
    });
    if (!portfolio) return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    if (confirmation !== portfolio.name) {
      return NextResponse.json({ error: "Type the exact portfolio name to confirm permanent deletion" }, { status: 400 });
    }

    const requestIds = portfolio.workOrders.map((item) => item.requestId).filter((value): value is number => Boolean(value));
    await prisma.$transaction(async (tx) => {
      await tx.project.deleteMany({ where: { engagementId: portfolioId } });
      if (requestIds.length) await tx.marketingRequest.deleteMany({ where: { id: { in: requestIds } } });
      await tx.engagementAsset.deleteMany({ where: { engagementId: portfolioId } });
      await tx.engagement.delete({ where: { id: portfolioId } });
    });

    return NextResponse.json({ deleted: true, id: portfolioId, workOrdersDeleted: portfolio.workOrders.length });
  } catch (error) {
    console.error("Portfolio delete error:", error);
    return NextResponse.json({ error: "Unable to permanently delete portfolio" }, { status: 500 });
  }
}
