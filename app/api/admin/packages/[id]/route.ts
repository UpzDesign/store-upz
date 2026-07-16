import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const packageId = Number(id);
    const body = await request.json().catch(() => null);
    if (!Number.isFinite(packageId)) return NextResponse.json({ error: "Invalid package id" }, { status: 400 });

    const existing = await prisma.package.findUnique({ where: { id: packageId } });
    if (!existing) return NextResponse.json({ error: "Package not found" }, { status: 404 });

    await prisma.packageItem.deleteMany({ where: { packageId } });
    const selectedItems = Array.isArray(body?.items) ? body.items : [];

    const updated = await prisma.package.update({
      where: { id: packageId },
      data: {
        title: String(body?.title ?? existing.title).trim(),
        description: body?.description === "" ? null : body?.description === undefined ? existing.description : String(body.description).trim(),
        featured: typeof body?.featured === "boolean" ? body.featured : existing.featured,
        active: typeof body?.active === "boolean" ? body.active : existing.active,
        sortOrder: Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : existing.sortOrder,
        items: {
          create: selectedItems
            .filter((item: any) => Number.isFinite(Number(item.catalogItemId)))
            .map((item: any) => ({ catalogItemId: Number(item.catalogItemId), quantity: Math.max(1, Number(item.quantity) || 1) })),
        },
      },
      include: { items: { include: { catalogItem: true } } },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update package error:", error);
    return NextResponse.json({ error: "Unable to update package" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const packageId = Number(id);
    if (!Number.isFinite(packageId)) return NextResponse.json({ error: "Invalid package id" }, { status: 400 });
    await prisma.packageItem.deleteMany({ where: { packageId } });
    await prisma.package.delete({ where: { id: packageId } });
    return NextResponse.json({ deleted: true, id: packageId });
  } catch (error) {
    console.error("Delete package error:", error);
    return NextResponse.json({ error: "Unable to delete package" }, { status: 500 });
  }
}
