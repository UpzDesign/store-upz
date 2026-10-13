import type { IntakeDefinition, IntakeFormSection } from "./intake-forms";
import { SIGNAGE_SECTIONS } from "./signage-form-layout";

export function intakeSections(service: IntakeDefinition): IntakeFormSection[] {
  if (service.sections) return service.sections;
  if (service.slug !== "signage") return [];
  return SIGNAGE_SECTIONS.map(section => ({
    id: section.id,
    title: section.title,
    description: section.description,
    requires: "requires" in section ? section.requires : undefined,
    keys: [...section.keys],
    variant: section.id === "survey" ? "highlighted" : section.id === "printing" || section.id === "installation" ? "service" : "standard",
    actionValue: "requires" in section ? section.requires : undefined,
  }));
}
export function sectionKind(section: IntakeFormSection): "standard" | "service" | "highlighted" {
  return section.variant || (section.id === "survey" ? "highlighted" : section.id === "printing" || section.id === "installation" ? "service" : "standard");
}
export function sectionOption(section: IntakeFormSection): string | undefined {
  return section.actionValue || (sectionKind(section) !== "standard" ? section.requires : undefined);
}
export function selectedOptions(answers: Record<string, unknown>, fieldKey: string): string[] {
  const value = answers[fieldKey];
  return Array.isArray(value) ? value.map(String) : value == null || value === "" ? [] : [String(value)];
}
export function sectionIsVisible(section: IntakeFormSection, answers: Record<string, unknown>): boolean {
  return sectionKind(section) !== "standard" || !section.requires || selectedOptions(answers, section.selectionField || "requestedServices").includes(section.requires);
}
export function sectionIsSelected(section: IntakeFormSection, answers: Record<string, unknown>): boolean {
  const option = sectionOption(section);
  return !option || selectedOptions(answers, section.selectionField || "requestedServices").includes(option);
}
export function unassignedFields(service: IntakeDefinition, sections: IntakeFormSection[]) {
  const assigned = new Set(sections.flatMap(section => section.keys));
  return service.fields.filter(field => !assigned.has(field.key));
}
