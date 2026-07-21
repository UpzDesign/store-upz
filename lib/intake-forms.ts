export type IntakeFieldType = "text" | "email" | "number" | "date" | "textarea" | "select" | "checkbox";

export type IntakeField = {
  key: string;
  label: string;
  type: IntakeFieldType;
  placeholder?: string;
  required?: boolean;
  wide?: boolean;
  options?: string[];
};

export type IntakeDefinition = {
  slug: string;
  name: string;
  description: string;
  fields: IntakeField[];
};

const sharedFields: IntakeField[] = [
  { key: "projectTitle", label: "Project Title", type: "text", placeholder: "Project name or property", required: true, wide: true },
  { key: "contactName", label: "Contact Name", type: "text", required: true },
  { key: "contactEmail", label: "Email", type: "email", required: true },
  { key: "deadline", label: "Requested Deadline", type: "date" },
  { key: "budget", label: "Budget / Range", type: "text", placeholder: "$1,500–$3,000 or TBD" },
  { key: "priority", label: "Priority", type: "select", options: ["normal", "high", "urgent"] },
];

const closingFields: IntakeField[] = [
  { key: "attachments", label: "File / Folder Links", type: "textarea", placeholder: "Paste links to photos, plans, brand assets, or reference files.", wide: true },
  { key: "notes", label: "Additional Notes", type: "textarea", placeholder: "Anything else we should know?", wide: true },
];

