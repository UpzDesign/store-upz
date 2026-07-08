import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const defaultModules = [
  "Order Merchandise",
  "Broker Packages",
  "Business Cards",
  "Marketing Materials",
  "Brand Assets",
  "Request Services",
];

function getDefaultActions(company: { slug: string; shortName: string }) {
  return [
    {
      title: `${company.shortName} Starter Kit`,
      description: "A curated set of approved branded items for new brokers, team members, and client-facing work.",
      href: "#packages",
    },
    {
      title: "Order Merchandise",
      description: "Shop approved apparel, drinkware, office essentials, and client-facing branded items.",
      href: "#products",
    },
    {
      title: "Request Marketing Support",
      description: "Request brochures, signage, photography, drone, websites, or campaign materials from UPZ.",
      href: "#services",
    },
  ];
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    const company = await prisma.company.findUnique({
      where: { slug },
    });

    if (!company || !company.portalEnabled) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: String(company.id),
      slug: company.slug,
      name: company.name,
      shortName: company.shortName,
      logo: company.logo || "/upz-logo.svg",
      primaryColor: company.primaryColor,
      secondaryColor: company.secondaryColor,
      backgroundColor: "#ffffff",
      textColor: "#010101",
      heroTitle: company.heroTitle,
      heroText: company.heroText,
      modules: defaultModules,
      featuredActions: getDefaultActions(company),
    });
  } catch (error) {
    console.error("Portal company API error:", error);
    return NextResponse.json({ error: "Unable to load portal" }, { status: 500 });
  }
}
