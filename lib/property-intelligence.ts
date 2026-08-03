export type PropertyIntelligence = {
  propertyType?: string;
  buildingClass?: string;
  neighborhood?: string;
  borough?: string;
  owner?: string;
  landlord?: string;
  tenant?: string;
  brokerage?: string;
  squareFootage?: string;
  floors?: string;
  frontage?: string;
  ceilingHeight?: string;
  accessRestrictions?: string;
  loading?: string;
  parking?: string;
  latitude?: string;
  longitude?: string;
  marketingStatus?: string;
  notes?: string;
};

const MARKER = "__UPZ_PROPERTY_INTELLIGENCE__";

export function parsePropertyDescription(value?: string | null) {
  const source = String(value || "");
  const index = source.lastIndexOf(MARKER);
  if (index < 0) return { summary: source.trim(), intelligence: {} as PropertyIntelligence };
  let intelligence: PropertyIntelligence = {};
  try {
    intelligence = JSON.parse(source.slice(index + MARKER.length).trim()) || {};
  } catch {}
  return { summary: source.slice(0, index).trim(), intelligence };
}

export function serializePropertyDescription(summary: string | null | undefined, intelligence: PropertyIntelligence) {
  const clean = Object.fromEntries(Object.entries(intelligence).filter(([, value]) => String(value || "").trim()));
  const prefix = String(summary || "").trim();
  return `${prefix}${prefix ? "\n\n" : ""}${MARKER}${JSON.stringify(clean)}`;
}

export function propertyCompleteness(intelligence: PropertyIntelligence, address?: string | null) {
  const values = [address, intelligence.propertyType, intelligence.neighborhood, intelligence.borough, intelligence.squareFootage, intelligence.owner, intelligence.brokerage, intelligence.accessRestrictions];
  return Math.round((values.filter(value => String(value || "").trim()).length / values.length) * 100);
}

export function assetCategoryFromStage(title: string) {
  const value = title.toLowerCase();
  if (value.includes("photo") || value.includes("shoot")) return "Photography";
  if (value.includes("edit")) return "Edited Photography";
  if (value.includes("drone")) return "Drone";
  if (value.includes("video")) return "Video";
  if (value.includes("render")) return "Rendering";
  if (value.includes("floor plan") || value.includes("floorplan")) return "Floor Plans";
  if (value.includes("brochure") || value.includes("flyer")) return "Marketing PDFs";
  if (value.includes("social")) return "Social Media";
  if (value.includes("install") || value.includes("survey")) return "Site Documentation";
  if (value.includes("deliver")) return "Final Deliverables";
  return "Production Assets";
}
