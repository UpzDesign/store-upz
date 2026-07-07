import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/printful";
import { getCompanyBySlug } from "@/lib/companies";

export async function GET(request: NextRequest) {
  try {
    const companySlug = request.nextUrl.searchParams.get("company");
    const company = companySlug ? getCompanyBySlug(companySlug) : null;
    const products = await getProducts({ companySlug: company?.slug || null });

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
