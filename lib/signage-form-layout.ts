/** Shared signage section structure used by admin preview and client request composer. */
export const SIGNAGE_SECTIONS = [
 {id:"general",eyebrow:"03 · Project requirements",title:"General signage information",description:"Shared details for printing, installation and site survey.",keys:["signageType","measurementsStatus","scope"]},
 {id:"printing",eyebrow:"04 · Services",title:"Printing",description:"Artwork, sizes, material and finishing.",keys:["artworkStatus","printSizes","material","finishing"],requires:"Printing"},
 {id:"installation",eyebrow:"04 · Services",title:"Installation",description:"Site conditions, access, and removal.",keys:["installationLocation","surfaceType","accessHeight","removal","access","siteConditions"],requires:"Installation"},
 {id:"survey",eyebrow:"05 · Site survey",title:"Site survey details",description:"Information needed for a site visit.",keys:["surveyPurpose","surveyNotes"],requires:"Site survey"},
] as const;
export const SIGNAGE_STRUCTURED_KEYS = new Set<string>(["requestedServices",...SIGNAGE_SECTIONS.flatMap(section=>[...section.keys])]);
