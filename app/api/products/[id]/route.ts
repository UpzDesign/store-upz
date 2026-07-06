import { NextResponse } from "next/server";
import { getProductById } from "@/lib/printful";

export async function GET(
  _req: Request,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Missing product id" }, { status: 400 });
  }

  const product = await getProductById(id);

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}
