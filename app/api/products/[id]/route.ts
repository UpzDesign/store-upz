import { NextResponse } from "next/server";
import { getProductById } from "@/lib/printful";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const product = await getProductById(params.id);

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}