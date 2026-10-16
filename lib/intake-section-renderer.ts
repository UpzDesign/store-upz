import type { IntakeDefinition, IntakeFormSection, IntakeField } from "./intake-forms";

/** Saved admin form layout is the sole source of client service sections. */
export function intakeSections(service: IntakeDefinition): IntakeFormSection[] {
  return Array.isArray(service.sections) ? service.sections : [];
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
  return !section.requires || selectedOptions(answers, section.selectionField || "requestedServices").includes(section.requires) || (sectionKind(section) !== "standard" && Boolean(sectionOption(section)));
}
export function sectionIsSelected(section: IntakeFormSection, answers: Record<string, unknown>): boolean {
  const option = sectionOption(section);
  return !option || selectedOptions(answers, section.selectionField || "requestedServices").includes(option);
}
export function unassignedFields(service: IntakeDefinition, sections: IntakeFormSection[]) {
  const assigned = new Set(sections.flatMap(section => section.keys));
  return service.fields.filter(field => !assigned.has(field.key));
}

/** Shared section/field projection for the admin preview and client request composer. */
export const SHARED_REQUEST_FIELD_KEYS = new Set(["contactName","contactEmail","priority","propertyAddress","attachments","fileLinks","notes"]);
export function isProjectContextDuplicate(field: IntakeField): boolean {
  const key=field.key.replace(/[^a-z0-9]/gi,"").toLowerCase();
  const label=field.label.trim().toLowerCase().replace(/\s+/g," ");
  return ["projecttitle","projectname"].includes(key)||["project title","project name","project / property name"].includes(label);
}
export function clientIntakeFields(service: IntakeDefinition, fields: IntakeField[]): IntakeField[] {
  return fields.filter(field=>(field.type==="file_upload"||!SHARED_REQUEST_FIELD_KEYS.has(field.key))&&!isProjectContextDuplicate(field));
}
export function clientUnassignedFields(service: IntakeDefinition): IntakeField[] {
  const sections=intakeSections(service);
  const assigned=new Set(sections.flatMap(section=>section.keys));
  return clientIntakeFields(service,service.fields.filter(field=>!assigned.has(field.key)&&field.key!=="requestedServices"));
}
export function clientSectionFields(service: IntakeDefinition, section: IntakeFormSection): IntakeField[] {
  const keys=section.keys;
  return clientIntakeFields(service,keys.flatMap(key=>service.fields.filter(field=>field.key===key)));
}
