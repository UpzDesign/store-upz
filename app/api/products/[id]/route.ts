import { NextResponse } from "next/server";
import { getProductById } from "@/lib/printful";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  console.log("PRODUCT PAGE ID:", params.id);

  const product = await getProductById(params.id);

  console.log("PRINTFUL RESULT:", product);

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}