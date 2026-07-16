import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const company = await prisma.company.findUnique({
      where: { slug },
      include: {
        packages: {
          include: { items: { include: { catalogItem: true } } },
          orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
        },
        catalogItems: { where: { active: true }, orderBy: [{ sortOrder: "asc" }, { title: "asc" }] },
      },
    });
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });
    return NextResponse.json({ packages: company.packages, catalogItems: company.catalogItems });
  } catch (error) {
    console.error("Admin packages API error:", error);
    return NextResponse.json({ error: "Unable to load packages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const body = await request.json().catch(() => null);
    const title = String(body?.title || "").trim();
    if (!title) return NextResponse.json({ error: "Package title is required" }, { status: 400 });
    const company = await prisma.company.findUnique({ where: { slug } });
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const selectedItems = Array.isArray(body?.items) ? body.items : [];
    const created = await prisma.package.create({
      data: {
        companyId: company.id,
        title,
        description: body?.description ? String(body.description).trim() : null,
        featured: Boolean(body?.featured),
        active: Boolean(body?.active ?? true),
        sortOrder: Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : 0,
        items: {
          create: selectedItems
            .filter((item: any) => Number.isFinite(Number(item.catalogItemId)))
            .map((item: any) => ({ catalogItemId: Number(item.catalogItemId), quantity: Math.max(1, Number(item.quantity) || 1) })),
        },
      },
      include: { items: { include: { catalogItem: true } } },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Create package error:", error);
    return NextResponse.json({ error: "Unable to create package" }, { status: 500 });
  }
}
