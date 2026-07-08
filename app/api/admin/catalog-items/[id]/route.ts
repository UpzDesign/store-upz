import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const catalogItemId = Number(id);
    const body = await request.json().catch(() => null);

    if (!Number.isFinite(catalogItemId)) {
      return NextResponse.json({ error: "Invalid catalog item id" }, { status: 400 });
    }

    const item = await prisma.catalogItem.update({
      where: { id: catalogItemId },
      data: {
        collectionId:
          body?.collectionId === "" || body?.collectionId === null || body?.collectionId === undefined
            ? null
            : Number(body.collectionId),
        itemType: body?.itemType ? String(body.itemType).trim() : undefined,
        title: body?.title ? String(body.title).trim() : undefined,
        description: body?.description === "" ? null : body?.description ? String(body.description).trim() : undefined,
        thumbnail: body?.thumbnail === "" ? null : body?.thumbnail ? String(body.thumbnail).trim() : undefined,
        price:
          body?.price === "" || body?.price === null || body?.price === undefined
            ? null
            : Number(body.price),
        sku: body?.sku === "" ? null : body?.sku ? String(body.sku).trim() : undefined,
        featured: typeof body?.featured === "boolean" ? body.featured : undefined,
        active: typeof body?.active === "boolean" ? body.active : undefined,
        sortOrder: Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : undefined,
      },
      include: {
        collection: true,
        product: true,
      },
    });

    if (item.productId) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          name: item.title,
          thumbnail: item.thumbnail,
          price: item.price,
          collection: item.collection?.name || null,
          featured: item.featured,
          active: item.active,
          sortOrder: item.sortOrder,
        },
      });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Admin catalog item update API error:", error);
    return NextResponse.json({ error: "Unable to update catalog item" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const catalogItemId = Number(id);

    if (!Number.isFinite(catalogItemId)) {
      return NextResponse.json({ error: "Invalid catalog item id" }, { status: 400 });
    }

    await prisma.packageItem.deleteMany({ where: { catalogItemId } });
    await prisma.catalogItem.delete({ where: { id: catalogItemId } });

    return NextResponse.json({ deleted: true, id: catalogItemId });
  } catch (error) {
    console.error("Admin catalog item delete API error:", error);
    return NextResponse.json({ error: "Unable to delete catalog item" }, { status: 500 });
  }
}
