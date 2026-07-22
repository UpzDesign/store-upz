export type WorkflowStep = {
  title: string;
  description: string;
  clientVisible?: boolean;
  durationDays?: number;
};

const templates: Record<string, WorkflowStep[]> = {
  photography: [
    { title: "Request received", description: "Project details are reviewed and confirmed.", durationDays: 0 },
    { title: "Schedule shoot", description: "Access, timing, and shot list are coordinated.", durationDays: 2 },
    { title: "Photography", description: "On-site photography is completed.", durationDays: 3 },
    { title: "Editing", description: "Selected images are professionally edited.", durationDays: 5 },
    { title: "Client review", description: "Edited images are shared for review.", durationDays: 6 },
    { title: "Final delivery", description: "Approved final files are delivered.", durationDays: 7 },
  ],
  video: [
    { title: "Request received", description: "Scope and creative direction are confirmed.", durationDays: 0 },
    { title: "Pre-production", description: "Schedule, shot list, and logistics are prepared.", durationDays: 2 },
    { title: "Production", description: "Video capture is completed on location.", durationDays: 4 },
    { title: "Editing", description: "Footage is edited into the first cut.", durationDays: 7 },
    { title: "Client review", description: "The first cut is shared for comments.", durationDays: 9 },
    { title: "Final delivery", description: "Approved video files are delivered.", durationDays: 11 },
  ],
  signage: [
    { title: "Request received", description: "Project requirements and site details are reviewed.", durationDays: 0 },
    { title: "Site survey", description: "Measurements, access, and installation conditions are confirmed.", durationDays: 3 },
    { title: "Concept design", description: "Initial signage concepts and mockups are prepared.", durationDays: 6 },
    { title: "Client approval", description: "Final artwork and specifications are approved.", durationDays: 8 },
    { title: "Production", description: "Approved signage is produced and prepared.", durationDays: 13 },
    { title: "Installation", description: "Installation is completed on site.", durationDays: 16 },
    { title: "Completion", description: "Final quality check and completion photos are delivered.", durationDays: 17 },
  ],
  website: [
    { title: "Discovery", description: "Goals, content, functionality, and references are reviewed.", durationDays: 0 },
    { title: "Structure", description: "Site architecture and page requirements are organized.", durationDays: 3 },
    { title: "Design", description: "Primary layouts and visual direction are created.", durationDays: 8 },
    { title: "Development", description: "Approved designs are built and integrated.", durationDays: 15 },
    { title: "Quality assurance", description: "Responsive, browser, and content checks are completed.", durationDays: 18 },
    { title: "Client review", description: "The completed website is shared for final review.", durationDays: 20 },
    { title: "Launch", description: "The approved website is launched.", durationDays: 22 },
  ],
  general: [
    { title: "Request received", description: "The request is reviewed by the UPZ team.", durationDays: 0 },
    { title: "Scope confirmation", description: "Requirements, timeline, and next steps are confirmed.", durationDays: 2 },
    { title: "In production", description: "The requested work is actively being completed.", durationDays: 5 },
    { title: "Client review", description: "Work is shared for review and approval.", durationDays: 7 },
    { title: "Final delivery", description: "Approved files and deliverables are provided.", durationDays: 9 },
  ],
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function getWorkflowTemplate(service: string): WorkflowStep[] {
  const key = normalize(service);
  if (key.includes("photo")) return templates.photography;
  if (key.includes("video") || key.includes("drone")) return templates.video;
  if (key.includes("sign") || key.includes("vinyl") || key.includes("window")) return templates.signage;
  if (key.includes("web") || key.includes("landing-page")) return templates.website;
  return templates.general;
}
