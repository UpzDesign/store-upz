import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProducts } from "@/lib/printful";

function mapDatabaseProduct(product: any) {
  return {
    id: product.printfulId,
    databaseId: product.id,
    name: product.name,
    image: product.thumbnail || "/placeholder.png",
    thumbnail: product.thumbnail || "/placeholder.png",
    price: product.price,
    collection: product.collection || "Merchandise",
    category: product.collection || "Merchandise",
    featured: product.featured,
    active: product.active,
    printfulId: product.printfulId,
  };
}

export async function GET(request: NextRequest) {
  try {
    const companySlug = request.nextUrl.searchParams.get("company");

    if (companySlug) {
      const company = await prisma.company.findUnique({
        where: { slug: companySlug },
        include: {
          products: {
            where: { active: true },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          },
        },
      });

      if (!company || !company.portalEnabled) {
        return NextResponse.json([]);
      }

      if (company.products.length > 0) {
        return NextResponse.json(company.products.map(mapDatabaseProduct));
      }

      const fallbackProducts = await getProducts({ companySlug: company.slug });
      return NextResponse.json(Array.isArray(fallbackProducts) ? fallbackProducts : []);
    }

    const products = await getProducts({ companySlug: null });
    return NextResponse.json(Array.isArray(products) ? products : []);
  } catch (err) {
    console.error("❌ PRODUCTS API ERROR:", err);
    return NextResponse.json([]);
  }
}
