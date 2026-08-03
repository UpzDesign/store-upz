import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parsePropertyDescription, propertyCompleteness, serializePropertyDescription, type PropertyIntelligence } from "@/lib/property-intelligence";

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const propertyId = parseId(id);
  if (!propertyId) return NextResponse.json({ error: "Invalid property id" }, { status: 400 });

  const property = await prisma.engagement.findUnique({
    where: { id: propertyId },
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

  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
  const totalTasks = property.workOrders.reduce((sum, item) => sum + item.tasks.length, 0);
  const completeTasks = property.workOrders.reduce((sum, item) => sum + item.tasks.filter((task) => ["complete", "completed"].includes(task.status)).length, 0);
  const totalBudget = property.workOrders.reduce((sum, item) => sum + Number(item.budget || 0), 0);
  const totalCost = property.workOrders.reduce((sum, item) => sum + Number(item.internalCost || 0), 0);
  const activity = property.workOrders.flatMap((item) => item.activities.map((entry) => ({ ...entry, workOrderTitle: item.title }))).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 30);
  const parsed = parsePropertyDescription(property.description);

  return NextResponse.json({
    ...property,
    description: parsed.summary,
    intelligence: parsed.intelligence,
    intelligenceCompleteness: propertyCompleteness(parsed.intelligence, property.address),
    progress: totalTasks ? Math.round((completeTasks / totalTasks) * 100) : 0,
    totalBudget: Number(property.budget || totalBudget),
    totalCost,
    activity,
  }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const propertyId = parseId(id);
  if (!propertyId) return NextResponse.json({ error: "Invalid property id" }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const existing = await prisma.engagement.findUnique({ where: { id: propertyId } });
  if (!existing) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  const status = body.status === undefined ? undefined : String(body.status).trim().toLowerCase();
  if (status !== undefined && !["active", "archived"].includes(status)) return NextResponse.json({ error: "Unsupported property status" }, { status: 400 });
  const parsed = parsePropertyDescription(existing.description);
  const intelligence = body.intelligence === undefined ? parsed.intelligence : (body.intelligence || {}) as PropertyIntelligence;

  const updated = await prisma.engagement.update({
    where: { id: propertyId },
    data: {
      name: body.name === undefined ? undefined : String(body.name).trim(),
      type: body.type === undefined ? undefined : String(body.type).trim(),
      address: body.address === undefined ? undefined : String(body.address || "").trim() || null,
      city: body.city === undefined ? undefined : String(body.city || "").trim() || null,
      state: body.state === undefined ? undefined : String(body.state || "").trim() || null,
      postalCode: body.postalCode === undefined ? undefined : String(body.postalCode || "").trim() || null,
      description: body.description === undefined && body.intelligence === undefined ? undefined : serializePropertyDescription(body.description === undefined ? parsed.summary : body.description, intelligence),
      status,
      clientVisible: status === "archived" ? false : body.clientVisible === undefined ? undefined : Boolean(body.clientVisible),
    },
  });

  return NextResponse.json(updated, { headers: { "Cache-Control": "no-store, max-age=0" } });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const propertyId = parseId(id);
    if (!propertyId) return NextResponse.json({ error: "Invalid property id" }, { status: 400 });
    const body = await request.json().catch(() => ({}));
    const confirmation = String(body?.confirmation || "").trim();
    const property = await prisma.engagement.findUnique({ where: { id: propertyId }, select: { id: true, name: true, workOrders: { select: { id: true, requestId: true } } } });
    if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
    if (confirmation !== property.name) return NextResponse.json({ error: "Type the exact property name to confirm permanent deletion" }, { status: 400 });

    const requestIds = property.workOrders.map((item) => item.requestId).filter((value): value is number => Boolean(value));
    await prisma.$transaction(async (tx) => {
      await tx.project.deleteMany({ where: { engagementId: propertyId } });
      if (requestIds.length) await tx.marketingRequest.deleteMany({ where: { id: { in: requestIds } } });
      await tx.engagementAsset.deleteMany({ where: { engagementId: propertyId } });
      await tx.engagement.delete({ where: { id: propertyId } });
    });
    return NextResponse.json({ deleted: true, id: propertyId, workOrdersDeleted: property.workOrders.length });
  } catch (error) {
    console.error("Property delete error:", error);
    return NextResponse.json({ error: "Unable to permanently delete property" }, { status: 500 });
  }
}
