import { getProducts } from "@/lib/printful";

export async function GET() {
  try {
    const products = await getProducts();
    return Response.json(products);
  } catch (err) {
    return Response.json(
      { error: "Failed to load products" },
      { status: 500 }
    );
  }
}