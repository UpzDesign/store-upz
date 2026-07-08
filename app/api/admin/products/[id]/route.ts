import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const productId = Number(id);

    if (!Number.isFinite(productId)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { company: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Admin product detail API error:", error);
    return NextResponse.json({ error: "Unable to load product" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const productId = Number(id);
    const body = await request.json().catch(() => null);

    if (!Number.isFinite(productId)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        name: body?.name ? String(body.name).trim() : undefined,
        thumbnail: body?.thumbnail === "" ? null : body?.thumbnail ? String(body.thumbnail).trim() : undefined,
        price:
          body?.price === "" || body?.price === null || body?.price === undefined
            ? null
            : Number(body.price),
        collection: body?.collection === "" ? null : body?.collection ? String(body.collection).trim() : undefined,
        featured: Boolean(body?.featured),
        active: Boolean(body?.active),
        sortOrder: Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : undefined,
      },
      include: { company: true },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Admin product update API error:", error);
    return NextResponse.json({ error: "Unable to update product" }, { status: 500 });
  }
}
