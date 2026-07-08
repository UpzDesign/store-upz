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

async function findOrCreateCollection(companyId: number, name: string, sortOrder: number) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return prisma.collection.upsert({
    where: {
      companyId_slug: {
        companyId,
        slug,
      },
    },
    update: {
      name,
      active: true,
    },
    create: {
      companyId,
      name,
      slug,
      sortOrder,
      active: true,
    },
  });
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
      printfulProducts.map(async (product: any, index: number) => {
        const collectionName = inferCollection(product.name || "");
        const collection = await findOrCreateCollection(company.id, collectionName, index);

        const syncedProduct = await prisma.product.upsert({
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
            collection: collectionName,
            active: true,
          },
          create: {
            companyId: company.id,
            printfulId: String(product.id),
            name: product.name,
            thumbnail: product.image || null,
            price: product.price ? Number(product.price) : null,
            collection: collectionName,
            active: true,
            sortOrder: index,
          },
        });

        await prisma.catalogItem.upsert({
          where: {
            companyId_sourceVendor_sourceProductId: {
              companyId: company.id,
              sourceVendor: "printful",
              sourceProductId: String(product.id),
            },
          },
          update: {
            collectionId: collection.id,
            productId: syncedProduct.id,
            itemType: "product",
            title: syncedProduct.name,
            thumbnail: syncedProduct.thumbnail,
            price: syncedProduct.price,
            sourceVendor: "printful",
            sourceProductId: syncedProduct.printfulId,
            active: syncedProduct.active,
            sortOrder: syncedProduct.sortOrder,
          },
          create: {
            companyId: company.id,
            collectionId: collection.id,
            productId: syncedProduct.id,
            itemType: "product",
            sourceVendor: "printful",
            sourceProductId: syncedProduct.printfulId,
            title: syncedProduct.name,
            thumbnail: syncedProduct.thumbnail,
            price: syncedProduct.price,
            active: syncedProduct.active,
            sortOrder: syncedProduct.sortOrder,
          },
        });

        return syncedProduct;
      })
    );

    return NextResponse.json({
      company: company.slug,
      synced: syncedProducts.length,
      catalogItems: syncedProducts.length,
    });
  } catch (error) {
    console.error("Product sync error:", error);
    return NextResponse.json(
      { error: "Unable to sync products" },
      { status: 500 }
    );
  }
}
