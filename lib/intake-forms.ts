export type IntakeFieldType = "text" | "email" | "number" | "date" | "textarea" | "select" | "checkbox" | "multi_select" | "address";
export type IntakeVisibility = "both" | "new" | "existing";
export type IntakeConditionOperator = "equals" | "not_equals" | "includes" | "not_empty";

export type IntakeCondition = {
  fieldKey: string;
  operator: IntakeConditionOperator;
  value?: string;
};

export type IntakeField = {
  key: string;
  label: string;
  type: IntakeFieldType;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  wide?: boolean;
  options?: string[];
  visibility?: IntakeVisibility;
  checklistStage?: string;
  condition?: IntakeCondition;
};

export type IntakeDefinition = { slug:string; name:string; description:string; imageUrl?:string; fields:IntakeField[] };

const sharedFields:IntakeField[]=[
 {key:"contactName",label:"Contact Name",type:"text",required:true},
 {key:"contactEmail",label:"Email",type:"email",required:true},
 {key:"priority",label:"Priority",type:"select",options:["Normal","High","Urgent"],required:true},
];
const closingFields:IntakeField[]=[
 {key:"attachments",label:"File or Folder Links",type:"textarea",placeholder:"Paste links to photos, plans, brand assets, or reference files.",wide:true},
 {key:"notes",label:"Anything Else We Should Know?",type:"textarea",wide:true},
];

