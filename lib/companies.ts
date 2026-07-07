export type BrandPortalCompany = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  password: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  printfulStoreId?: string;
  heroTitle: string;
  heroText: string;
  modules: string[];
  featuredActions: Array<{
    title: string;
    description: string;
    href: string;
  }>;
};

export const companies: BrandPortalCompany[] = [
  {
    id: "rtl",
    slug: "rtl",
    name: "RTL Realty Group",
    shortName: "RTL",
    password: "rtl-demo",
    logo: "/upz-logo.svg",
    primaryColor: "#DC353C",
    secondaryColor: "#010101",
    backgroundColor: "#ffffff",
    textColor: "#010101",
    printfulStoreId: "rtl",
    heroTitle: "RTL Brand Portal",
    heroText:
      "Approved branded merchandise, broker kits, marketing materials, and brand assets for the RTL team.",
    modules: [
      "Order Merchandise",
      "Broker Packages",
      "Business Cards",
      "Marketing Materials",
      "Brand Assets",
      "Request Services",
    ],
    featuredActions: [
      {
        title: "Broker Starter Kit",
        description: "A curated set of approved branded items for new brokers and active listing teams.",
        href: "#packages",
      },
      {
        title: "Order Merchandise",
        description: "Shop company-approved apparel, drinkware, office essentials, and client-facing items.",
        href: "#products",
      },
      {
        title: "Request Marketing Support",
        description: "Request brochures, signage, photography, drone, websites, or campaign materials from UPZ.",
        href: "#services",
      },
    ],
  },
];

export function getCompanyBySlug(slug?: string | null) {
  return companies.find((company) => company.slug === slug) || null;
}

export function validateCompanyPassword(slug: string, password: string) {
  const company = getCompanyBySlug(slug);
  if (!company) return null;
  return company.password === password ? company : null;
}
