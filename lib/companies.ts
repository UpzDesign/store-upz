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

const realEstateModules = [
  "Order Merchandise",
  "Broker Packages",
  "Business Cards",
  "Marketing Materials",
  "Brand Assets",
  "Request Services",
];

export const companies: BrandPortalCompany[] = [
  {
    id: "rtl",
    slug: "rtl",
    name: "RTL Realty Group",
    shortName: "RTL",
    password: "rtldemo",
    logo: "/upz-logo.svg",
    primaryColor: "#DC353C",
    secondaryColor: "#010101",
    backgroundColor: "#ffffff",
    textColor: "#010101",
    printfulStoreId: "rtl",
    heroTitle: "RTL Brand Portal",
    heroText:
      "Approved branded merchandise, broker kits, marketing materials, and brand assets for the RTL team.",
    modules: realEstateModules,
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
  {
    id: "ksr",
    slug: "ksr",
    name: "KSR",
    shortName: "KSR",
    password: "ksrdemo",
    logo: "/ksr-logo.svg",
    primaryColor: "#ff5f1b",
    secondaryColor: "#010101",
    backgroundColor: "#ffffff",
    textColor: "#010101",
    printfulStoreId: "ksr",
    heroTitle: "KSR Brand Portal",
    heroText:
      "Approved KSR merchandise, broker essentials, marketing materials, and brand assets in one private portal.",
    modules: realEstateModules,
    featuredActions: [
      {
        title: "KSR Broker Kit",
        description: "A ready-to-order package of branded essentials for brokers, site visits, and client meetings.",
        href: "#packages",
      },
      {
        title: "Order KSR Merchandise",
        description: "Shop KSR-approved apparel, accessories, office items, and client-facing products.",
        href: "#products",
      },
      {
        title: "Request Marketing Support",
        description: "Request brochures, signage, photography, drone, websites, or property campaign materials from UPZ.",
        href: "#services",
      },
    ],
  },
];

export function getCompanyBySlug(slug?: string | null) {
  return companies.find((company) => company.slug === slug) || null;
}

export function validateCompanyPassword(slug: string, password: string) {
  const normalizedSlug = slug.trim().toLowerCase();
  const normalizedPassword = password.trim();
  const company = getCompanyBySlug(normalizedSlug);
  if (!company) return null;
  return company.password === normalizedPassword ? company : null;
}
