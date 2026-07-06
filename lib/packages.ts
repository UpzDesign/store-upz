export type PackageItemRule = {
  category: string;
  quantity: number;
  label: string;
};

export type StorePackage = {
  id: string;
  title: string;
  tag: string;
  description: string;
  idealFor: string;
  rules: PackageItemRule[];
};

export const storePackages: StorePackage[] = [
  {
    id: "broker-starter",
    title: "Broker Starter Package",
    tag: "Best for new agents",
    description: "A clean starter set for new brokers, teams, and onboarding.",
    idealFor: "New brokers, junior teams, and onboarding packages",
    rules: [
      { category: "Apparel", quantity: 1, label: "1 branded apparel item" },
      { category: "Drinkware", quantity: 1, label: "1 mug or bottle" },
      { category: "Office", quantity: 1, label: "1 office/presentation item" },
    ],
  },
  {
    id: "open-house",
    title: "Open House Package",
    tag: "For launches",
    description: "Client-facing essentials for tours, launches, and property events.",
    idealFor: "Open houses, property launches, and broker events",
    rules: [
      { category: "Bags", quantity: 1, label: "1 tote or carry item" },
      { category: "Drinkware", quantity: 2, label: "2 giveaway drinkware items" },
      { category: "Accessories", quantity: 1, label: "1 small branded accessory" },
    ],
  },
  {
    id: "team-branding",
    title: "Team Branding Package",
    tag: "For offices",
    description: "A polished merch bundle for brokerage teams and CRE offices.",
    idealFor: "Teams, office rebrands, and recurring company merch",
    rules: [
      { category: "Apparel", quantity: 3, label: "3 apparel items" },
      { category: "Drinkware", quantity: 3, label: "3 drinkware items" },
      { category: "Bags", quantity: 2, label: "2 branded bags" },
    ],
  },
];