export const INTAKE_FORMS:Record<string,IntakeDefinition>={
 photography:{slug:"photography",name:"Photography & Media",description:"Select the coverage needed and add only the details specific to the property.",imageUrl:"/service-placeholders/photography.svg",fields:[...sharedFields,
  {key:"propertyAddress",label:"Project Address",type:"address",required:true,wide:true,visibility:"new",helpText:"Start typing the full street address. Location confirmation will be added in the next intake pass."},
  {key:"coverage",label:"Photography Coverage",type:"multi_select",options:["Interior","Exterior","Night-time / twilight","Lobby","Amenities","Drone / aerial","Video walkthrough","360 virtual tour"],required:true,wide:true,helpText:"Selected items become the Photography stage checklist.",checklistStage:"Photography"},
  {key:"condition",label:"Current Condition",type:"select",options:["Vacant / unfurnished","Furnished / staged","Occupied","Not sure"]},
  {key:"accessInstructions",label:"Access Notes",type:"textarea",wide:true},...closingFields]},
 signage:{slug:"signage",name:"Signage, Print & Installation",description:"Share the location, approximate scope, and installation needs.",imageUrl:"/service-placeholders/signage.svg",fields:[...sharedFields,{key:"propertyAddress",label:"Installation Address",type:"address",required:true,wide:true,visibility:"new"},{key:"signageType",label:"Project Type",type:"select",options:["Storefront vinyl","Window graphics","Wall graphics","Banner","Building signage","Printed collateral","Other"],required:true},{key:"scope",label:"Measurements, Quantity, and Scope",type:"textarea",required:true,wide:true},{key:"installationRequired",label:"Installation",type:"select",options:["Required","Print only","Not sure"]},{key:"siteConditions",label:"Access, Height, or Site Notes",type:"textarea",wide:true,condition:{fieldKey:"installationRequired",operator:"not_equals",value:"Print only"},helpText:"Shown when installation may be required."},...closingFields]},
 web:{slug:"web",name:"Website & Digital Development",description:"Tell us what you want to build or update.",imageUrl:"/service-placeholders/web.svg",fields:[...sharedFields,{key:"websiteType",label:"Project Type",type:"select",options:["New website","Landing page","Property website","Website redesign","Feature / update","Other"],required:true},{key:"existingWebsite",label:"Current Website",type:"text",wide:true,condition:{fieldKey:"websiteType",operator:"not_equals",value:"New website"}},{key:"features",label:"Pages, Features, and Goals",type:"textarea",required:true,wide:true},{key:"contentStatus",label:"Content Status",type:"select",options:["Ready","Partially ready","Copywriting needed","Not started"]},...closingFields]},
 brochure:{slug:"brochure",name:"Brochure & Marketing Design",description:"Describe the deliverable and the information it needs to include.",imageUrl:"/service-placeholders/design.svg",fields:[...sharedFields,{key:"propertyAddress",label:"Project Address",type:"address",wide:true,visibility:"new"},{key:"deliverableType",label:"Deliverable",type:"select",options:["Property brochure","Flyer","Offering memorandum","Presentation deck","Email campaign","Map / floor plan","Other"],required:true},{key:"requiredSections",label:"Content and Required Sections",type:"textarea",required:true,wide:true},{key:"printRequired",label:"Final Delivery",type:"select",options:["Digital only","Printing required","Not sure"]},...closingFields]},
 branding:{slug:"branding",name:"Branding & Identity",description:"Tell us about the brand and the identity assets you need.",imageUrl:"/service-placeholders/branding.svg",fields:[...sharedFields,{key:"businessName",label:"Business or Brand Name",type:"text",required:true,wide:true},{key:"brandingScope",label:"Requested Brand Work",type:"multi_select",options:["Logo","Naming","Color palette","Typography","Brand guidelines","Presentation templates","Marketing collateral"],required:true,wide:true,checklistStage:"Design"},{key:"existingBrand",label:"Existing Identity",type:"select",options:["No existing brand","Refresh existing brand","Expand existing system"]},...closingFields]},
 print:{slug:"print",name:"Print Production",description:"Share the printed item, quantity, size, and artwork status.",imageUrl:"/service-placeholders/print.svg",fields:[...sharedFields,{key:"printItem",label:"Printed Item",type:"text",required:true},{key:"quantity",label:"Quantity",type:"number",required:true},{key:"specifications",label:"Size, Material, and Finishing",type:"textarea",required:true,wide:true},{key:"artworkStatus",label:"Artwork Status",type:"select",options:["Print-ready","Design needed","Updates needed","Not sure"]},...closingFields]},
 merchandise:{slug:"merchandise",name:"Branded Merchandise",description:"Tell us which products and quantities you are considering.",imageUrl:"/service-placeholders/merchandise.svg",fields:[...sharedFields,{key:"products",label:"Products Requested",type:"textarea",required:true,wide:true},{key:"quantity",label:"Estimated Quantity",type:"number"},{key:"variants",label:"Sizes, Colors, or Variants",type:"textarea",wide:true},...closingFields]},
 general:{slug:"general",name:"Custom Project",description:"Use this for work that does not fit one of the standard services.",imageUrl:"/service-placeholders/general.svg",fields:[...sharedFields,{key:"projectType",label:"Project Type",type:"text",required:true},{key:"propertyAddress",label:"Project Address",type:"address",wide:true,visibility:"new"},{key:"deliverables",label:"What Do You Need?",type:"textarea",required:true,wide:true},...closingFields]},
};

export function conditionMatches(condition:IntakeCondition|undefined,answers:Record<string,unknown>){
 if(!condition?.fieldKey)return true;
 const current=answers[condition.fieldKey];
 if(condition.operator==="not_empty")return Array.isArray(current)?current.length>0:Boolean(String(current??"").trim());
 if(condition.operator==="includes")return Array.isArray(current)?current.includes(condition.value||""):String(current??"").includes(condition.value||"");
 if(condition.operator==="not_equals")return String(current??"")!==String(condition.value??"");
 return String(current??"")===String(condition.value??"");
}
export function getIntakeForm(slug?:string|null){return INTAKE_FORMS[String(slug||"general").toLowerCase()]||INTAKE_FORMS.general;}
export function inferProjectType(text:string){const value=text.toLowerCase();if(/photo|drone|video|360|staging/.test(value))return"photography";if(/sign|vinyl|window|banner|install/.test(value))return"signage";if(/website|web |landing|digital/.test(value))return"web";if(/brochure|flyer|deck|presentation|map|floor plan/.test(value))return"brochure";if(/brand|logo|identity/.test(value))return"branding";if(/merch|apparel|shirt|hat|mug/.test(value))return"merchandise";if(/print|card|postcard|booklet/.test(value))return"print";return"general";}