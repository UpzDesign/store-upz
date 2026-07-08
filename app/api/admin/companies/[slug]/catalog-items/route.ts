import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const company = await prisma.company.findUnique({
      where: { slug },
      include: {
        catalogItems: {
          include: {
            collection: true,
            product: true,
          },
          orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(company.catalogItems);
  } catch (error) {
    console.error("Admin catalog items API error:", error);
    return NextResponse.json({ error: "Unable to load catalog items" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await request.json().catch(() => null);
    const title = String(body?.title || "").trim();

    if (!title) {
      return NextResponse.json({ error: "Catalog item title is required" }, { status: 400 });
    }

    const company = await prisma.company.findUnique({ where: { slug } });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const item = await prisma.catalogItem.create({
      data: {
        companyId: company.id,
        collectionId: body?.collectionId ? Number(body.collectionId) : null,
        itemType: String(body?.itemType || "service"),
        sourceVendor: body?.sourceVendor ? String(body.sourceVendor).trim() : "manual",
        sourceProductId: body?.sourceProductId ? String(body.sourceProductId).trim() : null,
        title,
        description: body?.description ? String(body.description).trim() : null,
        thumbnail: body?.thumbnail ? String(body.thumbnail).trim() : null,
        price:
          body?.price === "" || body?.price === null || body?.price === undefined
            ? null
            : Number(body.price),
        sku: body?.sku ? String(body.sku).trim() : null,
        featured: Boolean(body?.featured),
        active: Boolean(body?.active ?? true),
        sortOrder: Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : 0,
      },
      include: {
        collection: true,
        product: true,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Admin create catalog item API error:", error);
    return NextResponse.json({ error: "Unable to create catalog item" }, { status: 500 });
  }
}
