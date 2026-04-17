import { NextRequest, NextResponse } from "next/server";
import { getProductById } from "@/lib/printful";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const product = await getProductById(id);

  return NextResponse.json(product);
}