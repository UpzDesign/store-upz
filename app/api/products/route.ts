import { NextResponse } from "next/server";
import { getProducts } from "@/lib/printful";

export async function GET() {
  const products = await getProducts();
  return NextResponse.json(products);
}