export const INTAKE_FORMS: Record<string, IntakeDefinition> = {
  photography: {
    slug: "photography",
    name: "Photography & Media",
    description: "Tell us about the property, spaces, access, staging, and media coverage needed.",
    fields: [...sharedFields,
      { key: "propertyAddress", label: "Property Address", type: "text", required: true, wide: true },
      { key: "propertyType", label: "Property Type", type: "select", options: ["Office", "Retail", "Residential", "Industrial", "Hospitality", "Other"] },
      { key: "squareFootage", label: "Approx. Square Footage", type: "number" },
      { key: "floorsSpaces", label: "Floors / Spaces to Photograph", type: "textarea", wide: true, required: true },
      { key: "coverage", label: "Coverage Needed", type: "textarea", placeholder: "Interior, exterior, lobby, amenities, drone, video, 360 tour, virtual staging", wide: true },
      { key: "furnished", label: "Current Condition", type: "select", options: ["Furnished / staged", "Vacant / unfurnished", "Partially furnished", "Occupied"] },
      { key: "stagingRequired", label: "Staging Required?", type: "select", options: ["No", "Yes", "Not sure"] },
      { key: "accessInstructions", label: "Access / Building Instructions", type: "textarea", wide: true },
      ...closingFields],
  },
  signage: {
    slug: "signage",
    name: "Signage, Print & Installation",
    description: "Share the location, dimensions, materials, production, removal, and installation requirements.",
    fields: [...sharedFields,
      { key: "propertyAddress", label: "Installation Address", type: "text", required: true, wide: true },
      { key: "signageType", label: "Project Type", type: "select", options: ["Storefront vinyl", "Window graphics", "Wall graphics", "Banner", "Building signage", "Printed collateral", "Other"] },
      { key: "indoorOutdoor", label: "Environment", type: "select", options: ["Indoor", "Outdoor", "Both"] },
      { key: "measurements", label: "Measurements / Quantity", type: "textarea", required: true, wide: true },
      { key: "surveyRequired", label: "Site Survey Required?", type: "select", options: ["No — measurements provided", "Yes", "Not sure"] },
      { key: "installationRequired", label: "Installation Required?", type: "select", options: ["Yes", "No", "Not sure"] },
      { key: "removalRequired", label: "Existing Graphics Removal?", type: "select", options: ["No", "Yes", "Not sure"] },
      { key: "material", label: "Preferred Material", type: "text", placeholder: "Vinyl, mesh banner, foam board, aluminum, TBD" },
      { key: "siteConditions", label: "Access / Height / Site Conditions", type: "textarea", wide: true },
      ...closingFields],
  },
  web: {
    slug: "web",
    name: "Website & Digital Development",
    description: "Tell us about the website, content, functionality, integrations, and launch requirements.",
    fields: [...sharedFields,
      { key: "websiteType", label: "Website Type", type: "select", options: ["New website", "Landing page", "Property website", "Website redesign", "Feature / update", "Other"] },
      { key: "existingWebsite", label: "Existing Website URL", type: "text", wide: true },
      { key: "pageCount", label: "Approx. Number of Pages", type: "number" },
      { key: "domainHosting", label: "Domain / Hosting Status", type: "textarea", wide: true },
      { key: "features", label: "Required Features", type: "textarea", placeholder: "Forms, listings, maps, CMS, payments, analytics, CRM, integrations", wide: true, required: true },
      { key: "contentStatus", label: "Content Status", type: "select", options: ["Ready", "Partially ready", "Copywriting needed", "Not started"] },
      { key: "referenceSites", label: "Reference Websites", type: "textarea", wide: true },
      ...closingFields],
  },
  brochure: {
    slug: "brochure",
    name: "Brochure & Marketing Design",
    description: "Provide the property details, format, content, brand assets, and required deliverables.",
    fields: [...sharedFields,
      { key: "propertyAddress", label: "Property / Project Address", type: "text", wide: true },
      { key: "deliverableType", label: "Deliverable", type: "select", options: ["Property brochure", "Flyer", "Offering memorandum", "Presentation deck", "Email campaign", "Map / floor plan", "Other"] },
      { key: "format", label: "Format / Page Count", type: "text", placeholder: "8.5×11, 12 pages, digital PDF" },
      { key: "contentStatus", label: "Content Status", type: "select", options: ["Ready", "Partially ready", "Copywriting needed", "Not started"] },
      { key: "requiredSections", label: "Required Sections / Content", type: "textarea", wide: true, required: true },
      { key: "printRequired", label: "Printing Required?", type: "select", options: ["No — digital only", "Yes", "Not sure"] },
      ...closingFields],
  },
  branding: {
    slug: "branding",
    name: "Branding & Identity",
    description: "Define the business, audience, existing identity, and the brand assets you need.",
    fields: [...sharedFields,
      { key: "businessName", label: "Business / Brand Name", type: "text", required: true, wide: true },
      { key: "brandingScope", label: "Branding Scope", type: "textarea", placeholder: "Naming, logo, colors, typography, guidelines, templates, collateral", wide: true, required: true },
      { key: "existingBrand", label: "Existing Brand / Logo?", type: "select", options: ["No", "Yes — refresh", "Yes — expand system"] },
      { key: "audience", label: "Target Audience", type: "textarea", wide: true },
      { key: "brandDirection", label: "Style / Brand Direction", type: "textarea", wide: true },
      ...closingFields],
  },
  print: {
    slug: "print",
    name: "Print Production",
    description: "Share the printed item, specifications, quantity, finishing, delivery, and artwork status.",
    fields: [...sharedFields,
      { key: "printItem", label: "Printed Item", type: "text", required: true },
      { key: "quantity", label: "Quantity", type: "number", required: true },
      { key: "dimensions", label: "Finished Size", type: "text" },
      { key: "stockFinish", label: "Stock / Material / Finish", type: "textarea", wide: true },
      { key: "artworkStatus", label: "Artwork Status", type: "select", options: ["Print-ready", "Design needed", "Updates needed", "Not sure"] },
      { key: "deliveryAddress", label: "Delivery Address", type: "textarea", wide: true },
      ...closingFields],
  },
  merchandise: {
    slug: "merchandise",
    name: "Branded Merchandise",
    description: "Tell us what products, quantities, branding, sizes, delivery, and budget you have in mind.",
    fields: [...sharedFields,
      { key: "products", label: "Products Requested", type: "textarea", required: true, wide: true },
      { key: "quantity", label: "Estimated Quantity", type: "number" },
      { key: "sizesVariants", label: "Sizes / Variants", type: "textarea", wide: true },
      { key: "logoPlacement", label: "Logo Placement / Decoration", type: "textarea", wide: true },
      { key: "shipping", label: "Shipping / Delivery Details", type: "textarea", wide: true },
      ...closingFields],
  },
  general: {
    slug: "general",
    name: "Custom Project",
    description: "Use this form for a project that does not fit one of the standard service types.",
    fields: [...sharedFields,
      { key: "projectType", label: "Project Type", type: "text", required: true },
      { key: "propertyAddress", label: "Property / Project Address", type: "text", wide: true },
      { key: "deliverables", label: "Requested Deliverables", type: "textarea", required: true, wide: true },
      ...closingFields],
  },
};

export function getIntakeForm(slug?: string | null) {
  return INTAKE_FORMS[String(slug || "general").toLowerCase()] || INTAKE_FORMS.general;
}

export function inferProjectType(text: string) {
  const value = text.toLowerCase();
  if (/photo|drone|video|360|staging/.test(value)) return "photography";
  if (/sign|vinyl|window|banner|install/.test(value)) return "signage";
  if (/website|web |landing|digital/.test(value)) return "web";
  if (/brochure|flyer|deck|presentation|map|floor plan/.test(value)) return "brochure";
  if (/brand|logo|identity/.test(value)) return "branding";
  if (/merch|apparel|shirt|hat|mug/.test(value)) return "merchandise";
  if (/print|card|postcard|booklet/.test(value)) return "print";
  return "general";
}
