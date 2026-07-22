import { INTAKE_FORMS, type IntakeDefinition } from "@/lib/intake-forms";

export const SERVICE_LIBRARY_KEY = "upz_service_library_v1";
export const companyServiceKey = (slug:string) => `upz_company_services_${slug}`;

export function getServiceLibrary():IntakeDefinition[] {
  if (typeof window === "undefined") return Object.values(INTAKE_FORMS);
  try {
    const saved = window.localStorage.getItem(SERVICE_LIBRARY_KEY);
    const parsed = saved ? JSON.parse(saved) : null;
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch {}
  return Object.values(INTAKE_FORMS);
}

export function getEnabledServiceSlugs(companySlug:string, services: IntakeDefinition[] = getServiceLibrary()):string[] {
  if (typeof window === "undefined") return services.map((service)=>service.slug);
  try {
    const saved = window.localStorage.getItem(companyServiceKey(companySlug));
    if (!saved) return services.map((service)=>service.slug);
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.filter((slug):slug is string=>typeof slug === "string") : services.map((service)=>service.slug);
  } catch {
    return services.map((service)=>service.slug);
  }
}

export function saveEnabledServiceSlugs(companySlug:string, slugs:string[]){
  window.localStorage.setItem(companyServiceKey(companySlug), JSON.stringify(slugs));
  window.dispatchEvent(new CustomEvent("upz-company-services-updated", { detail:{ companySlug, slugs } }));
}
