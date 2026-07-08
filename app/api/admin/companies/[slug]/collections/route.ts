import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await request.json().catch(() => null);
    const name = String(body?.name || "").trim();

    if (!name) {
      return NextResponse.json({ error: "Collection name is required" }, { status: 400 });
    }

    const company = await prisma.company.findUnique({ where: { slug } });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const collection = await prisma.collection.create({
      data: {
        companyId: company.id,
        name,
        slug: slugify(String(body?.slug || name)),
        description: body?.description ? String(body.description).trim() : null,
        heroImage: body?.heroImage ? String(body.heroImage).trim() : null,
        sortOrder: Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : 0,
        active: Boolean(body?.active ?? true),
      },
    });

    return NextResponse.json(collection, { status: 201 });
  } catch (error: any) {
    console.error("Admin create collection API error:", error);

    if (error?.code === "P2002") {
      return NextResponse.json({ error: "That collection slug is already in use" }, { status: 409 });
    }

    return NextResponse.json({ error: "Unable to create collection" }, { status: 500 });
  }
}
