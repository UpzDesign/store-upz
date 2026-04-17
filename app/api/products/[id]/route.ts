import { NextResponse } from "next/server";
import { getProducts } from "@/lib/printful";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const products = await getProducts();

  const product = products.find(
    (p: any) =>
      String(p.id) === String(params.id) ||
      String(p.external_id) === String(params.id)
  );

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}