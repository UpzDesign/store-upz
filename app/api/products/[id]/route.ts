import { NextRequest, NextResponse } from "next/server";
import { getProductById } from "@/lib/printful";
import { getCompanyBySlug } from "@/lib/companies";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Missing product id" }, { status: 400 });
  }

  const companySlug = request.nextUrl.searchParams.get("company");
  const company = companySlug ? getCompanyBySlug(companySlug) : null;
  const product = await getProductById(id, { companySlug: company?.slug || null });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}
