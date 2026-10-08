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
 {key:"attachments",label:"Available Files",type:"multi_select",options:["Photos","Floor plans","Brand assets","Existing artwork","Reference examples","No files yet"],wide:true,helpText:"Select everything currently available."},
 {key:"fileLinks",label:"File or Folder Links",type:"textarea",placeholder:"Paste links only when files are available.",wide:true,condition:{fieldKey:"attachments",operator:"not_equals",value:"No files yet"}},
 {key:"notes",label:"Additional Notes",type:"textarea",wide:true,placeholder:"Add only details not covered by the selections above."},
];

export const INTAKE_FORMS:Record<string,IntakeDefinition>={
 photography:{slug:"photography",name:"Photography & Media",description:"Select the exact coverage, property condition, access, and delivery needs.",imageUrl:"/service-placeholders/photography.svg",fields:[...sharedFields,
  {key:"propertyAddress",label:"Project Address",type:"address",required:true,wide:true,visibility:"new",helpText:"Choose a previously used address when available, or enter a new full address."},
  {key:"coverage",label:"Photography Coverage",type:"multi_select",options:["Interior","Exterior","Night-time / twilight","Lobby","Amenities","Drone / aerial","Video walkthrough","360 virtual tour","Headshots / team"],required:true,wide:true,helpText:"Selected items become the Photography stage checklist.",checklistStage:"Photography"},
  {key:"condition",label:"Current Condition",type:"select",options:["Vacant / unfurnished","Furnished / staged","Occupied","Under construction","Not sure"],required:true},
  {key:"spaceType",label:"Space Type",type:"multi_select",options:["Office","Retail","Restaurant","Residential","Industrial","Medical","Hospitality","Exterior / site","Other"],wide:true},
  {key:"accessType",label:"Site Access",type:"select",options:["Open access","Escort required","Keys / lockbox","Tenant coordination required","COI required","Not sure"]},
  {key:"preferredTiming",label:"Preferred Timing",type:"multi_select",options:["Morning","Midday","Afternoon","Evening / twilight","Weekend","Flexible"],wide:true},
  {key:"deliveryNeeds",label:"Delivery Needs",type:"multi_select",options:["High-resolution originals","Web-optimized images","Social media crops","Brochure-ready images","MLS / listing crops","Rush delivery"],wide:true,checklistStage:"Editing & Delivery"},
  {key:"accessInstructions",label:"Specific Access Notes",type:"textarea",wide:true,condition:{fieldKey:"accessType",operator:"not_equals",value:"Open access"}},...closingFields]},
 signage:{slug:"signage",name:"Signage, Print & Installation",description:"Select printing, installation and an optional site survey. Only relevant questions appear.",imageUrl:"/service-placeholders/signage.svg",fields:[...sharedFields,
  {key:"propertyAddress",label:"Project Address",type:"address",wide:true,visibility:"new"},
  {key:"requestedServices",label:"What do you need?",type:"multi_select",options:["Printing","Installation","Site survey"],wide:true,helpText:"Select one or more. You can request a survey even if you have measurements."},
  {key:"signageType",label:"Signage / Graphics Type",type:"multi_select",options:["Storefront vinyl","Window graphics","Wall graphics","Banner","Building signage","Wayfinding","Printed collateral","Removal only","Other"],wide:true},
  {key:"measurementsStatus",label:"Measurements available?",type:"select",options:["Final measurements available","Approximate measurements available","Need measurements","Not sure"]},
  {key:"scope",label:"General project scope",type:"textarea",wide:true,placeholder:"Describe what is needed and anything already known."},
  {key:"artworkStatus",label:"Artwork Status",type:"select",options:["Print-ready artwork","Design required","Existing artwork needs updates","Client will provide later","Not sure"],condition:{fieldKey:"requestedServices",operator:"includes",value:"Printing"}},
  {key:"printSizes",label:"Print sizes and quantities",type:"textarea",wide:true,placeholder:"One line per size, e.g. 2 panels × 48 in W × 96 in H; 1 panel × 36 in W × 72 in H.",condition:{fieldKey:"requestedServices",operator:"includes",value:"Printing"}},
  {key:"material",label:"Preferred print material",type:"select",options:["Adhesive vinyl","Perforated window vinyl","Frosted vinyl","Banner","Rigid board","Not sure / recommend"],condition:{fieldKey:"requestedServices",operator:"includes",value:"Printing"}},
  {key:"finishing",label:"Print finishing",type:"multi_select",options:["Laminate","Contour cut","Grommets","Pole pockets","Hemmed edges","Mounting hardware","Not sure"],wide:true,condition:{fieldKey:"requestedServices",operator:"includes",value:"Printing"}},
  {key:"installationLocation",label:"Installation location",type:"select",options:["Interior","Exterior","Both","Not sure"],condition:{fieldKey:"requestedServices",operator:"includes",value:"Installation"}},
  {key:"surfaceType",label:"Installation surface",type:"multi_select",options:["Glass","Painted wall","Brick / masonry","Metal","Concrete","Freestanding structure","Unknown"],wide:true,condition:{fieldKey:"requestedServices",operator:"includes",value:"Installation"}},
  {key:"accessHeight",label:"Installation access / height",type:"select",options:["Ground level","Ladder access","Scaffold required","Lift required","Roof access","Unknown"],condition:{fieldKey:"requestedServices",operator:"includes",value:"Installation"}},
  {key:"removal",label:"Existing graphics / removal",type:"select",options:["No removal needed","Remove existing graphics","Remove and replace","Not sure"],condition:{fieldKey:"requestedServices",operator:"includes",value:"Installation"}},
  {key:"access",label:"Site access",type:"select",options:["Open access","Building / tenant coordination","Escort or keys required","COI required","Not sure"],condition:{fieldKey:"requestedServices",operator:"includes",value:"Installation"}},
  {key:"siteConditions",label:"Site conditions or installation notes",type:"textarea",wide:true,condition:{fieldKey:"requestedServices",operator:"includes",value:"Installation"}},
  {key:"surveyPurpose",label:"What should UPZ verify?",type:"multi_select",options:["Accurate measurements","Photos of existing conditions","Surface / material suitability","Access and equipment requirements","Removal / installation feasibility","Other / not sure"],wide:true,condition:{fieldKey:"requestedServices",operator:"includes",value:"Site survey"},helpText:"UPZ visits the site to measure, document existing conditions with photos, and assess installation surfaces, access and equipment. We will quote the survey fee for approval before scheduling."},
  {key:"surveyNotes",label:"Survey questions or concerns",type:"textarea",wide:true,placeholder:"What are you unsure about?",condition:{fieldKey:"requestedServices",operator:"includes",value:"Site survey"}},
  ...closingFields]},

 web:{slug:"web",name:"Website & Digital Development",description:"Select the website type, required features, content readiness, and integrations.",imageUrl:"/service-placeholders/web.svg",fields:[...sharedFields,
  {key:"websiteType",label:"Project Type",type:"select",options:["New website","Landing page","Property website","Website redesign","Feature / update","Maintenance / support","Other"],required:true},
  {key:"existingWebsite",label:"Current Website",type:"text",wide:true,condition:{fieldKey:"websiteType",operator:"not_equals",value:"New website"}},
  {key:"pageNeeds",label:"Pages Needed",type:"multi_select",options:["Home","About","Services","Portfolio / projects","Listings","Team","Contact","News / blog","Privacy / legal","Custom pages"],wide:true,checklistStage:"Design & Development"},
  {key:"featureNeeds",label:"Features Needed",type:"multi_select",options:["Contact forms","Search / filters","Interactive map","Listings database","Client portal","Payments","Booking","Newsletter signup","Analytics","CRM integration","File downloads","Other"],required:true,wide:true,checklistStage:"Development"},
  {key:"contentStatus",label:"Content Status",type:"select",options:["Ready","Partially ready","Copywriting needed","Photography needed","Not started"],required:true},
  {key:"brandStatus",label:"Brand Assets",type:"select",options:["Complete brand package available","Logo and colors available","Brand refresh needed","No brand yet","Not sure"]},
  {key:"platformPreference",label:"Platform Preference",type:"select",options:["Custom development","WordPress","Shopify","Existing platform","No preference / advise us"]},
  {key:"integrationNeeds",label:"Integrations",type:"multi_select",options:["HubSpot","GoHighLevel","Mailchimp / Constant Contact","Google Analytics","Google Maps","Stripe","Calendly","MLS / listing feed","Other","None"],wide:true},
  {key:"features",label:"Additional Goals or Technical Notes",type:"textarea",wide:true,placeholder:"Add only requirements not represented by the selections."},...closingFields]},
 brochure:{slug:"brochure",name:"Brochure & Marketing Design",description:"Choose the deliverable, format, required sections, and final-output needs.",imageUrl:"/service-placeholders/design.svg",fields:[...sharedFields,
  {key:"propertyAddress",label:"Project Address",type:"address",wide:true,visibility:"new"},
  {key:"deliverableType",label:"Deliverable",type:"multi_select",options:["Property brochure","Flyer","Offering memorandum","Presentation deck","Email campaign","Social media graphics","Map","Floor plan cleanup","Other"],required:true,wide:true,checklistStage:"Design"},
  {key:"requiredSections",label:"Required Sections",type:"multi_select",options:["Cover","Property overview","Availability","Floor plans","Location map","Neighborhood highlights","Demographics","Building features","Ownership / team","Contact page","Disclaimer"],required:true,wide:true,checklistStage:"Content Assembly"},
  {key:"assetStatus",label:"Asset Readiness",type:"multi_select",options:["Copy ready","Photos ready","Floor plans ready","Maps ready","Brand assets ready","Broker information ready","Assets still needed"],wide:true},
  {key:"formatNeeds",label:"Final Formats",type:"multi_select",options:["Print PDF","Digital PDF","PowerPoint","Email HTML","Social media sizes","Editable source files"],required:true,wide:true,checklistStage:"Final Delivery"},
  {key:"printRequired",label:"Printing",type:"select",options:["Digital only","Printing required","Pricing requested","Not sure"]},
  {key:"designDirection",label:"Design Direction",type:"select",options:["Use existing brand","Match previous collateral","Create a new visual direction","Refresh existing design","Not sure"]},
  {key:"contentNotes",label:"Additional Content Notes",type:"textarea",wide:true},...closingFields]},
 branding:{slug:"branding",name:"Branding & Identity",description:"Select the identity components, current brand condition, and intended applications.",imageUrl:"/service-placeholders/branding.svg",fields:[...sharedFields,
  {key:"businessName",label:"Business or Brand Name",type:"text",required:true,wide:true},
  {key:"brandingScope",label:"Requested Brand Work",type:"multi_select",options:["Logo","Naming","Tagline","Color palette","Typography","Brand guidelines","Presentation templates","Marketing collateral","Signage system","Social media templates"],required:true,wide:true,checklistStage:"Design"},
  {key:"existingBrand",label:"Existing Identity",type:"select",options:["No existing brand","Refresh existing brand","Expand existing system","Rebrand completely","Not sure"],required:true},
  {key:"brandPersonality",label:"Brand Personality",type:"multi_select",options:["Professional","Modern","Luxury","Approachable","Bold","Minimal","Traditional","Playful","Technical","Editorial"],wide:true},
  {key:"primaryAudience",label:"Primary Audience",type:"multi_select",options:["Consumers","Business clients","Real estate owners","Tenants","Investors","Medical patients","Hospitality guests","Internal team","Other"],wide:true},
  {key:"applicationNeeds",label:"Primary Applications",type:"multi_select",options:["Website","Print collateral","Signage","Presentations","Social media","Merchandise","Email marketing","Advertising"],wide:true,checklistStage:"Brand Applications"},...closingFields]},
 print:{slug:"print",name:"Print Production",description:"Choose the printed item, quantity range, size, stock, finishing, and artwork status.",imageUrl:"/service-placeholders/print.svg",fields:[...sharedFields,
  {key:"printItem",label:"Printed Item",type:"select",options:["Business cards","Postcards","Flyers","Brochures","Booklets","Folders","Posters","Banners","Presentation boards","Labels / stickers","Other"],required:true},
  {key:"quantityRange",label:"Quantity",type:"select",options:["Under 100","100–249","250–499","500–999","1,000–2,499","2,500–4,999","5,000+","Not sure"],required:true},
  {key:"size",label:"Finished Size",type:"select",options:["Standard business card","Letter 8.5 × 11","Half letter 5.5 × 8.5","Tabloid 11 × 17","Postcard","Custom size","Not sure"]},
  {key:"stock",label:"Material / Stock",type:"select",options:["Standard coated stock","Uncoated stock","Heavy cover stock","Synthetic / waterproof","Vinyl","Specialty stock","Not sure"]},
  {key:"finishing",label:"Finishing",type:"multi_select",options:["No special finishing","Folding","Scoring","Lamination","Spot UV","Foil stamping","Rounded corners","Binding","Die cutting","Mounting","Not sure"],wide:true},
  {key:"artworkStatus",label:"Artwork Status",type:"select",options:["Print-ready","Design needed","Updates needed","Files incomplete","Not sure"],required:true},
  {key:"specifications",label:"Additional Specifications",type:"textarea",wide:true,placeholder:"Add custom dimensions, exact quantities, special materials, or packaging requirements."},...closingFields]},
 merchandise:{slug:"merchandise",name:"Branded Merchandise",description:"Select products, quantity range, decoration method, variants, and fulfillment needs.",imageUrl:"/service-placeholders/merchandise.svg",fields:[...sharedFields,
  {key:"products",label:"Products Requested",type:"multi_select",options:["T-shirts","Polos","Hoodies","Hats","Tote bags","Mugs","Tumblers","Notebooks","Pens","Outerwear","Promotional items","Other"],required:true,wide:true,checklistStage:"Product Sourcing"},
  {key:"quantityRange",label:"Estimated Quantity",type:"select",options:["Under 25","25–49","50–99","100–249","250–499","500+","Not sure"]},
  {key:"decoration",label:"Decoration Method",type:"multi_select",options:["Screen print","Embroidery","Heat transfer","Direct-to-garment","Full-color print","Engraving","Not sure"],wide:true},
  {key:"variants",label:"Variants Needed",type:"multi_select",options:["Multiple sizes","Multiple colors","Men’s / women’s fits","Individual names","Individual packaging","One standard version"],wide:true},
  {key:"fulfillment",label:"Delivery / Fulfillment",type:"select",options:["Bulk delivery","Individual shipment","Event delivery","Pickup","Not sure"]},
  {key:"productNotes",label:"Additional Product Notes",type:"textarea",wide:true},...closingFields]},
 general:{slug:"general",name:"Custom Project",description:"Select the closest project category and deliverables before adding custom notes.",imageUrl:"/service-placeholders/general.svg",fields:[...sharedFields,
  {key:"projectType",label:"Project Category",type:"select",options:["Creative design","Digital development","Photography / media","Print production","Signage / installation","Branding","Marketing campaign","Consulting / strategy","Other"],required:true},
  {key:"propertyAddress",label:"Project Address",type:"address",wide:true,visibility:"new"},
  {key:"deliverables",label:"Requested Deliverables",type:"multi_select",options:["Concept / strategy","Design files","Production files","Photography","Video","Website / digital","Printing","Installation","Presentation","Ongoing support","Other"],required:true,wide:true,checklistStage:"Production"},
  {key:"deliveryFormat",label:"Final Delivery",type:"multi_select",options:["Digital files","Printed materials","Installed product","Online publication","Editable source files","Presentation / handoff"],wide:true},
  {key:"customScope",label:"Custom Scope Notes",type:"textarea",wide:true,placeholder:"Describe only the requirements not covered by the selections."},...closingFields]},
};

