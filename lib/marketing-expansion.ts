export type MarketingSuggestion={service:string;reason:string;generatedContent:string[]};

const has=(services:string[],pattern:RegExp)=>services.some(service=>pattern.test(service.toLowerCase()));

export function marketingExpansionSuggestions(services:string[]=[]):MarketingSuggestion[]{
 const normalized=services.filter(Boolean);
 const suggestions:MarketingSuggestion[]=[];
 if(has(normalized,/photo|media|drone|virtual/)&&!has(normalized,/brochure|marketing design/))suggestions.push({service:"Brochure & Marketing Design",reason:"Use the new visual assets immediately across leasing and property marketing.",generatedContent:["Property overview","Feature highlights","Brochure copy","Email teaser"]});
 if(has(normalized,/photo|brochure|branding/)&&!has(normalized,/website|digital/))suggestions.push({service:"Website & Digital Development",reason:"Turn approved property content into a dedicated digital leasing destination.",generatedContent:["Landing-page copy","SEO starter brief","Calls to action","Inquiry messaging"]});
 if(has(normalized,/branding|website|brochure/)&&!has(normalized,/print|signage/))suggestions.push({service:"Signage & Print Production",reason:"Extend the approved visual system into physical marketing and on-site materials.",generatedContent:["Signage copy","Production notes","Print collateral list","Campaign consistency checklist"]});
 if(has(normalized,/website|brochure|photo|branding/))suggestions.push({service:"AI Marketing Content",reason:"Reuse the structured project brief and approved assets for ongoing marketing without re-entering project information.",generatedContent:["Social captions","Email campaign copy","Listing highlights","Campaign variants"]});
 return suggestions.slice(0,3);
}

export function generatedProjectBrief(input:{projectName?:string;propertyType?:string;address?:string;location?:string;service:string;answers?:Record<string,unknown>}):string{
 const entries=Object.entries(input.answers||{}).filter(([,value])=>value!==null&&value!==undefined&&value!==""&&value!==false&&(!Array.isArray(value)||value.length)).slice(0,5).map(([key,value])=>`${key.replace(/([a-z0-9])([A-Z])/g,"$1 $2").replace(/[_-]+/g," ")}: ${Array.isArray(value)?value.join(", "):String(value)}`);
 return [`${input.service} for ${input.projectName||"project"}${input.location?` · ${input.location}`:""}.`,input.propertyType?`Property type: ${input.propertyType}.`:"",input.address?`Address: ${input.address}.`:"",entries.length?`Scope: ${entries.join("; ")}.`:""].filter(Boolean).join(" ");
}
