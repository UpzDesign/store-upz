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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const collectionId = Number(id);
    const body = await request.json().catch(() => null);

    if (!Number.isFinite(collectionId)) {
      return NextResponse.json({ error: "Invalid collection id" }, { status: 400 });
    }

    const collection = await prisma.collection.update({
      where: { id: collectionId },
      data: {
        name: body?.name ? String(body.name).trim() : undefined,
        slug: body?.slug ? slugify(String(body.slug)) : undefined,
        description: body?.description === "" ? null : body?.description ? String(body.description).trim() : undefined,
        heroImage: body?.heroImage === "" ? null : body?.heroImage ? String(body.heroImage).trim() : undefined,
        sortOrder: Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : undefined,
        active: typeof body?.active === "boolean" ? body.active : undefined,
      },
    });

    return NextResponse.json(collection);
  } catch (error: any) {
    console.error("Admin update collection API error:", error);

    if (error?.code === "P2002") {
      return NextResponse.json({ error: "That collection slug is already in use" }, { status: 409 });
    }

    return NextResponse.json({ error: "Unable to update collection" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const collectionId = Number(id);

    if (!Number.isFinite(collectionId)) {
      return NextResponse.json({ error: "Invalid collection id" }, { status: 400 });
    }

    await prisma.collection.delete({ where: { id: collectionId } });

    return NextResponse.json({ deleted: true, id: collectionId });
  } catch (error) {
    console.error("Admin delete collection API error:", error);
    return NextResponse.json({ error: "Unable to delete collection" }, { status: 500 });
  }
}
