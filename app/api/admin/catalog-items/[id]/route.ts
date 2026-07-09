import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseNullableNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

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

    const existingItem = await prisma.catalogItem.findUnique({
      where: { id: catalogItemId },
      include: { collection: true, product: true },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Catalog item not found" }, { status: 404 });
    }

    const nextTitle = String(body?.title ?? existingItem.title).trim();

    if (!nextTitle) {
      return NextResponse.json({ error: "Catalog item title is required" }, { status: 400 });
    }

    const item = await prisma.catalogItem.update({
      where: { id: catalogItemId },
      data: {
        collectionId: parseNullableNumber(body?.collectionId),
        itemType: String(body?.itemType ?? existingItem.itemType).trim(),
        title: nextTitle,
        description: body?.description === "" ? null : body?.description === undefined ? existingItem.description : String(body.description).trim(),
        thumbnail: body?.thumbnail === "" ? null : body?.thumbnail === undefined ? existingItem.thumbnail : String(body.thumbnail).trim(),
        price: body?.price === undefined ? existingItem.price : parseNullableNumber(body.price),
        sku: body?.sku === "" ? null : body?.sku === undefined ? existingItem.sku : String(body.sku).trim(),
        featured: typeof body?.featured === "boolean" ? body.featured : existingItem.featured,
        active: typeof body?.active === "boolean" ? body.active : existingItem.active,
        sortOrder: Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : existingItem.sortOrder,
      },
      include: {
        collection: true,
        product: true,
      },
    });

    if (item.productId) {
      try {
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
      } catch (productMirrorError) {
        console.error("Catalog item saved, but product mirror update failed:", productMirrorError);
      }
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
