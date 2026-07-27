import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const defaultModules = ["Order Merchandise", "Broker Packages", "Business Cards", "Marketing Materials", "Brand Assets", "Request Services"];

function getDefaultActions(company: { slug: string; shortName: string }) {
  return [
    { title: `${company.shortName} Starter Kit`, description: "A curated set of approved branded items for new brokers, team members, and client-facing work.", href: "#packages" },
    { title: "Order Merchandise", description: "Shop approved apparel, drinkware, office essentials, and client-facing branded items.", href: "#products" },
    { title: "Request Marketing Support", description: "Request brochures, signage, photography, drone, websites, or campaign materials from UPZ.", href: "#services" },
  ];
}

function textLogoDataUri(text: string, color: string, style: string) {
  const family = style === "serif" ? "Georgia,serif" : "Arial,sans-serif";
  const weight = style === "light" ? "400" : "700";
  const spacing = style === "condensed" ? "-2" : "0";
  const safeText = text.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[character] || character));
  const width = Math.max(260, Math.min(900, safeText.length * 46));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="120" viewBox="0 0 ${width} 120"><text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" fill="${color}" font-family="${family}" font-size="58" font-weight="${weight}" letter-spacing="${spacing}">${safeText}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const company = await prisma.company.findUnique({ where: { slug } });
    if (!company || !company.portalEnabled) return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    const logo = company.logoType === "text"
      ? textLogoDataUri(company.logoText || company.shortName, company.logoTextColor || company.secondaryColor, company.logoFontStyle || "sans")
      : company.logoType === "none" ? "" : company.logo || "/upz-logo.svg";

    return NextResponse.json({
      id: String(company.id), slug: company.slug, name: company.name, shortName: company.shortName,
      logo, logoType: company.logoType, logoText: company.logoText, logoTextColor: company.logoTextColor, logoFontStyle: company.logoFontStyle,
      primaryColor: company.primaryColor, secondaryColor: company.secondaryColor, backgroundColor: "#ffffff", textColor: "#010101",
      heroTitle: company.heroTitle, heroText: company.heroText, modules: defaultModules, featuredActions: getDefaultActions(company),
    });
  } catch (error) {
    console.error("Portal company API error:", error);
    return NextResponse.json({ error: "Unable to load portal" }, { status: 500 });
  }
}
