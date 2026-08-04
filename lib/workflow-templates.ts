export type WorkflowStep={title:string;description:string;clientVisible?:boolean;durationDays?:number};

const flow=(steps:Array<[string,string,number,boolean?]>):WorkflowStep[]=>steps.map(([title,description,durationDays,clientVisible=true])=>({title,description,durationDays,clientVisible}));

const templates:Record<string,WorkflowStep[]>={
 photography:flow([
  ["Scope confirmation","Confirm property, coverage, access, timing, and required deliverables.",0],
  ["Schedule & preparation","Coordinate access and prepare the shot list.",2],
  ["On-site production","Complete approved photography, video, drone, or virtual-tour capture.",4],
  ["Post-production","Edit and prepare the selected media.",7],
  ["Client review","Share proofs or first-cut media for consolidated feedback.",9],
  ["Final delivery","Deliver approved files and close the work order.",11],
 ]),
 signage:flow([
  ["Scope confirmation","Confirm signage type, measurements, artwork status, site conditions, and installation needs.",0],
  ["Site verification","Verify dimensions, surfaces, access, permits, and installation conditions when required.",3],
  ["Artwork & proof","Prepare or review production artwork and issue the approval proof.",6],
  ["Client approval","Approve artwork, material, finishing, quantity, and installation scope.",8],
  ["Production","Print, fabricate, finish, and quality-check the approved signage.",13],
  ["Installation / handoff","Install on site or release the completed production order.",16],
  ["Completion","Document completion and deliver final files or photos.",17],
 ]),
 web:flow([
  ["Discovery & scope","Confirm goals, audience, pages, content, integrations, and technical requirements.",0],
  ["Structure & content","Organize sitemap, page requirements, content, and asset responsibilities.",4],
  ["Design","Create the primary visual direction and key page layouts.",9],
  ["Development","Build approved layouts and requested functionality.",16],
  ["Quality assurance","Complete responsive, browser, form, content, and accessibility checks.",20],
  ["Client review","Collect final consolidated edits and approval.",22],
  ["Launch & handoff","Publish the approved website and provide access or documentation.",24],
 ]),
 brochure:flow([
  ["Scope & content check","Confirm format, audience, required sections, assets, and final delivery.",0],
  ["Content preparation","Organize supplied copy, photography, plans, maps, and property information.",3],
  ["Initial design","Create the first complete layout and visual direction.",7],
  ["Client review","Collect consolidated corrections and approvals.",10],
  ["Final artwork","Complete revisions and prepare digital or print-ready files.",13],
  ["Delivery / production","Deliver final files or release the approved print order.",15],
 ]),
 branding:flow([
  ["Discovery","Confirm audience, positioning, applications, references, and existing brand equity.",0],
  ["Creative direction","Establish visual direction, naming direction, or moodboard as required.",4],
  ["Concept development","Develop the selected identity concepts and core applications.",9],
  ["Client review","Review concepts and select the final direction.",12],
  ["Refinement","Finalize logo, color, typography, and approved applications.",16],
  ["Brand delivery","Deliver master assets and concise usage guidance.",18],
 ]),
 print:flow([
  ["Specification check","Confirm item, quantity, size, stock, finishing, artwork, and delivery requirements.",0],
  ["Artwork & proof","Prepare or review print-ready artwork and issue a proof.",3],
  ["Client approval","Approve artwork and final production specifications.",5],
  ["Production","Print, finish, and quality-check the order.",10],
  ["Delivery","Ship, deliver, or release the completed order.",12],
 ]),
 merchandise:flow([
  ["Product confirmation","Confirm products, quantities, variants, decoration, and fulfillment requirements.",0],
  ["Artwork & mockup","Prepare decoration artwork and product mockups.",3],
  ["Client approval","Approve products, artwork, quantities, and variants.",5],
  ["Production","Produce and quality-check the merchandise order.",12],
  ["Fulfillment","Ship, deliver, or distribute the completed order.",15],
 ]),
 general:flow([
  ["Scope confirmation","Review the request and confirm requirements, ownership, and next steps.",0],
  ["Preparation","Collect required content, files, access, and approvals.",2],
  ["Production","Complete the approved work.",6],
  ["Client review","Share work for consolidated feedback and approval.",8],
  ["Final delivery","Deliver approved files or completed work and close the request.",10],
 ]),
};

const normalize=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/g,"-");
export function getWorkflowTemplate(service:string):WorkflowStep[]{const key=normalize(service);if(/photo|video|drone|360|virtual-tour/.test(key))return templates.photography;if(/sign|vinyl|window|installation/.test(key))return templates.signage;if(/web|landing/.test(key))return templates.web;if(/brochure|marketing-design|flyer|presentation|floor-plan|map/.test(key))return templates.brochure;if(/brand|identity|logo/.test(key))return templates.branding;if(/merch|apparel|promotional/.test(key))return templates.merchandise;if(/print|business-card|postcard|booklet/.test(key))return templates.print;return templates.general;}
