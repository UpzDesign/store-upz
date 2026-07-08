import { NextRequest, NextResponse } from "next/server";
import { getProductById } from "@/lib/printful";
import { prisma } from "@/lib/prisma";

function mergeProductSettings(printfulProduct: any, databaseProduct: any) {
  if (!databaseProduct) return printfulProduct;

  return {
    ...printfulProduct,
    id: databaseProduct.printfulId,
    databaseId: databaseProduct.id,
    name: databaseProduct.name || printfulProduct?.name,
    image: databaseProduct.thumbnail || printfulProduct?.image || "/placeholder.png",
    thumbnail: databaseProduct.thumbnail || printfulProduct?.thumbnail || printfulProduct?.image || "/placeholder.png",
    price: databaseProduct.price ?? printfulProduct?.price,
    collection: databaseProduct.collection || printfulProduct?.collection,
    category: databaseProduct.collection || printfulProduct?.category,
    featured: databaseProduct.featured,
    active: databaseProduct.active,
    printfulId: databaseProduct.printfulId,
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Missing product id" }, { status: 400 });
  }

  const companySlug = request.nextUrl.searchParams.get("company");
  let databaseProduct = null;
  let resolvedCompanySlug: string | null = null;

  if (companySlug) {
    const company = await prisma.company.findUnique({ where: { slug: companySlug } });

    if (!company || !company.portalEnabled) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    resolvedCompanySlug = company.slug;

    databaseProduct = await prisma.product.findFirst({
      where: {
        companyId: company.id,
        printfulId: String(id),
        active: true,
      },
    });
  }

  const product = await getProductById(id, { companySlug: resolvedCompanySlug });

  if (!product && !databaseProduct) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(mergeProductSettings(product, databaseProduct));
}
