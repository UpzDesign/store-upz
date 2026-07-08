import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProducts } from "@/lib/printful";

function inferCollection(productName: string) {
  const name = productName.toLowerCase();

  if (name.includes("shirt") || name.includes("hoodie") || name.includes("tee") || name.includes("polo")) return "Apparel";
  if (name.includes("mug") || name.includes("bottle") || name.includes("tumbler")) return "Drinkware";
  if (name.includes("notebook") || name.includes("card") || name.includes("pen")) return "Office";
  if (name.includes("bag") || name.includes("hat") || name.includes("cap")) return "Accessories";

  return "Merchandise";
}

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const company = await prisma.company.findUnique({ where: { slug } });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const printfulProducts = await getProducts({ companySlug: company.slug });

    const syncedProducts = await Promise.all(
      printfulProducts.map((product: any, index: number) =>
        prisma.product.upsert({
          where: {
            companyId_printfulId: {
              companyId: company.id,
              printfulId: String(product.id),
            },
          },
          update: {
            name: product.name,
            thumbnail: product.image || null,
            price: product.price ? Number(product.price) : null,
            collection: inferCollection(product.name || ""),
            active: true,
          },
          create: {
            companyId: company.id,
            printfulId: String(product.id),
            name: product.name,
            thumbnail: product.image || null,
            price: product.price ? Number(product.price) : null,
            collection: inferCollection(product.name || ""),
            active: true,
            sortOrder: index,
          },
        })
      )
    );

    return NextResponse.json({
      company: company.slug,
      synced: syncedProducts.length,
    });
  } catch (error) {
    console.error("Product sync error:", error);
    return NextResponse.json(
      { error: "Unable to sync products" },
      { status: 500 }
    );
  }
}
