import { NextResponse } from "next/server";
import { getProducts } from "@/lib/printful";

export async function GET() {
  try {
    const products = await getProducts();

    if (!Array.isArray(products)) {
      console.error("❌ PRODUCTS NOT ARRAY:", products);
      return NextResponse.json([]);
    }

    return NextResponse.json(products);
  } catch (err) {
    console.error("❌ PRODUCTS API ERROR:", err);
    return NextResponse.json([]);
  }
}