export function conditionMatches(condition:IntakeCondition|undefined,answers:Record<string,unknown>){
 if(!condition?.fieldKey)return true;
 const current=answers[condition.fieldKey];
 if(condition.operator==="not_empty")return Array.isArray(current)?current.length>0:Boolean(String(current??"").trim());
 if(condition.operator==="includes")return Array.isArray(current)?current.includes(condition.value||""):String(current??"").includes(condition.value||"");
 if(condition.operator==="not_equals"){
  if(Array.isArray(current))return !current.includes(condition.value||"");
  return String(current??"")!==String(condition.value??"");
 }
 return String(current??"")===String(condition.value??"");
}
export function getIntakeForm(slug?:string|null){return INTAKE_FORMS[String(slug||"general").toLowerCase()]||INTAKE_FORMS.general;}
export function inferProjectType(text:string){const value=text.toLowerCase();if(/photo|drone|video|360|staging/.test(value))return"photography";if(/sign|vinyl|window|banner|install/.test(value))return"signage";if(/website|web |landing|digital/.test(value))return"web";if(/brochure|flyer|deck|presentation|map|floor plan/.test(value))return"brochure";if(/brand|logo|identity/.test(value))return"branding";if(/merch|apparel|shirt|hat|mug/.test(value))return"merchandise";if(/print|card|postcard|booklet/.test(value))return"print";return"general";}
